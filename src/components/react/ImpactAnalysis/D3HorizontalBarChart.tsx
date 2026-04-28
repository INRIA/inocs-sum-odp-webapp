import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { IMeasureCoefficient, ILivingLabAnalysis } from "../../../types";
import {
  coefficientToPercentage,
  formatCoefficient,
  findImplementingLabs,
} from "../../../lib/helpers/impact-analysis-format";
import {
  COLOR_BLUE,
  COLOR_GREEN,
  COLOR_GRAY,
  COLOR_LIGHT_BLUE,
  COLOR_RED,
} from "../../../styles/constants";
interface D3HorizontalBarChartProps {
  measures: IMeasureCoefficient[];
  livingLabsAnalysis: ILivingLabAnalysis[];
  height?: number;
}

interface TooltipData {
  measure: IMeasureCoefficient;
  labs: string[];
  x: number;
  y: number;
}

const DEFAULT_ROW_HEIGHT = 50;
const LABEL_LINE_HEIGHT = 16;
const LABEL_FONT_SIZE = 12;
const BADGE_GUTTER = 32;
const LABEL_PADDING = 8;

export const D3HorizontalBarChart: React.FC<D3HorizontalBarChartProps> = ({
  measures,
  livingLabsAnalysis,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const isMobile = dimensions.width < 640;
  const labelAreaWidth = isMobile
    ? 24
    : Math.min(250, Math.floor(dimensions.width * 0.32));
  const labelTextWidth = Math.max(
    40,
    labelAreaWidth - BADGE_GUTTER - LABEL_PADDING,
  );

  const svgHeight = Math.max(
    height,
    measures.length * DEFAULT_ROW_HEIGHT + 20 + (isMobile ? 40 : 50),
  );

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [height]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || measures.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = {
      top: 20,
      right: isMobile ? 20 : 60,
      bottom: isMobile ? 40 : 50,
      left: labelAreaWidth,
    };
    const width = dimensions.width - margin.left - margin.right;

    // Prepare data - convert coefficients to percentages
    const data = measures.map((_m) => {
      const labs = findImplementingLabs(String(_m.id), livingLabsAnalysis);
      return {
        ..._m,
        percentValue: coefficientToPercentage(_m.coefficient),
        labs,
        labCount: _m.times_implemented,
      };
    });

    const chartHeight = svgHeight - margin.top - margin.bottom;
    svg.attr("height", svgHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const maxAbsValue = d3.max(data, (d) => Math.abs(d.percentValue)) || 10;
    const xScale = d3
      .scaleLinear()
      .domain([-maxAbsValue * 1.1, maxAbsValue * 1.1])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, chartHeight])
      .padding(0.2);
    const barHeight = isMobile
      ? yScale.bandwidth()
      : Math.min(32, yScale.bandwidth());
    const getRowCenter = (name: string) =>
      (yScale(name) || 0) + yScale.bandwidth() / 2;
    const getBarY = (name: string) =>
      (yScale(name) || 0) + (yScale.bandwidth() - barHeight) / 2;

    // Color scale
    const colorScale = d3
      .scaleLinear<string>()
      .domain([-maxAbsValue, 0, maxAbsValue])
      .range([COLOR_RED, COLOR_BLUE, COLOR_GREEN]);

    // Add gridlines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(chartHeight)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "#e5e7eb")
          .attr("stroke-dasharray", "2,2"),
      );

    // Add zero line
    g.append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#374151")
      .attr("stroke-width", 2);

    // Add bars with transition
    const bars = g
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) =>
        d.percentValue >= 0 ? xScale(0) : xScale(d.percentValue),
      )
      .attr("y", (d) => getBarY(d.name))
      .attr("height", barHeight)
      .attr("fill", (d) => colorScale(d.percentValue))
      .attr("opacity", 0.8)
      .attr("rx", 4)
      .attr("width", 0) // Start with 0 width for animation
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "#1f2937")
          .attr("stroke-width", 2);

        setTooltip({
          measure: d,
          labs: d.labs,
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on("mousemove", function (event) {
        setTooltip((prev) =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null,
        );
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
        setTooltip(null);
      })
      .on("click", function (event, d) {
        setTooltip({
          measure: d,
          labs: d.labs,
          x: event.clientX,
          y: event.clientY,
        });
      });

    // Animate bars
    bars
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr("width", (d) => Math.abs(xScale(d.percentValue) - xScale(0)));

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => `${d}`))
      .call((g) => g.select(".domain").attr("stroke", "#9ca3af"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    // Add Y axis with custom labels
    const yAxis = g.append("g").attr("class", "y-axis");

    if (!isMobile) {
      const badgeRadius = 10;
      const badgeCenterX = -16;
      const labelBoxRight = badgeCenterX - badgeRadius - LABEL_PADDING;
      const labelBoxLeft = labelBoxRight - labelTextWidth;

      const labelGroups = yAxis
        .selectAll(".measure-name")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "measure-name")
        .attr("transform", (d) => `translate(0,${getRowCenter(d.name)})`)
        .attr("cursor", "pointer")
        .each(function (d) {
          const group = d3.select(this);
          const labelBoxHeight = yScale.bandwidth();

          const labelContainer = group
            .append("foreignObject")
            .attr("x", labelBoxLeft)
            .attr("y", -labelBoxHeight / 2)
            .attr("width", labelTextWidth)
            .attr("height", labelBoxHeight);

          labelContainer
            .append("xhtml:div")
            .attr("class", "measure-label-text")
            .attr("title", d.name)
            .attr(
              "style",
              `width:100%;height:100%;display:flex;align-items:center;justify-content:flex-end;text-align:right;font-size:${LABEL_FONT_SIZE}px;line-height:${LABEL_LINE_HEIGHT}px;font-weight:600;color:${COLOR_GRAY};white-space:normal;word-break:break-word;overflow-wrap:anywhere;`,
            )
            .text(d.name);
        })
        .on("mouseenter", function (event, d) {
          d3.select(this)
            .select(".measure-label-text")
            .style("color", COLOR_LIGHT_BLUE);
          setTooltip({
            measure: d,
            labs: d.labs,
            x: event.clientX,
            y: event.clientY,
          });
        })
        .on("mousemove", function (event) {
          setTooltip((prev) =>
            prev ? { ...prev, x: event.clientX, y: event.clientY } : null,
          );
        })
        .on("mouseleave", function () {
          d3.select(this)
            .select(".measure-label-text")
            .style("color", COLOR_GRAY);
          setTooltip(null);
        })
        .on("click", function (event, d) {
          setTooltip({
            measure: d,
            labs: d.labs,
            x: event.clientX,
            y: event.clientY,
          });
        });

      labelGroups
        .append("circle")
        .attr("class", "implementing-count-badge")
        .attr("cx", badgeCenterX)
        .attr("cy", 0)
        .attr("r", badgeRadius)
        .attr("fill", COLOR_LIGHT_BLUE);

      labelGroups
        .append("text")
        .attr("class", "implementing-count-badge-text")
        .attr("x", badgeCenterX)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#111827")
        .attr("font-size", "10px")
        .attr("font-weight", "700")
        .text((d) => `${d.labCount}`);
    }

    // Add value labels on bars
    const valueLabelFontSize = isMobile ? "9px" : "11px";
    const valueLabelOffset = isMobile ? 3 : 5;

    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) =>
        d.percentValue >= 0
          ? xScale(d.percentValue) + valueLabelOffset
          : xScale(d.percentValue) - valueLabelOffset,
      )
      .attr("y", (d) => getRowCenter(d.name))
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.percentValue >= 0 ? "start" : "end"))
      .attr("fill", COLOR_GRAY)
      .attr("font-size", valueLabelFontSize)
      .attr("font-weight", "600")
      .attr("opacity", 0)
      .text((d) => formatCoefficient(d.coefficient, 2, ""))
      .transition()
      .duration(800)
      .delay(400)
      .attr("opacity", 1);
  }, [
    dimensions.width,
    isMobile,
    labelAreaWidth,
    labelTextWidth,
    livingLabsAnalysis,
    measures,
    svgHeight,
  ]);

  if (measures.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          No measures data available for visualization.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart Container */}
      <div ref={containerRef} className="relative w-full px-2 md:px-4">
        <div className="mb-4 space-y-1 text-center">
          <h4 className="text-lg md:text-2xl font-semibold text-gray-700">
            Contribution levels by Policy measure
          </h4>
          <small className="text-xs italic text-gray-500">
            Click on the texts or bars to open details
          </small>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mx-auto w-max">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-info text-dark font-bold">
              #
            </span>
            <span>Number of living labs implementing the policy measure.</span>
          </div>
        </div>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={svgHeight}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-dark text-white px-4 py-3 rounded-lg shadow-xl text-sm max-w-xs pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 10}px`,
              transform: "translateY(-100%)",
            }}
          >
            <div className="font-bold mb-1">{tooltip.measure.name}</div>
            <div className="text-warning font-semibold mb-2">
              Level: {formatCoefficient(tooltip.measure.coefficient)}
            </div>
            {tooltip.labs.length > 0 ? (
              <div>
                <div className="text-gray-300 text-xs mb-1">
                  Implemented by:
                </div>
                <div className="flex flex-wrap gap-1">
                  {tooltip.labs.map((lab, idx) => (
                    <span
                      key={idx}
                      className="bg-info px-2 py-0.5 rounded text-xs text-dark font-bold"
                    >
                      {lab}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-xs">
                No implementation data
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

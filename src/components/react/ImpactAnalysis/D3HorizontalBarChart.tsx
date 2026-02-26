import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { IMeasureCoefficient, ILivingLabAnalysis } from "../../../types";
import {
  coefficientToPercentage,
  formatCoefficient,
  findImplementingLabs,
} from "../../../lib/helpers/impact-analysis-format";
import {
  COLOR_GRAY,
  COLOR_LIGHT_BLUE,
  COLORS_BASELINE,
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

function splitLabelIntoTwoLines(
  text: string,
  maxCharsPerLine: number,
): string[] {
  if (text.length <= maxCharsPerLine) {
    return [text];
  }

  const breakBeforeLimit = text.lastIndexOf(" ", maxCharsPerLine);
  const breakAfterLimit = text.indexOf(" ", maxCharsPerLine);

  const splitIndex =
    breakBeforeLimit > 0
      ? breakBeforeLimit
      : breakAfterLimit > 0
        ? breakAfterLimit
        : maxCharsPerLine;

  const firstLine = text.slice(0, splitIndex).trim();
  const secondLine = text.slice(splitIndex).trim();

  return secondLine ? [firstLine, secondLine] : [firstLine];
}

export const D3HorizontalBarChart: React.FC<D3HorizontalBarChartProps> = ({
  measures,
  livingLabsAnalysis,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });

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

    // Keep labels around 1/3 of total width and chart around 2/3
    const isMobile = dimensions.width < 640;
    const margin = {
      top: 20,
      right: isMobile ? 20 : 60,
      bottom: isMobile ? 40 : 50,
      left: Math.floor(dimensions.width / 4),
    };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data - convert coefficients to percentages
    const data = measures.map((m) => ({
      ...m,
      percentValue: coefficientToPercentage(m.coefficient),
    }));

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

    // Color scale
    const colorScale = d3
      .scaleLinear<string>()
      .domain([-maxAbsValue, 0, maxAbsValue])
      .range(COLORS_BASELINE);

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
      .attr("y", (d) => yScale(d.name) || 0)
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.percentValue))
      .attr("opacity", 0.8)
      .attr("rx", 4)
      .attr("width", 0) // Start with 0 width for animation
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "#1f2937")
          .attr("stroke-width", 2);

        const labs = findImplementingLabs(d.id, livingLabsAnalysis);
        setTooltip({
          measure: d,
          labs,
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

    // Full y-axis labels
    const maxCharsPerLine = isMobile ? 18 : 32;
    const labelFontSize = isMobile ? "10px" : "12px";
    const labelXOffset = -12;
    const labelAnchor = "end";

    // Add measure names with tooltip
    yAxis
      .selectAll(".measure-name")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "measure-name")
      .attr("x", labelXOffset)
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() * 0.12)
      .attr("text-anchor", labelAnchor)
      .attr("dominant-baseline", "hanging")
      .attr("fill", COLOR_GRAY)
      .attr("font-size", labelFontSize)
      .attr("font-weight", "600")
      .attr("cursor", "pointer")
      .each(function (d) {
        const lines = splitLabelIntoTwoLines(d.name, maxCharsPerLine);
        const textElement = d3.select(this);

        lines.forEach((line, lineIndex) => {
          textElement
            .append("tspan")
            .attr("x", labelXOffset)
            .attr("dy", lineIndex === 0 ? 0 : "1.1em")
            .text(line);
        });
      })
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill", COLOR_LIGHT_BLUE);
        const labs = findImplementingLabs(d.id, livingLabsAnalysis);
        setTooltip({
          measure: d,
          labs,
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
        d3.select(this).attr("fill", COLOR_GRAY);
        setTooltip(null);
      });

    // Add implementing labs count under measure names
    yAxis
      .selectAll(".implementing-count")
      .data(data)
      .enter()
      .each(function (d) {
        const labs = findImplementingLabs(d.id, livingLabsAnalysis);
        const yPos = (yScale(d.name) || 0) + yScale.bandwidth() * 0.82;

        d3.select(this)
          .append("text")
          .attr("x", -12)
          .attr("y", yPos)
          .attr("text-anchor", "end")
          .attr("fill", "#6b7280")
          .attr("font-size", "9px")
          .text(`${labs.length} labs implementing`);
      });

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
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
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

    // Add chart title
    const titleFontSize = isMobile ? "12px" : "14px";
    svg
      .append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", COLOR_GRAY)
      .attr("font-size", titleFontSize)
      .attr("font-weight", "600")
      .text("Contribution levels by Policy measure");
  }, [measures, livingLabsAnalysis, dimensions]);

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
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
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

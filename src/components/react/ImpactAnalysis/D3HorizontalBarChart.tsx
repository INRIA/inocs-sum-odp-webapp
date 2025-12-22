import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { IMeasureCoefficient, ILivingLabAnalysis } from "../../../types";
import {
  coefficientToPercentage,
  formatCoefficient,
  findImplementingLabs,
} from "../../../lib/helpers/impact-analysis-format";
import {
  BLUE_COLOR,
  GRAY_COLOR,
  LIGHT_BLUE_COLOR,
  LIGHT_GRAY_COLOR,
} from "../../../styles/constants";

const MAX_BADGES_COUNT = 3;
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

    const margin = { top: 20, right: 120, bottom: 50, left: 280 };
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
      .range(["#ef4444", "#fbbf24", "#10b981"]);

    // Add gridlines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(chartHeight)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "#e5e7eb")
          .attr("stroke-dasharray", "2,2")
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
        d.percentValue >= 0 ? xScale(0) : xScale(d.percentValue)
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
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
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
      .call(d3.axisBottom(xScale).tickFormat((d) => `${d}%`))
      .call((g) => g.select(".domain").attr("stroke", "#9ca3af"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    // Add Y axis with custom labels
    const yAxis = g.append("g").attr("class", "y-axis");

    // Add measure names with tooltip
    yAxis
      .selectAll(".measure-name")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "measure-name")
      .attr("x", -10)
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 3)
      .attr("text-anchor", "end")
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("cursor", "pointer")
      .text((d) => {
        const text = d.name;
        return text.length > 25 ? text.substring(0, 22) + "..." : text;
      })
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill", LIGHT_BLUE_COLOR);
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
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", GRAY_COLOR);
        setTooltip(null);
      });

    // Add living lab badges under measure names
    yAxis
      .selectAll(".lab-badges")
      .data(data)
      .enter()
      .each(function (d) {
        const labs = findImplementingLabs(d.id, livingLabsAnalysis);
        const yPos = (yScale(d.name) || 0) + (yScale.bandwidth() * 2) / 3;

        if (labs.length === 0) {
          d3.select(this)
            .append("text")
            .attr("x", -10)
            .attr("y", yPos)
            .attr("text-anchor", "end")
            .attr("fill", "#9ca3af")
            .attr("font-size", "9px")
            .attr("font-style", "italic")
            .attr("cursor", "pointer")
            .text("Not implemented")
            .on("mouseenter", function (event) {
              d3.select(this).attr("fill", "#6b7280");
              setTooltip({
                measure: d,
                labs: [],
                x: event.clientX,
                y: event.clientY,
              });
            })
            .on("mousemove", function (event) {
              setTooltip((prev) =>
                prev ? { ...prev, x: event.clientX, y: event.clientY } : null
              );
            })
            .on("mouseleave", function () {
              d3.select(this).attr("fill", "#9ca3af");
              setTooltip(null);
            });
        } else {
          const maxLabsToShow = MAX_BADGES_COUNT;
          const displayLabs = labs.slice(0, maxLabsToShow);
          const remainingCount = labs.length - maxLabsToShow;

          // Create a group for badges
          const badgeGroup = d3.select(this);
          let xOffset = -10;

          // Add badges from right to left
          [...displayLabs].reverse().forEach((lab, idx) => {
            const badgeG = badgeGroup
              .append("g")
              .attr("class", "lab-badge")
              .attr("cursor", "pointer");

            const text = badgeG
              .append("text")
              .attr("y", yPos)
              .attr("font-size", "8px")
              .attr("fill", BLUE_COLOR)
              .attr("font-weight", "500")
              .text(lab.length > 8 ? lab.substring(0, 6) + ".." : lab);

            const bbox = (text.node() as SVGTextElement).getBBox();
            const padding = 4;

            const rect = badgeG
              .insert("rect", "text")
              .attr("x", xOffset - bbox.width - padding * 2)
              .attr("y", yPos - bbox.height + 2)
              .attr("width", bbox.width + padding * 2)
              .attr("height", bbox.height + 2)
              .attr("rx", 3)
              .attr("fill", LIGHT_GRAY_COLOR)
              .attr("stroke", BLUE_COLOR)
              .attr("stroke-width", 0.5);

            text
              .attr("x", xOffset - bbox.width / 2 - padding)
              .attr("text-anchor", "middle");

            // Add tooltip handlers to the badge group
            badgeG
              .on("mouseenter", function (event) {
                rect.attr("fill", LIGHT_BLUE_COLOR).attr("stroke", BLUE_COLOR);
                setTooltip({
                  measure: d,
                  labs,
                  x: event.clientX,
                  y: event.clientY,
                });
              })
              .on("mousemove", function (event) {
                setTooltip((prev) =>
                  prev ? { ...prev, x: event.clientX, y: event.clientY } : null
                );
              })
              .on("mouseleave", function () {
                rect.attr("fill", LIGHT_GRAY_COLOR).attr("stroke", BLUE_COLOR);
                setTooltip(null);
              });

            xOffset -= bbox.width + padding * 2 + 3;
          });

          // Add "+N more" if needed
          if (remainingCount > 0) {
            const moreText = badgeGroup
              .append("text")
              .attr("x", xOffset)
              .attr("y", yPos)
              .attr("text-anchor", "end")
              .attr("font-size", "8px")
              .attr("fill", BLUE_COLOR)
              .attr("font-weight", "500")
              .attr("cursor", "pointer")
              .text(`+${remainingCount}`)
              .on("mouseenter", function (event) {
                d3.select(this).attr("fill", "#374151");
                setTooltip({
                  measure: d,
                  labs,
                  x: event.clientX,
                  y: event.clientY,
                });
              })
              .on("mousemove", function (event) {
                setTooltip((prev) =>
                  prev ? { ...prev, x: event.clientX, y: event.clientY } : null
                );
              })
              .on("mouseleave", function () {
                d3.select(this).attr("fill", "#6b7280");
                setTooltip(null);
              });
          }
        }
      });

    // Add value labels on bars
    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) =>
        d.percentValue >= 0
          ? xScale(d.percentValue) + 5
          : xScale(d.percentValue) - 5
      )
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.percentValue >= 0 ? "start" : "end"))
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("opacity", 0)
      .text((d) => formatCoefficient(d.coefficient, 2))
      .transition()
      .duration(800)
      .delay(400)
      .attr("opacity", 1);

    // Add chart title
    svg
      .append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text("Measure Contribution Coefficients");
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
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
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
            Impact: {formatCoefficient(tooltip.measure.coefficient, 3)}
          </div>
          {tooltip.labs.length > 0 ? (
            <div>
              <div className="text-gray-300 text-xs mb-1">Implemented by:</div>
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
            <div className="text-gray-400 text-xs">No implementation data</div>
          )}
        </div>
      )}
    </div>
  );
};

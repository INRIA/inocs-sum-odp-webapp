import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { D3TimelineChartProps, ILabKpiTimeline } from "./types";
import { getFormattedValueString } from "../../../lib/helpers";
import type { EnumKpiMetricType } from "../../../types/KPIs";

export const D3TimelineChart: React.FC<D3TimelineChartProps> = ({
  data,
  metricType,
  height = 250,
  showLegend = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height });

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(width, 300), height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  // Draw chart
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = {
      top: 20,
      right: showLegend ? 120 : 20,
      bottom: 40,
      left: 60,
    };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Collect all years and values for scales
    const allYears: number[] = [];
    const allValues: number[] = [];

    data.forEach((lab) => {
      lab.dataPoints.forEach((point) => {
        allYears.push(point.year);
        allValues.push(point.value);
      });
    });

    if (allYears.length === 0) return;

    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    // Add 10% padding on both ends
    const range = maxValue - minValue;
    const padding = range * 0.1 || 1; // Use 1 as fallback if range is 0
    // If all values are positive, keep min at 0 for better visualization
    const yMin = minValue >= 0 ? 0 : minValue - padding;
    const yMax = maxValue + padding;

    // X scale (years)
    const x = d3
      .scaleLinear()
      .domain([minYear - 0.5, maxYear + 0.5])
      .range([0, width]);

    // Y scale (values)
    const y = d3.scaleLinear().domain([yMin, yMax]).range([chartHeight, 0]);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => d.toString())
          .ticks(Math.min(maxYear - minYear + 1, 10)),
      )
      .selectAll("text")
      .style("font-size", "11px");

    // X axis label
    g.append("text")
      .attr("x", width / 2)
      .attr("y", chartHeight + 35)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs fill-gray-500")
      .text("Year");

    // Y axis
    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .tickFormat((d) =>
            getFormattedValueString(
              d as number,
              metricType as EnumKpiMetricType,
            ),
          ),
      )
      .selectAll("text")
      .style("font-size", "11px");

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3");

    g.select(".grid .domain").remove();

    // Line generator
    const line = d3
      .line<{ year: number; value: number }>()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    // Draw lines for each lab
    data.forEach((lab) => {
      if (lab.dataPoints.length === 0) return;

      // Sort data points by year
      const sortedPoints = [...lab.dataPoints].sort((a, b) => a.year - b.year);

      // Draw line
      g.append("path")
        .datum(sortedPoints)
        .attr("fill", "none")
        .attr("stroke", lab.color)
        .attr("stroke-width", 2.5)
        .attr("d", line);

      // Draw points
      g.selectAll(`.point-${lab.labId}`)
        .data(sortedPoints)
        .enter()
        .append("circle")
        .attr("class", `point-${lab.labId}`)
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(d.value))
        .attr("r", 5)
        .attr("fill", lab.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 7);
          showTooltip(event, lab, d);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 5);
          hideTooltip();
        });
    });

    // Legend (only if showLegend is true)
    if (showLegend) {
      const legend = g
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 0)`);

      data.forEach((lab, i) => {
        const legendItem = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", lab.color)
          .attr("stroke-width", 2.5);

        legendItem
          .append("circle")
          .attr("cx", 10)
          .attr("cy", 0)
          .attr("r", 4)
          .attr("fill", lab.color);

        legendItem
          .append("text")
          .attr("x", 25)
          .attr("y", 4)
          .attr("class", "text-xs fill-gray-700")
          .text(
            lab.labName.length > 10
              ? lab.labName.slice(0, 10) + "..."
              : lab.labName,
          )
          .append("title")
          .text(lab.labName);
      });
    }

    // Tooltip functions
    function showTooltip(
      event: MouseEvent,
      lab: ILabKpiTimeline,
      point: { year: number; value: number; date: string },
    ) {
      if (!tooltipRef.current) return;

      const formattedValue = getFormattedValueString(
        point.value,
        metricType as EnumKpiMetricType,
      );

      tooltipRef.current.innerHTML = `
        <div class="flex items-center gap-2 mb-1">
          <span class="w-3 h-3 rounded-full" style="background-color: ${lab.color}"></span>
          <strong>${lab.labName}</strong>
        </div>
        <div>Value: ${formattedValue}</div>
        <div>Year: ${point.year}</div>
      `;
      tooltipRef.current.style.left = `${event.offsetX + 15}px`;
      tooltipRef.current.style.top = `${event.offsetY - 10}px`;
      tooltipRef.current.style.opacity = "1";
    }

    function hideTooltip() {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.opacity = "0";
    }
  }, [data, dimensions, metricType]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />
      <div
        ref={tooltipRef}
        className="absolute bg-gray-900 text-white text-xs px-3 py-2 rounded-lg pointer-events-none opacity-0 z-50 shadow-lg"
        style={{ transition: "opacity 0.2s" }}
      />
    </div>
  );
};

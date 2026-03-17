/**
 * D3LineChartLabKPIsOvertime Component
 * 
 * React component with client:load that renders a D3 line chart showing
 * KPI results over time per living lab.
 * 
 * @module User Story 2
 */

import { useEffect, useRef, useState } from "react";
import type { LabKpiTimelineSeries } from "./types";

export interface D3LineChartLabKPIsOvertimeProps {
  data: LabKpiTimelineSeries[];
}

/**
 * A D3 line chart showing KPI results submitted per year for each living lab.
 * This component requires client:load for D3 DOM manipulation.
 */
export function D3LineChartLabKPIsOvertime({ data }: D3LineChartLabKPIsOvertimeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 250 });

  // Handle responsive sizing
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.min(height, 300) });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Render chart with D3
  useEffect(() => {
    const renderChart = async () => {
      if (!svgRef.current || data.length === 0) return;

      // Dynamic import of D3 for client-side only
      const d3 = await import("d3");

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom;

      const g = svg
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Gather all data points for scales
      const allPoints = data.flatMap((series) => series.dataPoints);
      if (allPoints.length === 0) return;

      const years = allPoints.map((d) => d.year);
      const counts = allPoints.map((d) => d.count);

      // X scale (years)
      const xScale = d3
        .scaleLinear()
        .domain([Math.min(...years), Math.max(...years)])
        .range([0, width]);

      // Y scale (counts)
      const yScale = d3
        .scaleLinear()
        .domain([0, Math.max(...counts, 1)])
        .nice()
        .range([height, 0]);

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(Math.min(years.length, 6))
            .tickFormat(d3.format("d"))
        )
        .selectAll("text")
        .attr("class", "text-xs text-gray-500");

      // Y axis
      g.append("g")
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .attr("class", "text-xs text-gray-500");

      // Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs text-gray-500")
        .text("KPI Results");

      // Line generator
      const line = d3
        .line<{ year: number; count: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.count))
        .curve(d3.curveMonotoneX);

      // Draw lines for each series
      data.forEach((series) => {
        if (series.dataPoints.length === 0) return;

        // Sort data points by year
        const sortedPoints = [...series.dataPoints].sort((a, b) => a.year - b.year);

        // Draw line
        g.append("path")
          .datum(sortedPoints)
          .attr("fill", "none")
          .attr("stroke", series.color)
          .attr("stroke-width", 2)
          .attr("d", line);

        // Draw dots
        g.selectAll(`.dot-${series.labId}`)
          .data(sortedPoints)
          .enter()
          .append("circle")
          .attr("cx", (d) => xScale(d.year))
          .attr("cy", (d) => yScale(d.count))
          .attr("r", 4)
          .attr("fill", series.color)
          .attr("class", "cursor-pointer")
          .append("title")
          .text((d) => `${series.labName}: ${d.count} results in ${d.year}`);
      });
    };

    renderChart();
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px]">
      <svg ref={svgRef} className="w-full h-full" />
      {/* Legend */}
      {data.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
          {data.map((series) => (
            <div key={series.labId} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <span className="text-xs text-gray-600">{series.labName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default D3LineChartLabKPIsOvertime;

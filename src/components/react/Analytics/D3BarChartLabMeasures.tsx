/**
 * D3BarChartLabMeasures Component
 * 
 * React component with client:load that renders a D3 grouped bar chart showing
 * PUSH and PULL measures per living lab.
 * 
 * @module User Story 3
 */

import { useEffect, useRef, useState } from "react";
import type { LabMeasuresBarData } from "./types";

export interface D3BarChartLabMeasuresProps {
  data: LabMeasuresBarData[];
}

/**
 * A D3 grouped bar chart showing PUSH and PULL measures for each living lab.
 * This component requires client:load for D3 DOM manipulation.
 */
export function D3BarChartLabMeasures({ data }: D3BarChartLabMeasuresProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 250 });

  // Colors for PUSH and PULL
  const colors = {
    push: "#3B82F6", // Primary blue
    pull: "#10B981", // Secondary green
  };

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

      const margin = { top: 20, right: 30, bottom: 60, left: 50 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom;

      const g = svg
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X scale (lab names)
      const x0 = d3
        .scaleBand()
        .domain(data.map((d) => d.labName))
        .range([0, width])
        .padding(0.2);

      // X1 scale (PUSH/PULL within each lab)
      const x1 = d3
        .scaleBand()
        .domain(["push", "pull"])
        .range([0, x0.bandwidth()])
        .padding(0.05);

      // Y scale
      const maxValue = Math.max(...data.flatMap((d) => [d.pushCount, d.pullCount]), 1);
      const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height, 0]);

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("class", "text-xs text-gray-500")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.5em");

      // Y axis
      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .attr("class", "text-xs text-gray-500");

      // Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs text-gray-500")
        .text("Measures Count");

      // Draw bars
      data.forEach((d) => {
        const labGroup = g.append("g").attr("transform", `translate(${x0(d.labName)},0)`);

        // PUSH bar
        labGroup
          .append("rect")
          .attr("x", x1("push")!)
          .attr("y", y(d.pushCount))
          .attr("width", x1.bandwidth())
          .attr("height", height - y(d.pushCount))
          .attr("fill", colors.push)
          .append("title")
          .text(`${d.labName}: ${d.pushCount} PUSH measures`);

        // PULL bar
        labGroup
          .append("rect")
          .attr("x", x1("pull")!)
          .attr("y", y(d.pullCount))
          .attr("width", x1.bandwidth())
          .attr("height", height - y(d.pullCount))
          .attr("fill", colors.pull)
          .append("title")
          .text(`${d.labName}: ${d.pullCount} PULL measures`);
      });
    };

    renderChart();
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px]">
      <svg ref={svgRef} className="w-full h-full" />
      {/* Legend */}
      <div className="flex gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.push }} />
          <span className="text-xs text-gray-600">PUSH</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.pull }} />
          <span className="text-xs text-gray-600">PULL</span>
        </div>
      </div>
    </div>
  );
}

export default D3BarChartLabMeasures;

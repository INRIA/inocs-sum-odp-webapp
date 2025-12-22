import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

export interface Series {
  name: string;
  color: string;
  values: number[]; // percentage values, e.g., -12.3, 5.6
}

interface D3KpiLabsVariationsChartProps {
  categories: string[]; // ["All Living Labs", ...lab names]
  series: Series[]; // First series usually Overall, then KPI series
  height?: number; // default 360
  xLabel?: string; // default "% variation"
}

export const D3KpiLabsVariationsChart: React.FC<
  D3KpiLabsVariationsChartProps
> = ({ categories, series, height = 360, xLabel = "% variation" }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState<number>(720);

  // Resize observer for responsive width
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setWidth(w);
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const margin = useMemo(
    () => ({ top: 16, right: 48, bottom: 40, left: 120 }),
    []
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = Math.max(240, width - margin.left - margin.right);
    const innerHeight = Math.max(120, height - margin.top - margin.bottom);

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Compute x domain symmetric around zero based on data
    const allVals = series.flatMap((s) =>
      s.values.filter((v) => Number.isFinite(v))
    );
    const maxAbs = Math.max(5, d3.max(allVals.map((v) => Math.abs(v))) || 0);
    const xDomain = [-maxAbs, maxAbs];

    // Scales - swapped for horizontal bars
    const y0 = d3
      .scaleBand<string>()
      .domain(categories)
      .range([0, innerHeight])
      .paddingInner(0.2);

    const y1 = d3
      .scaleBand<string>()
      .domain(series.map((s) => s.name))
      .range([0, y0.bandwidth()])
      .padding(0.1);

    const x = d3.scaleLinear().domain(xDomain).nice().range([0, innerWidth]);

    const xAxis = d3
      .axisBottom(x)
      .ticks(6)
      .tickFormat((d) => `${d}%` as any);
    const yAxis = d3.axisLeft(y0).tickSizeOuter(0);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("class", "text-xs text-gray-500")
      .call(xAxis as any)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#6b7280"); // gray-500

    g.append("g")
      .attr("class", "text-xs text-gray-500")
      .call(yAxis as any)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#6b7280");

    // X label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .style("font-size", "12px")
      .text(xLabel);

    // Zero line (vertical for horizontal bars)
    g.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#e5e7eb"); // gray-200

    // Tooltip
    const tooltip = d3
      .select(wrapperRef.current)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "6px")
      .style("padding", "6px 8px")
      .style("font-size", "12px")
      .style("color", "#111827")
      .style("box-shadow", "0 1px 2px rgba(0,0,0,0.06)")
      .style("opacity", 0);

    const group = g
      .selectAll(".category")
      .data(categories)
      .enter()
      .append("g")
      .attr("class", "category")
      .attr("transform", (d) => `translate(0,${y0(d)})`);

    // Draw bars per series (horizontal)
    for (const s of series) {
      group
        .append("g")
        .attr("fill", s.color)
        .selectAll("rect")
        .data((cat, i) => [{ category: cat, value: s.values[i] ?? 0 }])
        .enter()
        .append("rect")
        .attr("y", () => y1(s.name) || 0)
        .attr("height", y1.bandwidth())
        .attr("x", (d) => (d.value >= 0 ? x(0) : x(d.value)))
        .attr("width", (d) => Math.abs(x(d.value) - x(0)))
        .on("mousemove", function (event, d) {
          const [mx, my] = d3.pointer(event, wrapperRef.current as Element);
          tooltip
            .style("left", `${mx + 12}px`)
            .style("top", `${my + 12}px`)
            .style("opacity", 1)
            .html(
              `<div><strong>${s.name}</strong></div><div>${
                d.category
              }</div><div>${d.value.toFixed(2)}%</div>`
            );
        })
        .on("mouseout", function () {
          tooltip.style("opacity", 0);
        });
    }

    return () => {
      tooltip.remove();
    };
  }, [width, height, margin, categories, series, xLabel]);

  return (
    <div ref={wrapperRef} className="w-full relative">
      <svg ref={svgRef} />
    </div>
  );
};

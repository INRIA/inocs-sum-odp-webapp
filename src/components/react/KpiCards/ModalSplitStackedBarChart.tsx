import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ModalSplitChartDataset, SplitItem } from "./ModalSplitChart";

export interface ModalSplitStackedBarChartProps {
  data: ModalSplitChartDataset[];
  /** Orientation of the stacked bars. Default is 'vertical' */
  orientation?: "horizontal" | "vertical";
  /** Height of the chart in pixels */
  height?: number;
  viewLegend?: boolean;
}

function normalizePercentages(items: SplitItem[]): number[] {
  const total = items.reduce((s, it) => s + (Number(it.value) || 0), 0);
  if (total === 0) {
    const len = items.length || 1;
    return items.map(() => +(100 / len).toFixed(1));
  }
  return items.map((it) => +((Number(it.value) || 0) * 100).toFixed(1));
}

export const ModalSplitStackedBarChart: React.FC<
  ModalSplitStackedBarChartProps
> = ({ data, orientation = "vertical", height = 300, viewLegend = true }) => {
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
        setDimensions({ width: Math.max(width, 350), height });
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

    const margin = { top: 20, right: 20, bottom: 40, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data: normalize percentages for each dataset
    const processedData = data.map((dataset) => {
      const sortedItems = [...dataset.data].sort((a, b) => b.value - a.value);
      const percentages = normalizePercentages(sortedItems);
      return {
        label: dataset.label,
        items: sortedItems.map((item, i) => ({
          ...item,
          percentage: percentages[i],
        })),
      };
    });

    // Get all unique transport mode labels for consistent ordering
    const allLabels = Array.from(
      new Set(data.flatMap((d) => d.data.map((item) => item.label))),
    );

    // Create color map from the data (uses colors from SplitItem)
    const colorMap = new Map<string, string>();
    data.forEach((dataset) => {
      dataset.data.forEach((item) => {
        if (!colorMap.has(item.label)) {
          colorMap.set(item.label, item.color);
        }
      });
    });

    if (orientation === "vertical") {
      drawVerticalBars(
        g,
        processedData,
        allLabels,
        colorMap,
        width,
        chartHeight,
      );
    } else {
      drawHorizontalBars(
        g,
        processedData,
        allLabels,
        colorMap,
        width,
        chartHeight,
      );
    }

    // Tooltip functions
    function showTooltip(
      event: MouseEvent,
      label: string,
      percentage: number,
      datasetLabel: string,
      color: string,
    ) {
      if (!tooltipRef.current) return;

      tooltipRef.current.innerHTML = `
        <div class="flex items-center gap-2 mb-1">
          <span class="w-3 h-3 rounded-sm" style="background-color: ${color}"></span>
          <strong>${label}</strong>
        </div>
        <div>${datasetLabel}: ${percentage}%</div>
      `;
      tooltipRef.current.style.left = `${event.offsetX + 15}px`;
      tooltipRef.current.style.top = `${event.offsetY - 10}px`;
      tooltipRef.current.style.opacity = "1";
    }

    function hideTooltip() {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.opacity = "0";
    }

    function drawVerticalBars(
      g: d3.Selection<SVGGElement, unknown, null, undefined>,
      processedData: Array<{
        label: string;
        items: Array<SplitItem & { percentage: number }>;
      }>,
      allLabels: string[],
      colorMap: Map<string, string>,
      width: number,
      chartHeight: number,
    ) {
      // X scale for datasets (Before, After)
      const x = d3
        .scaleBand()
        .domain(processedData.map((d) => d.label))
        .range([0, width])
        .padding(0.3);

      // Y scale (0-100%)
      const y = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "500");

      // Y axis
      g.append("g")
        .call(
          d3
            .axisLeft(y)
            .tickFormat((d) => `${d}%`)
            .ticks(5),
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

      // Draw stacked bars for each dataset
      processedData.forEach((dataset) => {
        let cumulativeY = 0;

        dataset.items.forEach((item) => {
          const barHeight = (item.percentage / 100) * chartHeight;
          const yPos = chartHeight - cumulativeY - barHeight;
          const color = colorMap.get(item.label) || "#ccc";

          g.append("rect")
            .attr("x", x(dataset.label) || 0)
            .attr("y", yPos)
            .attr("width", x.bandwidth())
            .attr("height", barHeight)
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .on("mouseover", function (event) {
              d3.select(this).attr("opacity", 0.8);
              showTooltip(
                event,
                item.label,
                item.percentage,
                dataset.label,
                color,
              );
            })
            .on("mouseout", function () {
              d3.select(this).attr("opacity", 1);
              hideTooltip();
            });

          cumulativeY += barHeight;
        });
      });
    }

    function drawHorizontalBars(
      g: d3.Selection<SVGGElement, unknown, null, undefined>,
      processedData: Array<{
        label: string;
        items: Array<SplitItem & { percentage: number }>;
      }>,
      allLabels: string[],
      colorMap: Map<string, string>,
      width: number,
      chartHeight: number,
    ) {
      // Y scale for datasets (Before, After)
      const y = d3
        .scaleBand()
        .domain(processedData.map((d) => d.label))
        .range([0, chartHeight])
        .padding(0.3);

      // X scale (0-100%)
      const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(
          d3
            .axisBottom(x)
            .tickFormat((d) => `${d}%`)
            .ticks(5),
        )
        .selectAll("text")
        .style("font-size", "11px");

      // Y axis
      g.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "500");

      // Grid lines
      g.append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisBottom(x)
            .tickSize(chartHeight)
            .tickFormat(() => ""),
        )
        .selectAll("line")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-dasharray", "3,3");

      g.select(".grid .domain").remove();

      // Draw stacked bars for each dataset
      processedData.forEach((dataset) => {
        let cumulativeX = 0;

        dataset.items.forEach((item) => {
          const barWidth = (item.percentage / 100) * width;
          const color = colorMap.get(item.label) || "#ccc";

          g.append("rect")
            .attr("x", cumulativeX)
            .attr("y", y(dataset.label) || 0)
            .attr("width", barWidth)
            .attr("height", y.bandwidth())
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .on("mouseover", function (event) {
              d3.select(this).attr("opacity", 0.8);
              showTooltip(
                event,
                item.label,
                item.percentage,
                dataset.label,
                color,
              );
            })
            .on("mouseout", function () {
              d3.select(this).attr("opacity", 1);
              hideTooltip();
            });

          cumulativeX += barWidth;
        });
      });
    }
  }, [data, dimensions, orientation]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  // Get legend items from data
  const legendItems = Array.from(
    new Map(
      data.flatMap((d) => d.data.map((item) => [item.label, item.color])),
    ).entries(),
  );

  return (
    <div className="flex flex-row gap-2 w-full">
      <div ref={containerRef} className="relative w-1/2">
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
      {/* Legend */}
      {viewLegend && (
        <div className="w-1/2 flex flex-col h-60 gap-0">
          {legendItems.map(([label, color]) => (
            <li
              key={label}
              className="flex items-center gap-1 justify-between text-sm"
            >
              <span
                className="inline-block rounded-[3px] flex-shrink-0 w-3 h-3"
                style={{ background: color ?? "#ccc" }}
              />
              <small className="flex-1">{label}</small>
            </li>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModalSplitStackedBarChart;

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { D3FacetedTimelineChartProps, ILabKpiTimeline } from "./types";
import { formatValueToString } from "../../../lib/helpers";
import type { EnumKpiMetricType } from "../../../types/KPIs";

const MOBILE_BREAKPOINT = 768;
/**
 * D3FacetedTimelineChart - A unified chart with multiple facets (small multiples)
 * for comparing child KPIs side by side with shared Y-axis and synchronized tooltips.
 */
export const D3FacetedTimelineChart: React.FC<D3FacetedTimelineChartProps> = ({
  facets,
  metricType,
  facetHeight = 180,
  showLegend = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Collect all unique labs across all facets for a shared legend
  const allLabs = useMemo(() => {
    const labMap = new Map<
      number,
      { labId: number; labName: string; color: string }
    >();
    facets.forEach((facet) => {
      facet.labTimelines.forEach((lab) => {
        if (!labMap.has(lab.labId)) {
          labMap.set(lab.labId, {
            labId: lab.labId,
            labName: lab.labName,
            color: lab.color,
          });
        }
      });
    });
    return Array.from(labMap.values());
  }, [facets]);

  // Calculate global Y-axis domain (shared across all facets)
  const globalYDomain = useMemo(() => {
    let minValue = Infinity;
    let maxValue = -Infinity;
    facets.forEach((facet) => {
      facet.labTimelines.forEach((lab) => {
        lab.dataPoints.forEach((point) => {
          minValue = Math.min(minValue, point.value);
          maxValue = Math.max(maxValue, point.value);
        });
      });
    });
    // Handle edge case when no data points exist
    if (minValue === Infinity) minValue = 0;
    if (maxValue === -Infinity) maxValue = 0;
    // Add 10% padding on both ends
    const range = maxValue - minValue;
    const padding = range * 0.1 || 1; // Use 1 as fallback if range is 0
    // If all values are positive, keep min at 0 for better visualization
    const adjustedMin = minValue >= 0 ? 0 : minValue - padding;
    const adjustedMax = maxValue + padding;
    return [adjustedMin, adjustedMax];
  }, [facets]);

  // Calculate global X-axis domain (shared across all facets)
  const globalXDomain = useMemo(() => {
    const allYears: number[] = [];
    facets.forEach((facet) => {
      facet.labTimelines.forEach((lab) => {
        lab.dataPoints.forEach((point) => {
          allYears.push(point.year);
        });
      });
    });
    if (allYears.length === 0) return [2020, 2025];
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    return [minYear - 0.5, maxYear + 0.5];
  }, [facets]);

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setContainerWidth(Math.max(width, 350));
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw faceted chart
  useEffect(() => {
    if (!svgRef.current || facets.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 15, bottom: 30, left: 30 };
    const legendHeight = showLegend ? 40 : 0;
    const facetSpacing = 15;
    const facetTitleHeight = 25;
    const rowSpacing = 40; // Space between rows

    // Responsive: 2 facets per row on mobile (<768px), 3 on tablet/desktop
    const maxFacetsPerRow = containerWidth < MOBILE_BREAKPOINT ? 2 : 3;
    const facetCount = facets.length;
    const facetsPerRow = Math.min(facetCount, maxFacetsPerRow);
    const numRows = Math.ceil(facetCount / maxFacetsPerRow);

    // Calculate facet width based on facets per row (max 3)
    const totalFacetWidth = containerWidth - margin.left - margin.right;
    const facetWidth =
      (totalFacetWidth - (facetsPerRow - 1) * facetSpacing) / facetsPerRow;

    // Total chart height with multiple rows
    const totalHeight =
      margin.top +
      numRows * (facetTitleHeight + facetHeight + rowSpacing) -
      rowSpacing + // Remove extra spacing after last row
      legendHeight +
      margin.bottom;

    // Shared Y scale
    const yScale = d3
      .scaleLinear()
      .domain(globalYDomain)
      .range([facetHeight, 0]);

    // Shared X scale (per facet width)
    const xScale = d3
      .scaleLinear()
      .domain(globalXDomain)
      .range([0, facetWidth]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Line generator
    const line = d3
      .line<{ year: number; value: number }>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw each row of facets
    for (let row = 0; row < numRows; row++) {
      const rowY = row * (facetTitleHeight + facetHeight + rowSpacing);
      const startIdx = row * maxFacetsPerRow;
      const endIdx = Math.min(startIdx + maxFacetsPerRow, facetCount);
      const facetsInThisRow = endIdx - startIdx;

      // Create a group for this row
      const rowGroup = g.append("g").attr("transform", `translate(0,${rowY})`);

      // Draw Y axis only for the first column (left side)
      if (row === 0) {
        rowGroup
          .append("g")
          .call(
            d3
              .axisLeft(yScale)
              .tickFormat((d) =>
                formatValueToString(
                  d as number,
                  metricType as EnumKpiMetricType,
                ),
              ),
          )
          .selectAll("text")
          .style("font-size", "10px");
      } else {
        // For subsequent rows, just draw tick marks without labels for alignment
        rowGroup
          .append("g")
          .call(d3.axisLeft(yScale).tickFormat(() => ""))
          .selectAll("text")
          .style("font-size", "10px");
      }

      // Draw horizontal grid lines for this row
      const rowGridWidth =
        facetsInThisRow * facetWidth + (facetsInThisRow - 1) * facetSpacing;
      rowGroup
        .append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(-rowGridWidth)
            .tickFormat(() => ""),
        )
        .selectAll("line")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-dasharray", "3,3");

      rowGroup.select(".grid .domain").remove();

      // Draw facets in this row
      for (let i = startIdx; i < endIdx; i++) {
        const facet = facets[i];
        const colIndex = i - startIdx;
        const facetX = colIndex * (facetWidth + facetSpacing);

        const facetGroup = rowGroup
          .append("g")
          .attr("transform", `translate(${facetX},0)`);

        // Facet background
        facetGroup
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", facetWidth)
          .attr("height", facetHeight)
          .attr("fill", "#fafafa")
          .attr("stroke", "#e5e7eb")
          .attr("stroke-width", 1)
          .attr("rx", 4);

        // Facet title
        facetGroup
          .append("text")
          .attr("x", facetWidth / 2)
          .attr("y", -8)
          .attr("text-anchor", "middle")
          .attr("class", "text-xs font-medium")
          .attr("fill", "#374151")
          .text(
            facet.kpiName.length > 25
              ? facet.kpiName.slice(0, 25) + "..."
              : facet.kpiName,
          )
          .append("title")
          .text(facet.kpiName);

        // X axis for this facet
        facetGroup
          .append("g")
          .attr("transform", `translate(0,${facetHeight})`)
          .call(
            d3
              .axisBottom(xScale)
              .tickFormat((d) => d.toString())
              .ticks(Math.min(globalXDomain[1] - globalXDomain[0] + 1, 5)),
          )
          .selectAll("text")
          .style("font-size", "9px");

        // Draw lines and points for each lab in this facet
        facet.labTimelines.forEach((lab) => {
          if (lab.dataPoints.length === 0) return;

          const sortedPoints = [...lab.dataPoints].sort(
            (a, b) => a.year - b.year,
          );

          // Draw line
          facetGroup
            .append("path")
            .datum(sortedPoints)
            .attr("fill", "none")
            .attr("stroke", lab.color)
            .attr("stroke-width", 2)
            .attr("d", line);

          // Draw points
          facetGroup
            .selectAll(`.point-${i}-${lab.labId}`)
            .data(sortedPoints)
            .enter()
            .append("circle")
            .attr("class", `point-${i}-${lab.labId}`)
            .attr("cx", (d) => xScale(d.year))
            .attr("cy", (d) => yScale(d.value))
            .attr("r", 4)
            .attr("fill", lab.color)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
              d3.select(this).attr("r", 6);
              showTooltip(event, lab, d, facet.kpiName);
            })
            .on("mouseout", function () {
              d3.select(this).attr("r", 4);
              hideTooltip();
            });
        });
      }
    }

    // Draw shared legend at the bottom (after all rows) - only if showLegend is true
    if (showLegend) {
      const legendY =
        numRows * (facetTitleHeight + facetHeight + rowSpacing) -
        rowSpacing +
        20;
      const legendGroup = g
        .append("g")
        .attr("transform", `translate(0, ${legendY})`);

      const legendItemWidth = Math.min(120, totalFacetWidth / allLabs.length);

      allLabs.forEach((lab, i) => {
        const legendItem = legendGroup
          .append("g")
          .attr("transform", `translate(${i * legendItemWidth}, 0)`);

        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", 15)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", lab.color)
          .attr("stroke-width", 2.5);

        legendItem
          .append("circle")
          .attr("cx", 7.5)
          .attr("cy", 0)
          .attr("r", 3)
          .attr("fill", lab.color);

        legendItem
          .append("text")
          .attr("x", 20)
          .attr("y", 4)
          .attr("class", "text-xs")
          .attr("fill", "#374151")
          .text(
            lab.labName.length > 12
              ? lab.labName.slice(0, 12) + "..."
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
      kpiName: string,
    ) {
      if (!tooltipRef.current) return;

      const formattedValue = formatValueToString(
        point.value,
        metricType as EnumKpiMetricType,
      );

      tooltipRef.current.innerHTML = `
        <div class="font-medium text-xs text-gray-400 mb-1">${kpiName}</div>
        <div class="flex items-center gap-2 mb-1">
          <span class="w-3 h-3 rounded-full" style="background-color: ${lab.color}"></span>
          <strong>${lab.labName}</strong>
        </div>
        <div>Value: ${formattedValue}</div>
        <div>Year: ${point.year}</div>
      `;
      tooltipRef.current.style.left = `${event.offsetX + margin.left + 15}px`;
      tooltipRef.current.style.top = `${event.offsetY + margin.top - 10}px`;
      tooltipRef.current.style.opacity = "1";
    }

    function hideTooltip() {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.opacity = "0";
    }
  }, [
    facets,
    containerWidth,
    metricType,
    globalYDomain,
    globalXDomain,
    allLabs,
    facetHeight,
  ]);

  // Calculate total height for the SVG with multiple rows
  const legendHeight = 40;
  const facetTitleHeight = 25;
  const rowSpacing = 40;
  // Responsive: 2 facets per row on mobile (<768px), 3 on tablet/desktop
  const maxFacetsPerRow = containerWidth < MOBILE_BREAKPOINT ? 2 : 3;
  const numRows = Math.ceil(facets.length / maxFacetsPerRow);
  const totalHeight =
    numRows * (facetTitleHeight + facetHeight + rowSpacing) -
    rowSpacing + // Remove extra spacing after last row
    legendHeight;

  if (facets.length === 0) {
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
        width={containerWidth}
        height={totalHeight}
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

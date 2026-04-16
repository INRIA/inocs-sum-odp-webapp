/**
 * D3LineChartLabKPIsOvertime Component
 * 
 * React component with client:load that renders a D3 line chart showing
 * KPI results over time per living lab.
 * 
 * @module User Story 2
 */

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [selectedLabIds, setSelectedLabIds] = useState<number[]>(() =>
    data.map((series) => series.labId),
  );

  useEffect(() => {
    const nextLabIds = data.map((series) => series.labId);

    setSelectedLabIds((previousSelection) => {
      if (nextLabIds.length === 0) {
        return [];
      }

      const nextLabIdSet = new Set(nextLabIds);
      const preservedSelection = previousSelection.filter((labId) =>
        nextLabIdSet.has(labId),
      );
      const selectedLabIdSet = new Set(preservedSelection);
      const newLabIds = nextLabIds.filter((labId) => !selectedLabIdSet.has(labId));
      const nextSelection = [...preservedSelection, ...newLabIds];

      return nextSelection.length > 0 ? nextSelection : [...nextLabIds];
    });
  }, [data]);

  const selectedLabIdSet = useMemo(
    () => new Set(selectedLabIds),
    [selectedLabIds],
  );

  const visibleSeries = useMemo(
    () => data.filter((series) => selectedLabIdSet.has(series.labId)),
    [data, selectedLabIdSet],
  );

  const hasVisibleDataPoints = useMemo(
    () => visibleSeries.some((series) => series.dataPoints.length > 0),
    [visibleSeries],
  );

  const toggleLabVisibility = (labId: number) => {
    setSelectedLabIds((previousSelection) => {
      const isSelected = previousSelection.includes(labId);

      if (isSelected) {
        if (previousSelection.length === 1) {
          return previousSelection;
        }

        return previousSelection.filter((selectedLabId) => selectedLabId !== labId);
      }

      return [...previousSelection, labId];
    });
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
    let isCancelled = false;

    const renderChart = async () => {
      if (!svgRef.current) return;

      // Dynamic import of D3 for client-side only
      const d3 = await import("d3");

      if (!svgRef.current || isCancelled) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      if (visibleSeries.length === 0 || !hasVisibleDataPoints) {
        return;
      }

      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom;

      const g = svg
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Gather all data points for scales
      const allPoints = visibleSeries.flatMap((series) => series.dataPoints);
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
      visibleSeries.forEach((series) => {
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

    return () => {
      isCancelled = true;
    };
  }, [visibleSeries, hasVisibleDataPoints, dimensions]);

  return (
    <div className="flex h-full w-full min-h-50 flex-col gap-3">
      <div ref={containerRef} className="relative min-h-50 flex-1">
        <svg ref={svgRef} className="h-full w-full" />
        {!hasVisibleDataPoints && (
          <div className="absolute inset-0 flex h-full min-h-50 items-center justify-center text-gray-400">
            <p className="text-sm">
              No KPI timeline data available for the selected labs
            </p>
          </div>
        )}
      </div>
      {data.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <small className="text-xs text-gray-500">
              Click on living labs to show or hide them in the chart
            </small>
            <span className="text-xs text-gray-500">
              {selectedLabIds.length}/{data.length} selected
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
          {data.map((series) => (
            <button
              key={series.labId}
              type="button"
              onClick={() => toggleLabVisibility(series.labId)}
              aria-pressed={selectedLabIdSet.has(series.labId)}
              disabled={selectedLabIdSet.has(series.labId) && selectedLabIds.length === 1}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className="inline-block h-3 w-3 rounded-full border"
                style={{
                  backgroundColor: selectedLabIdSet.has(series.labId)
                    ? series.color
                    : "transparent",
                  borderColor: series.color,
                }}
                aria-hidden
              />
              <span
                className={
                  selectedLabIdSet.has(series.labId)
                    ? "text-gray-900"
                    : "text-gray-500"
                }
              >
                {series.labName}
              </span>
            </button>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}

export default D3LineChartLabKPIsOvertime;

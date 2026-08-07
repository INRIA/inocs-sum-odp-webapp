import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  COLOR_GREEN,
  COLOR_GRAY,
  COLOR_LIGHT_BLUE,
  COLOR_RED,
} from "../../../styles/constants";

// Flow colors
const NET_FLOW_COLOR = COLOR_LIGHT_BLUE;
const POSITIVE_FLOW_COLOR = COLOR_GREEN;
const NEGATIVE_FLOW_COLOR = COLOR_RED;

interface D3McdaNetFlowsChartProps {
  netFlows: { [key: string]: number };
  positiveFlows?: { [key: string]: number };
  negativeFlows?: { [key: string]: number };
  alternativeLabels: { [key: string]: string };
  height?: number;
}

interface TooltipData {
  key: string;
  label: string;
  netFlow: number;
  positiveFlow?: number;
  negativeFlow?: number;
  x: number;
  y: number;
}

interface ChartDataPoint {
  key: string;
  label: string;
  netFlow: number;
  positiveFlow: number;
  negativeFlow: number;
}

interface FlowVisibility {
  netFlow: boolean;
  positiveFlow: boolean;
  negativeFlow: boolean;
}

export const D3McdaNetFlowsChart: React.FC<D3McdaNetFlowsChartProps> = ({
  netFlows,
  positiveFlows = {},
  negativeFlows = {},
  alternativeLabels,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [isMobile, setIsMobile] = useState(false);
  const [visibility, setVisibility] = useState<FlowVisibility>({
    netFlow: true,
    positiveFlow: true,
    negativeFlow: true,
  });

  const toggleVisibility = (flowType: keyof FlowVisibility) => {
    setVisibility((prev) => ({ ...prev, [flowType]: !prev[flowType] }));
  };

  // Handle responsive sizing and mobile detection
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkMobile);
    };
  }, [height]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || Object.keys(netFlows).length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Left margin gives room for the key label (A1, A2…) on both mobile and desktop
    const margin = isMobile
      ? { top: 40, right: 20, bottom: 60, left: 50 }
      : { top: 40, right: 40, bottom: 60, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data
    const data: ChartDataPoint[] = Object.entries(netFlows)
      .map(([key, netFlow]) => ({
        key,
        label: alternativeLabels[key] || key,
        netFlow,
        positiveFlow: positiveFlows[key] || 0,
        negativeFlow: -negativeFlows[key] || 0,
      }))
      .sort((a, b) => b.netFlow - a.netFlow); // Sort by net flow descending

    // Scales
    const maxAbsValue =
      d3.max(data, (d) =>
        Math.max(
          Math.abs(d.netFlow),
          Math.abs(d.positiveFlow),
          Math.abs(d.negativeFlow),
        ),
      ) || 1;
    const xScale = d3
      .scaleLinear()
      .domain([-maxAbsValue * 1.1, maxAbsValue * 1.1])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, chartHeight])
      .padding(0.3);

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

    // Helper function to create bars for a specific flow type
    const createBars = (
      flowType: "netFlow" | "positiveFlow" | "negativeFlow",
      color: string,
      offset: number,
    ) => {
      if (!visibility[flowType]) return;

      const barHeight = yScale.bandwidth() / 3;
      const bars = g
        .selectAll(`.bar-${flowType}`)
        .data(data)
        .enter()
        .append("rect")
        .attr("class", `bar-${flowType}`)
        .attr("x", (d) => (d[flowType] >= 0 ? xScale(0) : xScale(d[flowType])))
        .attr("y", (d) => (yScale(d.label) || 0) + offset)
        .attr("height", barHeight)
        .attr("fill", color)
        .attr("opacity", 0.8)
        .attr("rx", 3)
        .attr("width", 0)
        .on("mouseenter", function (event, d) {
          d3.select(this)
            .attr("opacity", 1)
            .attr("stroke", "#1f2937")
            .attr("stroke-width", 2);

          setTooltip({
            key: d.key,
            label: d.label,
            netFlow: d.netFlow,
            positiveFlow: d.positiveFlow,
            negativeFlow: -d.negativeFlow,
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
        .attr("width", (d) => Math.abs(xScale(d[flowType]) - xScale(0)));

      // Add value labels
      g.selectAll(`.label-${flowType}`)
        .data(data)
        .enter()
        .append("text")
        .attr("class", `label-${flowType}`)
        .attr("x", (d) =>
          d[flowType] >= 0 ? xScale(d[flowType]) + 5 : xScale(d[flowType]) - 5,
        )
        .attr("y", (d) => (yScale(d.label) || 0) + offset + barHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", (d) => (d[flowType] >= 0 ? "start" : "end"))
        .attr("fill", COLOR_GRAY)
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("opacity", 0)
        .text((d) => d[flowType].toFixed(2))
        .transition()
        .duration(800)
        .delay(400)
        .attr("opacity", 1);
    };

    // Create bars for each flow type with vertical offsets
    createBars("netFlow", NET_FLOW_COLOR, 0);
    createBars("positiveFlow", POSITIVE_FLOW_COLOR, yScale.bandwidth() / 3);
    createBars(
      "negativeFlow",
      NEGATIVE_FLOW_COLOR,
      (yScale.bandwidth() * 2) / 3,
    );

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call((g) => g.select(".domain").attr("stroke", "#9ca3af"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    // Add X axis label
    g.append("text")
      .attr("x", width / 2)
      .attr("y", chartHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", COLOR_GRAY)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text("Overall score (φ)");

    // Add Y axis with labels
    const yAxis = g.append("g").attr("class", "y-axis");

    yAxis
      .selectAll(".alternative-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "alternative-label")
      .attr("x", -8)
      .attr("y", (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", COLOR_GRAY)
      .attr("font-size", isMobile ? "11px" : "12px")
      .attr("font-weight", "700")
      .attr("cursor", "pointer")
      .text((d) => d.key.toUpperCase())
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill", COLOR_LIGHT_BLUE);
        setTooltip({
          key: d.key,
          label: d.label,
          netFlow: d.netFlow,
          positiveFlow: d.positiveFlow,
          negativeFlow: -d.negativeFlow,
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

    // Remove old value labels section - now handled in createBars

    // Add chart title
    svg
      .append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", COLOR_GRAY)
      .attr("font-size", "16px")
      .attr("font-weight", "700")
      .text("Business Activities - ranking");
  }, [
    netFlows,
    positiveFlows,
    negativeFlows,
    alternativeLabels,
    dimensions,
    isMobile,
    visibility,
  ]);

  if (Object.keys(netFlows).length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          No overall scores data available for visualization.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col rounded-lg shadow-md border border-gray-200">
        <div ref={chartContainerRef} className="w-full">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-white"
          />
        </div>

        {/* Flow Types Legend */}
        <div className="w-full p-4 bg-white">
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={() => toggleVisibility("netFlow")}
              className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                visibility.netFlow
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "bg-gray-50 hover:bg-gray-100 opacity-50"
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: NET_FLOW_COLOR }}
              />
              <span className="text-sm font-medium text-gray-700">
                Overall score
              </span>
            </button>

            <button
              onClick={() => toggleVisibility("positiveFlow")}
              className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                visibility.positiveFlow
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "bg-gray-50 hover:bg-gray-100 opacity-50"
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: POSITIVE_FLOW_COLOR }}
              />
              <span className="text-sm font-medium text-gray-700">
                Strengths
              </span>
            </button>
            <button
              onClick={() => toggleVisibility("negativeFlow")}
              className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                visibility.negativeFlow
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "bg-gray-50 hover:bg-gray-100 opacity-50"
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: NEGATIVE_FLOW_COLOR }}
              />
              <span className="text-sm font-medium text-gray-700">
                Weaknesses
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-light text-dark px-4 py-3 rounded-lg shadow-xl text-sm max-w-xs pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 10}px`,
            transform: "translateY(-100%)",
          }}
        >
          <div className="font-bold mb-1">{tooltip.label}</div>
          <div className="space-y-1">
            <div className="text-dark text-xs">
              Overall score (φ):{" "}
              <span className="font-semibold text-black">
                {tooltip.netFlow.toFixed(4)}
              </span>
            </div>
            {tooltip.positiveFlow !== undefined && (
              <div className="text-dark text-xs">
                Strengths (φ+):{" "}
                <span className="font-semibold text-black">
                  {tooltip.positiveFlow.toFixed(4)}
                </span>
              </div>
            )}
            {tooltip.negativeFlow !== undefined && (
              <div className="text-dark text-xs">
                Weaknesses (φ-):{" "}
                <span className="font-semibold text-black">
                  {tooltip.negativeFlow.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

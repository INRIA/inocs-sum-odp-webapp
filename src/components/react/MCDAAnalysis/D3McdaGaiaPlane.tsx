import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  GRAY_COLOR,
  GREEN_COLOR,
  LIGHT_GRAY_COLOR,
  BLUE_COLOR,
  ORANGE_COLOR,
  RED_COLOR,
} from "../../../styles/constants";

// GAIA colors
const CRITERIA_COLOR = BLUE_COLOR;
const DECISION_STICK_COLOR = ORANGE_COLOR;
const GOOD_FLOW_COLOR = GREEN_COLOR;
const BAD_FLOW_COLOR = RED_COLOR;

interface GAIAPoint {
  key: string;
  x: number;
  y: number;
}

interface D3McdaGaiaPlaneProps {
  gaiaAlternatives: GAIAPoint[];
  gaiaCriteria: GAIAPoint[];
  gaiaDecisionStick?: [number, number];
  alternativeLabels: { [key: string]: string };
  criteriaLabels: { [key: string]: string };
  netFlows: { [key: string]: number };
  ranking?: string[];
  height?: number;
}

interface TooltipData {
  type: "alternative" | "criterion" | "decision";
  label: string;
  x: number;
  y: number;
  netFlow?: number;
  rank?: number;
  weight?: number;
  clientX: number;
  clientY: number;
}

export const D3McdaGaiaPlane: React.FC<D3McdaGaiaPlaneProps> = ({
  gaiaAlternatives,
  gaiaCriteria,
  gaiaDecisionStick,
  alternativeLabels,
  criteriaLabels,
  netFlows,
  ranking = [],
  height = 700,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height });

  // Handle responsive sizing
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => resizeObserver.disconnect();
  }, [height]);

  // Render D3 GAIA plane
  useEffect(() => {
    if (
      !svgRef.current ||
      gaiaAlternatives.length === 0 ||
      gaiaCriteria.length === 0
    )
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate domain from all points
    const allX = [
      ...gaiaAlternatives.map((d) => d.x),
      ...gaiaCriteria.map((d) => d.x),
      ...(gaiaDecisionStick ? [gaiaDecisionStick[0]] : []),
    ];
    const allY = [
      ...gaiaAlternatives.map((d) => d.y),
      ...gaiaCriteria.map((d) => d.y),
      ...(gaiaDecisionStick ? [gaiaDecisionStick[1]] : []),
    ];

    const xExtent = d3.extent(allX) as [number, number];
    const yExtent = d3.extent(allY) as [number, number];
    const xPadding = (xExtent[1] - xExtent[0]) * 0.15;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.15;

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([chartHeight, 0]);

    // Color scale for net flows
    const flowExtent = d3.extent(Object.values(netFlows)) as [number, number];
    const colorScale = d3
      .scaleLinear<string>()
      .domain([flowExtent[0], 0, flowExtent[1]])
      .range([BAD_FLOW_COLOR, "#fbbf24", GOOD_FLOW_COLOR]);

    // Add gridlines
    g.append("g")
      .attr("class", "grid-x")
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

    g.append("g")
      .attr("class", "grid-y")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "#e5e7eb")
          .attr("stroke-dasharray", "2,2"),
      );

    // Add origin lines (x=0, y=0)
    g.append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5);

    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5);

    // Draw criteria vectors (arrows)
    const arrowMarker = svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow-criteria")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto");

    arrowMarker
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", CRITERIA_COLOR);

    gaiaCriteria.forEach((criterion) => {
      const scale = 1.2; // Scale up vectors for visibility
      const endX = xScale(criterion.x * scale);
      const endY = yScale(criterion.y * scale);
      const startX = xScale(0);
      const startY = yScale(0);

      // Draw arrow line
      g.append("line")
        .attr("x1", startX)
        .attr("y1", startY)
        .attr("x2", endX)
        .attr("y2", endY)
        .attr("stroke", CRITERIA_COLOR)
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#arrow-criteria)")
        .style("cursor", "pointer")
        .on("mouseenter", function (event) {
          d3.select(this).attr("stroke-width", 4);
          setTooltip({
            type: "criterion",
            label: criteriaLabels[criterion.key] || criterion.key,
            x: criterion.x,
            y: criterion.y,
            clientX: event.clientX,
            clientY: event.clientY,
          });
        })
        .on("mousemove", function (event) {
          setTooltip((prev) =>
            prev
              ? { ...prev, clientX: event.clientX, clientY: event.clientY }
              : null,
          );
        })
        .on("mouseleave", function () {
          d3.select(this).attr("stroke-width", 3);
          setTooltip(null);
        });

      // Add criterion label
      const labelX = endX + (endX - startX) * 0.15;
      const labelY = endY + (endY - startY) * 0.15;

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("fill", CRITERIA_COLOR)
        .attr("font-size", "13px")
        .attr("font-weight", "700")
        .style("cursor", "pointer")
        .text(criteriaLabels[criterion.key] || criterion.key)
        .on("mouseenter", function (event) {
          setTooltip({
            type: "criterion",
            label: criteriaLabels[criterion.key] || criterion.key,
            x: criterion.x,
            y: criterion.y,
            clientX: event.clientX,
            clientY: event.clientY,
          });
        })
        .on("mousemove", function (event) {
          setTooltip((prev) =>
            prev
              ? { ...prev, clientX: event.clientX, clientY: event.clientY }
              : null,
          );
        })
        .on("mouseleave", function () {
          setTooltip(null);
        });
    });

    // Draw decision stick (π vector)
    if (gaiaDecisionStick) {
      const decisionMarker = svg
        .select("defs")
        .append("marker")
        .attr("id", "arrow-decision")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto");

      decisionMarker
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", DECISION_STICK_COLOR);

      const scale = 1.5;
      const endX = xScale(gaiaDecisionStick[0] * scale);
      const endY = yScale(gaiaDecisionStick[1] * scale);
      const startX = xScale(0);
      const startY = yScale(0);

      g.append("line")
        .attr("x1", startX)
        .attr("y1", startY)
        .attr("x2", endX)
        .attr("y2", endY)
        .attr("stroke", DECISION_STICK_COLOR)
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "8,4")
        .attr("marker-end", "url(#arrow-decision)")
        .style("cursor", "pointer")
        .on("mouseenter", function (event) {
          d3.select(this).attr("stroke-width", 5);
          setTooltip({
            type: "decision",
            label: "Decision Stick (π)",
            x: gaiaDecisionStick[0],
            y: gaiaDecisionStick[1],
            clientX: event.clientX,
            clientY: event.clientY,
          });
        })
        .on("mousemove", function (event) {
          setTooltip((prev) =>
            prev
              ? { ...prev, clientX: event.clientX, clientY: event.clientY }
              : null,
          );
        })
        .on("mouseleave", function () {
          d3.select(this).attr("stroke-width", 4);
          setTooltip(null);
        });

      // Add decision stick label
      const labelX = endX + (endX - startX) * 0.12;
      const labelY = endY + (endY - startY) * 0.12;

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("fill", DECISION_STICK_COLOR)
        .attr("font-size", "13px")
        .attr("font-weight", "700")
        .text("π");
    }

    // Draw alternatives as circles
    const circles = g
      .selectAll(".alternative")
      .data(gaiaAlternatives)
      .enter()
      .append("circle")
      .attr("class", "alternative")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 0)
      .attr("fill", (d) => {
        const rank = ranking.indexOf(d.key);
        return rank >= 0 && rank < 3 ? GREEN_COLOR : GRAY_COLOR;
      })
      .attr("stroke", LIGHT_GRAY_COLOR)
      .attr("stroke-width", 2)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("r", 10);
        const rank = ranking.indexOf(d.key) + 1;
        setTooltip({
          type: "alternative",
          label: alternativeLabels[d.key] || d.key,
          x: d.x,
          y: d.y,
          netFlow: netFlows[d.key],
          rank: rank > 0 ? rank : undefined,
          clientX: event.clientX,
          clientY: event.clientY,
        });
      })
      .on("mousemove", function (event) {
        setTooltip((prev) =>
          prev
            ? { ...prev, clientX: event.clientX, clientY: event.clientY }
            : null,
        );
      })
      .on("mouseleave", function (event, d) {
        const rank = ranking.indexOf(d.key);
        const radius = rank >= 0 && rank < 3 ? 8 : 6;
        d3.select(this).attr("opacity", 0.85).attr("r", radius);
        setTooltip(null);
      });

    // Animate circles
    circles
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr("r", (d) => {
        const rank = ranking.indexOf(d.key);
        return rank >= 0 && rank < 3 ? 8 : 6;
      });

    // Add labels to circles
    g.selectAll(".alternative-label")
      .data(gaiaAlternatives)
      .enter()
      .append("text")
      .attr("class", "alternative-label")
      .attr("x", (d) => xScale(d.x))
      .attr("y", (d) => yScale(d.y + 0.12))
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none")
      //   .style("text-shadow", "0 0 3px rgba(0,0,0,0.8)")
      .attr("opacity", 0)
      .text((d) => d.key.toUpperCase())
      .transition()
      .duration(800)
      .delay(400)
      .attr("opacity", 1);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call((g) => g.select(".domain").attr("stroke", "#9ca3af"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(8))
      .call((g) => g.select(".domain").attr("stroke", "#9ca3af"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    // Add axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", chartHeight + 45)
      .attr("text-anchor", "middle")
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .text("Principal Component 1");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .text("Principal Component 2");

    // Add title
    svg
      .append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", GRAY_COLOR)
      .attr("font-size", "16px")
      .attr("font-weight", "700")
      .text("GAIA Plane Visualization");
  }, [
    gaiaAlternatives,
    gaiaCriteria,
    gaiaDecisionStick,
    alternativeLabels,
    criteriaLabels,
    netFlows,
    ranking,
    dimensions,
  ]);

  if (gaiaAlternatives.length === 0 || gaiaCriteria.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          No GAIA plane data available for visualization.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col gap-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row-reverse">
          {/* Alternatives Legend */}
          <div className="w-full lg:w-1/4 flex flex-col p-1 self-start overflow-y-auto">
            <h5> Alternatives Legend</h5>
            <p>Sorted by ranking</p>
            <div className="space-y-2 flex flex-col ">
              {gaiaAlternatives
                .slice()
                .sort((a, b) => {
                  const rankA = ranking.indexOf(a.key);
                  const rankB = ranking.indexOf(b.key);
                  return rankA - rankB;
                })
                .map((alt) => {
                  const rank = ranking.indexOf(alt.key);
                  const isTop3 = rank >= 0 && rank < 3;
                  const netFlow = netFlows[alt.key] || 0;
                  const flowColor =
                    netFlow > 0
                      ? "text-success"
                      : netFlow < 0
                        ? "text-danger"
                        : "text-gray-500";

                  return (
                    <div
                      key={alt.key}
                      className={`flex items-start gap-2 p-2 rounded text-xs transition-colors hover:bg-gray-50 ${
                        isTop3 ? "bg-success/5 border border-success" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center min-w-[28px] h-5 px-1 rounded font-bold text-white ${
                          isTop3 ? "text-dark-light bg-success" : "bg-dark"
                        }`}
                      >
                        {alt.key.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {alternativeLabels[alt.key] || alt.key}
                        </div>
                        {rank >= 0 && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            Rank: #{rank + 1} • Net Flow:{" "}
                            <span className={flowColor}>
                              {netFlow.toFixed(3)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div ref={chartContainerRef} className="flex-1 w-full lg:w-3/4">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="bg-white"
            />
          </div>
        </div>
        {/* Legend */}
        <div className=" bg-white p-4">
          <h5>GAIA Plane Legend</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs my-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: GREEN_COLOR,
                  borderColor: LIGHT_GRAY_COLOR,
                }}
              ></div>
              <span className="text-gray-700">Top 3 alternatives</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: GRAY_COLOR,
                  borderColor: LIGHT_GRAY_COLOR,
                }}
              ></div>
              <span className="text-gray-700">Other alternatives</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-1.5 rounded"
                style={{ backgroundColor: CRITERIA_COLOR }}
              ></div>
              <span className="text-gray-700">Goal vectors</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-0 border-t-4 border-dashed"
                style={{
                  borderColor: DECISION_STICK_COLOR,
                }}
              ></div>
              <span className="text-gray-700">Decision stick (π)</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Alternatives closer to the decision stick represent better
            compromise solutions. Goal vectors show the direction of improvement
            for each criterion.
          </p>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-light text-dark px-4 py-3 rounded-lg shadow-xl text-sm max-w-xs pointer-events-none"
          style={{
            left: `${tooltip.clientX + 10}px`,
            top: `${tooltip.clientY - 10}px`,
            transform: "translateY(-100%)",
          }}
        >
          <div className="font-bold mb-1">{tooltip.label}</div>
          {tooltip.type === "alternative" && (
            <>
              {tooltip.rank && (
                <div className="text-warning text-xs mb-1">
                  Rank: #{tooltip.rank}
                </div>
              )}
              <div className="text-dark text-xs mb-1">
                Position: ({tooltip.x.toFixed(3)}, {tooltip.y.toFixed(3)})
              </div>
              {tooltip.netFlow !== undefined && (
                <div className="text-dark text-xs">
                  Net Flow: {tooltip.netFlow.toFixed(3)}
                </div>
              )}
            </>
          )}
          {tooltip.type === "criterion" && (
            <div className="text-dark text-xs">
              Goal vector direction: ({tooltip.x.toFixed(3)},{" "}
              {tooltip.y.toFixed(3)})
            </div>
          )}
          {tooltip.type === "decision" && (
            <div className="text-dark text-xs">
              Optimal decision direction based on weighted criteria
            </div>
          )}
        </div>
      )}
    </div>
  );
};

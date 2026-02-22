import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type {
  OutrankingGraphData,
  OutrankingGraphEdge,
  OutrankingGraphNode,
} from "../../../types";
import {
  COLOR_GRAY,
  COLOR_GREEN,
  COLOR_LIGHT_GRAY,
  COLOR_RED,
} from "../../../styles/constants";

interface D3McdaNetworkChartProps {
  outrankingGraphData?: OutrankingGraphData;
  height?: number;
}

interface TooltipEdgeData {
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  weight: number;
}

interface TooltipData {
  type: "node" | "edge";
  clientX: number;
  clientY: number;
  node?: OutrankingGraphNode;
  edge?: TooltipEdgeData;
}

type SensitivityLevelId = "all" | "moderate" | "significant" | "strong";

interface SensitivityLevel {
  id: SensitivityLevelId;
  label: string;
  multiplier: number;
  description: string;
}

type SimulationNode = d3.SimulationNodeDatum & OutrankingGraphNode;
type SimulationLink = d3.SimulationLinkDatum<SimulationNode> &
  OutrankingGraphEdge;

const EDGE_COLOR = "#9ca3af";

const SENSITIVITY_LEVELS: SensitivityLevel[] = [
  {
    id: "all",
    label: "All",
    multiplier: 0,
    description: "All outranking relations (dense exploratory view).",
  },
  {
    id: "moderate",
    label: "Moderate",
    multiplier: 0.25,
    description: "Filters weak links while preserving most structure.",
  },
  {
    id: "significant",
    label: "Significant",
    multiplier: 0.5,
    description:
      "PROMETHEE-focused default: highlights meaningful outranking relations.",
  },
  {
    id: "strong",
    label: "Strong",
    multiplier: 0.75,
    description: "Keeps only dominant outranking relations.",
  },
];

const DEFAULT_SENSITIVITY_LEVEL: SensitivityLevelId = "significant";

export const D3McdaNetworkChart: React.FC<D3McdaNetworkChartProps> = ({
  outrankingGraphData,
  height = 700,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height });
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevelId>(
    DEFAULT_SENSITIVITY_LEVEL,
  );

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

  const nodes = outrankingGraphData?.nodes ?? [];
  const edges = outrankingGraphData?.edges ?? [];
  const maxWeight = useMemo(() => {
    const localMaxWeight = edges.reduce(
      (max, edge) => Math.max(max, edge.weight),
      0,
    );
    return localMaxWeight > 0 ? localMaxWeight : 1;
  }, [edges]);

  const selectedSensitivity = useMemo(
    () =>
      SENSITIVITY_LEVELS.find((level) => level.id === sensitivityLevel) ||
      SENSITIVITY_LEVELS[2],
    [sensitivityLevel],
  );

  const sensitivityThreshold = useMemo(
    () => selectedSensitivity.multiplier * maxWeight,
    [selectedSensitivity, maxWeight],
  );

  const filteredEdges = useMemo(
    () => edges.filter((edge) => edge.weight >= sensitivityThreshold),
    [edges, sensitivityThreshold],
  );

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const graph = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "outranking-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", EDGE_COLOR);

    const simulationNodes: SimulationNode[] = nodes.map((node) => ({
      ...node,
    }));
    const simulationLinks: SimulationLink[] = filteredEdges.map((edge) => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    }));

    const maxAbsFlow =
      d3.max(simulationNodes, (node) => Math.abs(node.netFlow)) || 1;

    const nodeRadiusScale = d3
      .scaleSqrt()
      .domain([0, maxAbsFlow])
      .range([8, 18]);

    const nodeColorScale = d3
      .scaleLinear<string>()
      .domain([-maxAbsFlow, 0, maxAbsFlow])
      .range([COLOR_RED, COLOR_GRAY, COLOR_GREEN]);

    const edgeWidthScale = d3
      .scaleLinear()
      .domain([0, maxWeight])
      .range([0.8, 4]);

    const edgeOpacityScale = d3
      .scaleLinear()
      .domain([0, maxWeight])
      .range([0.2, 0.85]);

    const linksGroup = graph
      .append("g")
      .attr("stroke", EDGE_COLOR)
      .attr("stroke-linecap", "round")
      .selectAll("line")
      .data(simulationLinks)
      .enter()
      .append("line")
      .attr("stroke-width", (d) => edgeWidthScale(d.weight))
      .attr("stroke-opacity", (d) => edgeOpacityScale(d.weight))
      .attr("marker-end", "url(#outranking-arrow)")
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", 5);
        const sourceNode = d.source as SimulationNode;
        const targetNode = d.target as SimulationNode;
        setTooltip({
          type: "edge",
          edge: {
            sourceId: sourceNode.id,
            sourceLabel: sourceNode.label,
            targetId: targetNode.id,
            targetLabel: targetNode.label,
            weight: d.weight,
          },
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
        d3.select(this)
          .attr("stroke-opacity", edgeOpacityScale(d.weight))
          .attr("stroke-width", edgeWidthScale(d.weight));
        setTooltip(null);
      });

    const nodesGroup = graph
      .append("g")
      .selectAll("circle")
      .data(simulationNodes)
      .enter()
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d) => nodeColorScale(d.netFlow))
      .attr("stroke", COLOR_LIGHT_GRAY)
      .attr("stroke-width", 2)
      .attr("opacity", 0.95)
      .style("cursor", "grab")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("stroke-width", 3);
        setTooltip({
          type: "node",
          node: d,
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
        d3.select(this).attr("stroke-width", 2);
        setTooltip(null);
      })
      .call(
        d3
          .drag<SVGCircleElement, SimulationNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    nodesGroup
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("r", (d) => nodeRadiusScale(Math.abs(d.netFlow)));

    const labelsGroup = graph
      .append("g")
      .selectAll("text")
      .data(simulationNodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -(nodeRadiusScale(Math.abs(d.netFlow)) + 6))
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .attr("fill", COLOR_GRAY)
      .attr("pointer-events", "none")
      .text((d) => d?.id?.toUpperCase());

    const simulation = d3
      .forceSimulation<SimulationNode>(simulationNodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(simulationLinks)
          .id((d) => d.id)
          .distance((d) => 220 - 120 * (d.weight / maxWeight))
          .strength((d) => 0.1 + 0.5 * (d.weight / maxWeight)),
      )
      .force("charge", d3.forceManyBody().strength(-460))
      .force(
        "collide",
        d3
          .forceCollide<SimulationNode>()
          .radius((d) => nodeRadiusScale(Math.abs(d.netFlow)) + 18),
      )
      .force("center", d3.forceCenter(width / 2, chartHeight / 2))
      .force("x", d3.forceX(width / 2).strength(0.04))
      .force("y", d3.forceY(chartHeight / 2).strength(0.04))
      .alphaDecay(filteredEdges.length > 250 ? 0.05 : 0.032)
      .velocityDecay(filteredEdges.length > 250 ? 0.5 : 0.4);

    let tickCount = 0;
    const tickThrottle = filteredEdges.length > 250 ? 2 : 1;

    simulation.on("tick", () => {
      tickCount += 1;
      if (tickCount % tickThrottle !== 0) return;

      linksGroup
        .attr("x1", (d) => (d.source as SimulationNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimulationNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimulationNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimulationNode).y ?? 0);

      nodesGroup.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

      labelsGroup.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
    };
  }, [dimensions, filteredEdges, maxWeight, nodes]);

  if (!outrankingGraphData || nodes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          No outranking graph data available for visualization.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col rounded-lg border border-gray-200 shadow-sm">
        <div ref={chartContainerRef} className="w-full">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-white"
          />
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h5 className="text-sm font-semibold text-gray-800">Sensitivity</h5>
            <span className="text-xs text-gray-600 tabular-nums">
              Threshold: {sensitivityThreshold.toFixed(3)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {SENSITIVITY_LEVELS.map((level) => {
              const isActive = level.id === sensitivityLevel;

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSensitivityLevel(level.id)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-label={`Set ${level.label} sensitivity`}
                >
                  {level.label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {selectedSensitivity.description}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Showing {filteredEdges.length} / {edges.length} edges.
          </p>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 max-w-xs rounded-lg bg-light px-4 py-3 text-sm text-dark shadow-xl pointer-events-none"
          style={{
            left: `${tooltip.clientX + 10}px`,
            top: `${tooltip.clientY - 10}px`,
            transform: "translateY(-100%)",
          }}
        >
          {tooltip.type === "node" && tooltip.node && (
            <>
              <div className="mb-1 font-bold">
                {tooltip.node?.id?.toUpperCase()}
              </div>
              <div className="mb-1 text-xs text-dark">{tooltip.node.label}</div>
              {tooltip.node.rank && (
                <div className="mb-1 text-xs text-warning">
                  Rank: #{tooltip.node.rank}
                </div>
              )}
              <div className="text-xs text-dark">
                Net flow: {tooltip.node.netFlow.toFixed(3)}
              </div>
              {tooltip.node.positiveFlow !== undefined && (
                <div className="text-xs text-dark">
                  Positive flow: {tooltip.node.positiveFlow.toFixed(3)}
                </div>
              )}
              {tooltip.node.negativeFlow !== undefined && (
                <div className="text-xs text-dark">
                  Negative flow: {tooltip.node.negativeFlow.toFixed(3)}
                </div>
              )}
            </>
          )}

          {tooltip.type === "edge" && tooltip.edge && (
            <>
              <div className="mb-1 font-bold">Outranking relation</div>
              <div className="text-xs text-dark">
                <span className="font-medium">
                  {tooltip.edge.sourceId.toUpperCase()}
                </span>{" "}
                {tooltip.edge.sourceLabel && `(${tooltip.edge.sourceLabel})`}
              </div>
              <div className="my-1 text-xs text-gray-400">↓ outranks</div>
              <div className="text-xs text-dark">
                <span className="font-medium">
                  {tooltip.edge.targetId.toUpperCase()}
                </span>{" "}
                {tooltip.edge.targetLabel && `(${tooltip.edge.targetLabel})`}
              </div>
              <div className="mt-2 text-xs text-dark">
                Strength: {tooltip.edge.weight.toFixed(3)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

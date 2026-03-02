import type {
  MCDAGoal,
  McdaKeyInsightCard,
  McdaResults,
  OutrankingGraphData,
  OutrankingGraphEdge,
  OutrankingGraphNode,
} from "../../types";

export const MCDA_PERSPECTIVES: Record<string, string> = {
  regulatory: "Regulatory Authorities",
  pto: "Public Transport Operators",
  nsm_providers: "New Shared Mobility Providers",
  user_personalized: "Custom user-personalized",
};

export const MCDA_DEFAULT_GOALS: MCDAGoal[] = [
  {
    name: "Improve Accessibility",
    weight: 1 / 8,
  },
  {
    name: "Improve Mobility Service",
    weight: 1 / 8,
  },
  {
    name: "Improve Multimodality",
    weight: 1 / 8,
  },
  { name: "Noise Hinderance", weight: 1 / 8 },
  {
    name: "Improve Public Transport",
    weight: 1 / 8,
  },
  {
    name: "Reduction of Congestion",
    weight: 1 / 8,
  },
  {
    name: "Reduction of Emission",
    weight: 1 / 8,
  },
  { name: "Improve Safety", weight: 1 / 8 },
];

export const resolveMcdaPerspectiveLabel = (
  perspective: string,
  perspectives: Record<string, string> = MCDA_PERSPECTIVES,
): string => `${perspectives[perspective] || perspective} perspective`;

const hasPreferenceMatrixValues = (
  preferenceMatrix: NonNullable<McdaResults["preference_matrix"]>,
): boolean =>
  Object.values(preferenceMatrix).some(
    (targets) => targets && Object.keys(targets).length > 0,
  );

const createOutrankingNodes = (
  keys: string[],
  results: McdaResults,
): OutrankingGraphNode[] => {
  const netFlows = results.net_flows ?? {};
  const alternativeLabels = results.alternative_labels ?? {};
  const positiveFlows = results.positive_flows ?? {};
  const negativeFlows = results.negative_flows ?? {};
  const ranking = results.ranking ?? [];

  const rankLookup = new Map(ranking.map((key, index) => [key, index + 1]));

  return keys.map((key) => ({
    id: key,
    label: alternativeLabels[key] || key,
    rank: rankLookup.get(key),
    netFlow: netFlows[key] ?? 0,
    positiveFlow: positiveFlows[key] ?? 0,
    negativeFlow: negativeFlows[key] ?? 0,
  }));
};

const createOutrankingEdges = (
  keys: string[],
  results: McdaResults,
): OutrankingGraphEdge[] => {
  const netFlows = results.net_flows ?? {};
  const preferenceMatrix = results.preference_matrix ?? {};
  const usePreferenceMatrix = hasPreferenceMatrixValues(preferenceMatrix);

  if (usePreferenceMatrix) {
    return keys.flatMap((source) =>
      keys
        .filter((target) => target !== source)
        .map((target) => ({
          source,
          target,
          weight: preferenceMatrix[source]?.[target] ?? 0,
        }))
        .filter((edge) => edge.weight > 0),
    );
  }

  return keys.flatMap((source) =>
    keys
      .filter((target) => target !== source)
      .map((target) => ({
        source,
        target,
        weight: (netFlows[source] ?? 0) - (netFlows[target] ?? 0),
      }))
      .filter((edge) => edge.weight > 0),
  );
};

export const buildOutrankingGraphData = (
  results: McdaResults | undefined,
): OutrankingGraphData | undefined => {
  if (!results) return undefined;

  const keys = Object.keys(results.net_flows ?? {});
  if (keys.length === 0) return undefined;

  const nodes = createOutrankingNodes(keys, results);
  const edges = createOutrankingEdges(keys, results);

  return {
    nodes,
    edges,
  };
};

const formatPhi = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
};

const toPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const buildMcdaKeyInsights = (
  results: McdaResults | undefined,
): McdaKeyInsightCard[] => {
  if (!results?.net_flows) return [];

  const netFlows = results.net_flows;
  const labels = results.alternative_labels ?? {};
  const criteriaLabels = results.criteria_labels ?? {};
  const ranking = results.ranking ?? [];
  const keys = Object.keys(netFlows);

  if (keys.length === 0) return [];

  const orderedKeys =
    ranking.length > 0
      ? ranking.filter((key) => key in netFlows)
      : keys.sort((a, b) => (netFlows[b] ?? 0) - (netFlows[a] ?? 0));

  const topKey = orderedKeys[0];
  const secondKey = orderedKeys[1];
  const topPhi = topKey ? (netFlows[topKey] ?? 0) : 0;
  const secondPhi = secondKey ? (netFlows[secondKey] ?? 0) : 0;
  const topGap = topPhi - secondPhi;

  const sensitivityLabel =
    topGap >= 0.2
      ? "Low sensitivity"
      : topGap >= 0.1
        ? "Moderate sensitivity"
        : "High sensitivity";

  const sensitivityDetail =
    topGap >= 0.2
      ? "Ranking is robust against small perturbations."
      : topGap >= 0.1
        ? "Top alternatives are distinguishable but relatively close."
        : "Top alternatives are very close; small weight changes may swap ranks.";

  const values = Object.values(netFlows);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const maxScore = Math.max(...values);
  const minScore = Math.min(...values);
  const spread = maxScore - minScore;

  let conflictValue = "Not enough GAIA criteria";
  let conflictDetail =
    "Add at least two GAIA criteria vectors to estimate trade-off conflicts.";

  let differentiatingCriteriaValue = "Not enough GAIA criteria";
  let differentiatingCriteriaDetail =
    "Add GAIA criteria vectors to identify the most differentiating criteria.";

  const gaiaCriteria = results.gaia_criteria ?? [];
  if (gaiaCriteria.length >= 2) {
    let bestPair: [string, string] | null = null;
    let minCosine = 1;

    for (let i = 0; i < gaiaCriteria.length; i++) {
      for (let j = i + 1; j < gaiaCriteria.length; j++) {
        const a = gaiaCriteria[i];
        const b = gaiaCriteria[j];
        const normA = Math.hypot(a.x, a.y);
        const normB = Math.hypot(b.x, b.y);
        if (normA === 0 || normB === 0) continue;

        const cosine = (a.x * b.x + a.y * b.y) / (normA * normB);
        if (cosine < minCosine) {
          minCosine = cosine;
          bestPair = [a.key, b.key];
        }
      }
    }

    if (bestPair) {
      const [left, right] = bestPair;
      const leftLabel = criteriaLabels[left] || left;
      const rightLabel = criteriaLabels[right] || right;

      conflictValue = `${leftLabel} vs ${rightLabel}`;
      conflictDetail =
        minCosine <= -0.6
          ? "Strong conflict detected in the GAIA plane."
          : minCosine <= -0.3
            ? "Moderate conflict detected in the GAIA plane."
            : "Limited direct conflict in the GAIA plane.";
    }
  }

  const criteriaByLength = gaiaCriteria
    .map((criterion) => ({
      key: criterion.key,
      label: criteriaLabels[criterion.key] || criterion.key,
      length: Math.hypot(criterion.x, criterion.y),
    }))
    .filter((criterion) => criterion.length > 0)
    .sort((a, b) => b.length - a.length);

  if (criteriaByLength.length > 0) {
    const topDifferentiatingCriteria = criteriaByLength.slice(0, 3);
    const topCount = topDifferentiatingCriteria.length;
    differentiatingCriteriaValue = topDifferentiatingCriteria
      .map((criterion) => criterion.label)
      .join(", ");
    differentiatingCriteriaDetail = `Top ${topCount} by vector length: ${topDifferentiatingCriteria
      .map((criterion) => criterion.length.toFixed(2))
      .join(", ")}.`;
  }

  let alignmentValue = "Not enough GAIA vectors";
  let alignmentDetail =
    "Decision stick and GAIA alternatives are required to estimate alignment.";

  const decisionStick = results.gaia_decision_stick;
  const gaiaAlternatives = results.gaia_alternatives ?? [];
  if (
    decisionStick &&
    Array.isArray(decisionStick) &&
    decisionStick.length === 2 &&
    gaiaAlternatives.length > 0
  ) {
    const [sx, sy] = decisionStick;
    const stickNorm = Math.hypot(sx, sy);
    if (stickNorm > 0) {
      let bestAlternative: { key: string; score: number } | null = null;

      for (const alt of gaiaAlternatives) {
        const altNorm = Math.hypot(alt.x, alt.y);
        if (altNorm === 0) continue;

        const score = (alt.x * sx + alt.y * sy) / (altNorm * stickNorm);
        if (!bestAlternative || score > bestAlternative.score) {
          bestAlternative = { key: alt.key, score };
        }
      }

      if (bestAlternative) {
        const alignedLabel = labels[bestAlternative.key] || bestAlternative.key;
        alignmentValue = alignedLabel;
        alignmentDetail = `Alignment score: ${toPercent(bestAlternative.score)}.`;
      }
    }
  }

  return [
    {
      title: "Top performer",
      description: "Highest PROMETHEE net flow",
      value: topKey ? labels[topKey] || topKey : "N/A",
      detail: topKey ? `φ = ${formatPhi(topPhi)}` : "",
      tooltip:
        "PROMETHEE II ranks alternatives by net flow (φ). The highest φ is currently the top performer.",
    },
    {
      title: "Sensitivity level",
      description: "Stability of top ranking",
      value: sensitivityLabel,
      detail: `${sensitivityDetail} Gap to #2: ${formatPhi(topGap)}.`,
      tooltip:
        "Based on the φ gap between rank #1 and #2. A small gap means ranking can change more easily.",
    },
    {
      title: "Conflict analysis",
      description: "Most conflicting criteria pair",
      value: conflictValue,
      detail: conflictDetail,
      tooltip:
        "Computed from criterion-vector directions in the GAIA plane using cosine similarity.",
    },
    {
      title: "Score spread",
      description: "The difference between the highest and lowest net flow",
      value: formatPhi(spread),
      detail: `(max-min) = (${formatPhi(maxScore)}) - (${formatPhi(minScore)}). How separated the alternatives are.`,
      tooltip:
        "Spread indicates how strongly the best alternative outperforms the worst and how clearly differentiated the options are.",
    },
    {
      title: "GAIA quality",
      description: "2D projection representativeness",
      value:
        typeof results.gaia_quality === "number"
          ? `${results.gaia_quality.toFixed(1)}%`
          : "N/A",
      detail:
        typeof results.gaia_quality === "number"
          ? results.gaia_quality >= 80
            ? "High confidence in GAIA interpretation."
            : results.gaia_quality >= 60
              ? "Moderate confidence in GAIA interpretation."
              : "Low confidence. Rely more on flow-based results."
          : "No GAIA quality score available.",
      tooltip:
        "GAIA quality indicates how much decision information is preserved in the 2D plane.",
    },
    {
      title: "Differentiating criteria",
      description: "Most discriminating in the GAIA plane",
      value: differentiatingCriteriaValue,
      detail: differentiatingCriteriaDetail,
      tooltip:
        "Longer criterion vectors in the GAIA plane indicate stronger discrimination between alternatives.",
    },
    // {
    //   title: "Decision alignment",
    //   description: "Best aligned with GAIA decision stick",
    //   value: alignmentValue,
    //   detail: alignmentDetail,
    //   tooltip:
    //     "Alternative whose GAIA vector is most aligned with the decision stick direction.",
    // },
  ];
};

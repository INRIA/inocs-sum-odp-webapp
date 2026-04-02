import type {
  IJobRun,
  MCDAGoal,
  McdaKeyInsightCard,
  McdaResults,
  OutrankingGraphData,
  OutrankingGraphEdge,
  OutrankingGraphNode,
} from "../../types";
import { formatDateWithTime } from "./format";

type MethodologyInfoCard = {
  title: string;
  description: string;
  showIcon: false;
  textAlign: "center";
};

type QuantitativeMethodologySection = {
  accordion: {
    title: string;
    subtitle: string;
    content: string;
    defaultOpen: boolean;
    variant: "info";
  };
  ctaButton: {
    variant: "primary";
    href: string;
    size: "xs";
    label: string;
  };
  infoCards: MethodologyInfoCard[];
  participantsIntro: string;
  participants: string[];
  details: string;
};

export const MCDA_PERSPECTIVES: Record<string, string> = {
  regulatory: "Regulatory Authorities",
  pto: "Public Transport Operators",
  nsm_providers: "New Shared Mobility Providers",
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

export const CUSTOM_MCDA_DEFAULT_GOALS: string[] = [
  "Improve Accessibility",
  "Improve Mobility Service",
  "Improve Multimodality",
  "Noise Hinderance",
  "Improve Public Transport",
  "Reduction of Congestion",
  "Reduction of Emission",
  "Improve Safety",
];

export const CUSTOM_MCDA_DEFAULT_ACTIVITIES: string[] = [
  "Integrated Mobility Service Platform (MaaS)",
  "Demand-Responsive and On-Demand Mobility",
  "Mobility Hub Development",
  "Active Mobility Promotion",
  "Incentive-Based Programs",
  "NSM Integration into Mobility Ecosystem",
  "Public Engagement and Awareness Initiatives",
  "Enhanced Data Collection and Analysis",
  "Electric and Low-Emission Infrastructure Expansion",
  "PT Scheduling and Frequency Optimization",
];

export const resolveMcdaPerspectiveLabel = (
  perspective: string,
  perspectives: Record<string, string> = MCDA_PERSPECTIVES,
): string => `${perspectives[perspective] ?? "User personalized "} perspective`;

const formatMcdaPercent = (value: number | undefined): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const normalizedValue = value <= 1 ? value * 100 : value;
  return `${Math.round(normalizedValue * 10) / 10}%`;
};

const createCenteredInfoCard = (
  title: string,
  description: string,
): MethodologyInfoCard => ({
  title,
  description,
  showIcon: false,
  textAlign: "center",
});

const uniqueLabels = (labels: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      labels
        .map((label) => label?.trim())
        .filter((label): label is string => Boolean(label)),
    ),
  );

export const buildQuantitativeMethodologySection = (
  jobRun: IJobRun | null,
): QuantitativeMethodologySection => {
  const kpis = jobRun?.input_data?.kpis ?? [];
  const kpiGroups = jobRun?.input_data?.kpi_groups ?? [];
  const livingLabs = jobRun?.input_data?.living_labs ?? [];
  const alternatives = jobRun?.input_data?.alternatives ?? [];
  const mcdaResults = jobRun?.output_data?.mcda_results;

  const kpiCount = kpis.length;
  const kpiGroupCount = kpiGroups.length;
  const livingLabCount = livingLabs.length;
  const policyMeasureCount =
    alternatives.length > 0
      ? alternatives.length
      : (mcdaResults?.ranking?.length ?? 0);

  const topRankedKey = mcdaResults?.ranking?.[0];
  const topRankedAlternative = topRankedKey
    ? (mcdaResults?.alternative_labels?.[topRankedKey] ?? topRankedKey)
    : null;
  const gaiaQualityLabel = formatMcdaPercent(mcdaResults?.gaia_quality);
  const completedAt = jobRun?.completed_at
    ? formatDateWithTime(jobRun.completed_at)
    : null;

  const kpiGroupLabels = uniqueLabels(kpiGroups.map((group) => group.name));
  const criteriaLabels = uniqueLabels(
    Object.values(mcdaResults?.criteria_labels ?? {}),
  );
  const participants =
    kpiGroupLabels.length > 0 ? kpiGroupLabels : criteriaLabels;

  const summarySegments = [
    `This quantitative MCDA result uses ${kpiCount} KPI indicators grouped into ${kpiGroupCount} criteria, data from ${livingLabCount} living labs, and ${policyMeasureCount} policy measures evaluated as alternatives.`,
    "Policy measures are scored against KPI groups through a ridge regression model that estimates the positive or negative contribution of policy measures to KPI changes observed across living labs.",
    "These estimated contributions form the input matrix for the PROMETHEE-GAIA analysis, which produces the final ranking of policy measures.",
  ];

  if (topRankedAlternative) {
    summarySegments.push(`Top-ranked policy measure: ${topRankedAlternative}.`);
  }

  if (gaiaQualityLabel) {
    summarySegments.push(`GAIA plane quality: ${gaiaQualityLabel}.`);
  }

  if (completedAt) {
    summarySegments.push(`Analysis completed on ${completedAt}.`);
  }

  return {
    accordion: {
      title: "Analysis Approach & Data Source",
      subtitle:
        "This analysis is based on KPI indicators, KPI groups, living-lab submissions, and policy measures reported by cities across Europe.",
      content: "",
      defaultOpen: false,
      variant: "info",
    },
    ctaButton: {
      variant: "primary",
      href: "/tools/mcda_analysis",
      size: "xs",
      label: "Change approach",
    },
    infoCards: [
      createCenteredInfoCard(
        String(kpiCount),
        "KPI indicators included in this analysis",
      ),
      createCenteredInfoCard(
        String(kpiGroupCount),
        "KPI groups used as MCDA criteria",
      ),
      createCenteredInfoCard(
        String(livingLabCount),
        "Living labs contributing quantitative data",
      ),
      createCenteredInfoCard(
        String(policyMeasureCount),
        "Policy measures evaluated as alternatives",
      ),
    ],
    participantsIntro: "KPI groups used as criteria in this run:",
    participants:
      participants.length > 0
        ? participants
        : ["No KPI groups are available for the latest successful run."],
    details: summarySegments.join(" "),
  };
};

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

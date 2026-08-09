export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  aliases: string[];
  relatedTerms: string[];
}

export const GLOSSARY_TERMS: GlossaryEntry[] = [
  // MCDA methodology terms
  {
    id: "promethee",
    term: "PROMETHEE",
    definition:
      "Preference Ranking Organisation METHod for Enrichment Evaluations — a family of outranking methods for multi-criteria decision analysis that ranks alternatives by computing net preference flows.",
    aliases: ["PROMETHEE II"],
    relatedTerms: ["gaia", "net-flow", "outranking", "criteria", "alternatives"],
  },
  {
    id: "gaia",
    term: "GAIA",
    definition:
      "Geometrical Analysis for Interactive Aid — a visual complement to PROMETHEE that projects alternatives and criteria onto a 2D plane to reveal trade-offs and conflicts.",
    aliases: ["GAIA plane", "Graphical Analysis for Interactive Aid"],
    relatedTerms: ["promethee", "decision-stick", "criteria"],
  },
  {
    id: "net-flow",
    term: "Net flow",
    definition:
      "The net preference score (φ) of an alternative in PROMETHEE II, computed as the difference between its positive flow (how much it outranks others) and its negative flow (how much it is outranked). Higher net flow = better overall ranking.",
    aliases: ["phi score", "φ score", "PROMETHEE net flow"],
    relatedTerms: ["promethee", "outranking"],
  },
  {
    id: "outranking",
    term: "Outranking",
    definition:
      "A relation between two alternatives where one is judged to be at least as good as the other on a majority of criteria, without being significantly worse on any. The basis of PROMETHEE preference calculations.",
    aliases: ["outranking relation"],
    relatedTerms: ["promethee", "net-flow", "preference-matrix"],
  },
  {
    id: "decision-stick",
    term: "Decision stick",
    definition:
      "A vector in the GAIA plane that summarises the overall PROMETHEE ranking direction. Alternatives aligned with the decision stick perform best across all weighted criteria.",
    aliases: ["GAIA decision stick", "decision axis"],
    relatedTerms: ["gaia", "promethee"],
  },
  {
    id: "preference-matrix",
    term: "Preference matrix",
    definition:
      "A matrix of pairwise preference values between alternatives for each criterion, used as input to PROMETHEE to compute net flows.",
    aliases: [],
    relatedTerms: ["promethee", "criteria", "outranking"],
  },
  {
    id: "criteria",
    term: "Criteria",
    definition:
      "The evaluation dimensions used in MCDA to compare alternatives. In the SUM platform, KPI groups serve as PROMETHEE criteria, each assigned a weight reflecting its importance.",
    aliases: ["criterion", "MCDA criteria"],
    relatedTerms: ["promethee", "alternatives", "kpi"],
  },
  {
    id: "alternatives",
    term: "Alternatives",
    definition:
      "The options being compared in an MCDA analysis. In the SUM platform, policy measures or business activities serve as alternatives to be ranked.",
    aliases: ["policy alternatives"],
    relatedTerms: ["promethee", "criteria"],
  },
  // Impact analysis terms
  {
    id: "ridge-regression",
    term: "Ridge regression",
    definition:
      "A linear regression technique with L2 regularisation that estimates the contribution of each measure to observed KPI changes. Used when the number of predictors (measures) exceeds the number of observations (Living Labs), preventing overfitting.",
    aliases: ["L2 regularisation", "Tikhonov regularisation"],
    relatedTerms: ["regression-coefficient", "mse", "multivariate-analysis"],
  },
  {
    id: "multivariate-analysis",
    term: "Multivariate analysis",
    definition:
      "Statistical analysis that examines multiple dependent variables simultaneously. In the impact analysis, KPIs of the same type (environmental, societal, economic) are grouped and analysed together to improve robustness.",
    aliases: ["multivariate regression"],
    relatedTerms: ["ridge-regression", "regression-coefficient"],
  },
  {
    id: "regression-coefficient",
    term: "Regression coefficient",
    definition:
      "A numerical value (β) that estimates the contribution of a policy measure to the change in a KPI. A positive coefficient indicates a beneficial effect; negative indicates a detrimental one; near-zero suggests minimal isolated impact.",
    aliases: ["beta coefficient", "β coefficient"],
    relatedTerms: ["ridge-regression", "mse"],
  },
  {
    id: "mse",
    term: "MSE",
    definition:
      "Mean Squared Error — a measure of model accuracy in regression analysis. Lower MSE indicates the model fits the observed KPI data more closely.",
    aliases: ["Mean Squared Error", "model accuracy"],
    relatedTerms: ["ridge-regression", "regression-coefficient"],
  },
  // KPI framework terms
  {
    id: "sief",
    term: "SIEF",
    definition:
      "The SUM Impact Evaluation Framework — the KPI framework used to evaluate the impact of New Shared Mobility policies across Living Labs. Organises KPIs into thematic domains (environmental, societal, economic).",
    aliases: ["SUM Impact Evaluation Framework"],
    relatedTerms: ["kpi", "living-lab", "policy-measure"],
  },
  {
    id: "kpi",
    term: "KPI",
    definition:
      "Key Performance Indicator — a measurable value used to evaluate how effectively a policy measure achieves mobility-related objectives. The SUM platform tracks KPIs before and after measure implementation.",
    aliases: ["Key Performance Indicator"],
    relatedTerms: ["sief", "policy-measure", "living-lab"],
  },
  {
    id: "modal-split",
    term: "Modal split",
    definition:
      "The percentage distribution of trips across different transport modes (e.g. car, bus, bike, NSM). A key indicator of how mobility policy affects travel behaviour.",
    aliases: ["mode share", "modal share"],
    relatedTerms: ["kpi", "policy-measure"],
  },
  {
    id: "policy-measure",
    term: "Policy measure",
    definition:
      "A policy action, infrastructure change, service rollout, or regulatory shift implemented by a city to influence urban mobility. Classified as push (restricting car use) or pull (incentivising alternatives).",
    aliases: ["measure", "mobility measure"],
    relatedTerms: ["kpi", "living-lab", "modal-split"],
  },
  {
    id: "living-lab",
    term: "Living Lab",
    definition:
      "A city or urban area participating in the SUM project that implements New Shared Mobility measures and contributes real-world KPI data to the Open Data Platform.",
    aliases: ["SUM Living Lab"],
    relatedTerms: ["kpi", "policy-measure", "sief"],
  },
];

import type {
  IIKpiResultBeforeAfter,
  IKpiResult,
  IKpiResultGroup,
} from "../../types";

const toTimestamp = (date: string): number => {
  const ts = Date.parse(date);
  return Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
};

const sortResults = (results: IKpiResult[]): IKpiResult[] =>
  [...results]
    .map((result, index) => ({ result, index }))
    .sort((a, b) => {
      const timeDiff = toTimestamp(a.result.date) - toTimestamp(b.result.date);
      if (timeDiff !== 0) {
        return timeDiff;
      }

      const idDiff = a.result.id - b.result.id;
      if (idDiff !== 0) {
        return idDiff;
      }

      return a.index - b.index;
    })
    .map(({ result }) => result);

export function normalizeKpiResultGroup(
  group: IIKpiResultBeforeAfter | IKpiResultGroup,
): IKpiResultGroup {
  const sourceResults =
    "results" in group && Array.isArray(group.results)
      ? group.results
      : [group.result_before, group.result_after].filter(
          (result): result is IKpiResult => Boolean(result),
        );

  const results = sortResults(sourceResults);

  return {
    ...group,
    results,
    result_before: results[0] ?? null,
    result_after: results[results.length - 1] ?? null,
  };
}

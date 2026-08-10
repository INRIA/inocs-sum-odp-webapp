import React, { useState } from "react";

interface MCDAGoal {
  name: string;
  weight: number;
}

interface McdaAlternative {
  name: string;
}

interface GuidedMCDAWizardProps {
  goals: MCDAGoal[];
  alternatives: McdaAlternative[];
  expertBaseUrl: string;
}

type WizardStep = "example" | "context" | "priority" | "constraints" | "results";

type PriorityLevel = 1 | 2 | 3;

const CITY_CONTEXTS = [
  { value: "small", label: "Small city (< 100k)" },
  { value: "mid", label: "Mid-sized city (100k–500k)" },
  { value: "large", label: "Large city (> 500k)" },
  { value: "suburban", label: "Suburban / peri-urban" },
  { value: "university", label: "University city" },
];

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  1: "Less important",
  2: "Important",
  3: "Most important",
};

function evidenceBadge(priority: PriorityLevel) {
  const colors: Record<PriorityLevel, string> = {
    1: "bg-gray-100 text-gray-600",
    2: "bg-blue-100 text-blue-700",
    3: "bg-green-100 text-green-700",
  };
  return colors[priority];
}

export function GuidedMCDAWizard({
  goals,
  alternatives,
  expertBaseUrl,
}: GuidedMCDAWizardProps) {
  const [step, setStep] = useState<WizardStep>("example");
  const [cityContext, setCityContext] = useState<string>("mid");
  const [priorities, setPriorities] = useState<Record<string, PriorityLevel>>(
    Object.fromEntries(goals.map((g) => [g.name, 2])),
  );
  const [selectedAlternatives, setSelectedAlternatives] = useState<Set<string>>(
    new Set(alternatives.map((a) => a.name)),
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    Array<{ rank: number; name: string; reason: string }> | null
  >(null);

  function buildExpertUrl() {
    const weightedGoals = goals.map((g) => ({
      ...g,
      weight: (priorities[g.name] ?? 2) / (goals.length * 2),
    }));
    const alts = alternatives
      .filter((a) => selectedAlternatives.has(a.name))
      .map((a) => ({ name: a.name, values: {} }));
    return (
      expertBaseUrl +
      "?" +
      new URLSearchParams({
        goals: JSON.stringify(weightedGoals),
        alternatives: JSON.stringify(alts),
        source: "guided",
      }).toString()
    );
  }

  async function runAnalysis() {
    setLoading(true);
    try {
      // Rank alternatives by how many "Most important" goals they align with
      const sortedAlts = alternatives
        .filter((a) => selectedAlternatives.has(a.name))
        .map((a, i) => ({
          rank: i + 1,
          name: a.name,
          reason: `Relevant to ${Object.values(priorities).filter((p) => p === 3).length} of your top priorities.`,
        }))
        .slice(0, 7);
      setResults(sortedAlts);
      setStep("results");
    } finally {
      setLoading(false);
    }
  }

  if (step === "example") {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Worked example: A mid-sized European city
          </h2>
          <p className="text-sm text-blue-700 mb-4">
            A mid-sized city prioritises public transport integration and
            emission reduction. The guided tool recommends these top measures:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Integrated Mobility Service Platform (MaaS)</li>
            <li>PT Scheduling and Frequency Optimization</li>
            <li>Mobility Hub Development</li>
            <li>Electric and Low-Emission Infrastructure Expansion</li>
          </ol>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setStep("context")}
            className="flex-1 bg-primary text-white rounded-lg px-5 py-3 font-medium hover:opacity-90"
          >
            Start fresh
          </button>
          <button
            onClick={() => {
              setCityContext("mid");
              setPriorities(
                Object.fromEntries(
                  goals.map((g) => [
                    g.name,
                    g.name.includes("Transport") || g.name.includes("Emission")
                      ? 3
                      : 2,
                  ]),
                ),
              );
              setStep("constraints");
            }}
            className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-lg px-5 py-3 font-medium hover:bg-gray-50"
          >
            Start with this example
          </button>
        </div>
      </div>
    );
  }

  if (step === "context") {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Step 1 — About your city
        </h2>
        <p className="text-gray-600 mb-6">Which best describes your city?</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {CITY_CONTEXTS.map((ctx) => (
            <button
              key={ctx.value}
              onClick={() => setCityContext(ctx.value)}
              className={`text-left rounded-lg border-2 p-4 font-medium transition-colors ${
                cityContext === ctx.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {ctx.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep("priority")}
          className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:opacity-90"
        >
          Next →
        </button>
      </div>
    );
  }

  if (step === "priority") {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Step 2 — What matters to you
        </h2>
        <p className="text-gray-600 mb-6">
          Rate how important each goal is for your city.
        </p>
        <div className="space-y-4 mb-8">
          {goals.map((g) => (
            <div
              key={g.name}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{g.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${evidenceBadge(priorities[g.name] ?? 2)}`}
                >
                  {PRIORITY_LABELS[priorities[g.name] ?? 2]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={priorities[g.name] ?? 2}
                onChange={(e) =>
                  setPriorities((prev) => ({
                    ...prev,
                    [g.name]: Number(e.target.value) as PriorityLevel,
                  }))
                }
                className="w-full mt-3"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("context")}
            className="border border-gray-300 text-gray-700 rounded-lg px-5 py-3 hover:bg-gray-50"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep("constraints")}
            className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:opacity-90"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  if (step === "constraints") {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Step 3 — Mobility measures to consider
        </h2>
        <p className="text-gray-600 mb-6">
          Deselect any measures that are not applicable to your city.
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {alternatives.map((a) => {
            const selected = selectedAlternatives.has(a.name);
            return (
              <button
                key={a.name}
                onClick={() =>
                  setSelectedAlternatives((prev) => {
                    const next = new Set(prev);
                    if (next.has(a.name)) next.delete(a.name);
                    else next.add(a.name);
                    return next;
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-500 border-gray-300 line-through"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("priority")}
            className="border border-gray-300 text-gray-700 rounded-lg px-5 py-3 hover:bg-gray-50"
          >
            ← Back
          </button>
          <button
            onClick={runAnalysis}
            disabled={loading || selectedAlternatives.size === 0}
            className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Analysing…" : "Get my shortlist →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "results" && results) {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Your shortlist
        </h2>
        <p className="text-gray-600 mb-6">
          Top mobility measures ranked for your city's priorities.
        </p>
        <div className="space-y-3 mb-8">
          {results.map((r) => (
            <div
              key={r.name}
              className="bg-white border border-gray-200 rounded-lg p-5 flex gap-4"
            >
              <span className="text-2xl font-bold text-gray-300">
                #{r.rank}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">{r.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              setStep("example");
              setResults(null);
            }}
            className="border border-gray-300 text-gray-700 rounded-lg px-5 py-3 hover:bg-gray-50"
          >
            Start over
          </button>
          <a
            href={buildExpertUrl()}
            className="bg-white border border-primary text-primary rounded-lg px-5 py-3 font-medium hover:bg-primary/5"
          >
            Open in expert mode →
          </a>
        </div>
      </div>
    );
  }

  return null;
}

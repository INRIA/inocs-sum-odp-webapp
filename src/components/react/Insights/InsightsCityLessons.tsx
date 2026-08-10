import React from "react";

interface LessonResource {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  associationType: "city" | "measure" | "kpi";
  associationLabel: string;
  date?: string | null;
}

interface InsightsCityLessonsProps {
  resources: LessonResource[];
}

export function InsightsCityLessons({ resources }: InsightsCityLessonsProps) {
  if (resources.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Lessons &amp; documents
        </h2>
        <div className="space-y-4">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{r.name}</h3>
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Related to: {r.associationLabel}
                    {r.date && ` · ${new Date(r.date).toLocaleDateString()}`}
                  </p>
                </div>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline whitespace-nowrap shrink-0"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useState } from "react";

interface DownloadEntry {
  title: string;
  description: string;
  doesNotContain: string;
  format: string;
  schemaFields: string[];
  coverage: string;
  period: string;
  licence: string;
  downloadUrl: string;
  sourcePages: string[];
}

interface DownloadCatalogueProps {
  entries: DownloadEntry[];
}

function EntryCard({ entry }: { entry: DownloadEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{entry.title}</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">
              {entry.format}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
          <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3 text-xs text-amber-800">
            <strong>Does not contain:</strong> {entry.doesNotContain}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            <span>Coverage: {entry.coverage}</span>
            <span>Period: {entry.period}</span>
            <span>Licence: {entry.licence}</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? "Hide schema ▲" : "Show schema ▼"}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {entry.schemaFields.map((field) => (
                <li key={field} className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                  {field}
                </li>
              ))}
            </ul>
          )}
        </div>
        <a
          href={entry.downloadUrl}
          className="shrink-0 bg-primary text-white text-sm rounded-lg px-4 py-2 font-medium hover:opacity-90"
        >
          Download
        </a>
      </div>
    </div>
  );
}

export function DownloadCatalogue({ entries }: DownloadCatalogueProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <EntryCard key={entry.title} entry={entry} />
      ))}
    </div>
  );
}

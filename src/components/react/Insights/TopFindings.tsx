interface Finding {
  measureName: string;
  direction: string;
  kpiGroupName: string;
  cityCount: number;
  evidenceLabel: string;
  goalSlug: string;
}

export function TopFindings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No findings available yet.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {findings.map((f, i) => (
        <li key={i} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-gray-800 text-sm leading-relaxed">
            <span className="font-semibold">{f.measureName}</span>
            {" is associated with "}
            <span className={f.direction === "improvement" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
              {f.direction}
            </span>
            {" in "}
            <span className="font-medium">{f.kpiGroupName}</span>
            {" across "}
            <span className="font-medium">{f.cityCount}</span>
            {f.cityCount === 1 ? " city." : " cities."}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              Evidence: {f.evidenceLabel}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

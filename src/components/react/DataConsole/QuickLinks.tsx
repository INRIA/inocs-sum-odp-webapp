import React from "react";

const LINKS = [
  { label: "KPI Dashboard", description: "Explore key performance indicators across cities", href: "/data/kpis" },
  { label: "Modal Split", description: "Transport mode share data by city", href: "/data/modal-split" },
  { label: "Policy Measures", description: "Mobility measures implemented by cities", href: "/data/measures" },
  { label: "Data Collection Plan", description: "Framework and methodology", href: "/methods/collection-plan" },
  { label: "Impact Analysis", description: "Statistical analysis of measure effectiveness", href: "/tools/impact_analysis" },
  { label: "MCDA Tool", description: "Multi-criteria decision analysis", href: "/tools/mcda_analysis" },
  { label: "Resources", description: "Documents, lessons, and references", href: "/tools/resources" },
  { label: "Downloads", description: "All downloadable datasets and files", href: "/data/downloads" },
];

export function QuickLinks() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-primary/30"
        >
          <h3 className="font-semibold text-gray-900 mb-1">{link.label}</h3>
          <p className="text-xs text-gray-500">{link.description}</p>
        </a>
      ))}
    </div>
  );
}

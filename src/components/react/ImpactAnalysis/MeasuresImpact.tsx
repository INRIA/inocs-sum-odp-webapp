import React from "react";
import type { IKpiGroup } from "../../../types";
import { AnalysisSectionDivider } from "../AnalysisSectionDivider";

interface MeasuresImpactProps {
  selectedGroup: IKpiGroup | null;
}

export const MeasuresImpact: React.FC<MeasuresImpactProps> = ({
  selectedGroup,
}) => {
  return (
    <div>
      <AnalysisSectionDivider
        step={2}
        title="Measures Impact"
        subtitle="Analyse how implemented measures contributed to the KPIs variations"
        description="Estimation of the level of contribution for each measure"
      />
      {selectedGroup ? (
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm ">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Selected KPI Group:{" "}
            <span className="text-secondary">{selectedGroup.name}</span>
          </h3>

          {selectedGroup.kpis && selectedGroup.kpis.length > 0 ? (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                KPIs in this group ({selectedGroup.kpis.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedGroup.kpis.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="bg-light border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {String(kpi.id).substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-sm mb-1">
                          {kpi.name}
                        </h5>
                        {kpi.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {kpi.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                No KPIs available in this group.
              </p>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> Detailed impact
              analysis for measures will be displayed here. This section will
              show the most and least impactful measures based on the analysis
              results.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">
          Please select a KPI group above to view the analysis.
        </p>
      )}
    </div>
  );
};

import React from "react";

export const KpisFrameworkDiagram: React.FC = () => {
  return (
    <section className="mb-8 rounded-lg p-4 md:p-6">
      <h2 className="mb-4 text-center">KPIs framework</h2>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[50px_minmax(0,1fr)]">
          <div className="hidden lg:flex items-center justify-center">
            <div className="-rotate-90 origin-center text-sm font-semibold text-primary whitespace-nowrap">
              Process evaluation
            </div>
          </div>

          <div
            id="process-evaluation"
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <div className="rounded-xl border-2 border-gray-700">
              <div className="rounded-t-xl border-b border-gray-700 bg-gray-50 px-3 py-1 font-semibold">
                Actual
              </div>
              <div className="space-y-2 p-3 text-sm">
                <div className="rounded-xl border-2 border-lime-500 p-2">
                  <p className="font-semibold">Policies</p>
                  <p>1. Level of completion of SUMP measures</p>
                  <p>2. Community involvement</p>
                  <p>3. Balance of pull-push planned/implemented measures</p>
                  <p>4. Number of NSM modes integrated in the system</p>
                </div>
                <div className="rounded-xl border-2 border-orange-500 p-2">
                  <p className="font-semibold">Transport system</p>
                  <p>7. Actual door-to-door travel time</p>
                  <p>8. Active mobility infrastructure</p>
                  <p>9. Multimodal integration in stations/stops</p>
                  <p>10. Travel cost ratio</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-gray-700">
              <div className="rounded-t-xl border-b border-gray-700 bg-gray-50 px-3 py-1 font-semibold">
                Perceived
              </div>
              <div className="space-y-2 p-3 text-sm">
                <div className="rounded-xl border-2 border-lime-500 p-2">
                  <p>5. Acceptance level of planned/implemented measures</p>
                  <p>6. Intention level to use NSMs</p>
                </div>
                <div className="rounded-xl border-2 border-orange-500 p-2">
                  <p>11. Perceived door-to-door travel time</p>
                  <p>12. Perceived safety difference</p>
                  <p>13. User satisfaction</p>
                  <p>14. Perceived affordability</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[50px_minmax(0,1fr)]">
          <div className="hidden lg:flex items-center justify-center">
            <div className="-rotate-90 origin-center text-sm font-semibold text-primary whitespace-nowrap">
              Impact evaluation
            </div>
          </div>

          <div id="impact-evaluation" className="space-y-3">
            <div className="rounded-xl bg-primary px-4 py-3 text-white">
              <p className="font-semibold">
                Modal split (main project outcome)
              </p>
              <p>15a. Modal split in trips</p>
              <p>15b. Modal split in passenger kilometers</p>
              <p>15c. Modal split in vehicle kilometers</p>
            </div>

            <div className="rounded-xl border-2 border-sky-400 p-3">
              <p className="mb-2 text-lg font-semibold text-gray-900">
                Impacts - Sustainability assessment
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3 text-sm">
                <div className="rounded-xl border border-gray-400 p-2">
                  <p className="mb-1 font-semibold">Environment</p>
                  <p>16. Greenhouse emissions</p>
                  <p>17. Air pollution</p>
                  <p>18. Noise hindrance</p>
                  <p>19. Energy consumption ratio</p>
                </div>
                <div className="rounded-xl border border-gray-400 p-2">
                  <p className="mb-1 font-semibold">Society</p>
                  <p>20. Accessibility ratio</p>
                  <p>21. Vertical social equity</p>
                  <p>22. Horizontal social equity</p>
                  <p>23. Social inclusion</p>
                </div>
                <div className="rounded-xl border border-gray-400 p-2">
                  <p className="mb-1 font-semibold">Economy</p>
                  <p>24. Congestion and travel delays</p>
                  <p>25. Social welfare</p>
                  <p>26. Profitability of NSM operators</p>
                  <p>27. Profitability of MaaS platforms</p>
                  <p>28. Operation revenue of NSMs</p>
                  <p>29. Service utilization rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from "react";
import type { McdaKeyInsightCard } from "../../../types";
import { InfoCard } from "../ui";

interface McdaKeyResultsProps {
  cards?: McdaKeyInsightCard[];
}
export const McdaKeyResults: React.FC<McdaKeyResultsProps> = ({ cards = [] }) => {
  if (cards.length === 0) return null;

  return (
    <section aria-label="MCDA key insights" className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900">Top insights</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <InfoCard
            key={card.title}
            title={card.title}
            description={card.description}
            tooltip={card.tooltip}
            variant="light"
            showIcon={false}
            className="h-full items-start px-4 py-3 text-left"
          >
            <div className="mt-3 w-full text-left">
              <p className="text-base font-semibold text-gray-900 leading-snug">{card.value}</p>
              {card.detail ? (
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{card.detail}</p>
              ) : null}
            </div>
          </InfoCard>
        ))}
      </div>
    </section>
  );
};

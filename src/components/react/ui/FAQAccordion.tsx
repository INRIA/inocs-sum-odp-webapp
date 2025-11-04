import React from "react";
import { ExpansionPanel, RButton } from ".";

type FAQItem = {
  question: string;
  answer: React.ReactNode | string;
  ctaLabel?: string;
  ctaLink?: string;
};

type Props = {
  questions: FAQItem[];
};

export function FAQAccordion({ questions = [] }: Props) {
  // defaultTabId={null} -> all closed by default
  return (
    <div>
      {questions.map((q, i) => (
        <ExpansionPanel
          key={i}
          header={<h6 className="">{q.question}</h6>}
          arrow
          open={false}
          content={
            <div className="prose">
              {/* answer can be string or React node */}
              {typeof q.answer === "string" ? <p>{q.answer}</p> : q.answer}
              {q.ctaLabel && q.ctaLink && (
                <p>
                  <RButton text={q.ctaLabel} href={q.ctaLink} />
                </p>
              )}
            </div>
          }
        />
      ))}
    </div>
  );
}

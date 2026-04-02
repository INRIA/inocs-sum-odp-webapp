import React from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../react-catalyst-ui-kit/typescript/table";

interface ScoreMatrixProps {
  goals: string[];
  alternatives: string[];
  scores: Record<string, Record<string, number>>;
  onScoreChange: (alternative: string, goal: string, value: number) => void;
  disabled?: boolean;
}

export const ScoreMatrix: React.FC<ScoreMatrixProps> = ({
  goals,
  alternatives,
  scores,
  onScoreChange,
  disabled = false,
}) => {
  if (goals.length === 0 || alternatives.length === 0) {
    return (
      <p className="text-lg italic text-muted">
        Select goals and activities first to enter scores.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-light bg-white p-3">
      <Table striped dense>
        <TableHead>
          <TableRow>
            <TableHeader>Business Activity</TableHeader>
            {goals.map((goal) => (
              <TableHeader key={`head-${goal}`}>{goal}</TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {alternatives.map((alternative) => (
            <TableRow key={`row-${alternative}`}>
              <TableCell className="font-medium text-dark">
                {alternative}
              </TableCell>
              {goals.map((goal) => {
                const rawValue = scores[alternative]?.[goal];
                const value = Number.isFinite(rawValue) ? rawValue : "";

                return (
                  <TableCell key={`${alternative}-${goal}`}>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={disabled}
                      value={value}
                      aria-label={`Score for ${alternative} and ${goal}`}
                      placeholder="0.00"
                      onChange={(event) => {
                        const nextRaw = event.target.value;
                        const nextValue =
                          nextRaw === "" ? Number.NaN : Number.parseFloat(nextRaw);
                        onScoreChange(alternative, goal, nextValue);
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
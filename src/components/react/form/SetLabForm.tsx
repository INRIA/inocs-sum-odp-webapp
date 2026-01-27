import React, { useState } from "react";
import {
  LivingLabModeOptions,
  type LivingLabMode,
} from "./LivingLabModeOptions";
import { RButton } from "../ui/RButton";
import { getUrl } from "../../../lib/helpers";

interface SetLabFormProps {
  livingLabs: { id: string; name: string }[];
}

/**
 * Form component for selecting or creating a Living Lab from the set-lab page.
 * Allows users to either select from available labs or navigate to create a new one.
 */
export function SetLabForm({ livingLabs }: SetLabFormProps) {
  const [mode, setMode] = useState<LivingLabMode>(
    livingLabs.length > 0 ? "select" : "create",
  );
  const [selectedLabId, setSelectedLabId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      // Redirect to create new lab page
      window.location.href = getUrl("/lab-admin/lab/new");
      return;
    }

    if (mode === "select" && selectedLabId) {
      // Set the selected lab by reloading with the id parameter
      setIsLoading(true);
      window.location.href = getUrl(`/lab-admin/set-lab?id=${selectedLabId}`);
    }
  };

  const isSubmitDisabled = mode === "select" && !selectedLabId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Choose your Living Lab</h2>
        {selectedLabId.length > 0 ? (
          <p className="text-gray-600 mb-6">
            Select an existing Living Lab to manage, or create a new one.
          </p>
        ) : (
          <p className="text-gray-600 mb-6">
            You have no Living Labs assigned to your account. If you want to
            manage an existing Living Lab, please contact the administrator at{" "}
            <a
              href="mailto:odp@sum-project.eu"
              className="text-blue-600 underline"
            >
              odp@sum-project.eu
            </a>
            . Otherwise, you can create a new Living Lab.
          </p>
        )}

        <LivingLabModeOptions
          livingLabs={livingLabs}
          mode={mode}
          onModeChange={setMode}
          selectedLabId={selectedLabId}
          onLabSelect={setSelectedLabId}
          isLoading={isLoading}
          labels={{
            select: "Manage existing Living Lab",
            create: "Create new Living Lab",
            selectDropdown: "Living Lab",
          }}
        />
      </div>

      <div className="flex gap-4">
        <RButton
          type="submit"
          variant="primary"
          text={mode === "create" ? "Create new lab" : "Continue"}
          disabled={isSubmitDisabled || isLoading}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

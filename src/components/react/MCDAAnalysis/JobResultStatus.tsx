import React from "react";

interface JobResultStatusProps {
  status: "PENDING" | "STARTED" | "FAILURE";
  message?: string;
}

export const JobResultStatus: React.FC<JobResultStatusProps> = ({
  status,
  message,
}) => {
  if (status === "FAILURE") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-red-800">
          Analysis Failed
        </h2>
        <p className="text-red-700">
          The analysis could not be completed. Please contact the platform
          administrator for assistance.
        </p>
        {message && (
          <p className="text-sm text-red-600 bg-red-100 rounded p-3">{message}</p>
        )}
      </div>
    );
  }

  // PENDING or STARTED
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 space-y-4">
      <p className="text-blue-800">
        The job is currently in process. Please try again by refreshing the
        page.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
      >
        Refresh page
      </button>
    </div>
  );
};

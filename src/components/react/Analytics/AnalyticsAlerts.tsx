/**
 * AnalyticsAlerts Component
 * 
 * SSR-only React component that displays alert cards for platform anomalies.
 * Examples: labs with no KPI results, labs with no measures, pending users.
 * 
 * @module Phase 7 - Analytics Alerts
 */

import type { AlertCardData } from "./types";

export interface AnalyticsAlertsProps {
  alerts: AlertCardData[];
}

/**
 * A component displaying alert cards for platform anomalies.
 * This component is rendered server-side without hydration (no client:* directive).
 */
export function AnalyticsAlerts({ alerts }: AnalyticsAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  const getSeverityClasses = (severity: AlertCardData["severity"]) => {
    switch (severity) {
      case "danger":
        return {
          container: "bg-red-50 border border-red-200",
          text: "text-red-700",
        };
      case "warning":
        return {
          container: "bg-yellow-50 border border-yellow-200",
          text: "text-yellow-700",
        };
      case "info":
      default:
        return {
          container: "bg-blue-50 border border-blue-200",
          text: "text-blue-700",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {alerts.map((alert, index) => {
        const classes = getSeverityClasses(alert.severity);
        return (
          <div key={index} className={`rounded-lg p-4 ${classes.container}`}>
            <p className={`font-medium ${classes.text}`}>{alert.label}</p>
            <p className="text-2xl font-bold mt-1">{alert.value}</p>
            {alert.items && alert.items.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm cursor-pointer hover:underline">
                  View details
                </summary>
                <ul className="text-sm mt-1 list-disc list-inside">
                  {alert.items.slice(0, 5).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {alert.items.length > 5 && (
                    <li className="text-gray-500">
                      ...and {alert.items.length - 5} more
                    </li>
                  )}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AnalyticsAlerts;

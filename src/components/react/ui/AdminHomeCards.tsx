import {
  PresentationChartBarIcon,
  CogIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { RButton } from "./RButton";
import { InfoAlert } from "./InfoAlert";

interface AdminHomeCardsProps {
  editorUrl: string;
  adminHostUrl: string;
}

const EDITOR_FEATURES = [
  "View and edit Living Lab profiles and information",
  "Declare and update policy measures implemented by cities",
  "Record and track KPI results over time",
  "Manage modal split transport data",
  "Monitor lab progress with analytics dashboards",
];

const ADMIN_FEATURES = [
  "Manage users, roles and access permissions",
  "Moderate and administer all Living Labs",
  "Maintain the KPI and category catalogues",
  "Manage policy measures and resources library",
  "Configure platform settings and system parameters",
];

function FeatureList({
  features,
  iconClass,
}: {
  features: string[];
  iconClass: string;
}) {
  return (
    <ul className="flex flex-col gap-2 mt-1">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
          <CheckIcon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
          {feature}
        </li>
      ))}
    </ul>
  );
}

export function AdminHomeCards({ editorUrl, adminHostUrl }: AdminHomeCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Card A — Lab Editor space */}
      <div className="flex flex-col gap-5 rounded-2xl border-2 border-primary/30 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
          <PresentationChartBarIcon className="w-6 h-6 text-success" />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Continue in Lab Editor space
          </h3>
          <p className="text-sm text-gray-500">
            Manage Living Labs with the same interface Living Lab editors
            experience.
          </p>
          <FeatureList features={EDITOR_FEATURES} iconClass="text-primary" />
        </div>

        <RButton
          href={editorUrl}
          variant="primary"
          text="Open Lab Editor space"
          defaultArrow
          className="mt-2 w-full justify-center text-center"
        />
      </div>

      {/* Card B — Full administration platform */}
      <div className="flex flex-col gap-5 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 shrink-0">
          <CogIcon className="w-6 h-6 text-warning" />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Go to full administration &amp; moderation space
          </h3>
          <p className="text-sm text-gray-500">
            Manage all platform resources with full administrative control.
          </p>
          <FeatureList features={ADMIN_FEATURES} iconClass="text-gray-500" />

          <InfoAlert variant="warning" icon="warning" className="mt-1 text-xs">
            You will be asked to sign in again on the administration platform.
          </InfoAlert>
        </div>

        <RButton
          href={adminHostUrl}
          variant="warning"
          text="Go to administration platform"
          defaultArrow
          className="mt-2 w-full justify-center text-center"
        />
      </div>
    </div>
  );
}

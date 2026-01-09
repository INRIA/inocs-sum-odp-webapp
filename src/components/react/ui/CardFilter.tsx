import React from "react";

interface CardFilterProps {
  groups: { id: string | number; name: string }[];
  selectedGroupId?: string | number;
  onGroupSelect: (groupId: string | number) => void;
}

export const CardFilter: React.FC<CardFilterProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
}) => {
  return (
    <div className="gap-2 lg:gap-4 flex justify-center mt-4 flex-row flex-wrap">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onGroupSelect(group.id)}
          className={`py-3 px-4 rounded-lg border-2 font-medium transition-all duration-200 text-center ${
            selectedGroupId === group.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <div className="text-3xl mb-2">{getGroupIcon(group.name)}</div>

          {group.name}
        </button>
      ))}
    </div>
  );
};

// Helper function to get icon based on group name
function getGroupIcon(groupName: string): string {
  const name = groupName.toLowerCase();

  if (name.includes("mobility") || name.includes("accessibility")) {
    return "🚏";
  }
  if (name.includes("economic") || name.includes("revenue")) {
    return "💶";
  }
  if (name.includes("provider") || name.includes("kpi provider")) {
    return "📊";
  }
  if (name.includes("environment")) {
    return "♻️";
  }
  if (name.includes("maaS") || name.includes("service")) {
    return "☁️";
  }
  if (name.includes("data") || name.includes("provider")) {
    return "💾";
  }
  if (
    name.includes("operator") ||
    name.includes("pt") ||
    name.includes("transport")
  ) {
    return "🚇";
  }
  if (
    name.includes("user") ||
    name.includes("citizen") ||
    name.includes("customer")
  ) {
    return "👤";
  }
  if (name.includes("traffic") || name.includes("congestion")) {
    return "🚦";
  }
  if (name.includes("safety") || name.includes("security")) {
    return "🛡️";
  }

  return "📊";
}

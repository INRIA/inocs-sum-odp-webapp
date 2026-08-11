interface GoalCardProps {
  slug: string;
  title: string;
  description: string;
  measureCount: number;
  cityCount: number;
  href: string;
}

export function GoalCard({ title, description, measureCount, cityCount, href }: GoalCardProps) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 group"
    >
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{description}</p>
      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="font-bold text-primary">{measureCount}</span>
          {measureCount === 1 ? "measure" : "measures"}
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-primary">{cityCount}</span>
          {cityCount === 1 ? "city" : "cities"}
        </span>
      </div>
    </a>
  );
}

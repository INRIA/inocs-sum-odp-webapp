import { getUrl } from "../../../lib/helpers";

interface Props {
  className?: string;
}

export function BrandLogo({ className = "" }: Props) {
  return (
    <a className={`flex flex-col items-start gap-1 ${className}`} href="/">
      <img src={getUrl("/sum_logo.jpg")} alt="SUM Logo" className="w-40" />
      <span className="text-md font-bold text-primary">Open Data Platform</span>
    </a>
  );
}

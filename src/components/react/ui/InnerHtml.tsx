import { stripHtml, truncateHtml } from "../../../lib/helpers";

interface InnerHtmlProps {
  html: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  maxLength?: number;
}

export function InnerHtml({
  html,
  className,
  as: Component = "div",
  maxLength,
}: InnerHtmlProps) {
  if (maxLength !== undefined) {
    const truncated = truncateHtml(html, maxLength);
    return <Component className={className}>{truncated}</Component>;
  }

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

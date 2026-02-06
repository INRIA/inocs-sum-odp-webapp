import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { ResourceCardProps } from "./types";
import { InnerHtml, RButton } from "../ui";
import { Badge } from "../ui";

export function ResourceCard({ resource }: ResourceCardProps) {
  const { id, name, description, url, item_tag, project } = resource;

  return (
    <article className="relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {item_tag && item_tag.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1">
          {item_tag.map((tag) => (
            <Badge
              key={tag.id}
              color="none"
              size="md"
              className="text-white font-bold"
              style={{ backgroundColor: tag.tags.color }}
            >
              {tag.tags.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex-1">
        <h5>{name}</h5>

        {description && (
          <InnerHtml
            html={description}
            as="p"
            className="mt-2 text-sm text-gray-600"
            maxLength={200}
          />
        )}
        {project && (
          <div>
            <small className="mt-3 block text-gray-500">
              Related to policy measures:
            </small>

            <div className="mt-3 flex flex-wrap gap-1">
              <Badge key={project.id} color="light" size="sm">
                {project.name}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <RButton variant="secondary" href={`/tools/resources/${id}`} className="w-full text-center">
          Learn more
        </RButton>

        {url && (
          <RButton
            variant="link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </RButton>
        )}
      </div>
    </article>
  );
}

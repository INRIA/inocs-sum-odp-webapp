import type { APIRoute } from "astro";
import { ApiResponse } from "../../../../types";
import { ItemService } from "../../../../bff/services/items.service";

const itemService = new ItemService();

function parseCategoryIds(param: string | null): number[] | undefined {
  if (!param || param === "") {
    return undefined;
  }

  let values: string[] = [];

  if (param.startsWith("[") && param.endsWith("]")) {
    values = param.slice(1, -1).split(",");
  } else if (param.includes(",")) {
    values = param.split(",");
  } else {
    values = [param];
  }

  const parsed = values
    .map((v) => parseInt(v.trim(), 10))
    .filter((n) => !isNaN(n));

  return parsed.length > 0 ? parsed : [];
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const categoryTypeParam = url.searchParams.get("category_type");
    const categoryIdParam = url.searchParams.get("category_id");

    if (categoryTypeParam && categoryTypeParam !== "") {
      const items = await itemService.getItemsByCategoryType(categoryTypeParam);

      if (items === null) {
        return ApiResponse.notFound("Category type not found");
      }

      return ApiResponse.success(items);
    }

    const categoryIds = parseCategoryIds(categoryIdParam);
    const items = await itemService.getItems(categoryIds);

    return ApiResponse.success(items);
  } catch (err) {
    console.error(err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};

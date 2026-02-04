import type { APIRoute } from "astro";
import { ApiResponse } from "../../../../types";
import { ItemService } from "../../../../bff/services/items.service";

const itemService = new ItemService();

export const GET: APIRoute = async ({ params }) => {
  const idParam = params.id;

  if (!idParam || idParam === "") {
    return ApiResponse.validationError("Invalid id parameter");
  }

  const id = parseInt(idParam, 10);

  if (isNaN(id) || id < 0) {
    return ApiResponse.validationError("Invalid id parameter");
  }

  const item = await itemService.getItemById(id);

  if (!item) {
    return ApiResponse.notFound("Item not found");
  }

  return ApiResponse.success(item);
};

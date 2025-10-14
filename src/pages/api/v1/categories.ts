import type { APIRoute } from "astro";
import ApiResponse from "../../../types/ApiResponse";
import { CategoryService } from "../../../bff/services/category.service";

const categoryService = new CategoryService();

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || undefined;
    const data = await categoryService.getCategories(type);
    return new ApiResponse({ data });
  } catch (err) {
    console.error(err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};

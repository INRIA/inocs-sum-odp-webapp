import type { APIRoute } from "astro";
import ApiResponse from "../../../types/ApiResponse";
import { TransportModeService } from "../../../bff/services/transport-mode.service";
const transportModeService = new TransportModeService();

export const GET: APIRoute = async () => {
  try {
    const data = await transportModeService.getAllTransportModes();
    return new ApiResponse({ data });
  } catch (err) {
    console.error(err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};

import { toSafeJsonString } from "../lib/helpers";

/**
 * Standard API response data structure
 */
export interface ApiResponseData<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  status?: number;
}

/**
 * ApiResponse class that extends Astro's Response with standardized response patterns
 * This reduces code duplication and provides consistent API responses across the application
 */
export class ApiResponse extends Response {
  constructor(data: ApiResponseData, init?: ResponseInit) {
    // Merge default headers with any provided headers
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Create the response with JSON stringified data
    super(
      data.data
        ? toSafeJsonString(data.data)
        : data
        ? JSON.stringify(data)
        : null,
      {
        ...init,
        headers,
        status: data.status ?? 200,
        statusText: data.error ?? data.message ?? "OK",
      }
    );
  }

  /**
   * Create a successful response
   */
  static success<T>(
    data?: T,
    message?: string,
    status = 200,
    count?: number
  ): ApiResponse {
    return new ApiResponse(
      {
        success: true,
        data,
        message,
        count,
        status,
      },
      { status }
    );
  }

  /**
   * Create an error response
   */
  static failure(error: string, status = 500, data?: any): ApiResponse {
    return new ApiResponse(
      {
        success: false,
        error,
        data,
        status,
      },
      { status }
    );
  }

  /**
   * Create a validation error response (400 Bad Request)
   */
  static validationError(error: string, data?: any): ApiResponse {
    return new ApiResponse(
      {
        success: false,
        error,
        data,
        status: 400,
      },
      { status: 400 }
    );
  }

  /**
   * Create a not found response (404)
   */
  static notFound(error = "Resource not found", data?: any): ApiResponse {
    return new ApiResponse(
      {
        success: false,
        error,
        data,
        status: 404,
      },
      { status: 404 }
    );
  }

  /**
   * Create an unauthorized response (401)
   */
  static unauthorized(error = "Unauthorized", data?: any): ApiResponse {
    return new ApiResponse(
      {
        success: false,
        error,
        data,
        status: 401,
      },
      { status: 401 }
    );
  }

  /**
   * Create a forbidden response (403)
   */
  static forbidden(error = "Forbidden", data?: any): ApiResponse {
    return new ApiResponse(
      {
        success: false,
        error,
        data,
        status: 403,
      },
      { status: 403 }
    );
  }

  /**
   * Create a conflict response (409)
   */
  static conflict(error: string, data?: any): ApiResponse {
    return new ApiResponse(
      {
        success: false,
        error,
        data,
        status: 409,
      },
      { status: 409 }
    );
  }

  /**
   * Create a created response (201)
   */
  static created<T>(
    data: T,
    message = "Resource created successfully"
  ): ApiResponse {
    return new ApiResponse(
      {
        success: true,
        data,
        message,
        status: 201,
      },
      { status: 201 }
    );
  }

  /**
   * Create a no content response (204)
   */
  static noContent(): ApiResponse {
    return new Response(null, { status: 204 });
  }

  /**
   * Create a response with custom status and message
   */
  static custom<T>(
    success: boolean,
    status: number,
    data?: T,
    message?: string,
    error?: string,
    count?: number
  ): ApiResponse {
    return new ApiResponse(
      {
        success,
        data,
        message,
        error,
        count,
        status,
      },
      { status }
    );
  }

  /**
   * Helper method to handle common try-catch patterns
   */
  static async handleAsync<T>(
    asyncOperation: () => Promise<T>,
    successMessage?: string,
    successStatus = 200
  ): Promise<ApiResponse> {
    try {
      const result = await asyncOperation();
      return ApiResponse.success(result, successMessage, successStatus);
    } catch (error) {
      console.error("ApiResponse.handleAsync error:", error);
      return ApiResponse.failure(
        error instanceof Error ? error.message : "Internal server error"
      );
    }
  }
}

export default ApiResponse;

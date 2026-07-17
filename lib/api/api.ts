import { ApiError } from "./types";

interface RequestOptions extends RequestInit {
  timeout?: number;
}

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = 15000, headers = {}, ...customOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
        ...customOptions,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errMessage = "Server returned an error status";
        let errDetails = null;

        try {
          const errData = await response.json();
          errMessage = errData.message || errMessage;
          errDetails = errData.details || null;
        } catch {
          // Response is not JSON, ignore
        }

        const apiError: ApiError = {
          message: errMessage,
          code: `HTTP_${response.status}`,
          details: errDetails,
        };
        throw apiError;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(id);

      if (err.name === "AbortError") {
        const timeoutError: ApiError = {
          message: "Request timed out. Please check your network connection and retry.",
          code: "TIMEOUT",
        };
        throw timeoutError;
      }

      if (err.message && err.code) {
        // Already mapped ApiError
        throw err;
      }

      const networkError: ApiError = {
        message: err.message || "A network or connection error occurred.",
        code: "NETWORK_ERROR",
        details: err,
      };
      throw networkError;
    }
  }

  public static async post<T, U>(endpoint: string, body: T, options: RequestOptions = {}): Promise<U> {
    return this.request<U>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  }
}

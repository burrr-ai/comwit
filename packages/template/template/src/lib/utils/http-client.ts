/** General-purpose HTTP client utilities. */

export interface RequestOptions {
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
  debug?: boolean;
}

/** HTTP client class. */
export class HttpClient {
  private debug: boolean = false;

  constructor(
    private baseUrl: string,
    private defaultHeaders: Record<string, string> = {},
    options?: { debug?: boolean }
  ) {
    this.debug = options?.debug ?? false;
  }

  /** GET request. */
  async get<TResponse>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<TResponse> {
    const url = this.buildUrl(endpoint, options?.queryParams);
    const startTime = Date.now();
    const shouldDebug = options?.debug ?? this.debug;

    if (shouldDebug) {
      console.log(`🔵 [GET] ${url}`);
      if (options?.queryParams) {
        console.log("  Query Params:", options.queryParams);
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
    });

    if (shouldDebug) {
      const duration = Date.now() - startTime;
      console.log(`  ⏱️ Duration: ${duration}ms`);
      console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    }

    return this.handleResponse<TResponse>(response, shouldDebug);
  }

  /** POST request. */
  async post<TResponse>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<TResponse> {
    const url = this.buildUrl(endpoint, options?.queryParams);
    const startTime = Date.now();
    const shouldDebug = options?.debug ?? this.debug;

    if (shouldDebug) {
      console.log(`🟢 [POST] ${url}`);
      if (body) {
        console.log("  Body:", JSON.stringify(body, null, 2));
      }
      if (options?.queryParams) {
        console.log("  Query Params:", options.queryParams);
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (shouldDebug) {
      const duration = Date.now() - startTime;
      console.log(`  ⏱️ Duration: ${duration}ms`);
      console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    }

    return this.handleResponse<TResponse>(response, shouldDebug);
  }

  /** PUT request. */
  async put<TResponse>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<TResponse> {
    const url = this.buildUrl(endpoint, options?.queryParams);
    const startTime = Date.now();
    const shouldDebug = options?.debug ?? this.debug;

    if (shouldDebug) {
      console.log(`🟠 [PUT] ${url}`);
      if (body) {
        console.log("  Body:", JSON.stringify(body, null, 2));
      }
      if (options?.queryParams) {
        console.log("  Query Params:", options.queryParams);
      }
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (shouldDebug) {
      const duration = Date.now() - startTime;
      console.log(`  ⏱️ Duration: ${duration}ms`);
      console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    }

    return this.handleResponse<TResponse>(response, shouldDebug);
  }

  /** PATCH request. */
  async patch<TResponse>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<TResponse> {
    const url = this.buildUrl(endpoint, options?.queryParams);
    const startTime = Date.now();
    const shouldDebug = options?.debug ?? this.debug;

    if (shouldDebug) {
      console.log(`🟣 [PATCH] ${url}`);
      if (body) {
        console.log("  Body:", JSON.stringify(body, null, 2));
      }
      if (options?.queryParams) {
        console.log("  Query Params:", options.queryParams);
      }
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (shouldDebug) {
      const duration = Date.now() - startTime;
      console.log(`  ⏱️ Duration: ${duration}ms`);
      console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    }

    return this.handleResponse<TResponse>(response, shouldDebug);
  }

  /** DELETE request. */
  async delete<TResponse>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<TResponse> {
    const url = this.buildUrl(endpoint, options?.queryParams);
    const startTime = Date.now();
    const shouldDebug = options?.debug ?? this.debug;

    if (shouldDebug) {
      console.log(`🔴 [DELETE] ${url}`);
      if (options?.queryParams) {
        console.log("  Query Params:", options.queryParams);
      }
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
    });

    if (shouldDebug) {
      const duration = Date.now() - startTime;
      console.log(`  ⏱️ Duration: ${duration}ms`);
      console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    }

    return this.handleResponse<TResponse>(response, shouldDebug);
  }

  /** Build a URL, including query parameters. */
  private buildUrl(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined | null>
  ): string {
    let url = `${this.baseUrl}${endpoint}`;

    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /** Handle the response. */
  private async handleResponse<TResponse>(
    response: Response,
    shouldDebug: boolean = false
  ): Promise<TResponse> {
    let data: unknown;

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (shouldDebug && data) {
      console.log(
        "  Response:",
        typeof data === "object" ? JSON.stringify(data, null, 2) : data
      );
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      // Safely extract an error message with a type guard.
      if (data && typeof data === "object" && "error" in data) {
        const error = data.error;
        if (error && typeof error === "object" && "message" in error) {
          errorMessage = String(error.message);
        }
      } else if (data && typeof data === "object" && "message" in data) {
        errorMessage = String(data.message);
      } else if (typeof data === "string") {
        errorMessage = data;
      }

      if (shouldDebug) {
        console.log(`  ❌ Error: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    return data as TResponse;
  }
}

/** Shared API response type. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

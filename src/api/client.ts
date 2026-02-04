// Base API client with authentication and error handling

import { ApiError } from '../types/api';
import { getApiKey } from './keyStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://usageflows.info';

/**
 * Base fetch wrapper with authentication and error handling.
 * API key is taken from the gatekeeper (sessionStorage), not from the build.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const apiKey = getApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['X-Internal-API-Key'] = apiKey;
  }

  // Merge with provided headers
  if (options.headers) {
    const providedHeaders = options.headers as Record<string, string>;
    Object.assign(headers, providedHeaders);
  }

  // Console log the request details
  console.group('🚀 API Request');
  console.log('URL:', url);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:', headers);
  if (options.body) {
    console.log('Body (raw):', options.body);
    try {
      console.log('Body (parsed):', JSON.parse(options.body as string));
    } catch {
      console.log('Body is not JSON');
    }
  } else {
    console.log('Body: none');
  }
  console.groupEnd();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse response body
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Console log the response
    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data.message
        ? data.message
        : typeof data === 'string'
        ? data
        : `HTTP ${response.status}: ${response.statusText}`;

      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error) {
    console.error('❌ API Error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Failed to connect to API. Check your connection and ensure the API is running.');
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}

/**
 * Get user-friendly error message from ApiError
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Handle specific status codes
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'Invalid API key. Refresh the page and enter the correct key to try again.';
    }
    if (error.statusCode === 500) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if API key is configured (set via gatekeeper)
 */
export function isApiKeyConfigured(): boolean {
  return getApiKey().length > 0;
}

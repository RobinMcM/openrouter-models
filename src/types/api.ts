// TypeScript interfaces for OpenRouter Gateway API

// Models API Response
export interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
  description?: string;
}

export interface ModelsResponse {
  models?: ModelInfo[];
  data?: ModelInfo[];
}

// Model Showcase API Response (detailed info)
export interface ShowcaseModel {
  id: string;
  name: string;
  provider: string;
  best_for?: string[];
  strengths?: string[];
  limitations?: string[];
  output_specs?: string;
  estimated_cost?: string;
  use_cases?: string[];
}

export interface ShowcaseCategory {
  title: string;
  icon: string;
  description: string;
  models: ShowcaseModel[];
}

export interface ModelsShowcaseResponse {
  categories: Record<string, ShowcaseCategory>;
}

// Execute API Request
export interface ExecuteRequest {
  job_type: string;
  payload: {
    model: string;
    messages: Array<{
      role: string;
      content: string;
    }>;
    [key: string]: any;
  };
  dry_run: boolean;
}

// Execute API Response
export interface ExecuteResponse {
  status: string;
  routing: {
    provider?: string;
    model?: string;
    endpoint?: string;
    [key: string]: any;
  };
  result?: {
    id?: string;
    choices?: Array<{
      message?: {
        role: string;
        content: string;
      };
      finish_reason?: string;
      index?: number;
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    [key: string]: any;
  };
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    input_cost?: number;
    output_cost?: number;
    total_cost?: number;
    estimated?: boolean;
    [key: string]: any;
  };
}

// Error Response
export interface ErrorResponse {
  status: string;
  message: string;
}

// API Client Error
export class ApiError extends Error {
  statusCode?: number;
  response?: any;

  constructor(
    message: string,
    statusCode?: number,
    response?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

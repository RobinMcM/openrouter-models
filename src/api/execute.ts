// API client for executing prompts via OpenRouter

import { apiFetch } from './client';
import type { ExecuteRequest, ExecuteResponse } from '../types/api';

export interface ExecutePromptParams {
  model: string;
  rulesTemplate: string;
  prompt: string;
}

/**
 * Execute a prompt via the OpenRouter Gateway
 * Prepends rules template to the user prompt
 */
export async function executePrompt(params: ExecutePromptParams): Promise<ExecuteResponse> {
  console.log('📝 executePrompt called with params:', params);
  
  const { model, rulesTemplate, prompt } = params;

  // Combine rules template and user prompt
  const fullPrompt = `${rulesTemplate}\n\n${prompt}`;
  
  console.log('📝 Full prompt to send:', fullPrompt);

  // Build the execute request matching backend ExecuteRequest schema
  // Note: provider field is optional for backward compatibility
  const request: ExecuteRequest = {
    job_type: 'text-completion',
    payload: {
      model: model,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    },
    dry_run: false,
  };
  
  console.log('📝 Request object:', request);

  try {
    const response = await apiFetch<ExecuteResponse>('/api/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    console.log('✅ Response received:', response);
    console.log('📊 Result:', response.result);
    console.log('💬 Content:', response.result?.choices?.[0]?.message?.content);

    return response;
  } catch (error) {
    console.error('❌ Error executing prompt:', error);
    throw error;
  }
}

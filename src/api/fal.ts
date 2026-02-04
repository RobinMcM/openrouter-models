// API client for FAL media generation via usageflows.info gateway

import { apiFetch } from './client';
import type { 
  FalExecuteRequest, 
  FalJobResponse, 
  FalJobStatusResponse,
  MediaResult
} from '../types/api';

export interface GenerateMediaParams {
  mediaType: string;
  prompt: string;
  model?: string;
  additionalParams?: Record<string, any>;
}

/**
 * Submit media generation job to FAL gateway
 */
export async function submitMediaGeneration(
  params: GenerateMediaParams
): Promise<FalJobResponse> {
  console.log('🎬 Submitting media generation job:', params);
  
  const request: FalExecuteRequest = {
    provider: 'fal',
    media_type: params.mediaType as any,
    model: params.model,
    payload: {
      prompt: params.prompt,
      ...params.additionalParams,
    },
    dry_run: false,
  };

  console.log('📤 FAL Request:', request);

  return apiFetch<FalJobResponse>('/api/execute', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get status of a media generation job
 */
export async function getJobStatus(jobId: string): Promise<FalJobStatusResponse> {
  return apiFetch<FalJobStatusResponse>(
    `/api/status/${jobId}`,
    { method: 'GET' }
  );
}

/**
 * Poll job status until completion
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (status: FalJobStatusResponse) => void
): Promise<FalJobStatusResponse> {
  const maxAttempts = 180; // 6 minutes (2s interval)
  let attempts = 0;

  console.log(`🔄 Starting to poll job ${jobId}`);

  while (attempts < maxAttempts) {
    const status = await getJobStatus(jobId);

    console.log(`📊 Job ${jobId} status:`, status.job_status, `(attempt ${attempts + 1}/${maxAttempts})`);

    // Call progress callback
    if (onProgress) {
      onProgress(status);
    }

    // Check if completed or failed
    if (status.job_status === 'completed') {
      console.log(`✅ Job ${jobId} completed successfully`);
      return status;
    }

    if (status.job_status === 'failed') {
      console.error(`❌ Job ${jobId} failed:`, status.error);
      throw new Error(status.error || 'Media generation failed');
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  console.error(`⏱️ Job ${jobId} timed out after ${maxAttempts} attempts`);
  throw new Error('Media generation timed out after 6 minutes');
}

/**
 * Submit and wait for media generation (convenience function)
 */
export async function generateMedia(
  params: GenerateMediaParams,
  onProgress?: (status: FalJobStatusResponse) => void
): Promise<MediaResult> {
  console.log('🚀 Starting media generation:', params);
  
  // Submit job
  const jobResponse = await submitMediaGeneration(params);
  
  console.log('✅ Job submitted:', jobResponse.job_id);

  // Poll until complete
  const result = await pollJobStatus(jobResponse.job_id, onProgress);

  if (!result.result) {
    throw new Error('No result returned from media generation');
  }

  console.log('🎉 Media generation complete:', result.result.files.length, 'file(s)');

  return {
    files: result.result.files,
    usage: result.usage || { total: 0, estimated: true },
  };
}

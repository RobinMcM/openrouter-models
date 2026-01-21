// API client for fetching available models

import { apiFetch } from './client';
import type { ModelsResponse, ModelInfo, ModelsShowcaseResponse, ShowcaseModel } from '../types/api';

/**
 * Fetch available models from the API
 * Returns array of ModelInfo objects with id, name, and provider
 */
export async function getModels(): Promise<ModelInfo[]> {
  try {
    const response = await apiFetch<ModelsResponse | ModelInfo[]>('/api/models');

    // Handle array response
    if (Array.isArray(response)) {
      return response.map(model => {
        if (typeof model === 'string') {
          return { id: model, name: model, provider: 'Unknown' };
        }
        return model;
      });
    }

    // Handle object with models array
    if (response && typeof response === 'object') {
      const modelsArray = (response as ModelsResponse).models || (response as ModelsResponse).data;
      
      if (Array.isArray(modelsArray)) {
        return modelsArray.map(model => {
          if (typeof model === 'string') {
            return { id: model, name: model, provider: 'Unknown' };
          }
          return model;
        });
      }
    }

    console.warn('Unexpected models response format:', response);
    return [];
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

/**
 * Fetch detailed model showcase information
 * Returns a map of model ID to detailed model information
 */
export async function getModelsShowcase(): Promise<Map<string, ShowcaseModel>> {
  try {
    const response = await apiFetch<ModelsShowcaseResponse>('/api/models-showcase');
    const showcaseMap = new Map<string, ShowcaseModel>();

    // Flatten all categories and build a map by model ID
    Object.values(response.categories).forEach(category => {
      category.models.forEach(model => {
        showcaseMap.set(model.id, model);
      });
    });

    return showcaseMap;
  } catch (error) {
    console.error('Error fetching models showcase:', error);
    // Return empty map on error - showcase is optional
    return new Map();
  }
}

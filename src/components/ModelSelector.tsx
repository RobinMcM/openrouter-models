import { useState, useEffect } from 'react';
import { getModels, getModelsShowcase } from '../api/models';
import { getErrorMessage } from '../api/client';
import type { ModelInfo, ShowcaseModel } from '../types/api';

const STORAGE_KEY = 'openrouter-selected-model';

interface ModelSelectorProps {
  selectedModel: string | null;
  onModelChange: (model: string | null) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [showcase, setShowcase] = useState<Map<string, ShowcaseModel>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    setLoading(true);
    setError(null);

    try {
      const [modelsList, showcaseData] = await Promise.all([
        getModels(),
        getModelsShowcase()
      ]);
      
      setModels(modelsList);
      setShowcase(showcaseData);

      // Restore selected model from localStorage if available and valid
      if (!selectedModel) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && modelsList.some(m => m.id === stored)) {
          onModelChange(stored);
        }
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    onModelChange(value);
    
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Get selected model info and showcase data
  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const selectedShowcase = selectedModel ? showcase.get(selectedModel) : null;

  return (
    <div className="model-selector">
      <label htmlFor="model-select">
        <strong>Select Model:</strong>
      </label>
      
      <div className="model-selector-controls">
        <select
          id="model-select"
          value={selectedModel || ''}
          onChange={handleModelChange}
          disabled={loading || models.length === 0}
          className="model-dropdown"
        >
          <option value="">
            {loading ? 'Loading models...' : 'Select a model'}
          </option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} {model.provider ? `(${model.provider})` : ''}
            </option>
          ))}
        </select>

        <button
          onClick={loadModels}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          title="Refresh models list"
        >
          {loading ? '↻' : '🔄'} Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {!loading && models.length === 0 && !error && (
        <div className="warning-message">
          No models available. Please check your API configuration.
        </div>
      )}

      {/* Model Synopsis */}
      {selectedModelInfo && (
        <div className="model-synopsis">
          <div className="model-synopsis-header">
            <h4>{selectedModelInfo.name}</h4>
            {selectedModelInfo.provider && (
              <span className="model-provider">{selectedModelInfo.provider}</span>
            )}
          </div>

          {selectedShowcase ? (
            <div className="model-synopsis-content">
              {selectedShowcase.best_for && selectedShowcase.best_for.length > 0 && (
                <div className="synopsis-section">
                  <strong>Best For:</strong>
                  <ul>
                    {selectedShowcase.best_for.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedShowcase.strengths && selectedShowcase.strengths.length > 0 && (
                <div className="synopsis-section">
                  <strong>✅ Strengths:</strong>
                  <ul>
                    {selectedShowcase.strengths.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedShowcase.limitations && selectedShowcase.limitations.length > 0 && (
                <div className="synopsis-section">
                  <strong>⚠️ Limitations:</strong>
                  <ul>
                    {selectedShowcase.limitations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedShowcase.output_specs && (
                <div className="synopsis-section">
                  <strong>Output:</strong> {selectedShowcase.output_specs}
                </div>
              )}

              {selectedShowcase.estimated_cost && (
                <div className="synopsis-section synopsis-cost">
                  <strong>💰 Estimated Cost:</strong> {selectedShowcase.estimated_cost}
                </div>
              )}

              {selectedShowcase.use_cases && selectedShowcase.use_cases.length > 0 && (
                <div className="synopsis-section">
                  <strong>Use Cases:</strong>
                  <ul>
                    {selectedShowcase.use_cases.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="model-synopsis-content">
              <p className="synopsis-no-data">
                Model ID: <code>{selectedModelInfo.id}</code>
              </p>
              <p className="synopsis-hint">
                💡 Detailed information not available for this model
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ModelSelector } from './ModelSelector';
import { PromptPanel } from './PromptPanel';
import { ResponseViewer } from './ResponseViewer';
import { executePrompt } from '../api/execute';
import { getErrorMessage, isApiKeyConfigured } from '../api/client';
import type { ExecuteResponse } from '../types/api';

export function TestPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [rulesTemplate, setRulesTemplate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load rules template from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('openrouter-rules-template');
    if (stored) {
      setRulesTemplate(stored);
    }
  }, []);

  // Poll for rules changes (in case user edits on Rules page)
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('openrouter-rules-template');
      if (stored !== rulesTemplate) {
        setRulesTemplate(stored || '');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rulesTemplate]);

  const handleSend = async (prompt: string) => {
    console.log('🎯 handleSend called with prompt:', prompt);
    console.log('🎯 Selected model:', selectedModel);
    console.log('🎯 Rules template:', rulesTemplate);
    
    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    setIsSending(true);
    setError(null);
    setResponse(null);

    try {
      const result = await executePrompt({
        model: selectedModel,
        rulesTemplate,
        prompt,
      });

      setResponse(result);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      console.error('Error executing prompt:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isApiKeyConfigured()) {
    return (
      <div className="test-page">
        <div className="error-box">
          <h3>⚠️ API Key Required</h3>
          <p>
            Your session has no API key. Please refresh the page and enter your OpenRouter Gateway API key when prompted.
          </p>
        </div>
      </div>
    );
  }

  if (!rulesTemplate) {
    return (
      <div className="test-page">
        <div className="warning-box">
          <h3>⚠️ No Rules Template Defined</h3>
          <p>
            Please go to the <strong>Rules Template</strong> tab and define your rules before testing prompts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="test-page">
      <h2>Test Prompt</h2>

      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <PromptPanel
        rulesTemplate={rulesTemplate}
        selectedModel={selectedModel}
        onSend={handleSend}
        isSending={isSending}
      />

      <ResponseViewer response={response} error={error} />
    </div>
  );
}

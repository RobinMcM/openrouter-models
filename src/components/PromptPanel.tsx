import { useState, useEffect } from 'react';

interface PromptPanelProps {
  rulesTemplate: string;
  selectedModel: string | null;
  onSend: (prompt: string) => void;
  isSending: boolean;
}

export function PromptPanel({ rulesTemplate, selectedModel, onSend, isSending }: PromptPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Reset acceptance when rules change
  useEffect(() => {
    setRulesAccepted(false);
  }, [rulesTemplate]);

  const canSend = 
    rulesTemplate.trim().length > 0 &&
    rulesAccepted === true &&
    selectedModel !== null &&
    prompt.trim().length > 0 &&
    !isSending;

  const handleSend = () => {
    console.log('🔘 Send button clicked');
    console.log('🔘 canSend:', canSend);
    console.log('🔘 Validation:', {
      rulesTemplate: rulesTemplate.trim().length > 0,
      rulesAccepted,
      selectedModel: selectedModel !== null,
      prompt: prompt.trim().length > 0,
      isSending,
    });
    
    if (canSend) {
      console.log('🔘 Calling onSend with prompt:', prompt);
      onSend(prompt);
    } else {
      console.log('🔘 Cannot send - validation failed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSend) {
      handleSend();
    }
  };

  return (
    <div className="prompt-panel">
      <h3>Your Prompt</h3>

      {rulesTemplate && (
        <div className="rules-preview">
          <button
            onClick={() => setShowRules(!showRules)}
            className="rules-toggle"
          >
            {showRules ? '▼' : '▶'} Current Rules Template ({rulesTemplate.length} chars)
          </button>
          
          {showRules && (
            <pre className="rules-preview-content">{rulesTemplate}</pre>
          )}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt here..."
        className="prompt-textarea"
        rows={8}
        disabled={isSending}
      />

      <div className="prompt-footer">
        <div className="prompt-validation">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              disabled={!rulesTemplate || isSending}
            />
            <span>I confirm these rules will be applied to my prompt</span>
          </label>

          <div className="validation-status">
            <ValidationItem
              label="Rules template defined"
              satisfied={rulesTemplate.trim().length > 0}
            />
            <ValidationItem
              label="Rules accepted"
              satisfied={rulesAccepted}
            />
            <ValidationItem
              label="Model selected"
              satisfied={selectedModel !== null}
            />
            <ValidationItem
              label="Prompt entered"
              satisfied={prompt.trim().length > 0}
            />
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="btn btn-primary btn-large"
        >
          {isSending ? '⏳ Sending...' : '🚀 Send Prompt'}
        </button>
      </div>

      <div className="prompt-hint">
        💡 Tip: Press Ctrl+Enter (or Cmd+Enter) to send
      </div>
    </div>
  );
}

interface ValidationItemProps {
  label: string;
  satisfied: boolean;
}

function ValidationItem({ label, satisfied }: ValidationItemProps) {
  return (
    <div className={`validation-item ${satisfied ? 'satisfied' : 'unsatisfied'}`}>
      <span className="validation-icon">{satisfied ? '✓' : '○'}</span>
      <span className="validation-label">{label}</span>
    </div>
  );
}

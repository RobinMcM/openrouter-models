import { useState, useEffect } from 'react';

const STORAGE_KEY = 'openrouter-rules-template';

export function RulesPage() {
  const [rules, setRules] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load rules from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRules(stored);
      // Try to get last saved time
      const savedTime = localStorage.getItem(`${STORAGE_KEY}-time`);
      if (savedTime) {
        setLastSaved(new Date(savedTime));
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(STORAGE_KEY, rules);
    const now = new Date();
    localStorage.setItem(`${STORAGE_KEY}-time`, now.toISOString());
    setLastSaved(now);
    
    // Reset rules acceptance when template changes
    localStorage.setItem('openrouter-rules-accepted', 'false');
    
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the rules template?')) {
      setRules('');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}-time`);
      localStorage.setItem('openrouter-rules-accepted', 'false');
      setLastSaved(null);
    }
  };

  const charCount = rules.length;

  return (
    <div className="rules-page">
      <h2>Rules Template</h2>
      <p className="description">
        Define the rules or system instructions that will be prepended to every prompt.
        These rules help guide the AI's behavior and responses.
      </p>

      <textarea
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        placeholder="Enter your rules template here... (e.g., 'You are a helpful assistant that always responds concisely.')"
        className="rules-textarea"
        rows={15}
      />

      <div className="rules-footer">
        <div className="rules-info">
          <span className="char-count">{charCount} characters</span>
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleString()}
            </span>
          )}
        </div>

        <div className="rules-actions">
          <button
            onClick={handleClear}
            className="btn btn-secondary"
            disabled={!rules}
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className={`btn btn-primary ${isSaving ? 'saving' : ''}`}
            disabled={!rules}
          >
            {isSaving ? 'Saved!' : 'Save Template'}
          </button>
        </div>
      </div>

      {!rules && (
        <div className="warning-box">
          ⚠️ You must define a rules template before you can send prompts on the Test page.
        </div>
      )}
    </div>
  );
}

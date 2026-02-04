import { useState } from 'react';
import type { FormEvent } from 'react';
import { setApiKey } from '../api/keyStore';

type Props = {
  onUnlock: () => void;
};

export function Gatekeeper({ onUnlock }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please enter your API key.');
      return;
    }
    setApiKey(trimmed);
    onUnlock();
  };

  return (
    <div className="gatekeeper">
      <div className="gatekeeper-card">
        <h1 className="gatekeeper-title">🔐 OpenRouter Test UI</h1>
        <p className="gatekeeper-subtitle">
          Enter your OpenRouter Gateway API key to continue. The key is not stored in the browser beyond this session.
        </p>
        <form onSubmit={handleSubmit} className="gatekeeper-form">
          <label htmlFor="gatekeeper-key" className="gatekeeper-label">
            API key
          </label>
          <input
            id="gatekeeper-key"
            type="password"
            autoComplete="off"
            className="gatekeeper-input"
            placeholder="Paste your gateway API key"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            autoFocus
          />
          {error && <p className="gatekeeper-error">{error}</p>}
          <button type="submit" className="gatekeeper-submit">
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}

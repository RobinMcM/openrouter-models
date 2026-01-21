import type { ExecuteResponse } from '../types/api';

interface ResponseViewerProps {
  response: ExecuteResponse | null;
  error: string | null;
}

export function ResponseViewer({ response, error }: ResponseViewerProps) {
  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    }
  };

  if (error) {
    return (
      <div className="response-viewer">
        <h3>Error</h3>
        <div className="error-box">
          <strong>❌ Request Failed</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-viewer">
        <h3>Response</h3>
        <div className="empty-state">
          No response yet. Send a prompt to see the result here.
        </div>
      </div>
    );
  }

  // Extract the assistant's message content
  const assistantMessage = response.result?.choices?.[0]?.message?.content;

  return (
    <div className="response-viewer">
      <div className="response-header">
        <h3>Response</h3>
        <button onClick={handleCopy} className="btn btn-secondary btn-sm" title="Copy full response">
          📋 Copy JSON
        </button>
      </div>

      {assistantMessage && (
        <div className="response-message">
          <h4>Assistant Message:</h4>
          <div className="message-content">{assistantMessage}</div>
        </div>
      )}

      {response.usage && (
        <div className="response-usage">
          <h4>Usage & Cost:</h4>
          <div className="usage-grid">
            {response.usage.input_tokens !== undefined && (
              <div className="usage-item">
                <span className="usage-label">Input Tokens:</span>
                <span className="usage-value">{response.usage.input_tokens}</span>
              </div>
            )}
            {response.usage.output_tokens !== undefined && (
              <div className="usage-item">
                <span className="usage-label">Output Tokens:</span>
                <span className="usage-value">{response.usage.output_tokens}</span>
              </div>
            )}
            {response.usage.total_tokens !== undefined && (
              <div className="usage-item">
                <span className="usage-label">Total Tokens:</span>
                <span className="usage-value">{response.usage.total_tokens}</span>
              </div>
            )}
            {response.usage.input_cost !== undefined && (
              <div className="usage-item">
                <span className="usage-label">Input Cost:</span>
                <span className="usage-value">${response.usage.input_cost.toFixed(6)}</span>
              </div>
            )}
            {response.usage.output_cost !== undefined && (
              <div className="usage-item">
                <span className="usage-label">Output Cost:</span>
                <span className="usage-value">${response.usage.output_cost.toFixed(6)}</span>
              </div>
            )}
            {response.usage.total_cost !== undefined && (
              <div className="usage-item total">
                <span className="usage-label">Total Cost:</span>
                <span className="usage-value">${response.usage.total_cost.toFixed(6)}</span>
              </div>
            )}
            {response.usage.estimated && (
              <div className="usage-note">
                ℹ️ Cost values are estimated
              </div>
            )}
          </div>
        </div>
      )}

      <div className="response-routing">
        <h4>Routing Information:</h4>
        <div className="routing-info">
          {response.routing.provider && (
            <div><strong>Provider:</strong> {response.routing.provider}</div>
          )}
          {response.routing.model && (
            <div><strong>Model:</strong> {response.routing.model}</div>
          )}
          {response.routing.endpoint && (
            <div><strong>Endpoint:</strong> {response.routing.endpoint}</div>
          )}
        </div>
      </div>

      <details className="response-raw">
        <summary>Full Response (JSON)</summary>
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </details>
    </div>
  );
}

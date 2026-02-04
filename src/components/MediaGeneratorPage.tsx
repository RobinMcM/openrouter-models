import { useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { executePrompt } from '../api/execute';
import { generateMedia } from '../api/fal';
import { getErrorMessage } from '../api/client';
import type { MediaResult, FalJobStatusResponse } from '../types/api';

interface PromptEnhancementState {
  input: string;
  model: string | null;
  isGenerating: boolean;
  enhancedPrompt: string;
  error: string | null;
}

interface MediaGenerationState {
  prompt: string;
  mediaType: 'image' | 'image-hd' | 'video' | 'audio';
  isGenerating: boolean;
  jobId: string | null;
  status: 'idle' | 'submitting' | 'polling' | 'completed' | 'failed';
  result: MediaResult | null;
  error: string | null;
  pollCount: number;
}

// Media type configuration
const MEDIA_TYPES = {
  image: {
    label: '🖼️ Image (Fast)',
    key: 'image-generation',
    model: 'fal-ai/flux/schnell',
    params: { image_size: 'square_hd' },
  },
  'image-hd': {
    label: '🎨 HD Image (High Quality)',
    key: 'image-generation-hd',
    model: 'fal-ai/flux-pro',
    params: { image_size: 'landscape_16_9' },
  },
  video: {
    label: '🎬 Video (Luma Ray 2 Flash)',
    key: 'video-generation',
    model: 'fal-ai/luma-dream-machine/ray-2-flash',
    params: { aspect_ratio: '16:9' },
  },
  audio: {
    label: '🎵 Audio/Music',
    key: 'audio-generation',
    model: 'fal-ai/stable-audio',
    params: { duration: 30 },
  },
} as const;

export function MediaGeneratorPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  const [stage1, setStage1] = useState<PromptEnhancementState>({
    input: '',
    model: null,
    isGenerating: false,
    enhancedPrompt: '',
    error: null,
  });

  const [stage2, setStage2] = useState<MediaGenerationState>({
    prompt: '',
    mediaType: 'image',
    isGenerating: false,
    jobId: null,
    status: 'idle',
    result: null,
    error: null,
    pollCount: 0,
  });

  const handleGeneratePrompt = async () => {
    if (!stage1.input.trim()) {
      setStage1(prev => ({ ...prev, error: 'Please enter your prompt' }));
      return;
    }

    if (!selectedModel) {
      setStage1(prev => ({ ...prev, error: 'Please select a model' }));
      return;
    }

    setStage1(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Send with enhancement instructions prepended
      const result = await executePrompt({
        model: selectedModel,
        rulesTemplate: 'You are an expert prompt engineer for AI media generation. Enhance the following idea into a detailed, vivid prompt suitable for creating images, videos, or audio. Focus on visual details, mood, atmosphere, style, composition, lighting, and artistic direction. Be specific and descriptive. Return ONLY the enhanced prompt, nothing else.',
        prompt: stage1.input,
      });

      console.log('🔍 FULL API RESULT:', result);
      console.log('🔍 result.result:', result.result);
      console.log('🔍 result.result?.choices:', result.result?.choices);
      console.log('🔍 result.result?.choices?.[0]:', result.result?.choices?.[0]);
      console.log('🔍 result.result?.choices?.[0]?.message:', result.result?.choices?.[0]?.message);
      console.log('🔍 result.result?.choices?.[0]?.message?.content:', result.result?.choices?.[0]?.message?.content);

      // Extract the response content (just like TestPage/ResponseViewer does)
      const enhancedPrompt = result.result?.choices?.[0]?.message?.content || '';

      console.log('🔍 Extracted prompt:', enhancedPrompt);
      console.log('🔍 Prompt length:', enhancedPrompt.length);

      if (!enhancedPrompt) {
        console.error('❌ NO CONTENT! Full response:', JSON.stringify(result, null, 2));
        setStage1(prev => ({
          ...prev,
          error: 'No content received from API. Check console for details.',
          isGenerating: false,
        }));
        return;
      }

      console.log('✅ SUCCESS! Putting response in second box');
      // Put the response in the Enhanced Prompt box
      setStage1(prev => ({ ...prev, isGenerating: false, error: null }));
      setStage2(prev => ({ ...prev, prompt: enhancedPrompt }));

    } catch (err) {
      console.error('❌ ERROR:', err);
      setStage1(prev => ({
        ...prev,
        error: getErrorMessage(err),
        isGenerating: false,
      }));
    }
  };

  const handleClearAll = () => {
    setStage1({
      input: '',
      model: null,
      isGenerating: false,
      enhancedPrompt: '',
      error: null,
    });
    setStage2({
      prompt: '',
      mediaType: 'image',
      isGenerating: false,
      jobId: null,
      status: 'idle',
      result: null,
      error: null,
      pollCount: 0,
    });
    setSelectedModel(null);
  };

  const handleGenerateMedia = async () => {
    if (!stage2.prompt.trim()) {
      setStage2(prev => ({ ...prev, error: 'Please generate or enter a prompt' }));
      return;
    }

    setStage2(prev => ({
      ...prev,
      isGenerating: true,
      status: 'submitting',
      error: null,
      result: null,
      pollCount: 0,
    }));

    try {
      const mediaConfig = MEDIA_TYPES[stage2.mediaType];
      
      const result = await generateMedia(
        {
          mediaType: mediaConfig.key,
          prompt: stage2.prompt,
          model: mediaConfig.model,
          additionalParams: mediaConfig.params,
        },
        (status: FalJobStatusResponse) => {
          // Progress callback
          setStage2(prev => ({
            ...prev,
            status: 'polling',
            jobId: status.job_id,
            pollCount: prev.pollCount + 1,
          }));
        }
      );

      setStage2(prev => ({
        ...prev,
        status: 'completed',
        result,
        isGenerating: false,
      }));

    } catch (err) {
      setStage2(prev => ({
        ...prev,
        status: 'failed',
        error: getErrorMessage(err),
        isGenerating: false,
      }));
    }
  };

  return (
    <div className="test-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Media Generator</h2>
        <button
          onClick={handleClearAll}
          className="btn btn-secondary"
          disabled={stage1.isGenerating || stage2.isGenerating}
        >
          🗑️ Clear All
        </button>
      </div>

      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      {/* Stage 1: Prompt Input Panel */}
      <div className="prompt-panel">
        <h3>Your Prompt</h3>
        
        <textarea
          value={stage1.input}
          onChange={(e) => setStage1(prev => ({ ...prev, input: e.target.value }))}
          placeholder="Enter your prompt here..."
          className="prompt-textarea"
          rows={6}
          disabled={stage1.isGenerating}
        />

        <div className="prompt-footer">
          <div className="prompt-validation">
            <div className="validation-status">
              <ValidationItem
                label="Model selected"
                satisfied={selectedModel !== null}
              />
              <ValidationItem
                label="Prompt entered"
                satisfied={stage1.input.trim().length > 0}
              />
            </div>
          </div>

          <button
            onClick={handleGeneratePrompt}
            disabled={stage1.isGenerating || !stage1.input.trim() || !selectedModel}
            className="btn btn-primary btn-large"
          >
            {stage1.isGenerating ? '⏳ Sending...' : '🚀 Send Prompt'}
          </button>
        </div>

        {stage1.error && (
          <div className="error-message">
            ❌ {stage1.error}
          </div>
        )}

        <div className="prompt-hint">
          💡 Tip: The response will appear in the box below
        </div>
      </div>

      {/* Stage 2: Response & Media Generation Panel */}
      <div className="prompt-panel">
        <h3>Response / Media Prompt</h3>
        <div style={{ 
          background: '#f0f7ff', 
          border: '1px solid #d0e7ff',
          borderRadius: '8px', 
          padding: '12px 16px', 
          marginBottom: '16px',
          fontSize: '14px',
          color: '#1565c0'
        }}>
          <strong>🎬 Media Generation:</strong> Use this prompt to create images, videos, or audio for films, 
          presentations, music videos, or creative projects. Select your media type below and generate 
          professional-quality content powered by AI.
        </div>
        
        <textarea
          value={stage2.prompt}
          onChange={(e) => setStage2(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="Response will appear here... (or enter your own prompt for media generation)"
          className="prompt-textarea"
          rows={8}
          disabled={stage2.isGenerating}
        />

        <div className="media-type-selector-row">
          <label htmlFor="media-type">
            <strong>Media Type:</strong>
          </label>
          <select
            id="media-type"
            value={stage2.mediaType}
            onChange={(e) => setStage2(prev => ({ ...prev, mediaType: e.target.value as any }))}
            disabled={stage2.isGenerating}
            className="media-type-dropdown"
          >
            {Object.entries(MEDIA_TYPES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <div className="prompt-footer">
          <div className="prompt-validation">
            <div className="validation-status">
              <ValidationItem
                label="Prompt ready"
                satisfied={stage2.prompt.trim().length > 0}
              />
              <ValidationItem
                label="Media type selected"
                satisfied={true}
              />
            </div>
          </div>

          <button
            onClick={handleGenerateMedia}
            disabled={stage2.isGenerating || !stage2.prompt.trim()}
            className="btn btn-primary btn-large"
          >
            {stage2.isGenerating ? '⏳ Generating...' : '🎬 Generate Media'}
          </button>
        </div>

        {/* Status indicators */}
        {stage2.status === 'submitting' && (
          <div className="info-message">
            ⏳ Submitting job to FAL gateway...
          </div>
        )}

        {stage2.status === 'polling' && (
          <div className="info-message">
            ⏳ Generating media... (check #{stage2.pollCount}, job: {stage2.jobId?.substring(0, 8)}...)
          </div>
        )}

        {stage2.error && (
          <div className="error-message">
            ❌ {stage2.error}
          </div>
        )}

        <div className="prompt-hint">
          💡 Tip: You can edit the response before generating media
        </div>
      </div>

      {/* Media Preview */}
      {stage2.result && stage2.status === 'completed' && (
        <MediaPreview result={stage2.result} />
      )}
    </div>
  );
}

// Validation Item Component (matching TestPage style)
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

// Media Preview Component (styled like ResponseViewer)
function MediaPreview({ result }: { result: MediaResult }) {
  const file = result.files[0];

  if (!file) {
    return (
      <div className="response-viewer">
        <h3>Generated Media</h3>
        <div className="error-box">
          <p>No media file generated</p>
        </div>
      </div>
    );
  }

  const isImage = file.content_type.startsWith('image/');
  const isVideo = file.content_type.startsWith('video/');
  const isAudio = file.content_type.startsWith('audio/');

  return (
    <div className="response-viewer">
      <h3>✨ Generated Media</h3>

      <div className="response-content">
        <div className="media-container">
          {isImage && (
            <img
              src={file.url}
              alt="Generated"
              style={{
                maxWidth: '100%',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'block',
                margin: '0 auto',
              }}
            />
          )}

          {isVideo && (
            <video
              src={file.url}
              controls
              style={{
                maxWidth: '100%',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'block',
                margin: '0 auto',
              }}
            />
          )}

          {isAudio && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
              <audio src={file.url} controls style={{ width: '100%', maxWidth: '600px' }} />
            </div>
          )}
        </div>

        <div className="media-info-panel">
          <div className="media-details">
            <strong>File Type:</strong> {file.content_type}
            {file.width && file.height && (
              <span style={{ marginLeft: '20px' }}>
                <strong>Dimensions:</strong> {file.width} × {file.height}
              </span>
            )}
          </div>
          <div className="media-cost">
            <strong>Cost:</strong> ${result.usage.total.toFixed(4)} {result.usage.estimated && '(estimated)'}
          </div>
          <div className="media-download">
            <a
              href={file.url}
              download
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

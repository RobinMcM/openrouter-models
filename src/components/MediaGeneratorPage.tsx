import { useState, useRef, useEffect } from 'react';
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

interface MediaOption {
  id: string;
  label: string;
  key: string;
  model: string;
  params: Record<string, unknown>;
}

interface MediaGenerationState {
  prompt: string;
  mediaOptionId: string;
  isGenerating: boolean;
  jobId: string | null;
  status: 'idle' | 'submitting' | 'polling' | 'completed' | 'failed';
  result: MediaResult | null;
  error: string | null;
  pollCount: number;
}

const NOT_SPECIFIED = 'Not specified';

// Film context dropdown options (hardcoded for film media prompts).
const FILM_SHOT_TYPE_OPTIONS = [
  NOT_SPECIFIED,
  'Extreme close-up',
  'Close-up',
  'Medium close-up',
  'Medium shot',
  'Medium wide',
  'Wide shot',
  'Extreme wide / Establishing',
];

const FOCUS_OPTIONS = [
  NOT_SPECIFIED,
  'Left looking left',
  'Left looking right',
  'Right looking left',
  'Right looking right',
  'Center looking left',
  'Center looking right',
  'Center facing camera',
];

const SHOT_TYPE_OPTIONS = [
  NOT_SPECIFIED,
  'Over the shoulder',
  'Two-shot',
  'Single',
  'POV',
  'Dutch angle',
  'Low angle',
  'High angle',
];

const WEATHER_OPTIONS = [
  NOT_SPECIFIED,
  'Sunny/Clear',
  'Cloudy',
  'Overcast',
  'Rainy',
  'Foggy',
  'Stormy',
];

const DAY_TIME_OPTIONS = [
  NOT_SPECIFIED,
  'Dawn',
  'Morning',
  'Midday/Noon',
  'Afternoon',
  'Golden hour',
  'Dusk',
  'Night',
  'Midnight',
];

// Industry-standard film genres.
const FILM_GENRE_OPTIONS = [
  NOT_SPECIFIED,
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Thriller',
  'Sci-Fi',
  'Fantasy',
  'Romance',
  'Mystery',
  'Documentary',
  'Animation',
  'Musical',
  'Western',
  'Film noir',
  'Crime',
];

// Visual style / type (industry-standard).
const STYLE_OPTIONS = [
  NOT_SPECIFIED,
  'Live action',
  'Cartoon / Animated',
  'Anime',
  'Gothic',
  'Noir',
  'Realistic',
  'Stylized',
  'Vintage / Retro',
  'Cinematic',
  'Documentary style',
  'Fantasy art',
  'Comic book style',
];

// All media options (gateway media_type + allowed models). Image-to-video is in a separate dropdown below the result.
const MEDIA_OPTIONS: MediaOption[] = [
  { id: 'image-schnell', label: '🖼️ Image (FLUX Schnell)', key: 'image-generation', model: 'fal-ai/flux/schnell', params: { image_size: 'square_hd' } },
  { id: 'image-dev', label: '🖼️ Image (FLUX Dev)', key: 'image-generation', model: 'fal-ai/flux/dev', params: { image_size: 'square_hd' } },
  { id: 'image-realism', label: '🖼️ Image (FLUX Realism)', key: 'image-generation', model: 'fal-ai/flux-realism', params: { image_size: 'square_hd' } },
  { id: 'image-hd', label: '🎨 HD Image (FLUX Pro)', key: 'image-generation-hd', model: 'fal-ai/flux-pro', params: { image_size: 'landscape_16_9' } },
  { id: 'video-luma-flash', label: '🎬 Video (Luma Ray 2 Flash)', key: 'video-generation', model: 'fal-ai/luma-dream-machine/ray-2-flash', params: { aspect_ratio: '16:9' } },
  { id: 'video-luma', label: '🎬 Video (Luma Ray 2)', key: 'video-generation', model: 'fal-ai/luma-dream-machine/ray-2', params: { aspect_ratio: '16:9' } },
  { id: 'video-kling', label: '🎬 Video (Kling Text-to-Video)', key: 'video-generation', model: 'fal-ai/kling-video/v1/standard/text-to-video', params: { duration: 5 } },
  { id: 'audio', label: '🎵 Audio (Stable Audio)', key: 'audio-generation', model: 'fal-ai/stable-audio', params: { duration: 30 } },
];

// Image-to-video options: shown below placeholder #8.
const IMAGE_TO_VIDEO_OPTIONS: MediaOption[] = [
  { id: 'image-to-video-kling', label: '🎞️ Image to Video (Kling)', key: 'image-to-video', model: 'fal-ai/kling-video/v1/standard/image-to-video', params: { duration: 5 } },
  { id: 'image-to-video-runway', label: '🎞️ Image to Video (Runway Gen3)', key: 'image-to-video', model: 'fal-ai/runway-gen3/turbo/image-to-video', params: { duration: 5 } },
];

// Reference "original screen dimension" (4:3) in pixels. All viewing panes are computed from this.
const REFERENCE_WIDTH = 640;
const REFERENCE_HEIGHT = 480;

// API aspect ratio presets and their nominal dimensions. View pane is scaled from these to fit the reference.
const PRESET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  square_hd: { width: 1024, height: 1024 },
  square: { width: 512, height: 512 },
  portrait_4_3: { width: 896, height: 1152 },
  portrait_16_9: { width: 768, height: 1344 },
  landscape_4_3: { width: 1152, height: 896 },
  landscape_16_9: { width: 1344, height: 768 },
};

const DEFAULT_ASPECT_RATIO = 'landscape_4_3';
const ASPECT_RATIO_OPTIONS: { value: string; label: string }[] = [
  { value: 'landscape_4_3', label: '4:3 Landscape (1152×896)' },
  { value: 'landscape_16_9', label: '16:9 Landscape (1344×768)' },
  { value: 'portrait_4_3', label: '4:3 Portrait (896×1152)' },
  { value: 'portrait_16_9', label: '16:9 Portrait / Mobile (768×1344)' },
  { value: 'square_hd', label: 'Square HD (1024×1024)' },
  { value: 'square', label: 'Square (512×512)' },
];

function getAspectRatioParams(presetId: string): { image_size?: string; aspect_ratio?: string } {
  const result: { image_size?: string; aspect_ratio?: string } = { image_size: presetId };
  const presetToVideoRatio: Record<string, string> = {
    landscape_4_3: '4:3',
    landscape_16_9: '16:9',
    portrait_4_3: '3:4',
    portrait_16_9: '9:16',
    square_hd: '1:1',
    square: '1:1',
  };
  if (presetToVideoRatio[presetId]) {
    result.aspect_ratio = presetToVideoRatio[presetId];
  }
  return result;
}

/**
 * Viewing pane dimensions in pixels: scale the API preset dimensions to fit inside the reference box.
 */
function getViewingPanePixels(
  presetId: string,
  refW: number,
  refH: number
): { width: number; height: number } {
  const dims = PRESET_DIMENSIONS[presetId] ?? PRESET_DIMENSIONS.landscape_4_3;
  const scale = Math.min(refW / dims.width, refH / dims.height);
  return {
    width: Math.round(dims.width * scale),
    height: Math.round(dims.height * scale),
  };
}

/** Extract last frame from a video URL via canvas; returns data URL (image/png). */
function extractLastFrameFromVideo(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.onloadeddata = () => {
      video.currentTime = Math.max(0, video.duration - 0.1);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2d not available'));
          return;
        }
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        video.remove();
        resolve(dataUrl);
      } catch (e) {
        video.remove();
        reject(e);
      }
    };
    video.onerror = () => {
      video.remove();
      reject(new Error('Failed to load video for frame extraction'));
    };
    video.src = videoUrl;
  });
}

const INITIAL_FILM_CONTEXT = {
  filmShotType: NOT_SPECIFIED,
  focus: NOT_SPECIFIED,
  shotType: NOT_SPECIFIED,
  weather: NOT_SPECIFIED,
  dayTime: NOT_SPECIFIED,
  genre: NOT_SPECIFIED,
  style: NOT_SPECIFIED,
};

export function MediaGeneratorPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [filmContext, setFilmContext] = useState(INITIAL_FILM_CONTEXT);
  const [selectedImageToVideoId, setSelectedImageToVideoId] = useState(IMAGE_TO_VIDEO_OPTIONS[0].id);
  const [isConvertingToVideo, setIsConvertingToVideo] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [convertedVideoResult, setConvertedVideoResult] = useState<MediaResult | null>(null);
  const [placeholderScale, setPlaceholderScale] = useState(1);
  const placeholderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = placeholderContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setPlaceholderScale(Math.min(1, w / REFERENCE_WIDTH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [stage1, setStage1] = useState<PromptEnhancementState>({
    input: '',
    model: null,
    isGenerating: false,
    enhancedPrompt: '',
    error: null,
  });

  const [stage2, setStage2] = useState<MediaGenerationState>({
    prompt: '',
    mediaOptionId: MEDIA_OPTIONS[0].id,
    isGenerating: false,
    jobId: null,
    status: 'idle',
    result: null,
    error: null,
    pollCount: 0,
  });

  const viewingPanePixels = getViewingPanePixels(aspectRatio, REFERENCE_WIDTH, REFERENCE_HEIGHT);

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
      // Build definitive list of selected film specs (omit "Not specified")
      const specs: string[] = [];
      if (filmContext.filmShotType !== NOT_SPECIFIED) specs.push(`Film shot type: ${filmContext.filmShotType}`);
      if (filmContext.focus !== NOT_SPECIFIED) specs.push(`Focus (subject position/eyeline): ${filmContext.focus}`);
      if (filmContext.shotType !== NOT_SPECIFIED) specs.push(`Shot type: ${filmContext.shotType}`);
      if (filmContext.weather !== NOT_SPECIFIED) specs.push(`Weather: ${filmContext.weather}`);
      if (filmContext.dayTime !== NOT_SPECIFIED) specs.push(`Time of day: ${filmContext.dayTime}`);
      if (filmContext.genre !== NOT_SPECIFIED) specs.push(`Genre: ${filmContext.genre}`);
      if (filmContext.style !== NOT_SPECIFIED) specs.push(`Visual style: ${filmContext.style}`);

      // Definitive rule: integrate dropdown choices into one amazing, production-ready prompt
      const rulesTemplate = specs.length > 0
        ? `You are an expert prompt engineer for film and AI media generation. Your task is to create a single, definitive prompt that will be used to generate images or video. The prompt must be vivid, cinematic, specific, and production-ready—something that would produce stunning, professional results.

You MUST incorporate these specifications. Weave them naturally and decisively into one cohesive prompt:
${specs.map(s => `- ${s}`).join('\n')}

The user will provide their creative idea or scene in the next message. Use it as the creative core and combine it with the specifications above into one flowing, amazing prompt. Focus on visual detail, composition, lighting, mood, and atmosphere. Output ONLY the final enhanced prompt—no preamble, no explanation.`
        : `You are an expert prompt engineer for film and AI media generation. Create a single, definitive, production-ready prompt for AI image or video generation from the user's idea. The prompt must be vivid, cinematic, specific, and stunning. Focus on visual detail, composition, lighting, mood, and atmosphere. Output ONLY the final enhanced prompt—no preamble, no explanation.`;

      const result = await executePrompt({
        model: selectedModel,
        rulesTemplate,
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
      mediaOptionId: MEDIA_OPTIONS[0].id,
      isGenerating: false,
      jobId: null,
      status: 'idle',
      result: null,
      error: null,
      pollCount: 0,
    });
    setSelectedModel(null);
    setFilmContext(INITIAL_FILM_CONTEXT);
    setSelectedImageToVideoId(IMAGE_TO_VIDEO_OPTIONS[0].id);
    setIsConvertingToVideo(false);
    setAspectRatio(DEFAULT_ASPECT_RATIO);
    setConvertedVideoResult(null);
  };

  const handleConvertToVideo = async () => {
    if (!stage2.result?.files?.[0]) return;
    const file = stage2.result.files[0];
    const isImage = file.content_type.startsWith('image/');
    const isVideo = file.content_type.startsWith('video/');
    if (!isImage && !isVideo) return;
    const config = IMAGE_TO_VIDEO_OPTIONS.find(o => o.id === selectedImageToVideoId) ?? IMAGE_TO_VIDEO_OPTIONS[0];
    setIsConvertingToVideo(true);
    setStage2(prev => ({ ...prev, error: null }));
    try {
      let imageUrl: string;
      if (isImage) {
        imageUrl = file.url;
      } else {
        imageUrl = await extractLastFrameFromVideo(file.url);
      }
      const result = await generateMedia(
        {
          mediaType: config.key,
          prompt: stage2.prompt,
          model: config.model,
          additionalParams: { ...config.params, image_url: imageUrl },
        },
        () => {}
      );
      setConvertedVideoResult(result);
    } catch (err) {
      setStage2(prev => ({ ...prev, error: getErrorMessage(err) }));
    } finally {
      setIsConvertingToVideo(false);
    }
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
    setConvertedVideoResult(null);

    try {
      const mediaConfig = MEDIA_OPTIONS.find(o => o.id === stage2.mediaOptionId) ?? MEDIA_OPTIONS[0];
      const ratioParams = getAspectRatioParams(aspectRatio);
      const additionalParams = { ...mediaConfig.params, ...ratioParams };

      const result = await generateMedia(
        {
          mediaType: mediaConfig.key,
          prompt: stage2.prompt,
          model: mediaConfig.model,
          additionalParams,
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
          disabled={stage1.isGenerating || stage2.isGenerating || isConvertingToVideo}
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

        <div className="film-context-controls">
          <div className="model-selector">
            <label htmlFor="film-shot-type"><strong>Shot:</strong></label>
            <div className="model-selector-controls">
              <select
                id="film-shot-type"
                value={filmContext.filmShotType}
                onChange={(e) => setFilmContext(prev => ({ ...prev, filmShotType: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {FILM_SHOT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="model-selector">
            <label htmlFor="focus"><strong>Focus:</strong></label>
            <div className="model-selector-controls">
              <select
                id="focus"
                value={filmContext.focus}
                onChange={(e) => setFilmContext(prev => ({ ...prev, focus: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {FOCUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="model-selector">
            <label htmlFor="shot-type"><strong>Angle:</strong></label>
            <div className="model-selector-controls">
              <select
                id="shot-type"
                value={filmContext.shotType}
                onChange={(e) => setFilmContext(prev => ({ ...prev, shotType: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {SHOT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="model-selector">
            <label htmlFor="weather"><strong>Weather:</strong></label>
            <div className="model-selector-controls">
              <select
                id="weather"
                value={filmContext.weather}
                onChange={(e) => setFilmContext(prev => ({ ...prev, weather: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {WEATHER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="model-selector">
            <label htmlFor="day-time"><strong>Day:</strong></label>
            <div className="model-selector-controls">
              <select
                id="day-time"
                value={filmContext.dayTime}
                onChange={(e) => setFilmContext(prev => ({ ...prev, dayTime: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {DAY_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="model-selector">
            <label htmlFor="film-genre"><strong>Genre:</strong></label>
            <div className="model-selector-controls">
              <select
                id="film-genre"
                value={filmContext.genre}
                onChange={(e) => setFilmContext(prev => ({ ...prev, genre: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {FILM_GENRE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="model-selector">
            <label htmlFor="style"><strong>Style:</strong></label>
            <div className="model-selector-controls">
              <select
                id="style"
                value={filmContext.style}
                onChange={(e) => setFilmContext(prev => ({ ...prev, style: e.target.value }))}
                disabled={stage1.isGenerating}
                className="model-dropdown"
              >
                {STYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

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

        <div className="model-selector">
          <label htmlFor="media-type">
            <strong>Media Type:</strong>
          </label>
          <div className="model-selector-controls">
            <select
              id="media-type"
              value={stage2.mediaOptionId}
              onChange={(e) => setStage2(prev => ({ ...prev, mediaOptionId: e.target.value }))}
              disabled={stage2.isGenerating}
              className="model-dropdown"
            >
              {MEDIA_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="model-selector">
          <label htmlFor="aspect-ratio">
            <strong>Aspect Ratio:</strong>
          </label>
          <div className="model-selector-controls">
            <select
              id="aspect-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={stage2.isGenerating}
              className="model-dropdown"
            >
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
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

      {/* 8. Placeholder for image or video - fixed pixel reference 640×480, inner pane in pixels */}
      <div className="prompt-panel" ref={placeholderContainerRef} style={{ marginTop: '16px' }}>
        <h3>Generated image or video</h3>
        <div
          style={{
            width: REFERENCE_WIDTH * placeholderScale,
            height: REFERENCE_HEIGHT * placeholderScale,
            overflow: 'hidden',
          }}
        >
          <div
            className="media-placeholder media-placeholder-outer"
            style={{
              width: REFERENCE_WIDTH,
              height: REFERENCE_HEIGHT,
              transform: `scale(${placeholderScale})`,
              transformOrigin: '0 0',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="media-placeholder-inner"
              style={{
                width: viewingPanePixels.width,
                height: viewingPanePixels.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {stage2.result && stage2.status === 'completed' ? (
                <MediaPlaceholderContent result={stage2.result} />
              ) : (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Generate media to see result</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 9. Convert to Video - below placeholder #8 */}
      <div className="prompt-panel" style={{ marginTop: '16px' }}>
        <h3>Convert to Video</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 8px 0' }}>
          Use an image or the last frame of a video to create a new video.
        </p>
        <div className="model-selector-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            id="image-to-video-type"
            value={selectedImageToVideoId}
            onChange={(e) => setSelectedImageToVideoId(e.target.value)}
            disabled={stage2.isGenerating || isConvertingToVideo}
            className="model-dropdown"
            style={{ maxWidth: '320px' }}
          >
            {IMAGE_TO_VIDEO_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleConvertToVideo}
            disabled={stage2.isGenerating || isConvertingToVideo || !stage2.result?.files?.[0] || (!stage2.result.files[0].content_type.startsWith('image/') && !stage2.result.files[0].content_type.startsWith('video/'))}
            title={!stage2.result?.files?.[0] ? 'Generate an image or video first' : undefined}
            className="btn btn-primary"
          >
            {isConvertingToVideo ? '⏳ Converting...' : '🎞️ Convert to Video'}
          </button>
        </div>
      </div>

      {/* 10. Placeholder for converted video - fixed pixel reference 640×480, inner pane in pixels */}
      <div className="prompt-panel" style={{ marginTop: '16px' }}>
        <h3>Converted video</h3>
        <div
          style={{
            width: REFERENCE_WIDTH * placeholderScale,
            height: REFERENCE_HEIGHT * placeholderScale,
            overflow: 'hidden',
          }}
        >
          <div
            className="media-placeholder media-placeholder-outer"
            style={{
              width: REFERENCE_WIDTH,
              height: REFERENCE_HEIGHT,
              transform: `scale(${placeholderScale})`,
              transformOrigin: '0 0',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="media-placeholder-inner"
              style={{
                width: viewingPanePixels.width,
                height: viewingPanePixels.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {convertedVideoResult ? (
                <MediaPlaceholderContent result={convertedVideoResult} />
              ) : (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Converted video will appear here</p>
              )}
            </div>
          </div>
        </div>
      </div>
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

// Renders media (image/video/audio) inside the aspect-ratio placeholder with object-fit.
function MediaPlaceholderContent({ result }: { result: MediaResult }) {
  const file = result.files[0];
  if (!file) return <p style={{ color: 'var(--text-muted)', margin: 0 }}>No media file</p>;

  const isImage = file.content_type.startsWith('image/');
  const isVideo = file.content_type.startsWith('video/');
  const isAudio = file.content_type.startsWith('audio/');
  const mediaStyle = { width: '100%', height: '100%', objectFit: 'contain' as const, borderRadius: '8px' };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
        {isImage && <img src={file.url} alt="Generated" style={mediaStyle} />}
        {isVideo && <video src={file.url} controls style={mediaStyle} />}
        {isAudio && (
          <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎵</div>
            <audio src={file.url} controls style={{ width: '100%', maxWidth: '400px' }} />
          </div>
        )}
      </div>
      <div className="media-info-panel" style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px' }}><strong>Type:</strong> {file.content_type}</span>
        {file.width && file.height && <span style={{ fontSize: '12px' }}>{file.width} × {file.height}</span>}
        <span style={{ fontSize: '12px' }}><strong>Cost:</strong> ${result.usage.total.toFixed(4)}{result.usage.estimated ? ' (est.)' : ''}</span>
        <a href={file.url} download className="btn btn-secondary" style={{ marginLeft: 'auto' }} target="_blank" rel="noopener noreferrer">⬇️ Download</a>
      </div>
    </div>
  );
}

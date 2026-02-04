# Media Generator - Complete Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTOPENROUTER FRONTEND                      │
│                     (React + TypeScript)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                     ┌──────────────────┐
│   STAGE 1: PROMPT │                     │  STAGE 2: MEDIA  │
│   ENHANCEMENT     │────────────────────▶│   GENERATION     │
└───────────────────┘   Auto-populate     └──────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌───────────────────┐                     ┌──────────────────┐
│  executePrompt()  │                     │ generateMedia()  │
│  (execute.ts)     │                     │  (fal.ts)        │
└───────────────────┘                     └──────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌───────────────────────────────────────────────────────────────┐
│              USAGEFLOWS.INFO API GATEWAY                      │
│                  (https://usageflows.info)                    │
└───────────────────────────────────────────────────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌───────────────────┐                     ┌──────────────────┐
│   OPENROUTER.AI   │                     │    FAL.AI        │
│   (LLM Models)    │                     │ (Media Models)   │
└───────────────────┘                     └──────────────────┘
```

## Stage 1: Prompt Enhancement Flow

```
User enters idea
      │
      ▼
Select OpenRouter model
      │
      ▼
Click "Generate Prompt"
      │
      ▼
POST /api/execute
{
  provider: "openrouter",
  job_type: "text-completion",
  payload: {
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      {
        role: "system",
        content: "You are an expert prompt engineer..."
      },
      {
        role: "user",
        content: "<user's idea>"
      }
    ]
  }
}
      │
      ▼
OpenRouter processes
      │
      ▼
Enhanced prompt returned
      │
      ▼
Auto-populate Stage 2 text box
```

## Stage 2: Media Generation Flow

```
User reviews/edits prompt
      │
      ▼
Select media type
(Image/Video/Audio)
      │
      ▼
Click "Generate Media"
      │
      ▼
submitMediaGeneration()
      │
      ▼
POST /api/execute
{
  provider: "fal",
  media_type: "image-generation",
  model: "fal-ai/flux/schnell",
  payload: {
    prompt: "<enhanced prompt>",
    image_size: "square_hd"
  }
}
      │
      ▼
FAL Gateway submits job
      │
      ▼
Returns job_id immediately
{
  ok: true,
  job_id: "uuid-123",
  job_status: "processing",
  estimate: { total: 0.05 }
}
      │
      ▼
┌─────────────────────────────┐
│   POLLING LOOP (2s interval) │
└─────────────────────────────┘
      │
      ▼
GET /api/status/{job_id}
      │
      ├─▶ "queued"     ──▶ Continue polling
      ├─▶ "processing" ──▶ Continue polling
      ├─▶ "completed"  ──▶ Exit loop ✅
      └─▶ "failed"     ──▶ Exit loop ❌
      │
      ▼
Display result
{
  files: [{
    url: "https://fal.media/...",
    content_type: "image/png",
    width: 1024,
    height: 1024
  }],
  usage: {
    total: 0.05,
    estimated: false
  }
}
      │
      ▼
Show preview + download button
```

## Component Structure

```
MediaGeneratorPage
├── Stage 1 Container
│   ├── Text Input (user's idea)
│   ├── ModelSelector (OpenRouter models)
│   ├── Generate Button
│   └── Status Indicator
│
└── Stage 2 Container
    ├── Text Input (enhanced prompt)
    ├── Media Type Selector
    │   ├── 🖼️ Image (Fast)
    │   ├── 🎨 HD Image
    │   ├── 🎬 Video
    │   ├── 🎞️ Image to Video
    │   └── 🎵 Audio/Music
    ├── Generate Button
    ├── Status Indicator
    │   ├── Submitting...
    │   ├── Polling... (count)
    │   ├── Completed ✅
    │   └── Failed ❌
    └── MediaPreview
        ├── Image/Video/Audio Player
        ├── Download Button
        └── Cost Display
```

## State Management

### Stage 1 State
```typescript
{
  input: string;              // User's creative idea
  model: string | null;       // Selected OpenRouter model
  isGenerating: boolean;      // Loading state
  enhancedPrompt: string;     // Generated prompt
  error: string | null;       // Error message
}
```

### Stage 2 State
```typescript
{
  prompt: string;             // Prompt to use (from Stage 1 or manual)
  mediaType: string;          // Selected media type
  isGenerating: boolean;      // Loading state
  jobId: string | null;       // FAL job ID
  status: string;             // idle|submitting|polling|completed|failed
  result: MediaResult | null; // Final result with files
  error: string | null;       // Error message
  pollCount: number;          // Number of status checks
}
```

## Media Type Configuration

| Type | Model | Parameters |
|------|-------|------------|
| Image (Fast) | `fal-ai/flux/schnell` | `image_size: square_hd` |
| HD Image | `fal-ai/flux-pro` | `image_size: landscape_16_9` |
| Video | `fal-ai/runway-gen3/turbo/image-to-video` | `duration: 5` |
| Image to Video | `fal-ai/kling-video/v1/standard/image-to-video` | `duration: 5` |
| Audio/Music | `fal-ai/stable-audio` | `duration: 30` |

## Error Handling

### Stage 1 Errors
- ❌ No idea entered → "Please enter your idea"
- ❌ No model selected → "Please select a model"
- ❌ API error → Display error message

### Stage 2 Errors
- ❌ No prompt → "Please generate or enter a prompt"
- ❌ Submission failed → Display error with retry option
- ❌ Job failed → Display FAL error message
- ❌ Timeout (6 min) → "Media generation timed out"

## Polling Strategy

```
Max attempts: 180 (6 minutes)
Interval: 2 seconds
Progress callback: Updates UI on each poll
Terminal states: completed, failed
Non-terminal states: queued, processing (continue polling)
```

## API Response Examples

### OpenRouter Response (Stage 1)
```json
{
  "status": "success",
  "result": {
    "choices": [{
      "message": {
        "role": "assistant",
        "content": "A breathtaking mountain landscape at golden hour..."
      }
    }]
  },
  "usage": {
    "total_cost": 0.002
  }
}
```

### FAL Job Submission (Stage 2)
```json
{
  "ok": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_status": "processing",
  "status_url": "/api/status/550e8400-e29b-41d4-a716-446655440000",
  "estimate": {
    "total": 0.05,
    "estimated": true,
    "pricing_version": "2026-01-22"
  }
}
```

### FAL Job Status (Completed)
```json
{
  "ok": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_status": "completed",
  "result": {
    "files": [{
      "url": "https://fal.media/files/lion/abc123.png",
      "content_type": "image/png",
      "width": 1024,
      "height": 1024
    }],
    "raw": { /* full FAL response */ }
  },
  "usage": {
    "total": 0.048,
    "estimated": false
  }
}
```

## User Experience Flow

1. **Initial State**
   - Two empty text boxes
   - Stage 1 ready for input
   - Stage 2 disabled until prompt available

2. **Stage 1 Active**
   - User types idea
   - Selects model from dropdown
   - Clicks "Generate Prompt"
   - Loading indicator shows
   - Enhanced prompt appears
   - Stage 2 auto-populates

3. **Stage 2 Active**
   - User can edit prompt
   - Selects media type
   - Clicks "Generate Media"
   - Status shows: "Submitting..."
   - Status shows: "Generating... (polling X times)"
   - Progress indicator animates

4. **Completion**
   - Media preview displays
   - Download button appears
   - Cost information shown
   - User can generate again

## Performance Considerations

- **Polling**: 2-second intervals to balance responsiveness and API load
- **Timeout**: 6 minutes maximum to prevent infinite loops
- **Progress**: Real-time updates keep user informed
- **Caching**: Model list cached in localStorage
- **Bundle**: Optimized build (67.98 kB gzipped)

## Security

- ✅ API key stored in environment variables
- ✅ All requests go through gateway (no direct FAL access)
- ✅ CORS handled by gateway
- ✅ Input sanitization via gateway
- ✅ Error messages sanitized (no sensitive data)

## Future Enhancements

- [ ] Save generated media to gallery
- [ ] Share generated media
- [ ] Prompt history/templates
- [ ] Batch generation
- [ ] Advanced parameters per media type
- [ ] Real-time streaming for video generation
- [ ] Cost tracking dashboard
- [ ] Model comparison feature

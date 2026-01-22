# OpenRouter Test UI

A React + Vite TypeScript frontend for testing the OpenRouter Gateway API with custom rules and prompts.

## Features

- 📝 **Rules Template Management**: Define and save reusable rules/instructions that guide AI behavior
- 🤖 **Model Selection**: Browse and select from available OpenRouter models
- 🚀 **Prompt Testing**: Send test prompts with validation and error handling
- 💾 **Local Persistence**: Auto-save rules templates and model selection
- 📊 **Response Analysis**: View formatted responses with usage/cost information
- 🎨 **Clean UI**: Modern, responsive design with intuitive navigation

## Prerequisites

- Node.js 18+ and npm
- Valid OpenRouter Gateway API key
- Access to OpenRouter Gateway API (default: https://usageflows.info)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your **OpenRouter Gateway API key** (not your OpenRouter.ai key):

```env
VITE_GATEWAY_API_KEY=your_internal_gateway_api_key_here
```

**Important:** This is the internal API key for the OpenRouter Gateway service (backend), not your OpenRouter.ai API key. Contact your OpenRouter Gateway administrator to get this key.

**Note:** The `VITE_` prefix is required by Vite to expose environment variables to browser code (security feature).

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_GATEWAY_API_KEY` | **Yes** | - | Internal API key for the OpenRouter Gateway backend service (X-API-Key header authentication). This is NOT your OpenRouter.ai API key. Must match the Gateway's `INTERNAL_API_KEY`. |
| `VITE_API_BASE_URL` | No | `https://usageflows.info` | Base URL of the OpenRouter Gateway API service |

## Usage Guide

### Step 1: Define Rules Template

1. Navigate to the **Rules Template** tab
2. Enter your system instructions or rules (e.g., "You are a helpful assistant that always responds concisely.")
3. Click **Save Template**
4. Rules are automatically saved to localStorage

### Step 2: Test Prompts

1. Switch to the **Test Prompt** tab
2. Select a model from the dropdown
3. Enter your prompt
4. Check the confirmation box: "I confirm these rules will be applied"
5. Click **Send Prompt** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Review Response

- View the AI's response message
- Check usage statistics (tokens and cost)
- See routing information (provider, model, endpoint)
- Copy the full JSON response if needed

## Validation Rules

The Send button is only enabled when:

- ✅ Rules template is defined (non-empty)
- ✅ Rules acceptance checkbox is checked
- ✅ A model is selected
- ✅ Prompt is entered (non-empty)

## Local Storage

The app persists the following data in your browser:

- `openrouter-rules-template`: Your saved rules text
- `openrouter-rules-template-time`: Last save timestamp
- `openrouter-selected-model`: Last selected model ID
- `openrouter-rules-accepted`: Rules acceptance state (resets on template change)

## Build for Production

```bash
npm run build
```

Output directory: `dist/`

The build produces static files that can be served by any web server or static hosting service.

## DigitalOcean App Platform Deployment

### Prerequisites

1. GitHub/GitLab repository with this code
2. DigitalOcean account

### Deployment Steps

1. **Create New App** in DigitalOcean App Platform
2. **Connect Repository**: Link your Git repository
3. **Configure Build Settings**:
   - **Type**: Static Site
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Run Command**: (leave empty - not needed for static sites)

4. **Set Environment Variables** in the DigitalOcean dashboard:
   ```
   VITE_GATEWAY_API_KEY=your_gateway_api_key
   ```
   
   Optionally, if using a different API URL:
   ```
   VITE_API_BASE_URL=https://your-api-domain.com
   ```

5. **Deploy**: Click "Create Resources" to deploy

### CORS Configuration

If you encounter CORS errors, ensure the OpenRouter Gateway backend allows your DigitalOcean app domain:

```
Access-Control-Allow-Origin: https://your-app.ondigitalocean.app
```

Or use wildcard for testing (not recommended for production):

```
Access-Control-Allow-Origin: *
```

## API Integration

### Endpoints Used

#### GET `/models`
Fetches available models list.

**Response formats supported:**
- `{ models: [...] }`
- `{ data: [...] }`  
- `[...]` (direct array)

#### POST `/api/execute`
Executes a prompt via OpenRouter.

**Request body:**
```json
{
  "job_type": "text-completion",
  "payload": {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Rules template\n\nUser prompt"
      }
    ]
  },
  "dry_run": false
}
```

**Headers:**
```
X-API-Key: your_api_key
Content-Type: application/json
```

## Project Structure

```
testopenrouter/
├── src/
│   ├── api/                  # API client layer
│   │   ├── client.ts         # Base fetch wrapper with auth
│   │   ├── models.ts         # Models endpoint
│   │   └── execute.ts        # Execute endpoint
│   ├── components/           # React components
│   │   ├── RulesPage.tsx     # Rules template editor
│   │   ├── TestPage.tsx      # Main test interface
│   │   ├── ModelSelector.tsx # Model dropdown
│   │   ├── PromptPanel.tsx   # Prompt input with validation
│   │   └── ResponseViewer.tsx # Response display
│   ├── types/
│   │   └── api.ts            # TypeScript interfaces
│   ├── App.tsx               # Main app with tab navigation
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development

### TypeScript

This project uses TypeScript in strict mode for type safety. All API responses and component props are fully typed.

### Error Handling

The app provides user-friendly error messages for:
- Network failures
- Invalid API keys (401/403)
- Server errors (500)
- Unexpected response formats

### Keyboard Shortcuts

- **Ctrl+Enter** or **Cmd+Enter**: Send prompt (when validation passes)

## Troubleshooting

### "Invalid API key" Error

**Solution**: 
1. Check that `.env` file exists and contains `VITE_GATEWAY_API_KEY`
2. Ensure the value matches the Gateway's `INTERNAL_API_KEY`
3. Restart the development server after editing `.env`
4. Verify the API key is correct

### Models Not Loading

**Solution**:
1. Check that the API is running at the configured URL
2. Verify CORS settings on the backend
3. Check browser console for detailed error messages
4. Try clicking the "Refresh" button

### Send Button Disabled

**Solution**: Ensure all validation requirements are met:
1. Rules template is saved (check Rules Template tab)
2. Rules acceptance checkbox is checked
3. A model is selected from the dropdown
4. Prompt text is entered

### CORS Errors in Browser

**Solution**:
1. Backend must include CORS headers
2. For development, backend should allow `http://localhost:5173`
3. For production, backend should allow your deployed domain

## Contributing

This is a test UI for internal use. For improvements or bug reports, contact the development team.

## License

Proprietary - Internal use only

## Support

For API issues, contact the OpenRouter Gateway administrator.
For UI issues, check the browser console for detailed error messages.

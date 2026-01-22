# Setup Guide - OpenRouter Test UI

## Understanding the Architecture

This test UI connects to an **OpenRouter Gateway** backend service, which in turn connects to OpenRouter.ai. Here's the flow:

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Test UI   │ ──→  │ OpenRouter       │ ──→  │ OpenRouter   │
│  (Browser)  │      │ Gateway (Backend)│      │   .ai API    │
└─────────────┘      └──────────────────┘      └──────────────┘
   Uses:                Uses:                     Uses:
   VITE_GATEWAY_API_KEY INTERNAL_API_KEY         OPENROUTER_API_KEY
   (matches →)          (← matches)              (sk-or-v1-...)
```

## Required API Keys

### 1. VITE_GATEWAY_API_KEY (Test UI)
- **Purpose**: Authenticate with the OpenRouter Gateway backend
- **Where to get it**: From the Gateway's `.env` file (`INTERNAL_API_KEY` value)
- **Example**: `my-secret-internal-key-123`
- **File**: `/root/testopenrouter/.env`
- **Note**: The `VITE_` prefix is required by Vite (security feature)

### 2. INTERNAL_API_KEY (Gateway Backend)
- **Purpose**: Accept requests from authorized clients (like this test UI)
- **Where to set it**: In the OpenRouter Gateway's `.env` file
- **Example**: `my-secret-internal-key-123`
- **File**: `/root/openrouter-gateway/.env`

### 3. OPENROUTER_API_KEY (Gateway Backend)
- **Purpose**: The Gateway uses this to authenticate with OpenRouter.ai
- **Where to get it**: Sign up at https://openrouter.ai and generate an API key
- **Example**: `sk-or-v1-1234567890abcdef...`
- **File**: `/root/openrouter-gateway/.env`

## Step-by-Step Setup

### Step 1: Check Gateway Configuration

```bash
cd /root/openrouter-gateway
cat .env | grep INTERNAL_API_KEY
```

Note the value - you'll use this in Step 3.

### Step 2: Setup Test UI Environment

```bash
cd /root/testopenrouter
cp .env.example .env
nano .env  # or use your preferred editor
```

### Step 3: Configure VITE_GATEWAY_API_KEY

In `/root/testopenrouter/.env`, set:

```env
VITE_GATEWAY_API_KEY=<same_value_as_gateway_INTERNAL_API_KEY>
```

**Example:**
If Gateway has: `INTERNAL_API_KEY=my-secret-key-123`
Then Test UI needs: `VITE_GATEWAY_API_KEY=my-secret-key-123`

### Step 4: Install & Run

```bash
npm install
npm run dev
```

Visit: http://localhost:5173

## Verification Checklist

✅ Gateway backend is running (check https://usageflows.info/health)
✅ Gateway has INTERNAL_API_KEY set in its .env
✅ Gateway has valid OPENROUTER_API_KEY set in its .env  
✅ Test UI has VITE_GATEWAY_API_KEY matching Gateway's INTERNAL_API_KEY
✅ Test UI can load models (dropdown populates)
✅ Test UI can send prompts successfully

## Troubleshooting

### "Invalid API key" Error

**Problem**: VITE_GATEWAY_API_KEY doesn't match Gateway's INTERNAL_API_KEY

**Solution**:
1. Check Gateway's INTERNAL_API_KEY value
2. Update Test UI's VITE_GATEWAY_API_KEY to match
3. Restart Test UI dev server

### "Failed to load models" Error

**Problem**: Can't connect to Gateway backend

**Solution**:
1. Verify Gateway is running: `curl https://usageflows.info/health`
2. Check VITE_API_BASE_URL in .env (should be `https://usageflows.info`)
3. Check for CORS issues in browser console

### Models Load but Send Fails

**Problem**: Gateway can't authenticate with OpenRouter.ai

**Solution**:
1. Check Gateway's OPENROUTER_API_KEY is valid
2. Test: `curl -H "X-API-Key: your_internal_key" https://usageflows.info/api/models`
3. Check Gateway logs for errors

## Security Notes

1. **Never commit .env files**: Already in .gitignore, but be careful
2. **INTERNAL_API_KEY is sensitive**: Treat like a password
3. **OPENROUTER_API_KEY is sensitive**: Only set on Gateway backend
4. **Use HTTPS in production**: The gateway should be behind SSL/TLS

## Quick Reference

| Service | Config File | Key Name | Purpose |
|---------|-------------|----------|---------|
| Test UI | `/root/testopenrouter/.env` | `VITE_GATEWAY_API_KEY` | Auth with Gateway |
| Gateway | `/root/openrouter-gateway/.env` | `INTERNAL_API_KEY` | Accept client requests |
| Gateway | `/root/openrouter-gateway/.env` | `OPENROUTER_API_KEY` | Auth with OpenRouter.ai |

## Need Help?

- Test UI issues: Check browser console for errors
- Gateway issues: Check gateway logs (`docker logs` or service logs)
- OpenRouter.ai issues: Visit https://openrouter.ai/docs

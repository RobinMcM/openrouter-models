# Migration Guide: VITE_API_KEY → VITE_GATEWAY_API_KEY

## What Changed?

The environment variable name has been updated for better clarity:

- **Old name**: `VITE_API_KEY`
- **New name**: `VITE_GATEWAY_API_KEY`

## Why the Change?

The old name (`VITE_API_KEY`) was confusing because:
- It made users think it was related to Vite itself
- It wasn't clear this was for the Gateway service specifically

The new name (`VITE_GATEWAY_API_KEY`) makes it obvious:
- ✅ This is the Gateway API key
- ✅ Not your OpenRouter.ai API key
- ✅ The `VITE_` prefix is just a technical requirement (Vite security feature)

## Migration Steps

If you have an existing `.env` file, update it:

### 1. Open your .env file

```bash
cd /root/testopenrouter
nano .env  # or your preferred editor
```

### 2. Rename the variable

**Before:**
```env
VITE_API_KEY=my-gateway-key-123
```

**After:**
```env
VITE_GATEWAY_API_KEY=my-gateway-key-123
```

### 3. Restart the development server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## Quick Copy-Paste

If you're setting up fresh, use:

```bash
cd /root/testopenrouter
cp .env.example .env
# Edit .env and set VITE_GATEWAY_API_KEY to match Gateway's INTERNAL_API_KEY
```

## No Code Changes Needed!

If you're just a user of the app:
- ✅ Only the `.env` variable name changes
- ✅ No code changes required
- ✅ Same functionality

## For DigitalOcean Deployments

Update your environment variables in the DO dashboard:

1. Go to your app settings
2. Find "Environment Variables"
3. Delete: `VITE_API_KEY`
4. Add: `VITE_GATEWAY_API_KEY` with your key value
5. Redeploy

## Still Works With

✅ Same Gateway backend (no changes needed)  
✅ Same Gateway INTERNAL_API_KEY value  
✅ Same functionality and features  

## Need Help?

See `SETUP_GUIDE.md` for complete setup instructions with the new variable name.

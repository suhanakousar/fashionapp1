# Vercel Module Resolution Fix

## The Problem

The error `Cannot find module '/var/task/server/routes'` occurs because:

1. **Wrong Entry Point**: The main `vercel.json` was pointing to `server/index.ts` instead of `api/index.ts`
2. **Module Resolution**: Vercel's bundler needs all files to be properly included

## The Fix

I've updated `vercel.json` to use `api/index.ts` as the entry point. However, you need to ensure:

### For Backend Deployment:

1. **Use the correct vercel.json**:
   - Option A: Rename `vercel-backend.json` to `vercel.json` in your repository before deploying
   - Option B: In Vercel dashboard, go to Settings → General and upload `vercel-backend.json` as the configuration

2. **Make sure the entry point is `api/index.ts`**:
   - The `vercel.json` (or `vercel-backend.json`) should have:
     ```json
     {
       "builds": [
         {
           "src": "api/index.ts",
           "use": "@vercel/node"
         }
       ]
     }
     ```

3. **Redeploy** after making these changes

### Alternative: Update All Imports

If the issue persists, we may need to add `.js` extensions to all imports in the server files, but Vercel's bundler should handle this automatically.

## Current Status

✅ Updated main `vercel.json` to use `api/index.ts`
✅ `api/index.ts` properly imports and initializes the Express app
✅ Singleton pattern prevents re-initialization issues

## Next Steps

1. **Commit and push** the updated `vercel.json`:
   ```bash
   git add vercel.json
   git commit -m "Fix Vercel entry point to use api/index.ts"
   git push
   ```

2. **Redeploy on Vercel** - it should automatically redeploy from the push

3. **Verify** the deployment uses `api/index.ts` by checking the build logs

## If Still Not Working

If you still see the error, try:

1. Delete the Vercel project and create a new one
2. Make sure to set Root Directory to `.` (root)
3. Use `vercel-backend.json` renamed to `vercel.json` for backend deployment
4. Check that all server files are in the repository and committed


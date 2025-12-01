# Setting Root Directory in Vercel

## Why Root Directory Matters

When deploying to Vercel, you need to specify the **Root Directory** so Vercel knows where to find your project files.

For this project, the root directory should be **`.` (the repository root)** because:

- `package.json` is in the root
- `api/index.ts` (backend entry point) is in the root
- `server/` folder (backend code) is in the root
- `client/` folder (frontend code) is in the root
- All configuration files are in the root

## How to Set Root Directory

### Method 1: During Project Creation

1. When importing your repository in Vercel
2. Look for **"Root Directory"** field
3. Set it to **`.`** (a single dot, which means "current directory" or "root")
4. Or leave it empty (defaults to root)

### Method 2: After Project Creation

1. Go to your project in Vercel dashboard
2. Click **Settings** → **General**
3. Scroll down to **"Root Directory"** section
4. Click **Edit**
5. Set to **`.`** or leave empty
6. Click **Save**

## Visual Guide

```
Your Repository Structure:
├── . (ROOT DIRECTORY - Set to "." in Vercel)
│   ├── package.json
│   ├── api/
│   │   └── index.ts (backend entry point)
│   ├── server/
│   │   ├── index.ts
│   │   ├── routes.ts
│   │   └── ...
│   ├── client/
│   │   ├── src/
│   │   └── ...
│   ├── vercel-backend.json
│   ├── vercel-frontend.json
│   └── ...
```

## For Backend Deployment

- **Root Directory**: `.` (root)
- Vercel will find: `api/index.ts`, `server/`, `package.json`

## For Frontend Deployment

- **Root Directory**: `.` (root)
- Vercel will find: `client/`, `vite.config.ts`, `package.json`

## Common Mistakes

❌ **Wrong**: Setting root directory to `server/` or `client/`
- This will break the build because Vercel won't find `package.json` or other dependencies

✅ **Correct**: Setting root directory to `.` (root)
- Vercel can access all folders and files from the repository root

## Verification

After setting the root directory, verify in Vercel dashboard:
- Settings → General → Root Directory should show `.` or be empty
- Build logs should show files being found correctly
- No "file not found" errors during build


# Frankenstein Fusion Outfit Designer

> **AI-Powered Fashion Fusion System** - Combine traditional Indian wear with gothic aesthetics using HuggingFace image-to-image models. Built with Kiro (AI pair programmer) for hackathon submission.

![Kiroween Theme](https://img.shields.io/badge/Theme-Kiroween-dark?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square)

## 🎯 Project Overview

Frankenstein Fusion Outfit Designer is a full-stack fashion design management system with an AI-powered fusion feature that combines two fashion images to create unique gothic-inspired designs. The system preserves garment silhouettes while applying patterns, textures, and colors from a second image.

### Key Features

- **🎨 AI-Powered Fusion** - HuggingFace image-to-image models for fashion fusion
- **👗 Silhouette Preservation** - Maintains original garment structure
- **🎭 Kiroween Theme** - Dark gothic aesthetic with neon accents
- **🔍 Explainability** - Heatmaps and designer notes for AI transparency
- **👤 Virtual Try-On** - Mannequin preview with drag/scale controls
- **📚 Lookbook Generator** - One-click batch variation creation
- **📱 Social Sharing** - Instagram-ready 1080x1080 cards
- **♿ Accessible** - WCAG AA compliant, keyboard navigable
- **🤖 Kiro Integration** - Complete `.kiro` folder with specs and prompts

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:5173` and navigate to `/fusion` to try the fusion feature!

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

## 📁 Project Structure

```
BuildEachAll245/
├── .kiro/                    # Kiro AI specifications
│   ├── spec.yaml            # Module definitions
│   ├── steering.md           # Design constraints
│   ├── hooks/                # Event hooks
│   └── prompts/              # AI prompt templates
├── client/                   # React frontend
│   └── src/
│       ├── components/        # React components
│       │   ├── Hero.tsx      # Landing hero with carousel
│       │   ├── FusionWorkspace.tsx
│       │   ├── MannequinCanvas.tsx
│       │   ├── ExplainabilityPanel.tsx
│       │   └── JudgeTestMode.tsx
│       ├── pages/            # Page components
│       └── lib/              # Utilities
├── server/                   # Express backend
│   ├── fusion.ts            # Fusion API endpoints
│   ├── fusionPipeline.ts    # Image processing pipeline
│   └── storage.ts            # Database operations
├── shared/                   # Shared types
│   └── schema.ts            # TypeScript types & Zod schemas
└── docs/                     # Documentation
```

## 🎨 Tech Stack

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Tailwind CSS** + **shadcn/ui** - Styling and components
- **Framer Motion** - Animations
- **TanStack Query** - Data fetching
- **react-dropzone** - File uploads

### Backend
- **Express** + **TypeScript** - API server
- **MongoDB** (Atlas) - Database
- **Cloudinary** - Image storage & processing
- **HuggingFace API** - AI image-to-image models

### Development
- **Vite** - Build tool
- **Jest** - Testing
- **Kiro** - AI pair programming

## 🎯 Core Features

### 1. Fusion Workspace
- Drag-and-drop image uploads
- Fusion mode selector (pattern/color/texture)
- Strength slider (0.5-0.9)
- Real-time progress tracking
- Candidate carousel with multiple results

### 2. Explainability Panel
- Heatmap overlay showing contribution regions
- Auto-generated designer notes
- Pattern contribution percentages
- Visual feedback on fusion process

### 3. Mannequin Try-On
- Virtual mannequin preview
- Drag, scale, and rotate controls
- Spooky overlay toggles
- Fabric fold animations

### 4. Judge Test Mode
- Kiro integration showcase
- Example prompts display
- Test data preloading
- `.kiro` folder highlights

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** - 3-minute demo script
- **[JUDGE_PITCH.md](./JUDGE_PITCH.md)** - Judge pitch paragraph
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Full deployment guide
- **[HOW_KIRO_HELPED.md](./HOW_KIRO_HELPED.md)** - Kiro usage examples
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature checklist
- **[FINAL_IMPLEMENTATION_STATUS.md](./FINAL_IMPLEMENTATION_STATUS.md)** - Status report

## 🎬 Demo Flow

1. **Landing Page** - Hero carousel with before/after transformations
2. **Fusion Page** - Upload images → Configure → Create fusion
3. **Results** - View fusion with explainability panel
4. **Try-On** - Preview on virtual mannequin
5. **Lookbook** - Generate 6 variations
6. **Share** - Create Instagram-ready card

## 🔐 Environment Variables

```env
# Required
DATABASE_URL=mongodb+srv://...
SESSION_SECRET=...
CLOUDINARY_URL=cloudinary://...

# Optional
HUGGINGFACE_API_KEY=...  # Uses mock mode if not set
AUTO_MASK_FACES=true     # Face masking policy
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Free Tier Services

- ✅ **MongoDB Atlas** - M0 free tier (512MB)
- ✅ **Cloudinary** - Free tier (25GB storage, 25GB bandwidth)
- ✅ **Vercel** - Hobby plan (100GB bandwidth)
- ✅ **HuggingFace** - Rate-limited API (mock fallback available)

## 🧪 Testing

```bash
# Run tests
npm test

# Type check
npm run check

# Build
npm run build
```

## 🤖 Kiro Integration

This project was built with **Kiro** (AI pair programmer). The `.kiro` folder contains:

- **spec.yaml** - Module specifications and endpoints
- **steering.md** - Fashion designer persona and constraints
- **hooks/** - Event-driven architecture hooks
- **prompts/** - AI prompt templates for HuggingFace

See [HOW_KIRO_HELPED.md](./HOW_KIRO_HELPED.md) for exact prompts used.

## ♿ Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader announcements
- ✅ Focus rings for keyboard users
- ✅ Reduced motion support
- ✅ WCAG AA compliant

## 📊 Project Stats

- **React Components**: 7 major components
- **Backend Endpoints**: 7 fusion API routes
- **Database Collections**: 12+ (including FusionJobs)
- **Documentation Files**: 7 comprehensive guides
- **Lines of Code**: ~5,000+ (TypeScript)

## 🎯 Hackathon Highlights

### Technical Innovation
- AI-powered image fusion with explainability
- Real-time progress tracking
- Background job processing
- Mock mode for development

### Design Excellence
- Kiroween dark theme with neon accents
- Smooth microinteractions
- Responsive design
- Professional UI/UX

### Kiro Integration
- Complete `.kiro` folder structure
- Specification-driven development
- Event hooks and prompts
- Reproducible code generation

## 📝 License

MIT

## 🙏 Acknowledgments

- **Kiro** - AI pair programmer
- **HuggingFace** - AI models
- **Cloudinary** - Image processing
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling framework

---

**Built for Hackathon Submission** | **Version 1.0.0** | **2024**

For questions or issues, check the documentation files or review the `.kiro` folder for implementation details.


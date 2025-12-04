# Judge Pitch: Frankenstein Fusion Outfit Designer

## 120-Word Pitch

**Frankenstein Fusion Outfit Designer** revolutionizes fashion design by combining traditional Indian wear with gothic aesthetics using AI-powered image-to-image fusion. Built with **Kiro** as our AI pair programmer, we've created a production-ready system that preserves garment silhouettes while applying patterns, textures, and colors from a second image. Our HuggingFace-powered pipeline includes face detection, automatic masking, explainability heatmaps, and designer notes. The Kiroween-themed UI features dark palettes, neon accents, fog overlays, and microinteractions. Bonus features include one-click lookbook generation and social share cards. The entire codebase—React components, Express endpoints, image processing, and `.kiro` specifications—was co-created with Kiro, demonstrating how AI can accelerate full-stack development while maintaining code quality and accessibility standards.

---

## Technical Novelty

1. **AI-Powered Fusion**: HuggingFace image-to-image models with silhouette preservation
2. **Explainability**: Heatmap overlays and auto-generated designer notes
3. **Kiro Integration**: Complete `.kiro` folder with specs, steering, and hooks
4. **Face Protection**: Automatic detection and masking with consent flow
5. **Production-Ready**: TypeScript, accessibility, error handling, testing strategy

---

## Kiro Usage Highlights

- **`.kiro/spec.yaml`**: Module definitions, endpoints, events
- **`.kiro/steering.md`**: Fashion designer persona and constraints
- **`.kiro/hooks/`**: Event-driven architecture (onUpload, onFusionComplete)
- **`.kiro/prompts/`**: Fusion prompt templates for HuggingFace
- **Code Generation**: React components, Express routes, image pipeline

---

## Impact

- **Designers**: Create fusion designs in seconds vs. hours
- **Clients**: Visualize designs on virtual mannequins before ordering
- **Accessibility**: Keyboard-first, screen-reader friendly, WCAG compliant
- **Scalability**: Free-tier friendly (Cloudinary, MongoDB Atlas, local HF fallback)

---

## Demo Flow

1. Landing page with before/after carousel
2. Upload two images → configure fusion → process
3. View results with explainability panel
4. Generate lookbook (6 variations)
5. Try on mannequin with drag/scale controls
6. Show `.kiro` folder and Kiro-generated code

---

## Stack

- **Frontend**: React 18 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Express + TypeScript
- **AI**: HuggingFace (image-to-image, segmentation)
- **Storage**: Cloudinary (images), MongoDB (metadata)
- **Deployment**: Vercel (serverless)
- **AI Pair Programming**: Kiro (code generation, specs, prompts)


# Quick Start Guide: Frankenstein Fusion Outfit Designer

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free)
- Cloudinary account (free)
- Git repository cloned

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB (get from MongoDB Atlas)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-key-here

# Cloudinary (get from Cloudinary Dashboard)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Optional: HuggingFace (for real AI fusion, otherwise uses mock)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx

# Optional: Face masking policy
AUTO_MASK_FACES=true
```

### Step 3: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 4: Test the Fusion Feature

1. Navigate to `http://localhost:5173/fusion`
2. Enable "Judge Test Mode" (if in development)
3. Upload two images or use preloaded test images
4. Select fusion mode and strength
5. Click "Create Fusion"
6. Watch the progress and view results!

---

## 🎯 Key Pages

- **Home** (`/`) - Landing page with Hero carousel
- **Fusion** (`/fusion`) - Main fusion workspace
- **Admin Dashboard** (`/admin/dashboard`) - Designer portal
- **Client Portal** (`/client/dashboard`) - Customer portal

---

## 🧪 Judge Test Mode

For hackathon demos, enable Judge Test Mode:

1. Go to `/fusion?judge=true`
2. Or toggle the switch in development mode
3. See Kiro integration showcase
4. Preloaded test images ready to use

---

## 📚 Documentation

- `DEMO_SCRIPT.md` - 3-minute demo script
- `JUDGE_PITCH.md` - Judge pitch paragraph
- `DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `HOW_KIRO_HELPED.md` - Kiro usage examples
- `IMPLEMENTATION_SUMMARY.md` - Complete feature list

---

## 🔧 Common Issues

### "Database connection failed"
- Check `DATABASE_URL` is correct
- Verify MongoDB network access allows your IP
- Check database user credentials

### "Cloudinary upload failed"
- Verify `CLOUDINARY_URL` is correct
- Check Cloudinary account limits
- Ensure API key has upload permissions

### "Fusion job stuck"
- Check Vercel function logs
- Verify HuggingFace API key (or use mock mode)
- Check MongoDB connection

---

## 🎨 Features to Demo

1. **Hero Carousel** - Before/after transformations on homepage
2. **Fusion Workspace** - Upload, configure, create fusion
3. **Explainability Panel** - AI transparency with heatmaps
4. **Mannequin Try-On** - Virtual preview with controls
5. **Judge Test Mode** - Kiro integration showcase
6. **Lookbook Generator** - Batch variation creation
7. **Social Share Cards** - Instagram-ready images

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/public/`

---

## 🚢 Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Need Help?** Check the documentation files or review the `.kiro` folder for implementation details.


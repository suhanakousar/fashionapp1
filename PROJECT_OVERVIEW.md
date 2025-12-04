# Project Overview: Fashion Design Management System

## 🎯 Project Summary

A full-stack **Fashion Design Management System** built for fashion designers to manage their designs, clients, orders, and billing. The system includes both an **Admin Portal** for designers and a **Client Portal** for customers to track their orders.

---

## 🏗️ Architecture

### **Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Database:** MongoDB (via MongoDB Atlas)
- **File Storage:** Cloudinary (for images/files)
- **Deployment:** Vercel (serverless functions)
- **UI Framework:** Tailwind CSS + shadcn/ui components
- **State Management:** TanStack Query (React Query)
- **Routing:** Wouter
- **Authentication:** Express Sessions + bcryptjs
- **PWA:** Service Worker + Web App Manifest

### **Project Structure:**
```
BuildEachAll245/
├── api/              # Vercel serverless function entry point
├── client/           # React frontend application
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   ├── lib/      # Utilities, API, auth
│   │   └── hooks/    # Custom React hooks
│   └── public/       # Static assets, PWA files
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   ├── db.ts         # MongoDB connection
│   ├── whatsapp.ts   # WhatsApp integration
│   └── static.ts     # Static file serving
├── shared/           # Shared types & schemas
│   └── schema.ts     # Zod schemas, TypeScript types
└── dist/             # Build output
```

---

## 📊 Database Schema

### **Collections:**

1. **Users** (Designers/Admins)
   - `id`, `name`, `email`, `password` (hashed)
   - `role`, `businessName`, `businessPhone`, `businessAddress`
   - `createdAt`

2. **Designs**
   - `id`, `designerId`, `title`, `description`, `price`
   - `category`, `isPublished`, `createdAt`

3. **DesignImages**
   - `id`, `designId`, `imageUrl` (Cloudinary), `sortOrder`, `createdAt`

4. **Clients**
   - `id`, `name`, `phone`, `whatsapp`, `email`, `address`
   - `password` (hashed, optional), `otp`, `otpExpires`
   - `magicLinkToken`, `magicLinkExpires`
   - `qrLoginToken`, `qrLoginExpires`
   - `trustedDevices[]`, `lastLoginAt`, `createdAt`

5. **Measurements**
   - `id`, `clientId`, `label`
   - `chest`, `waist`, `hips`, `shoulder`, `sleeve`, `length`, `inseam`, `neck`
   - `customMeasurements{}`, `notes`, `createdAt`

6. **Orders**
   - `id`, `clientId`, `designId`, `designerId`
   - `status`: "requested" | "accepted" | "in_progress" | "ready_for_delivery" | "delivered"
   - `preferredDate`, `notes`, `measurementId`, `createdAt`

7. **OrderFiles**
   - `id`, `orderId`, `fileUrl` (Cloudinary), `fileType`, `fileName`, `createdAt`

8. **BillingEntries**
   - `id`, `orderId`, `clientId`, `description`, `amount`, `paid`, `createdAt`

9. **Notifications**
   - `id`, `userId`, `type`, `title`, `message`, `read`, `metadata{}`, `createdAt`

10. **Categories**
    - `id`, `name`, `createdAt`

11. **Messages**
    - `id`, `clientId`, `designerId`, `orderId?`, `sender`: "client" | "designer"
    - `message`, `read`, `createdAt`

12. **WhatsAppMessages**
    - `id`, `clientId`, `orderId?`, `phone`, `message`
    - `status`: "pending" | "sent" | "failed", `sentAt`, `createdAt`

---

## 🔌 API Routes

### **Authentication (Admin)**
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current admin user

### **Public Routes**
- `GET /api/designs` - Get published designs
- `GET /api/designs/:id` - Get design details
- `GET /api/categories` - Get categories
- `GET /api/orders/:id` - Get order (public)
- `POST /api/book` - Create booking (public, rate-limited)

### **Admin Routes** (require authentication)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/designs` - List all designs
- `POST /api/admin/designs` - Create design (with image upload)
- `PUT /api/admin/designs/:id` - Update design
- `PATCH /api/admin/designs/:id` - Partial update
- `DELETE /api/admin/designs/:id` - Delete design

- `GET /api/admin/clients` - List clients
- `GET /api/admin/clients/:id` - Get client details
- `DELETE /api/admin/clients/all` - Delete all clients
- `POST /api/admin/clients/:id/measurements` - Add measurement
- `PATCH /api/admin/measurements/:id` - Update measurement

- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id` - Update order (auto-sends WhatsApp)

- `POST /api/admin/orders/:id/billing` - Create billing entry
- `PATCH /api/admin/billing/:id` - Update billing entry

- `GET /api/admin/notifications` - Get notifications
- `PATCH /api/admin/notifications/:id/read` - Mark as read

- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/:id` - Delete category

- `PATCH /api/admin/settings/business` - Update business settings

- `GET /api/admin/export/clients` - Export clients CSV
- `GET /api/admin/export/clients/:id` - Export client details CSV
- `GET /api/admin/export/orders` - Export orders CSV
- `GET /api/admin/export/all` - Export all data (ZIP)

- `GET /api/admin/orders/:id/invoice` - Generate order invoice PDF
- `GET /api/admin/clients/:clientId/billing/invoice` - Generate billing statement PDF
- `GET /api/admin/billing/:id/invoice` - Generate billing entry invoice PDF

### **WhatsApp Integration**
- `POST /api/whatsapp/send` - Send WhatsApp message (admin)
- `GET /api/whatsapp/messages/:clientId` - Get WhatsApp message history

### **Client Portal Routes**
- `POST /api/client/request-otp` - Request OTP for login
- `POST /api/client/login` - Client login (OTP/password/email/magic link/QR)
- `POST /api/client/request-magic-link` - Request magic link login
- `POST /api/client/generate-qr-login` - Generate QR code for login
- `POST /api/client/logout` - Client logout
- `GET /api/client/me` - Get current client

- `GET /api/client/orders` - Get client's orders (requires auth)
- `GET /api/client/orders/:id` - Get order details
- `GET /api/client/measurements` - Get measurements
- `GET /api/client/billing` - Get billing entries
- `GET /api/client/messages` - Get messages
- `GET /api/client/messages/unread` - Get unread count
- `POST /api/client/messages` - Send message
- `PATCH /api/client/profile` - Update profile

---

## 🎨 Frontend Pages

### **Public Pages**
- `/` - Home page (design gallery)
- `/about` - About page
- `/contact` - Contact page
- `/design/:id` - Design detail page
- `/book/:designId` - Booking form
- `/booking/confirm/:orderId` - Booking confirmation

### **Admin Pages** (protected)
- `/admin/login` - Admin login
- `/admin/dashboard` - Dashboard with stats
- `/admin/designs` - Design management
- `/admin/designs/:id` - Design editor
- `/admin/clients` - Client list
- `/admin/clients/:id` - Client details
- `/admin/orders` - Order management
- `/admin/orders/:id` - Order details
- `/admin/settings` - Business settings

### **Client Portal Pages**
- `/client/login` - Client login (multiple methods)
- `/client/dashboard` - Client dashboard
- `/client/orders` - Client's orders
- `/client/orders/:id` - Order details
- `/client/messages` - Messages with designer
- `/client/billing` - Billing statements
- `/client/profile` - Profile management

---

## 🔧 Key Functions & Services

### **Storage Service** (`server/storage.ts`)
Implements `IStorage` interface with MongoDB operations:

**User Management:**
- `getUser(id)`, `getUserByEmail(email)`, `createUser()`, `updateUser()`

**Design Management:**
- `getDesigns(published?)`, `getDesign(id)`, `createDesign()`, `updateDesign()`, `deleteDesign()`
- `getDesignImages()`, `createDesignImage()`, `updateDesignImageOrder()`, `deleteDesignImage()`

**Client Management:**
- `getClients()`, `getClient(id)`, `getClientByPhone()`, `getClientByEmail()`
- `createClient()`, `updateClient()`, `deleteAllClients()`

**Measurements:**
- `getMeasurements(clientId)`, `createMeasurement()`, `updateMeasurement()`

**Orders:**
- `getOrders()`, `getOrder(id)`, `getOrdersByClient(clientId)`
- `createOrder()`, `updateOrder()`

**Billing:**
- `getBillingEntries(orderId)`, `getBillingEntriesByClient(clientId)`
- `createBillingEntry()`, `updateBillingEntry()`

**Notifications:**
- `getNotifications(userId)`, `createNotification()`, `markNotificationRead()`

**Categories:**
- `getCategories()`, `createCategory()`, `deleteCategory()`

**Messages:**
- `getMessages(clientId, designerId)`, `createMessage()`
- `getUnreadMessageCount()`, `markMessagesRead()`

**WhatsApp:**
- `getWhatsAppMessages(clientId)`, `createWhatsAppMessage()`

**Dashboard:**
- `getDashboardStats(designerId)` - Returns stats: newOrders, totalClients, pendingPayments, totalDesigns, recentOrders, upcomingDeliveries

### **WhatsApp Service** (`server/whatsapp.ts`)
Multi-provider WhatsApp integration:

**Methods:**
- `sendMessage(phone, message)` - Send via Twilio/API/URL
- `getWhatsAppURL(phone, message)` - Generate WhatsApp web URL
- `generateOTPMessage(name, otp)` - Generate OTP message template
- `generateBookingConfirmationMessage(booking)` - Generate booking confirmation
- `generateOrderStatusMessage(order)` - Generate status update message

**Providers:**
- `twilio` - Twilio WhatsApp API
- `whatsapp-api` - Custom WhatsApp Business API
- `url` - WhatsApp web URL (fallback)

### **Database Connection** (`server/db.ts`)
- `connect()` - Initialize MongoDB connection
- `getClient()` - Get MongoDB client
- `getDb()` - Get database instance

### **File Upload** (`server/routes.ts`)
- Uses **Multer** with memory storage (Vercel-compatible)
- Uploads to **Cloudinary** automatically
- Supports images (designs) and mixed files (bookings)
- File size limits: 5MB (images), 10MB (booking files)

### **Authentication Middleware**
- `requireAuth` - Admin authentication check
- `requireClientAuth` - Client authentication check
- Session-based with Express Sessions
- Supports trusted devices for clients

### **Rate Limiting**
- `rateLimit(limit, windowMs)` - In-memory rate limiter
- Applied to booking endpoint (10 requests per minute)

---

## 🚀 Key Features

### **1. Design Management**
- Create/edit/delete designs with multiple images
- Image ordering via drag-and-drop
- Publish/unpublish designs
- Category management
- Cloudinary image storage

### **2. Order Management**
- Order status workflow: requested → accepted → in_progress → ready_for_delivery → delivered
- Automatic WhatsApp notifications on status change
- Order files upload (images, PDFs, documents)
- Preferred delivery date tracking

### **3. Client Management**
- Client profiles with contact info
- Measurement tracking (chest, waist, hips, etc.)
- Custom measurements support
- Client history (orders, billing, messages)

### **4. Billing System**
- Billing entries per order
- Payment tracking (paid/unpaid)
- Outstanding balance calculation
- PDF invoice generation (jsPDF)
- Billing statement export

### **5. Client Portal**
**Multiple Login Methods:**
- **OTP Login** - SMS/WhatsApp OTP (6 digits, 10 min expiry)
- **Password Login** - Email/password or phone/password
- **Magic Link** - One-click login via WhatsApp (15 min expiry)
- **QR Code Login** - Scan QR code to login (10 min expiry)
- **Trusted Device** - Remember device, skip OTP/password

**Features:**
- View orders and status
- Track measurements
- View billing statements
- Message designer
- Update profile

### **6. WhatsApp Integration**
- Automatic booking confirmations
- Order status updates
- OTP delivery
- Magic link delivery
- Message history tracking
- Multi-provider support (Twilio/API/URL)

### **7. Notifications**
- In-app notifications for admins
- New order alerts
- Order status change alerts
- Unread count tracking

### **8. Data Export**
- CSV export (clients, orders, designs)
- ZIP archive export (all data)
- PDF invoices and statements

### **9. PWA Support**
- Service Worker for offline support
- Web App Manifest
- Installable on mobile/desktop
- Icon assets for all platforms

### **10. Responsive Design**
- Mobile-first design
- Dark mode support
- Modern UI with shadcn/ui components
- Accessible components

---

## 🔐 Security Features

1. **Password Hashing** - bcryptjs (10 rounds)
2. **Session Management** - Express Sessions with secure cookies
3. **Rate Limiting** - Prevents abuse
4. **Input Validation** - Zod schemas for all inputs
5. **File Upload Validation** - Type and size checks
6. **CORS Configuration** - Cross-origin request handling
7. **Trusted Devices** - Device fingerprinting for client login
8. **Token Expiration** - OTP, magic links, QR codes expire

---

## 📦 Dependencies

### **Core:**
- `express` - Web framework
- `mongodb` - Database driver
- `react` + `react-dom` - UI framework
- `typescript` - Type safety
- `vite` - Build tool

### **UI:**
- `tailwindcss` - CSS framework
- `@radix-ui/*` - Headless UI components
- `lucide-react` - Icons
- `framer-motion` - Animations
- `recharts` - Charts

### **Data:**
- `@tanstack/react-query` - Data fetching
- `zod` - Schema validation
- `react-hook-form` - Form management

### **Utilities:**
- `bcryptjs` - Password hashing
- `multer` - File uploads
- `cloudinary` - Image storage
- `jspdf` - PDF generation
- `archiver` - ZIP creation
- `date-fns` - Date utilities

---

## 🚢 Deployment

### **Vercel Configuration** (`vercel.json`)
- Serverless function: `api/index.ts`
- Build command: `npm run build`
- Output directory: `dist/public`
- Rewrites for API routes and static files
- Cache headers for assets

### **Environment Variables:**
- `DATABASE_URL` - MongoDB connection string
- `SESSION_SECRET` - Session encryption key
- `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `WHATSAPP_PROVIDER` - "twilio" | "whatsapp-api" | "url"
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` (if using Twilio)
- `WHATSAPP_API_URL`, `WHATSAPP_API_KEY` (if using custom API)
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - "production" | "development"

---

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm run seed` - Seed database with sample data

---

## 🎯 Business Logic Highlights

1. **Automatic Client Creation** - Clients created automatically on booking
2. **Magic Link on Booking** - Clients get instant login link via WhatsApp
3. **Auto WhatsApp Notifications** - Status changes trigger WhatsApp messages
4. **Billing Auto-Creation** - Billing entry created automatically on order
5. **Measurement Tracking** - Multiple measurements per client
6. **Order File Management** - Support for images, PDFs, documents
7. **Dashboard Analytics** - Real-time stats for admins
8. **Export Functionality** - CSV and PDF exports for records

---

## 🔄 Data Flow

1. **Booking Flow:**
   - Client fills booking form → Creates client (if new) → Creates order → Creates measurement (if provided) → Uploads files → Creates billing entry → Sends WhatsApp confirmation → Returns magic link

2. **Order Update Flow:**
   - Admin updates order status → Creates notification → Sends WhatsApp to client → Updates database

3. **Client Login Flow:**
   - Client requests OTP/magic link → System generates token → Sends via WhatsApp → Client uses token → Session created → Access granted

4. **File Upload Flow:**
   - File uploaded via Multer (memory) → Uploaded to Cloudinary → URL saved to database → Served via Cloudinary CDN

---

## 📈 Future Enhancements (Potential)

- Real-time chat with WebSockets
- Email notifications
- Payment gateway integration
- Inventory management
- Multi-designer support
- Advanced analytics
- Mobile app (React Native)
- SMS notifications
- Calendar integration
- Reminder system

---

## 📄 License

MIT

---

**Last Updated:** 2024
**Version:** 1.0.0


import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage.js";
import { whatsappService } from "./whatsapp.js";
import { jsPDF } from "jspdf";
import archiver from "archiver";
import { bookingFormSchema, insertBillingEntrySchema } from "../shared/schema.js";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    clientId?: string;
  }
}

// Configure Cloudinary
// Use environment variables for security (set in Vercel dashboard)
// Or use CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dzxawjlvs",
    api_key: process.env.CLOUDINARY_API_KEY || "893663778162643",
    api_secret: process.env.CLOUDINARY_API_SECRET || "_ThzqgrXbg3IHRlqhSJll92P7_w",
    secure: true,
  });
}

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File, folder: string = "fashion-app"): Promise<string> {
  return new Promise((resolve, reject) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const publicId = `${folder}/${uniqueSuffix}`;
    
    // Convert buffer to stream
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "auto",
        folder: folder,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else if (result) {
          // Return the secure URL
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload failed: No result returned"));
        }
      }
    );
    
    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(stream);
  });
}

// For Vercel: Use memory storage since filesystem is read-only except /tmp
// Files will be stored in memory and then uploaded to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for Vercel compatibility
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// More permissive upload for booking files (accepts images, PDFs, etc.)
const uploadBookingFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for booking files
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and common document types
    const allowedTypes = /jpeg|jpg|png|webp|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Allowed types: images, PDF, DOC, DOCX"));
    }
  },
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Debug session info (helpful for troubleshooting)
  const hasSession = !!req.session;
  const hasUserId = !!req.session?.userId;
  const sessionId = req.sessionID;
  
  if (!hasUserId) {
    console.log("Auth failed:", {
      hasSession,
      hasUserId,
      sessionId,
      cookieHeader: req.headers.cookie ? "present" : "missing",
      path: req.path,
    });
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.lastReset > windowMs) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ message: "Too many requests" });
    }

    record.count++;
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // CORS middleware for cross-origin requests (needed when frontend and backend are on different domains)
  const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_API_URL?.replace('/api', '') || '';
  const isProduction = process.env.NODE_ENV === "production";
  // Check if frontend and backend are on same domain (both on vercel.app)
  const isSameOrigin = !frontendUrl || frontendUrl.includes("vercel.app");
  
  app.use((req, res, next) => {
    if (frontendUrl && !isSameOrigin) {
      res.setHeader('Access-Control-Allow-Origin', frontendUrl);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    } else {
      // If no frontend URL is set or same origin, allow the request origin
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fashion-designer-secret-key",
      resave: false,
      saveUninitialized: false,
      name: "connect.sid", // Explicitly set session cookie name
      cookie: {
        // In production on Vercel, always use secure (HTTPS)
        // For same-origin, we can use "lax" which is simpler
        secure: isProduction, // Always secure in production (Vercel uses HTTPS)
        httpOnly: true,
        // Use "lax" for same-origin (simpler and more secure), "none" only for cross-origin
        sameSite: isSameOrigin ? "lax" : "none",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/", // Ensure cookie is available for all paths
        // Don't set domain - let browser handle it automatically
      },
      proxy: true, // Trust proxy (Vercel uses reverse proxy)
    })
  );

  // Files are now served directly from Cloudinary via their URLs
  // No need for a local /uploads endpoint

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        console.log(`Login attempt failed: User not found for email: ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log(`Login attempt failed: Invalid password for email: ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      // Save session before sending response
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log(`Login successful for user: ${user.email}, session ID: ${req.sessionID}`);
            resolve();
          }
        });
      });
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ user: { ...user, password: undefined } });
  });

  app.get("/api/designs", async (req, res) => {
    try {
      const designs = await storage.getDesigns(true);
      res.json(designs);
    } catch (error) {
      console.error("Error fetching designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  app.get("/api/designs/:id", async (req, res) => {
    try {
      const design = await storage.getDesign(req.params.id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json(design);
    } catch (error) {
      console.error("Error fetching design:", error);
      res.status(500).json({ message: "Failed to fetch design" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/book", rateLimit(10, 60000), uploadBookingFiles.array("files", 5), async (req, res) => {
    try {
      const { designId, ...formData } = req.body;

      const parsed = bookingFormSchema.safeParse(formData);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid form data", errors: parsed.error.errors });
      }

      const design = await storage.getDesign(designId);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      let client = await storage.getClientByPhone(formData.phone);
      if (!client) {
        client = await storage.createClient({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          whatsapp: formData.whatsapp || formData.phone,
          address: null,
        });
      }

      let measurement = null;
      if (formData.chest || formData.waist || formData.hips || formData.shoulder || formData.sleeve || formData.length) {
        measurement = await storage.createMeasurement({
          clientId: client.id,
          label: `Booking ${new Date().toLocaleDateString()}`,
          chest: formData.chest || null,
          waist: formData.waist || null,
          hips: formData.hips || null,
          shoulder: formData.shoulder || null,
          sleeve: formData.sleeve || null,
          length: formData.length || null,
          notes: formData.measurementNotes || null,
        });
      }

      const order = await storage.createOrder({
        clientId: client.id,
        designId: designId,
        designerId: design.designerId,
        status: "requested",
        preferredDate: formData.preferredDate ? new Date(formData.preferredDate) : null,
        notes: formData.notes || null,
        measurementId: measurement?.id || null,
      });

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          const cloudinaryUrl = await uploadToCloudinary(file, "fashion-app/orders");
          await storage.createOrderFile({
            orderId: order.id,
            fileUrl: cloudinaryUrl,
            fileType: file.mimetype,
            fileName: file.originalname,
          });
        }
      }

      await storage.createBillingEntry({
        orderId: order.id,
        clientId: client.id,
        description: `${design.title} - Design Fee`,
        amount: design.price,
        paid: false,
      });

      await storage.createNotification({
        userId: design.designerId,
        type: "new_order",
        title: "New Booking",
        message: `${client.name} booked "${design.title}"`,
        metadata: { orderId: order.id, clientId: client.id },
      });

      // Send WhatsApp confirmation message to client automatically
      try {
        const whatsappMessage = whatsappService.generateBookingConfirmationMessage({
          clientName: client.name,
          designTitle: design.title,
          orderId: order.id,
          price: design.price,
          preferredDate: formData.preferredDate 
            ? new Date(formData.preferredDate).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : undefined,
        });

        const phone = client.whatsapp || client.phone;
        
        // Try to send via API (Twilio/WhatsApp Business API) - automatic sending
        const sendResult = await whatsappService.sendMessage(phone, whatsappMessage);
        
        // Save WhatsApp message to database
        await storage.createWhatsAppMessage({
          clientId: client.id,
          orderId: order.id,
          phone,
          message: whatsappMessage,
          status: sendResult.success ? "sent" : "failed",
        });

        const fullOrder = await storage.getOrder(order.id);
        
        // If API sending failed or not configured, provide URL as fallback
        let whatsappUrl = null;
        if (!sendResult.success || process.env.WHATSAPP_PROVIDER === "url") {
          whatsappUrl = whatsappService.getWhatsAppURL(phone, whatsappMessage);
        }

        res.json({ 
          order: fullOrder, 
          client,
          whatsappSent: sendResult.success, // Indicates if message was automatically sent
          whatsappUrl, // Fallback URL if API not configured
        });
      } catch (whatsappError) {
        console.error("WhatsApp notification error:", whatsappError);
        // Don't fail the booking if WhatsApp fails
        const fullOrder = await storage.getOrder(order.id);
        res.json({ order: fullOrder, client });
      }
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/admin/dashboard", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/admin/designs", requireAuth, async (req, res) => {
    try {
      const designs = await storage.getDesigns();
      res.json(designs);
    } catch (error) {
      console.error("Error fetching designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  app.get("/api/admin/designs/:id", requireAuth, async (req, res) => {
    try {
      const design = await storage.getDesign(req.params.id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json(design);
    } catch (error) {
      console.error("Error fetching design:", error);
      res.status(500).json({ message: "Failed to fetch design" });
    }
  });

  app.post("/api/admin/designs", requireAuth, upload.array("newImages", 10), async (req, res) => {
    try {
      const { title, description, price, category, isPublished } = req.body;

      const design = await storage.createDesign({
        designerId: req.session.userId!,
        title,
        description: description || null,
        price,
        category,
        isPublished: isPublished === "true" || isPublished === true,
      });

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const cloudinaryUrl = await uploadToCloudinary(files[i], "fashion-app/designs");
          await storage.createDesignImage({
            designId: design.id,
            imageUrl: cloudinaryUrl,
            sortOrder: i,
          });
        }
      }

      const fullDesign = await storage.getDesign(design.id);
      res.json({ design: fullDesign });
    } catch (error: any) {
      console.error("Create design error:", error);
      const message = error?.message || "Failed to create design";
      res.status(500).json({ message });
    }
  });

  app.put("/api/admin/designs/:id", requireAuth, upload.array("newImages", 10), async (req, res) => {
    try {
      const { title, description, price, category, isPublished, imageOrder } = req.body;
      
      // Handle isPublished as both string and boolean
      const isPublishedValue = isPublished === "true" || isPublished === true;

      await storage.updateDesign(req.params.id, {
        title,
        description: description || null,
        price,
        category,
        isPublished: isPublishedValue,
      });

      if (imageOrder) {
        const order = JSON.parse(imageOrder);
        for (const item of order) {
          if (item.id) {
            await storage.updateDesignImageOrder(item.id, item.sortOrder);
          }
        }
      }

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const existingImages = await storage.getDesignImages(req.params.id);
        const startOrder = existingImages.length;
        for (let i = 0; i < files.length; i++) {
          const cloudinaryUrl = await uploadToCloudinary(files[i], "fashion-app/designs");
          await storage.createDesignImage({
            designId: req.params.id,
            imageUrl: cloudinaryUrl,
            sortOrder: startOrder + i,
          });
        }
      }

      const fullDesign = await storage.getDesign(req.params.id);
      res.json({ design: fullDesign });
    } catch (error: any) {
      console.error("Update design error:", error);
      const message = error?.message || "Failed to update design";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/admin/designs/:id", requireAuth, async (req, res) => {
    try {
      const design = await storage.updateDesign(req.params.id, req.body);
      res.json({ design });
    } catch (error) {
      console.error("Update design error:", error);
      res.status(500).json({ message: "Failed to update design" });
    }
  });

  app.delete("/api/admin/designs/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteDesign(req.params.id);
      res.json({ message: "Design deleted" });
    } catch (error: any) {
      console.error("Delete design error:", error);
      const message = error?.message || "Failed to delete design";
      res.status(500).json({ message });
    }
  });

  app.get("/api/admin/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // This route must come BEFORE /api/admin/clients/:id to avoid matching "all" as an ID
  app.delete("/api/admin/clients/all", requireAuth, async (req, res) => {
    try {
      console.log("Starting delete all clients operation...");
      await storage.deleteAllClients();
      console.log("Delete all clients completed successfully");
      res.json({ message: "All clients deleted successfully" });
    } catch (error: any) {
      console.error("Delete all clients error:", error);
      console.error("Error stack:", error?.stack);
      const message = error?.message || "Failed to delete all clients";
      res.status(500).json({ message });
    }
  });

  app.get("/api/admin/clients/:id", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/admin/clients/:id/measurements", requireAuth, async (req, res) => {
    try {
      const measurement = await storage.createMeasurement({
        clientId: req.params.id,
        ...req.body,
      });
      res.json({ measurement });
    } catch (error) {
      console.error("Create measurement error:", error);
      res.status(500).json({ message: "Failed to create measurement" });
    }
  });

  app.patch("/api/admin/measurements/:id", requireAuth, async (req, res) => {
    try {
      const measurement = await storage.updateMeasurement(req.params.id, req.body);
      res.json({ measurement });
    } catch (error) {
      console.error("Update measurement error:", error);
      res.status(500).json({ message: "Failed to update measurement" });
    }
  });

  app.get("/api/admin/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });


  app.post("/api/admin/orders/:id/billing", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const entry = await storage.createBillingEntry({
        orderId: req.params.id,
        clientId: order.clientId,
        description: req.body.description,
        amount: req.body.amount,
        paid: req.body.paid || false,
      });

      res.json({ entry });
    } catch (error) {
      console.error("Create billing entry error:", error);
      res.status(500).json({ message: "Failed to create billing entry" });
    }
  });

  app.patch("/api/admin/billing/:id", requireAuth, async (req, res) => {
    try {
      const entry = await storage.updateBillingEntry(req.params.id, req.body);
      res.json({ entry });
    } catch (error) {
      console.error("Update billing entry error:", error);
      res.status(500).json({ message: "Failed to update billing entry" });
    }
  });

  app.get("/api/admin/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/admin/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Marked as read" });
    } catch (error) {
      console.error("Mark notification error:", error);
      res.status(500).json({ message: "Failed to mark notification" });
    }
  });

  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const category = await storage.createCategory({ name: req.body.name });
      res.json({ category });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ message: "Category deleted" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.patch("/api/admin/settings/business", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.session.userId!, req.body);
      res.json({ user });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get("/api/admin/export/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      let csv = "ID,Name,Phone,Email,WhatsApp,Address,Total Spent,Outstanding,Created\n";
      for (const client of clients) {
        csv += `"${client.id}","${client.name}","${client.phone}","${client.email || ""}","${client.whatsapp || ""}","${client.address || ""}",${client.totalSpent},${client.outstandingBalance},"${client.createdAt}"\n`;
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=clients.csv");
      res.send(csv);
    } catch (error) {
      console.error("Export clients error:", error);
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  app.get("/api/admin/export/clients/:id", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      let csv = "=== CLIENT INFO ===\n";
      csv += `Name,${client.name}\n`;
      csv += `Phone,${client.phone}\n`;
      csv += `Email,${client.email || ""}\n`;
      csv += `Total Spent,${client.totalSpent}\n`;
      csv += `Outstanding,${client.outstandingBalance}\n\n`;

      csv += "=== ORDERS ===\n";
      csv += "Order ID,Design,Status,Date,Total\n";
      for (const order of client.orders || []) {
        const total = order.billingEntries?.reduce((s, e) => s + parseFloat(e.amount), 0) || 0;
        csv += `"${order.id}","${order.design?.title}","${order.status}","${order.createdAt}",${total}\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=client-${client.id}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export client error:", error);
      res.status(500).json({ message: "Failed to export client" });
    }
  });

  app.get("/api/admin/export/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      let csv = "Order ID,Client,Design,Status,Preferred Date,Total,Paid,Outstanding,Created\n";
      for (const order of orders) {
        const total = order.billingEntries?.reduce((s, e) => s + parseFloat(e.amount), 0) || 0;
        const paid = order.billingEntries?.filter(e => e.paid).reduce((s, e) => s + parseFloat(e.amount), 0) || 0;
        csv += `"${order.id}","${order.client?.name}","${order.design?.title}","${order.status}","${order.preferredDate || ""}",${total},${paid},${total - paid},"${order.createdAt}"\n`;
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
      res.send(csv);
    } catch (error) {
      console.error("Export orders error:", error);
      res.status(500).json({ message: "Failed to export orders" });
    }
  });

  app.get("/api/admin/export/all", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      const orders = await storage.getOrders();
      const designs = await storage.getDesigns();

      const archive = archiver("zip");
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=backup.zip");
      archive.pipe(res);

      let clientsCsv = "ID,Name,Phone,Email,Total Spent,Outstanding\n";
      for (const c of clients) {
        clientsCsv += `"${c.id}","${c.name}","${c.phone}","${c.email || ""}",${c.totalSpent},${c.outstandingBalance}\n`;
      }
      archive.append(clientsCsv, { name: "clients.csv" });

      let ordersCsv = "ID,Client,Design,Status,Created\n";
      for (const o of orders) {
        ordersCsv += `"${o.id}","${o.client?.name}","${o.design?.title}","${o.status}","${o.createdAt}"\n`;
      }
      archive.append(ordersCsv, { name: "orders.csv" });

      let designsCsv = "ID,Title,Category,Price,Published\n";
      for (const d of designs) {
        designsCsv += `"${d.id}","${d.title}","${d.category}",${d.price},${d.isPublished}\n`;
      }
      archive.append(designsCsv, { name: "designs.csv" });

      await archive.finalize();
    } catch (error) {
      console.error("Export all error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.get("/api/admin/orders/:id/invoice", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header with colored background box
      doc.setFillColor(75, 85, 99); // Gray-600
      doc.rect(0, 0, pageWidth, 50, "F");
      
      // Company name in header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(undefined, "bold");
      doc.text("RAJIYA FASHION", pageWidth / 2, 25, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text("Premium Fashion Design Studio", pageWidth / 2, 35, { align: "center" });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Company details box
      let y = 60;
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.roundedRect(20, y, pageWidth / 2 - 30, 40, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("From:", 25, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Rajiya Fashion", 25, y + 16);
      doc.text("D.No. 7/394, Rayachur Street", 25, y + 23);
      doc.text("Main Bazar, Tadipatri-515411", 25, y + 30);
      doc.text("Phone: +91 9182720386", 25, y + 37);

      // Invoice details box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(pageWidth / 2 + 10, y, pageWidth / 2 - 30, 40, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Invoice Details", pageWidth / 2 + 15, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth / 2 + 15, y + 16);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageWidth / 2 + 15, y + 23);
      doc.text(`Status: ${order.status.replace(/_/g, " ").toUpperCase()}`, pageWidth / 2 + 15, y + 30);
      doc.text(`Order #: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth / 2 + 15, y + 37);

      // Bill To section
      y = 110;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Bill To:", 25, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(order.client?.name || "", 25, y + 17);
      doc.text(order.client?.phone || "", 25, y + 25);
      if (order.client?.email) {
        doc.text(order.client.email, 25, y + 33);
      }

      // Items table header
      y = 155;
      doc.setFillColor(75, 85, 99);
      doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Description", 25, y + 8);
      doc.text("Amount", pageWidth - 70, y + 8, { align: "right" });
      doc.text("Status", pageWidth - 25, y + 8, { align: "right" });
      doc.setTextColor(0, 0, 0);

      // Items table rows
      y += 15;
      let total = 0;
      let paid = 0;
      let rowColor = false;

      for (const entry of order.billingEntries || []) {
        // Alternate row colors
        if (rowColor) {
          doc.setFillColor(249, 250, 251);
          doc.rect(20, y - 5, pageWidth - 40, 10, "F");
        }
        rowColor = !rowColor;

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(entry.description, 25, y);
        doc.text(`₹${parseFloat(entry.amount).toFixed(2)}`, pageWidth - 70, y, { align: "right" });
        
        // Status with color
        const statusText = entry.paid ? "Paid" : "Pending";
        const statusColor = entry.paid ? [34, 197, 94] : [251, 191, 36]; // Green or Amber
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFont(undefined, "bold");
        doc.text(statusText, pageWidth - 25, y, { align: "right" });
        doc.setTextColor(0, 0, 0);
        
        total += parseFloat(entry.amount);
        if (entry.paid) paid += parseFloat(entry.amount);
        y += 10;
      }

      // Summary box
      y += 10;
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.roundedRect(pageWidth - 90, y, 70, 50, 3, 3, "F");
      
      doc.setDrawColor(200, 200, 200);
      doc.line(pageWidth - 85, y + 15, pageWidth - 25, y + 15);
      doc.line(pageWidth - 85, y + 30, pageWidth - 25, y + 30);

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary", pageWidth - 85, y + 10);
      
      doc.setFont(undefined, "normal");
      doc.text("Total:", pageWidth - 85, y + 23);
      doc.text(`₹${total.toFixed(2)}`, pageWidth - 25, y + 23, { align: "right" });
      
      doc.text("Paid:", pageWidth - 85, y + 38);
      doc.text(`₹${paid.toFixed(2)}`, pageWidth - 25, y + 38, { align: "right" });
      
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38); // Red for balance
      doc.text("Balance Due:", pageWidth - 85, y + 48);
      doc.text(`₹${(total - paid).toFixed(2)}`, pageWidth - 25, y + 48, { align: "right" });
      doc.setTextColor(0, 0, 0);

      // Footer
      y = pageHeight - 30;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for your business! We appreciate your trust in Rajiya Fashion.", pageWidth / 2, y, { align: "center" });
      doc.text("For any queries, please contact us at +91 9182720386", pageWidth / 2, y + 6, { align: "center" });
      doc.setTextColor(0, 0, 0);

      const pdfBuffer = doc.output("arraybuffer");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.id.slice(0, 8)}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  app.get("/api/admin/clients/:clientId/billing/invoice", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const billingEntries = await storage.getBillingEntriesByClient(req.params.clientId);
      if (!billingEntries || billingEntries.length === 0) {
        return res.status(404).json({ message: "No billing entries found" });
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header with colored background box
      doc.setFillColor(75, 85, 99);
      doc.rect(0, 0, pageWidth, 50, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(undefined, "bold");
      doc.text("BILLING STATEMENT", pageWidth / 2, 25, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text("Complete Transaction History", pageWidth / 2, 35, { align: "center" });

      doc.setTextColor(0, 0, 0);

      // Company details box
      let y = 60;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, y, pageWidth / 2 - 30, 40, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("From:", 25, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Rajiya Fashion", 25, y + 16);
      doc.text("D.No. 7/394, Rayachur Street", 25, y + 23);
      doc.text("Main Bazar, Tadipatri-515411", 25, y + 30);
      doc.text("Phone: +91 9182720386", 25, y + 37);

      // Statement details box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(pageWidth / 2 + 10, y, pageWidth / 2 - 30, 40, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Statement Details", pageWidth / 2 + 15, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`Statement Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageWidth / 2 + 15, y + 16);
      doc.text(`Client ID: ${client.id.slice(0, 8).toUpperCase()}`, pageWidth / 2 + 15, y + 23);
      doc.text(`Entries: ${billingEntries.length}`, pageWidth / 2 + 15, y + 30);

      // Bill To section
      y = 110;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Bill To:", 25, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(client.name || "", 25, y + 17);
      doc.text(client.phone || "", 25, y + 25);
      if (client.email) {
        doc.text(client.email, 25, y + 33);
      }

      // Items table header
      y = 155;
      doc.setFillColor(75, 85, 99);
      doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Date", 25, y + 8);
      doc.text("Description", 60, y + 8);
      doc.text("Amount", pageWidth - 50, y + 8, { align: "right" });
      doc.text("Status", pageWidth - 25, y + 8, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 15;

      doc.setFont(undefined, "normal");
      let total = 0;
      let paid = 0;

      // Get orders for billing entries to show order info
      const orderIds = [...new Set(billingEntries.map(e => e.orderId).filter(Boolean))];
      const ordersMap = new Map();
      if (orderIds.length > 0) {
        for (const orderId of orderIds) {
          try {
            const order = await storage.getOrder(orderId);
            if (order) ordersMap.set(orderId, order);
          } catch (e) {
            // Ignore errors
          }
        }
      }

      let rowColor = false;
      for (const entry of billingEntries) {
        // Check if we need a new page
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 30;
          // Redraw header on new page
          doc.setFillColor(75, 85, 99);
          doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text("Date", 25, y + 8);
          doc.text("Description", 60, y + 8);
          doc.text("Amount", pageWidth - 50, y + 8, { align: "right" });
          doc.text("Status", pageWidth - 25, y + 8, { align: "right" });
          doc.setTextColor(0, 0, 0);
          y += 15;
          rowColor = false;
        }

        // Alternate row colors
        if (rowColor) {
          doc.setFillColor(249, 250, 251);
          doc.rect(20, y - 5, pageWidth - 40, 10, "F");
        }
        rowColor = !rowColor;

        const entryDate = new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(entryDate, 25, y);
        
        let description = entry.description;
        if (entry.orderId && ordersMap.has(entry.orderId)) {
          const order = ordersMap.get(entry.orderId);
          description += ` (${order.design?.title || "N/A"})`;
        }
        
        // Truncate description if too long
        if (description.length > 45) {
          description = description.substring(0, 42) + "...";
        }
        doc.text(description, 60, y);
        
        doc.text(`₹${parseFloat(entry.amount).toFixed(2)}`, pageWidth - 50, y, { align: "right" });
        
        // Status with color
        const statusText = entry.paid ? "Paid" : "Pending";
        const statusColor = entry.paid ? [34, 197, 94] : [251, 191, 36];
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFont(undefined, "bold");
        doc.text(statusText, pageWidth - 25, y, { align: "right" });
        doc.setTextColor(0, 0, 0);
        
        total += parseFloat(entry.amount);
        if (entry.paid) paid += parseFloat(entry.amount);
        y += 10;
      }

      // Check if we need a new page for summary
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 30;
      }

      // Summary box
      y += 10;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(pageWidth - 90, y, 70, 55, 3, 3, "F");
      
      doc.setDrawColor(200, 200, 200);
      doc.line(pageWidth - 85, y + 15, pageWidth - 25, y + 15);
      doc.line(pageWidth - 85, y + 30, pageWidth - 25, y + 30);
      doc.line(pageWidth - 85, y + 45, pageWidth - 25, y + 45);

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Summary", pageWidth - 85, y + 10);
      
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Total Amount:", pageWidth - 85, y + 23);
      doc.text(`₹${total.toFixed(2)}`, pageWidth - 25, y + 23, { align: "right" });
      
      doc.text("Total Paid:", pageWidth - 85, y + 38);
      doc.text(`₹${paid.toFixed(2)}`, pageWidth - 25, y + 38, { align: "right" });
      
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text("Outstanding:", pageWidth - 85, y + 53);
      doc.text(`₹${(total - paid).toFixed(2)}`, pageWidth - 25, y + 53, { align: "right" });
      doc.setTextColor(0, 0, 0);

      // Footer
      y = pageHeight - 30;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for your business! We appreciate your trust in Rajiya Fashion.", pageWidth / 2, y, { align: "center" });
      doc.text("For any queries, please contact us at +91 9182720386", pageWidth / 2, y + 6, { align: "center" });
      doc.setTextColor(0, 0, 0);

      const pdfBuffer = doc.output("arraybuffer");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=billing-statement-${client.id.slice(0, 8)}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Billing statement generation error:", error);
      res.status(500).json({ message: "Failed to generate billing statement" });
    }
  });

  app.get("/api/admin/billing/:id/invoice", requireAuth, async (req, res) => {
    try {
      // Get billing entry from database
      const db = await storage.getDb();
      const billingEntryDoc = await db.collection("billing_entries").findOne({ id: req.params.id });
      if (!billingEntryDoc) {
        return res.status(404).json({ message: "Billing entry not found" });
      }

      // Convert to BillingEntry format using the same helper function
      const billingEntry = {
        id: billingEntryDoc.id || billingEntryDoc._id?.toString() || "",
        orderId: billingEntryDoc.orderId,
        clientId: billingEntryDoc.clientId,
        description: billingEntryDoc.description,
        amount: billingEntryDoc.amount,
        paid: billingEntryDoc.paid ?? false,
        createdAt: billingEntryDoc.createdAt || new Date(),
      };

      const order = billingEntry.orderId ? await storage.getOrder(billingEntry.orderId) : null;
      const client = await storage.getClient(billingEntry.clientId);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header with colored background box
      doc.setFillColor(75, 85, 99);
      doc.rect(0, 0, pageWidth, 50, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(undefined, "bold");
      doc.text("INVOICE", pageWidth / 2, 25, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text("Premium Fashion Design Studio", pageWidth / 2, 35, { align: "center" });

      doc.setTextColor(0, 0, 0);

      // Company details box
      let y = 60;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, y, pageWidth / 2 - 30, 40, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("From:", 25, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Rajiya Fashion", 25, y + 16);
      doc.text("D.No. 7/394, Rayachur Street", 25, y + 23);
      doc.text("Main Bazar, Tadipatri-515411", 25, y + 30);
      doc.text("Phone: +91 9182720386", 25, y + 37);

      // Invoice details box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(pageWidth / 2 + 10, y, pageWidth / 2 - 30, 40, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Invoice Details", pageWidth / 2 + 15, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`Invoice #: ${billingEntry.id.slice(0, 8).toUpperCase()}`, pageWidth / 2 + 15, y + 16);
      doc.text(`Date: ${new Date(billingEntry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageWidth / 2 + 15, y + 23);
      const statusColor = billingEntry.paid ? [34, 197, 94] : [251, 191, 36];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFont(undefined, "bold");
      doc.text(`Status: ${billingEntry.paid ? "PAID" : "PENDING"}`, pageWidth / 2 + 15, y + 30);
      doc.setTextColor(0, 0, 0);
      if (order) {
        doc.setFont(undefined, "normal");
        doc.text(`Order: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth / 2 + 15, y + 37);
      }

      // Bill To section
      y = 110;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Bill To:", 25, y + 8);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(client?.name || "", 25, y + 17);
      doc.text(client?.phone || "", 25, y + 25);
      if (client?.email) {
        doc.text(client.email, 25, y + 33);
      }

      // Items table header
      y = 155;
      doc.setFillColor(75, 85, 99);
      doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Description", 25, y + 8);
      doc.text("Amount", pageWidth - 70, y + 8, { align: "right" });
      doc.text("Status", pageWidth - 25, y + 8, { align: "right" });
      doc.setTextColor(0, 0, 0);

      // Item row
      y += 15;
      doc.setFillColor(249, 250, 251);
      doc.rect(20, y - 5, pageWidth - 40, 25, "F");
      
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(billingEntry.description, 25, y);
      
      if (order) {
        doc.setFontSize(9);
        doc.setFont(undefined, "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(`Related Order: ${order.design?.title || "N/A"}`, 25, y + 8);
        doc.text(`Order ID: ${order.id.slice(0, 8).toUpperCase()}`, 25, y + 15);
        doc.setTextColor(0, 0, 0);
      }
      
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(`₹${parseFloat(billingEntry.amount).toFixed(2)}`, pageWidth - 70, y, { align: "right" });
      
      const statusText = billingEntry.paid ? "Paid" : "Pending";
      const statusTextColor = billingEntry.paid ? [34, 197, 94] : [251, 191, 36];
      doc.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
      doc.text(statusText, pageWidth - 25, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 30;

      // Summary box
      y += 10;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(pageWidth - 90, y, 70, 40, 3, 3, "F");
      
      doc.setDrawColor(200, 200, 200);
      doc.line(pageWidth - 85, y + 15, pageWidth - 25, y + 15);

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary", pageWidth - 85, y + 10);
      
      doc.setFont(undefined, "normal");
      doc.text("Total Amount:", pageWidth - 85, y + 23);
      doc.text(`₹${parseFloat(billingEntry.amount).toFixed(2)}`, pageWidth - 25, y + 23, { align: "right" });
      
      doc.setFont(undefined, "bold");
      doc.text("Payment Status:", pageWidth - 85, y + 38);
      doc.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
      doc.text(billingEntry.paid ? "PAID" : "PENDING", pageWidth - 25, y + 38, { align: "right" });
      doc.setTextColor(0, 0, 0);

      // Footer
      y = pageHeight - 30;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for your business! We appreciate your trust in Rajiya Fashion.", pageWidth / 2, y, { align: "center" });
      doc.text("For any queries, please contact us at +91 9182720386", pageWidth / 2, y + 6, { align: "center" });
      doc.setTextColor(0, 0, 0);

      const pdfBuffer = doc.output("arraybuffer");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${billingEntry.id.slice(0, 8)}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Billing invoice generation error:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // ==================== WhatsApp Integration ====================
  
  app.post("/api/whatsapp/send", requireAuth, async (req, res) => {
    try {
      const { clientId, message, orderId } = req.body;
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const phone = client.whatsapp || client.phone;
      const result = await whatsappService.sendMessage(phone, message);

      if (result.success) {
        // Save WhatsApp message to database
        await storage.createWhatsAppMessage({
          clientId,
          orderId: orderId || null,
          phone,
          message,
          status: "sent",
        });

        res.json({ success: true, messageId: result.messageId });
      } else {
        // Save as failed
        await storage.createWhatsAppMessage({
          clientId,
          orderId: orderId || null,
          phone,
          message,
          status: "failed",
        });

        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      res.status(500).json({ message: "Failed to send WhatsApp message" });
    }
  });

  app.get("/api/whatsapp/messages/:clientId", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getWhatsAppMessages(req.params.clientId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Auto-send WhatsApp notification on order status change
  app.patch("/api/admin/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);

      if (req.body.status) {
        const fullOrder = await storage.getOrder(req.params.id);
        if (fullOrder) {
          // Create admin notification
          await storage.createNotification({
            userId: req.session.userId!,
            type: "order_status_changed",
            title: "Order Updated",
            message: `Order for "${fullOrder.design?.title}" is now ${req.body.status.replace(/_/g, " ")}`,
            metadata: { orderId: req.params.id },
          });

          // Automatically send WhatsApp notification to client
          try {
            const whatsappMessage = whatsappService.generateOrderStatusMessage({
              id: fullOrder.id,
              designTitle: fullOrder.design?.title || "Your order",
              status: req.body.status,
              clientName: fullOrder.client?.name || "Client",
              orderNumber: fullOrder.id.slice(0, 8),
            });

            const client = fullOrder.client;
            if (client) {
              const phone = client.whatsapp || client.phone;
              // Send automatically via API (if configured)
              const result = await whatsappService.sendMessage(phone, whatsappMessage);
              
              await storage.createWhatsAppMessage({
                clientId: client.id,
                orderId: fullOrder.id,
                phone,
                message: whatsappMessage,
                status: result.success ? "sent" : "failed",
              });

              if (!result.success && process.env.WHATSAPP_PROVIDER === "url") {
                console.log("WhatsApp API not configured. Message would be sent via URL method.");
              }
            }
          } catch (whatsappError) {
            console.error("WhatsApp notification error:", whatsappError);
            // Don't fail the request if WhatsApp fails
          }
        }
      }

      res.json({ order });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // ==================== Client Portal ====================

  // Request OTP for client login
  app.post("/api/client/request-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      let client = await storage.getClientByPhone(phone);
      if (!client) {
        // Create client if doesn't exist
        client = await storage.createClient({
          name: "Client",
          phone,
          whatsapp: phone,
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.updateClient(client.id, {
        otp,
        otpExpires,
      });

      // Send OTP via WhatsApp automatically (via API if configured)
      try {
        const whatsappMessage = whatsappService.generateOTPMessage(client.name, otp);
        const whatsappPhone = client.whatsapp || client.phone;
        
        // Try to send via API (Twilio/WhatsApp Business API) - automatic sending
        const sendResult = await whatsappService.sendMessage(whatsappPhone, whatsappMessage);
        
        // Save WhatsApp message to database
        await storage.createWhatsAppMessage({
          clientId: client.id,
          phone: whatsappPhone,
          message: whatsappMessage,
          status: sendResult.success ? "sent" : "failed",
        });

        // If API sending failed or not configured, provide URL as fallback
        let whatsappUrl = null;
        if (!sendResult.success || process.env.WHATSAPP_PROVIDER === "url") {
          whatsappUrl = whatsappService.getWhatsAppURL(whatsappPhone, whatsappMessage);
        }

        if (sendResult.success) {
          res.json({ 
            success: true, 
            message: "OTP sent to your WhatsApp automatically",
            whatsappSent: true,
          });
        } else {
          // API not configured or failed - use URL fallback
          res.json({ 
            success: true, 
            message: "OTP ready. Please open WhatsApp to receive it.",
            whatsappSent: false,
            whatsappUrl, // Return URL for frontend to open
          });
        }
      } catch (whatsappError) {
        console.error("WhatsApp OTP send error:", whatsappError);
        // Fallback: generate URL
        const whatsappPhone = client.whatsapp || client.phone;
        const whatsappMessage = whatsappService.generateOTPMessage(client.name, otp);
        const whatsappUrl = whatsappService.getWhatsAppURL(whatsappPhone, whatsappMessage);
        
        res.json({ 
          success: true, 
          message: "OTP ready. Please open WhatsApp to receive it.",
          whatsappSent: false,
          whatsappUrl,
        });
      }
    } catch (error) {
      console.error("Request OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Client login (OTP or password)
  app.post("/api/client/login", async (req, res) => {
    try {
      const { phone, otp, password } = req.body;
      
      const client = await storage.getClientByPhone(phone);
      if (!client) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // OTP login
      if (otp) {
        if (client.otp !== otp) {
          return res.status(401).json({ message: "Invalid OTP" });
        }
        if (client.otpExpires && new Date() > new Date(client.otpExpires)) {
          return res.status(401).json({ message: "OTP expired" });
        }
        // Clear OTP after successful login
        await storage.updateClient(client.id, { otp: undefined, otpExpires: undefined });
      }
      // Password login
      else if (password) {
        if (!client.password) {
          return res.status(401).json({ message: "Password not set. Please use OTP login." });
        }
        const isValid = await bcrypt.compare(password, client.password);
        if (!isValid) {
          return res.status(401).json({ message: "Invalid password" });
        }
      } else {
        return res.status(400).json({ message: "OTP or password required" });
      }

      // Set client session
      req.session.clientId = client.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ client: { ...client, password: undefined, otp: undefined } });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Client logout
  app.post("/api/client/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Get current client
  app.get("/api/client/me", async (req, res) => {
    if (!req.session.clientId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await storage.getClient(req.session.clientId);
    if (!client) {
      return res.status(401).json({ message: "Client not found" });
    }

    res.json({ client: { ...client, password: undefined, otp: undefined } });
  });

  // Client routes (require client authentication)
  const requireClientAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.clientId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Get client's orders
  app.get("/api/client/orders", requireClientAuth, async (req, res) => {
    try {
      const orders = await storage.getOrdersByClient(req.session.clientId!);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching client orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get client's order details
  app.get("/api/client/orders/:id", requireClientAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order || order.clientId !== req.session.clientId) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get client's measurements
  app.get("/api/client/measurements", requireClientAuth, async (req, res) => {
    try {
      const measurements = await storage.getMeasurements(req.session.clientId!);
      res.json(measurements);
    } catch (error) {
      console.error("Error fetching measurements:", error);
      res.status(500).json({ message: "Failed to fetch measurements" });
    }
  });

  // Get client's billing entries
  app.get("/api/client/billing", requireClientAuth, async (req, res) => {
    try {
      const entries = await storage.getBillingEntriesByClient(req.session.clientId!);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching billing:", error);
      res.status(500).json({ message: "Failed to fetch billing" });
    }
  });

  // Get messages between client and designer
  app.get("/api/client/messages", requireClientAuth, async (req, res) => {
    try {
      const client = await storage.getClient(req.session.clientId!);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Get designer ID from first order or use a default
      const orders = await storage.getOrdersByClient(req.session.clientId!);
      const designerId = orders[0]?.designerId || req.session.userId;

      if (!designerId) {
        return res.status(400).json({ message: "No designer found" });
      }

      const messages = await storage.getMessages(req.session.clientId!, designerId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get unread message count for client
  app.get("/api/client/messages/unread", requireClientAuth, async (req, res) => {
    try {
      const orders = await storage.getOrdersByClient(req.session.clientId!);
      const designerId = orders[0]?.designerId || req.session.userId;

      if (!designerId) {
        return res.json({ count: 0 });
      }

      const count = await storage.getUnreadMessageCount(req.session.clientId!, designerId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.json({ count: 0 });
    }
  });

  // Send message from client
  app.post("/api/client/messages", requireClientAuth, async (req, res) => {
    try {
      const { message, orderId } = req.body;
      
      const client = await storage.getClient(req.session.clientId!);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Get designer ID
      const orders = await storage.getOrdersByClient(req.session.clientId!);
      const designerId = orders[0]?.designerId || req.session.userId;

      if (!designerId) {
        return res.status(400).json({ message: "No designer found" });
      }

      const newMessage = await storage.createMessage({
        clientId: req.session.clientId!,
        designerId,
        orderId: orderId || null,
        sender: "client",
        message,
      });

      res.json({ message: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Update client profile
  app.patch("/api/client/profile", requireClientAuth, async (req, res) => {
    try {
      const { name, email, address, password } = req.body;
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (address) updateData.address = address;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const client = await storage.updateClient(req.session.clientId!, updateData);
      res.json({ client: { ...client, password: undefined } });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // 404 handler for API routes (must be last)
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  return httpServer;
}

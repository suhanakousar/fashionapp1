import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { jsPDF } from "jspdf";
import archiver from "archiver";
import { bookingFormSchema, insertBillingEntrySchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
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

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
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
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fashion-designer-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  }, express.static(path.join(process.cwd(), "uploads")));

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
      console.log(`Login successful for user: ${user.email}`);
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

  app.post("/api/book", rateLimit(10, 60000), upload.array("files", 5), async (req, res) => {
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
          await storage.createOrderFile({
            orderId: order.id,
            fileUrl: `/uploads/${file.filename}`,
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

      const fullOrder = await storage.getOrder(order.id);
      res.json({ order: fullOrder, client });
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
          await storage.createDesignImage({
            designId: design.id,
            imageUrl: `/uploads/${files[i].filename}`,
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
          await storage.createDesignImage({
            designId: req.params.id,
            imageUrl: `/uploads/${files[i].filename}`,
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

  app.patch("/api/admin/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);

      if (req.body.status) {
        const fullOrder = await storage.getOrder(req.params.id);
        if (fullOrder) {
          await storage.createNotification({
            userId: req.session.userId!,
            type: "order_status_changed",
            title: "Order Updated",
            message: `Order for "${fullOrder.design?.title}" is now ${req.body.status.replace(/_/g, " ")}`,
            metadata: { orderId: req.params.id },
          });
        }
      }

      res.json({ order });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order" });
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

      doc.setFontSize(24);
      doc.text("INVOICE", pageWidth / 2, 30, { align: "center" });

      doc.setFontSize(12);
      doc.text("Rajiya Fashion", 20, 50);
      doc.setFontSize(10);
      doc.text("D.No. 7/394, Rayachur Street, Main Bazar", 20, 58);
      doc.text("Tadipatri-515411", 20, 65);
      doc.text("Phone: 9182720386", 20, 72);

      doc.setFontSize(10);
      doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 70, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 70, 58);
      doc.text(`Status: ${order.status.replace(/_/g, " ").toUpperCase()}`, pageWidth - 70, 65);

      doc.setFontSize(12);
      doc.text("Bill To:", 20, 85);
      doc.setFontSize(10);
      doc.text(order.client?.name || "", 20, 93);
      doc.text(order.client?.phone || "", 20, 100);
      if (order.client?.email) {
        doc.text(order.client.email, 20, 107);
      }

      let y = 130;
      doc.setFontSize(10);
      doc.setDrawColor(200);
      doc.line(20, y, pageWidth - 20, y);
      y += 5;

      doc.setFont(undefined, "bold");
      doc.text("Description", 20, y);
      doc.text("Amount", pageWidth - 50, y, { align: "right" });
      doc.text("Status", pageWidth - 20, y, { align: "right" });
      y += 5;
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      doc.setFont(undefined, "normal");
      let total = 0;
      let paid = 0;

      for (const entry of order.billingEntries || []) {
        doc.text(entry.description, 20, y);
        doc.text(`₹${parseFloat(entry.amount).toFixed(2)}`, pageWidth - 50, y, { align: "right" });
        doc.text(entry.paid ? "Paid" : "Pending", pageWidth - 20, y, { align: "right" });
        total += parseFloat(entry.amount);
        if (entry.paid) paid += parseFloat(entry.amount);
        y += 8;
      }

      y += 5;
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      doc.setFont(undefined, "bold");
      doc.text("Total:", pageWidth - 80, y);
      doc.text(`₹${total.toFixed(2)}`, pageWidth - 20, y, { align: "right" });
      y += 8;
      doc.text("Paid:", pageWidth - 80, y);
      doc.text(`₹${paid.toFixed(2)}`, pageWidth - 20, y, { align: "right" });
      y += 8;
      doc.text("Balance Due:", pageWidth - 80, y);
      doc.text(`₹${(total - paid).toFixed(2)}`, pageWidth - 20, y, { align: "right" });

      y += 30;
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

      const pdfBuffer = doc.output("arraybuffer");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.id.slice(0, 8)}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  return httpServer;
}

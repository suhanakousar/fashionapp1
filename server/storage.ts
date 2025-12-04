import {
  type User,
  type InsertUser,
  type Design,
  type InsertDesign,
  type DesignImage,
  type InsertDesignImage,
  type Client,
  type InsertClient,
  type Measurement,
  type InsertMeasurement,
  type Order,
  type InsertOrder,
  type OrderFile,
  type InsertOrderFile,
  type BillingEntry,
  type InsertBillingEntry,
  type Notification,
  type InsertNotification,
  type Category,
  type InsertCategory,
  type Message,
  type InsertMessage,
  type WhatsAppMessage,
  type InsertWhatsAppMessage,
  type FusionJob,
  type InsertFusionJob,
  type DesignWithImages,
  type ClientWithDetails,
  type OrderWithDetails,
  generateId,
} from "../shared/schema.js";
import { getDb } from "./db.js";
import { ObjectId } from "mongodb";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getDesigns(published?: boolean): Promise<DesignWithImages[]>;
  getDesign(id: string): Promise<DesignWithImages | undefined>;
  createDesign(design: InsertDesign): Promise<Design>;
  updateDesign(id: string, data: Partial<Design>): Promise<Design | undefined>;
  deleteDesign(id: string): Promise<void>;

  getDesignImages(designId: string): Promise<DesignImage[]>;
  createDesignImage(image: InsertDesignImage): Promise<DesignImage>;
  updateDesignImageOrder(id: string, sortOrder: number): Promise<void>;
  deleteDesignImage(id: string): Promise<void>;
  deleteDesignImages(designId: string): Promise<void>;

  getClients(): Promise<ClientWithDetails[]>;
  getClient(id: string): Promise<ClientWithDetails | undefined>;
  getClientByPhone(phone: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<Client>): Promise<Client | undefined>;
  deleteAllClients(): Promise<void>;

  getMeasurements(clientId: string): Promise<Measurement[]>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  updateMeasurement(id: string, data: Partial<Measurement>): Promise<Measurement | undefined>;

  getOrders(): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  getOrdersByClient(clientId: string): Promise<OrderWithDetails[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;

  getOrderFiles(orderId: string): Promise<OrderFile[]>;
  createOrderFile(file: InsertOrderFile): Promise<OrderFile>;

  getBillingEntries(orderId: string): Promise<BillingEntry[]>;
  getBillingEntriesByClient(clientId: string): Promise<BillingEntry[]>;
  createBillingEntry(entry: InsertBillingEntry): Promise<BillingEntry>;
  updateBillingEntry(id: string, data: Partial<BillingEntry>): Promise<BillingEntry | undefined>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  getDashboardStats(designerId: string): Promise<{
    newOrders: number;
    totalClients: number;
    pendingPayments: number;
    totalDesigns: number;
    recentOrders: OrderWithDetails[];
    upcomingDeliveries: OrderWithDetails[];
  }>;

  // Client authentication
  getClientByPhone(phone: string): Promise<Client | undefined>;
  updateClient(id: string, data: Partial<Client>): Promise<Client | undefined>;

  // Messages
  getMessages(clientId: string, designerId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageRead(id: string): Promise<void>;
  getUnreadMessageCount(clientId: string, designerId: string): Promise<number>;

  // WhatsApp messages
  createWhatsAppMessage(message: InsertWhatsAppMessage): Promise<WhatsAppMessage>;
  getWhatsAppMessages(clientId: string): Promise<WhatsAppMessage[]>;

  // Fusion jobs
  createFusionJob(job: InsertFusionJob): Promise<FusionJob>;
  getFusionJob(jobId: string): Promise<FusionJob | undefined>;
  updateFusionJob(jobId: string, data: Partial<FusionJob>): Promise<FusionJob | undefined>;
  deleteFusionJob(jobId: string): Promise<void>;
}

// Helper function to convert MongoDB document to our type
function toUser(doc: any): User {
  return {
    id: doc.id || doc._id?.toString() || "",
    name: doc.name,
    email: doc.email,
    password: doc.password,
    role: doc.role || "designer",
    businessName: doc.businessName,
    businessPhone: doc.businessPhone,
    businessAddress: doc.businessAddress,
    createdAt: doc.createdAt || new Date(),
  };
}

function toDesign(doc: any): Design {
  return {
    id: doc.id || doc._id?.toString() || "",
    designerId: doc.designerId,
    title: doc.title,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    isPublished: doc.isPublished ?? false,
    createdAt: doc.createdAt || new Date(),
  };
}

function toDesignImage(doc: any): DesignImage {
  return {
    id: doc.id || doc._id?.toString() || "",
    designId: doc.designId,
    imageUrl: doc.imageUrl,
    sortOrder: doc.sortOrder ?? 0,
    createdAt: doc.createdAt || new Date(),
  };
}

function toClient(doc: any): Client {
  return {
    id: doc.id || doc._id?.toString() || "",
    name: doc.name,
    phone: doc.phone,
    whatsapp: doc.whatsapp,
    email: doc.email,
    address: doc.address,
    password: doc.password,
    otp: doc.otp,
    otpExpires: doc.otpExpires,
    magicLinkToken: doc.magicLinkToken,
    magicLinkExpires: doc.magicLinkExpires,
    qrLoginToken: doc.qrLoginToken,
    qrLoginExpires: doc.qrLoginExpires,
    createdAt: doc.createdAt || new Date(),
  };
}

function toMessage(doc: any): Message {
  return {
    id: doc.id || doc._id?.toString() || "",
    clientId: doc.clientId,
    designerId: doc.designerId,
    orderId: doc.orderId,
    sender: doc.sender,
    message: doc.message,
    read: doc.read ?? false,
    createdAt: doc.createdAt || new Date(),
  };
}

function toWhatsAppMessage(doc: any): WhatsAppMessage {
  return {
    id: doc.id || doc._id?.toString() || "",
    clientId: doc.clientId,
    orderId: doc.orderId,
    phone: doc.phone,
    message: doc.message,
    status: doc.status || "pending",
    sentAt: doc.sentAt,
    createdAt: doc.createdAt || new Date(),
  };
}

function toMeasurement(doc: any): Measurement {
  return {
    id: doc.id || doc._id?.toString() || "",
    clientId: doc.clientId,
    label: doc.label,
    chest: doc.chest,
    waist: doc.waist,
    hips: doc.hips,
    shoulder: doc.shoulder,
    sleeve: doc.sleeve,
    length: doc.length,
    inseam: doc.inseam,
    neck: doc.neck,
    customMeasurements: doc.customMeasurements,
    notes: doc.notes,
    createdAt: doc.createdAt || new Date(),
  };
}

function toOrder(doc: any): Order {
  return {
    id: doc.id || doc._id?.toString() || "",
    clientId: doc.clientId,
    designId: doc.designId,
    designerId: doc.designerId,
    status: doc.status || "requested",
    preferredDate: doc.preferredDate,
    notes: doc.notes,
    measurementId: doc.measurementId,
    createdAt: doc.createdAt || new Date(),
  };
}

function toOrderFile(doc: any): OrderFile {
  return {
    id: doc.id || doc._id?.toString() || "",
    orderId: doc.orderId,
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileName: doc.fileName,
    createdAt: doc.createdAt || new Date(),
  };
}

function toBillingEntry(doc: any): BillingEntry {
  return {
    id: doc.id || doc._id?.toString() || "",
    orderId: doc.orderId,
    clientId: doc.clientId,
    description: doc.description,
    amount: doc.amount,
    paid: doc.paid ?? false,
    createdAt: doc.createdAt || new Date(),
  };
}

function toNotification(doc: any): Notification {
  return {
    id: doc.id || doc._id?.toString() || "",
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    read: doc.read ?? false,
    metadata: doc.metadata,
    createdAt: doc.createdAt || new Date(),
  };
}

function toCategory(doc: any): Category {
  return {
    id: doc.id || doc._id?.toString() || "",
    name: doc.name,
    createdAt: doc.createdAt || new Date(),
  };
}

export class DatabaseStorage implements IStorage {
  private async getDb() {
    return getDb();
  }

  async getUser(id: string): Promise<User | undefined> {
    const db = await this.getDb();
    const doc = await db.collection("users").findOne({ id });
    return doc ? toUser(doc) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.getDb();
    const doc = await db.collection("users").findOne({ email });
    return doc ? toUser(doc) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = await this.getDb();
    const id = generateId();
    const newUser = {
      id,
      ...user,
      role: user.role || "designer",
      createdAt: new Date(),
    };
    await db.collection("users").insertOne(newUser);
    return toUser(newUser);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const db = await this.getDb();
    const result = await db.collection("users").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ? toUser(result) : undefined;
  }

  async getDesigns(published?: boolean): Promise<DesignWithImages[]> {
    const db = await this.getDb();
    const query = published !== undefined ? { isPublished: published } : {};
    const designs = await db.collection("designs")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    const designIds = designs.map(d => d.id || d._id?.toString() || "");
    const images = await db.collection("design_images")
      .find({ designId: { $in: designIds } })
      .toArray();
    
    const imagesMap = new Map<string, DesignImage[]>();
    for (const img of images) {
      const designId = img.designId;
      if (!imagesMap.has(designId)) {
        imagesMap.set(designId, []);
      }
      imagesMap.get(designId)!.push(toDesignImage(img));
    }
    
    return designs.map(d => ({
      ...toDesign(d),
      images: (imagesMap.get(d.id || d._id?.toString() || "") || []).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  async getDesign(id: string): Promise<DesignWithImages | undefined> {
    const db = await this.getDb();
    const design = await db.collection("designs").findOne({ id });
    if (!design) return undefined;
    
    const images = await db.collection("design_images")
      .find({ designId: id })
      .sort({ sortOrder: 1 })
      .toArray();
    
    return {
      ...toDesign(design),
      images: images.map(toDesignImage),
    };
  }

  async createDesign(design: InsertDesign): Promise<Design> {
    const db = await this.getDb();
    const id = generateId();
    const newDesign = {
      id,
      ...design,
      isPublished: design.isPublished ?? false,
      createdAt: new Date(),
    };
    await db.collection("designs").insertOne(newDesign);
    return toDesign(newDesign);
  }

  async updateDesign(id: string, data: Partial<Design>): Promise<Design | undefined> {
    const db = await this.getDb();
    const result = await db.collection("designs").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ? toDesign(result) : undefined;
  }

  async deleteDesign(id: string): Promise<void> {
    const db = await this.getDb();
    // Get all orders for this design
    const designOrders = await db.collection("orders").find({ designId: id }).toArray();
    const orderIds = designOrders.map(o => o.id || o._id?.toString() || "");
    
    // Delete billing entries for these orders
    if (orderIds.length > 0) {
      await db.collection("billing_entries").deleteMany({ orderId: { $in: orderIds } });
      // Delete order files
      await db.collection("order_files").deleteMany({ orderId: { $in: orderIds } });
    }
    
    // Delete orders
    await db.collection("orders").deleteMany({ designId: id });
    
    // Delete design images
    await db.collection("design_images").deleteMany({ designId: id });
    
    // Finally delete the design
    await db.collection("designs").deleteOne({ id });
  }

  async getDesignImages(designId: string): Promise<DesignImage[]> {
    const db = await this.getDb();
    const images = await db.collection("design_images")
      .find({ designId })
      .sort({ sortOrder: 1 })
      .toArray();
    return images.map(toDesignImage);
  }

  async createDesignImage(image: InsertDesignImage): Promise<DesignImage> {
    const db = await this.getDb();
    const id = generateId();
    const newImage = {
      id,
      ...image,
      sortOrder: image.sortOrder ?? 0,
      createdAt: new Date(),
    };
    await db.collection("design_images").insertOne(newImage);
    return toDesignImage(newImage);
  }

  async updateDesignImageOrder(id: string, sortOrder: number): Promise<void> {
    const db = await this.getDb();
    await db.collection("design_images").updateOne(
      { id },
      { $set: { sortOrder } }
    );
  }

  async deleteDesignImage(id: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("design_images").deleteOne({ id });
  }

  async deleteDesignImages(designId: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("design_images").deleteMany({ designId });
  }

  async getClients(): Promise<ClientWithDetails[]> {
    const db = await this.getDb();
    const clients = await db.collection("clients")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const clientIds = clients.map(c => c.id || c._id?.toString() || "");
    
    const [measurements, orders, billingEntries] = await Promise.all([
      db.collection("measurements").find({ clientId: { $in: clientIds } }).toArray(),
      db.collection("orders").find({ clientId: { $in: clientIds } }).toArray(),
      db.collection("billing_entries").find({ clientId: { $in: clientIds } }).toArray(),
    ]);
    
    const measurementsMap = new Map<string, Measurement[]>();
    for (const m of measurements) {
      const clientId = m.clientId;
      if (!measurementsMap.has(clientId)) {
        measurementsMap.set(clientId, []);
      }
      measurementsMap.get(clientId)!.push(toMeasurement(m));
    }
    
    const ordersMap = new Map<string, Order[]>();
    for (const o of orders) {
      const clientId = o.clientId;
      if (!ordersMap.has(clientId)) {
        ordersMap.set(clientId, []);
      }
      ordersMap.get(clientId)!.push(toOrder(o));
    }
    
    const billingMap = new Map<string, BillingEntry[]>();
    for (const b of billingEntries) {
      const clientId = b.clientId;
      if (!billingMap.has(clientId)) {
        billingMap.set(clientId, []);
      }
      billingMap.get(clientId)!.push(toBillingEntry(b));
    }
    
    return clients.map(client => {
      const clientId = client.id || client._id?.toString() || "";
      const clientBilling = billingMap.get(clientId) || [];
      const totalSpent = clientBilling
        .filter((e) => e.paid)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const outstandingBalance = clientBilling
        .filter((e) => !e.paid)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      return {
        ...toClient(client),
        measurements: measurementsMap.get(clientId) || [],
        orders: (ordersMap.get(clientId) || []) as any, // Will be populated later if needed
        billingEntries: clientBilling,
        totalSpent,
        outstandingBalance,
      };
    });
  }

  async getClient(id: string): Promise<ClientWithDetails | undefined> {
    const db = await this.getDb();
    const client = await db.collection("clients").findOne({ id });
    if (!client) return undefined;
    
    const clientId = client.id || client._id?.toString() || "";
    
    const [measurements, orders, billingEntries] = await Promise.all([
      db.collection("measurements").find({ clientId }).sort({ createdAt: -1 }).toArray(),
      db.collection("orders").find({ clientId }).sort({ createdAt: -1 }).toArray(),
      db.collection("billing_entries").find({ clientId }).sort({ createdAt: -1 }).toArray(),
    ]);
    
    const orderIds = orders.map(o => o.id || o._id?.toString() || "");
    const designIds = orders.map(o => o.designId).filter(Boolean);
    
    const [orderFiles, designs, designImages] = await Promise.all([
      db.collection("order_files").find({ orderId: { $in: orderIds } }).toArray(),
      db.collection("designs").find({ id: { $in: designIds } }).toArray(),
      db.collection("design_images").find({ designId: { $in: designIds } }).toArray(),
    ]);
    
    const billingMap = new Map<string, BillingEntry[]>();
    for (const b of billingEntries) {
      const orderId = b.orderId;
      if (!billingMap.has(orderId)) {
        billingMap.set(orderId, []);
      }
      billingMap.get(orderId)!.push(toBillingEntry(b));
    }
    
    const filesMap = new Map<string, OrderFile[]>();
    for (const f of orderFiles) {
      const orderId = f.orderId;
      if (!filesMap.has(orderId)) {
        filesMap.set(orderId, []);
      }
      filesMap.get(orderId)!.push(toOrderFile(f));
    }
    
    const imagesMap = new Map<string, DesignImage[]>();
    for (const img of designImages) {
      const designId = img.designId;
      if (!imagesMap.has(designId)) {
        imagesMap.set(designId, []);
      }
      imagesMap.get(designId)!.push(toDesignImage(img));
    }
    
    const designsMap = new Map(designs.map(d => [d.id || d._id?.toString() || "", toDesign(d)]));
    
    const orderDetails: OrderWithDetails[] = orders.map(o => {
      const orderId = o.id || o._id?.toString() || "";
      const design = designsMap.get(o.designId);
      return {
        ...toOrder(o),
        client: toClient(client),
        design: design ? {
          ...design,
          images: (imagesMap.get(o.designId) || []).sort((a, b) => a.sortOrder - b.sortOrder),
        } : {} as any,
        files: filesMap.get(orderId) || [],
        billingEntries: billingMap.get(orderId) || [],
        measurement: measurements.find(m => (m.id || m._id?.toString() || "") === o.measurementId) ? toMeasurement(measurements.find(m => (m.id || m._id?.toString() || "") === o.measurementId)) : undefined,
      };
    });
    
    const clientBilling = billingEntries.map(toBillingEntry);
    const totalSpent = clientBilling
      .filter((e) => e.paid)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const outstandingBalance = clientBilling
      .filter((e) => !e.paid)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    return {
      ...toClient(client),
      measurements: measurements.map(toMeasurement),
      orders: orderDetails,
      billingEntries: clientBilling,
      totalSpent,
      outstandingBalance,
    };
  }

  async getClientByPhone(phone: string): Promise<Client | undefined> {
    const db = await this.getDb();
    const doc = await db.collection("clients").findOne({ phone });
    return doc ? toClient(doc) : undefined;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const db = await this.getDb();
    const doc = await db.collection("clients").findOne({ email });
    return doc ? toClient(doc) : undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const db = await this.getDb();
    const id = generateId();
    const newClient = {
      id,
      ...client,
      createdAt: new Date(),
    };
    await db.collection("clients").insertOne(newClient);
    return toClient(newClient);
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client | undefined> {
    const db = await this.getDb();
    const result = await db.collection("clients").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ? toClient(result) : undefined;
  }

  async deleteAllClients(): Promise<void> {
    const db = await this.getDb();
    const allClients = await db.collection("clients").find({}).toArray();
    const clientIds = allClients.map(c => c.id || c._id?.toString() || "");
    
    if (clientIds.length === 0) {
      console.log("No clients to delete");
      return;
    }
    
    console.log(`Starting deletion of ${clientIds.length} clients...`);
    
    try {
      const allOrders = await db.collection("orders").find({ clientId: { $in: clientIds } }).toArray();
      const orderIds = allOrders.map(o => o.id || o._id?.toString() || "");
      console.log(`Found ${orderIds.length} orders to delete`);
      
      if (orderIds.length > 0) {
        await db.collection("billing_entries").deleteMany({ orderId: { $in: orderIds } });
        await db.collection("order_files").deleteMany({ orderId: { $in: orderIds } });
      }
      
      await db.collection("orders").deleteMany({ clientId: { $in: clientIds } });
      await db.collection("billing_entries").deleteMany({ clientId: { $in: clientIds } });
      await db.collection("measurements").deleteMany({ clientId: { $in: clientIds } });
      await db.collection("clients").deleteMany({});
      
      console.log("All clients deleted successfully");
    } catch (error) {
      console.error("Error during client deletion:", error);
      throw error;
    }
  }

  async getMeasurements(clientId: string): Promise<Measurement[]> {
    const db = await this.getDb();
    const measurements = await db.collection("measurements")
      .find({ clientId })
      .sort({ createdAt: -1 })
      .toArray();
    return measurements.map(toMeasurement);
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    const db = await this.getDb();
    const id = generateId();
    const newMeasurement = {
      id,
      ...measurement,
      createdAt: new Date(),
    };
    await db.collection("measurements").insertOne(newMeasurement);
    return toMeasurement(newMeasurement);
  }

  async updateMeasurement(id: string, data: Partial<Measurement>): Promise<Measurement | undefined> {
    const db = await this.getDb();
    const result = await db.collection("measurements").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ? toMeasurement(result) : undefined;
  }

  async getOrders(): Promise<OrderWithDetails[]> {
    const db = await this.getDb();
    const orders = await db.collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const clientIds = [...new Set(orders.map(o => o.clientId))];
    const designIds = [...new Set(orders.map(o => o.designId))];
    const orderIds = orders.map(o => o.id || o._id?.toString() || "");
    const measurementIds = orders.map(o => o.measurementId).filter(Boolean);
    
    const [clients, designs, orderFiles, billingEntries, measurements, designImages] = await Promise.all([
      db.collection("clients").find({ id: { $in: clientIds } }).toArray(),
      db.collection("designs").find({ id: { $in: designIds } }).toArray(),
      db.collection("order_files").find({ orderId: { $in: orderIds } }).toArray(),
      db.collection("billing_entries").find({ orderId: { $in: orderIds } }).toArray(),
      db.collection("measurements").find({ id: { $in: measurementIds } }).toArray(),
      db.collection("design_images").find({ designId: { $in: designIds } }).toArray(),
    ]);
    
    const clientsMap = new Map(clients.map(c => [c.id || c._id?.toString() || "", toClient(c)]));
    const designsMap = new Map(designs.map(d => [d.id || d._id?.toString() || "", toDesign(d)]));
    const measurementsMap = new Map(measurements.map(m => [m.id || m._id?.toString() || "", toMeasurement(m)]));
    
    const filesMap = new Map<string, OrderFile[]>();
    for (const f of orderFiles) {
      const orderId = f.orderId;
      if (!filesMap.has(orderId)) {
        filesMap.set(orderId, []);
      }
      filesMap.get(orderId)!.push(toOrderFile(f));
    }
    
    const billingMap = new Map<string, BillingEntry[]>();
    for (const b of billingEntries) {
      const orderId = b.orderId;
      if (!billingMap.has(orderId)) {
        billingMap.set(orderId, []);
      }
      billingMap.get(orderId)!.push(toBillingEntry(b));
    }
    
    const imagesMap = new Map<string, DesignImage[]>();
    for (const img of designImages) {
      const designId = img.designId;
      if (!imagesMap.has(designId)) {
        imagesMap.set(designId, []);
      }
      imagesMap.get(designId)!.push(toDesignImage(img));
    }
    
    return orders.map(o => {
      const orderId = o.id || o._id?.toString() || "";
      const design = designsMap.get(o.designId);
      return {
        ...toOrder(o),
        client: clientsMap.get(o.clientId) || {} as Client,
        design: design ? {
          ...design,
          images: (imagesMap.get(o.designId) || []).sort((a, b) => a.sortOrder - b.sortOrder),
        } : {} as any,
        files: filesMap.get(orderId) || [],
        billingEntries: billingMap.get(orderId) || [],
        measurement: o.measurementId ? measurementsMap.get(o.measurementId) : undefined,
      };
    });
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const db = await this.getDb();
    const order = await db.collection("orders").findOne({ id });
    if (!order) return undefined;
    
    const [client, design, files, billingEntries, measurement] = await Promise.all([
      db.collection("clients").findOne({ id: order.clientId }),
      db.collection("designs").findOne({ id: order.designId }),
      db.collection("order_files").find({ orderId: id }).toArray(),
      db.collection("billing_entries").find({ orderId: id }).toArray(),
      order.measurementId ? db.collection("measurements").findOne({ id: order.measurementId }) : null,
    ]);
    
    const designImages = design ? await db.collection("design_images")
      .find({ designId: design.id || design._id?.toString() || "" })
      .sort({ sortOrder: 1 })
      .toArray() : [];
    
    return {
      ...toOrder(order),
      client: client ? toClient(client) : {} as Client,
      design: design ? {
        ...toDesign(design),
        images: designImages.map(toDesignImage),
      } : {} as any,
      files: files.map(toOrderFile),
      billingEntries: billingEntries.map(toBillingEntry),
      measurement: measurement ? toMeasurement(measurement) : undefined,
    };
  }

  async getOrdersByClient(clientId: string): Promise<OrderWithDetails[]> {
    const db = await this.getDb();
    const orders = await db.collection("orders")
      .find({ clientId })
      .sort({ createdAt: -1 })
      .toArray();
    
    if (orders.length === 0) return [];
    
    const designIds = [...new Set(orders.map(o => o.designId))];
    const orderIds = orders.map(o => o.id || o._id?.toString() || "");
    const measurementIds = orders.map(o => o.measurementId).filter(Boolean);
    
    const [client, designs, orderFiles, billingEntries, measurements, designImages] = await Promise.all([
      db.collection("clients").findOne({ id: clientId }),
      db.collection("designs").find({ id: { $in: designIds } }).toArray(),
      db.collection("order_files").find({ orderId: { $in: orderIds } }).toArray(),
      db.collection("billing_entries").find({ orderId: { $in: orderIds } }).toArray(),
      db.collection("measurements").find({ id: { $in: measurementIds } }).toArray(),
      db.collection("design_images").find({ designId: { $in: designIds } }).toArray(),
    ]);
    
    const designsMap = new Map(designs.map(d => [d.id || d._id?.toString() || "", toDesign(d)]));
    const measurementsMap = new Map(measurements.map(m => [m.id || m._id?.toString() || "", toMeasurement(m)]));
    
    const filesMap = new Map<string, OrderFile[]>();
    for (const f of orderFiles) {
      const orderId = f.orderId;
      if (!filesMap.has(orderId)) {
        filesMap.set(orderId, []);
      }
      filesMap.get(orderId)!.push(toOrderFile(f));
    }
    
    const billingMap = new Map<string, BillingEntry[]>();
    for (const b of billingEntries) {
      const orderId = b.orderId;
      if (!billingMap.has(orderId)) {
        billingMap.set(orderId, []);
      }
      billingMap.get(orderId)!.push(toBillingEntry(b));
    }
    
    const imagesMap = new Map<string, DesignImage[]>();
    for (const img of designImages) {
      const designId = img.designId;
      if (!imagesMap.has(designId)) {
        imagesMap.set(designId, []);
      }
      imagesMap.get(designId)!.push(toDesignImage(img));
    }
    
    return orders.map(o => {
      const orderId = o.id || o._id?.toString() || "";
      const design = designsMap.get(o.designId);
      return {
        ...toOrder(o),
        client: client ? toClient(client) : {} as Client,
        design: design ? {
          ...design,
          images: (imagesMap.get(o.designId) || []).sort((a, b) => a.sortOrder - b.sortOrder),
        } : {} as any,
        files: filesMap.get(orderId) || [],
        billingEntries: billingMap.get(orderId) || [],
        measurement: o.measurementId ? measurementsMap.get(o.measurementId) : undefined,
      };
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const db = await this.getDb();
    const id = generateId();
    const newOrder = {
      id,
      ...order,
      status: order.status || "requested",
      createdAt: new Date(),
    };
    await db.collection("orders").insertOne(newOrder);
    return toOrder(newOrder);
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const db = await this.getDb();
    const result = await db.collection("orders").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ? toOrder(result) : undefined;
  }

  async getOrderFiles(orderId: string): Promise<OrderFile[]> {
    const db = await this.getDb();
    const files = await db.collection("order_files")
      .find({ orderId })
      .toArray();
    return files.map(toOrderFile);
  }

  async createOrderFile(file: InsertOrderFile): Promise<OrderFile> {
    const db = await this.getDb();
    const id = generateId();
    const newFile = {
      id,
      ...file,
      createdAt: new Date(),
    };
    await db.collection("order_files").insertOne(newFile);
    return toOrderFile(newFile);
  }

  async getBillingEntries(orderId: string): Promise<BillingEntry[]> {
    const db = await this.getDb();
    const entries = await db.collection("billing_entries")
      .find({ orderId })
      .toArray();
    return entries.map(toBillingEntry);
  }

  async getBillingEntriesByClient(clientId: string): Promise<BillingEntry[]> {
    const db = await this.getDb();
    const entries = await db.collection("billing_entries")
      .find({ clientId })
      .toArray();
    return entries.map(toBillingEntry);
  }

  async createBillingEntry(entry: InsertBillingEntry): Promise<BillingEntry> {
    const db = await this.getDb();
    const id = generateId();
    const newEntry = {
      id,
      ...entry,
      paid: entry.paid ?? false,
      createdAt: new Date(),
    };
    await db.collection("billing_entries").insertOne(newEntry);
    return toBillingEntry(newEntry);
  }

  async updateBillingEntry(id: string, data: Partial<BillingEntry>): Promise<BillingEntry | undefined> {
    const db = await this.getDb();
    const result = await db.collection("billing_entries").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ? toBillingEntry(result) : undefined;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const db = await this.getDb();
    const notifications = await db.collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return notifications.map(toNotification);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const db = await this.getDb();
    const id = generateId();
    const newNotification = {
      id,
      ...notification,
      read: notification.read ?? false,
      createdAt: new Date(),
    };
    await db.collection("notifications").insertOne(newNotification);
    return toNotification(newNotification);
  }

  async markNotificationRead(id: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("notifications").updateOne(
      { id },
      { $set: { read: true } }
    );
  }

  async getCategories(): Promise<Category[]> {
    const db = await this.getDb();
    const categories = await db.collection("categories")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return categories.map(toCategory);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const db = await this.getDb();
    const id = generateId();
    const newCategory = {
      id,
      ...category,
      createdAt: new Date(),
    };
    await db.collection("categories").insertOne(newCategory);
    return toCategory(newCategory);
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("categories").deleteOne({ id });
  }

  async getDashboardStats(designerId: string): Promise<{
    newOrders: number;
    totalClients: number;
    pendingPayments: number;
    totalDesigns: number;
    recentOrders: OrderWithDetails[];
    upcomingDeliveries: OrderWithDetails[];
  }> {
    const allOrders = await this.getOrders();
    const allClients = await this.getClients();
    const allDesigns = await this.getDesigns();

    const newOrders = allOrders.filter((o) => o.status === "requested").length;
    const totalClients = allClients.length;
    const totalDesigns = allDesigns.length;

    const pendingPayments = allClients.reduce(
      (sum, client) => sum + (client.outstandingBalance || 0),
      0
    );

    const recentOrders = allOrders.slice(0, 5);
    const upcomingDeliveries = allOrders
      .filter((o) => o.status === "ready_for_delivery")
      .slice(0, 5);

    return {
      newOrders,
      totalClients,
      pendingPayments,
      totalDesigns,
      recentOrders,
      upcomingDeliveries,
    };
  }

  async getMessages(clientId: string, designerId: string): Promise<Message[]> {
    const db = await this.getDb();
    const messages = await db.collection("messages")
      .find({ clientId, designerId })
      .sort({ createdAt: 1 })
      .toArray();
    return messages.map(toMessage);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const db = await this.getDb();
    const id = generateId();
    const newMessage = {
      id,
      ...message,
      read: message.read ?? false,
      createdAt: new Date(),
    };
    await db.collection("messages").insertOne(newMessage);
    return toMessage(newMessage);
  }

  async markMessageRead(id: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("messages").updateOne(
      { id },
      { $set: { read: true } }
    );
  }

  async getUnreadMessageCount(clientId: string, designerId: string): Promise<number> {
    const db = await this.getDb();
    return await db.collection("messages").countDocuments({
      clientId,
      designerId,
      sender: "client",
      read: false,
    });
  }

  async createWhatsAppMessage(message: InsertWhatsAppMessage): Promise<WhatsAppMessage> {
    const db = await this.getDb();
    const id = generateId();
    const newMessage = {
      id,
      ...message,
      status: message.status || "pending",
      createdAt: new Date(),
    };
    await db.collection("whatsapp_messages").insertOne(newMessage);
    return toWhatsAppMessage(newMessage);
  }

  async getWhatsAppMessages(clientId: string): Promise<WhatsAppMessage[]> {
    const db = await this.getDb();
    const messages = await db.collection("whatsapp_messages")
      .find({ clientId })
      .sort({ createdAt: -1 })
      .toArray();
    return messages.map(toWhatsAppMessage);
  }

  // Fusion job methods
  async createFusionJob(job: InsertFusionJob): Promise<FusionJob> {
    const db = await this.getDb();
    const id = generateId();
    const now = new Date();
    const newJob = {
      id,
      ...job,
      status: job.status || "pending",
      progress: job.progress || 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("fusion_jobs").insertOne(newJob);
    return toFusionJob(newJob);
  }

  async getFusionJob(jobId: string): Promise<FusionJob | undefined> {
    const db = await this.getDb();
    const doc = await db.collection("fusion_jobs").findOne({ jobId });
    return doc ? toFusionJob(doc) : undefined;
  }

  async updateFusionJob(jobId: string, data: Partial<FusionJob>): Promise<FusionJob | undefined> {
    const db = await this.getDb();
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    const result = await db.collection("fusion_jobs").findOneAndUpdate(
      { jobId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result ? toFusionJob(result) : undefined;
  }

  async deleteFusionJob(jobId: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("fusion_jobs").deleteOne({ jobId });
  }
}

function toFusionJob(doc: any): FusionJob {
  return {
    id: doc.id || doc._id?.toString() || "",
    jobId: doc.jobId,
    imageA: doc.imageA,
    imageB: doc.imageB,
    mode: doc.mode,
    strength: doc.strength,
    status: doc.status || "pending",
    progress: doc.progress || 0,
    resultUrl: doc.resultUrl,
    candidates: doc.candidates,
    explainability: doc.explainability,
    metadata: doc.metadata,
    designerId: doc.designerId,
    error: doc.error,
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
  };
}

export const storage = new DatabaseStorage();

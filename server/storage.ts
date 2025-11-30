import {
  users,
  designs,
  designImages,
  clients,
  measurements,
  orders,
  orderFiles,
  billingEntries,
  notifications,
  categories,
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
  type DesignWithImages,
  type ClientWithDetails,
  type OrderWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or, inArray } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getDesigns(published?: boolean): Promise<DesignWithImages[]> {
    const allDesigns = await db.query.designs.findMany({
      where: published !== undefined ? eq(designs.isPublished, published) : undefined,
      with: { images: true },
      orderBy: desc(designs.createdAt),
    });
    return allDesigns;
  }

  async getDesign(id: string): Promise<DesignWithImages | undefined> {
    const design = await db.query.designs.findFirst({
      where: eq(designs.id, id),
      with: { images: true },
    });
    return design;
  }

  async createDesign(design: InsertDesign): Promise<Design> {
    const [newDesign] = await db.insert(designs).values(design).returning();
    return newDesign;
  }

  async updateDesign(id: string, data: Partial<Design>): Promise<Design | undefined> {
    const [updated] = await db.update(designs).set(data).where(eq(designs.id, id)).returning();
    return updated;
  }

  async deleteDesign(id: string): Promise<void> {
    // Delete related records first due to foreign key constraints
    // Get all orders for this design
    const designOrders = await db.select().from(orders).where(eq(orders.designId, id));
    
    // Delete billing entries for these orders
    for (const order of designOrders) {
      await db.delete(billingEntries).where(eq(billingEntries.orderId, order.id));
      // Delete order files
      await db.delete(orderFiles).where(eq(orderFiles.orderId, order.id));
    }
    
    // Delete orders
    await db.delete(orders).where(eq(orders.designId, id));
    
    // Delete design images (should cascade, but being explicit)
    await db.delete(designImages).where(eq(designImages.designId, id));
    
    // Finally delete the design
    await db.delete(designs).where(eq(designs.id, id));
  }

  async getDesignImages(designId: string): Promise<DesignImage[]> {
    return db.select().from(designImages).where(eq(designImages.designId, designId));
  }

  async createDesignImage(image: InsertDesignImage): Promise<DesignImage> {
    const [newImage] = await db.insert(designImages).values(image).returning();
    return newImage;
  }

  async updateDesignImageOrder(id: string, sortOrder: number): Promise<void> {
    await db.update(designImages).set({ sortOrder }).where(eq(designImages.id, id));
  }

  async deleteDesignImage(id: string): Promise<void> {
    await db.delete(designImages).where(eq(designImages.id, id));
  }

  async deleteDesignImages(designId: string): Promise<void> {
    await db.delete(designImages).where(eq(designImages.designId, designId));
  }

  async getClients(): Promise<ClientWithDetails[]> {
    const allClients = await db.query.clients.findMany({
      with: {
        measurements: true,
        orders: {
          with: {
            design: { with: { images: true } },
            files: true,
            billingEntries: true,
          },
        },
        billingEntries: true,
      },
      orderBy: desc(clients.createdAt),
    });

    return allClients.map((client) => {
      const totalSpent = client.billingEntries
        .filter((e) => e.paid)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const outstandingBalance = client.billingEntries
        .filter((e) => !e.paid)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      return { ...client, totalSpent, outstandingBalance };
    });
  }

  async getClient(id: string): Promise<ClientWithDetails | undefined> {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        measurements: { orderBy: desc(measurements.createdAt) },
        orders: {
          with: {
            design: { with: { images: true } },
            files: true,
            billingEntries: true,
          },
          orderBy: desc(orders.createdAt),
        },
        billingEntries: { orderBy: desc(billingEntries.createdAt) },
      },
    });

    if (!client) return undefined;

    const totalSpent = client.billingEntries
      .filter((e) => e.paid)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const outstandingBalance = client.billingEntries
      .filter((e) => !e.paid)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return { ...client, totalSpent, outstandingBalance };
  }

  async getClientByPhone(phone: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.phone, phone));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteAllClients(): Promise<void> {
    // Get all clients first to get their IDs
    const allClients = await db.select().from(clients);
    const clientIds = allClients.map(c => c.id);

    if (clientIds.length === 0) {
      console.log("No clients to delete");
      return;
    }

    console.log(`Starting deletion of ${clientIds.length} clients...`);

    try {
      // Get all orders for these clients
      const allOrders = await db.select().from(orders).where(inArray(orders.clientId, clientIds));
      const orderIds = allOrders.map(o => o.id);
      console.log(`Found ${orderIds.length} orders to delete`);

      // Delete billing entries for these orders first (they reference orderId)
      if (orderIds.length > 0) {
        const deletedBilling1 = await db.delete(billingEntries).where(inArray(billingEntries.orderId, orderIds));
        console.log("Deleted billing entries for orders:", deletedBilling1);
      }

      // Delete order files for these orders
      if (orderIds.length > 0) {
        const deletedFiles = await db.delete(orderFiles).where(inArray(orderFiles.orderId, orderIds));
        console.log("Deleted order files:", deletedFiles);
      }

      // Delete orders
      if (orderIds.length > 0) {
        const deletedOrders = await db.delete(orders).where(inArray(orders.clientId, clientIds));
        console.log("Deleted orders:", deletedOrders);
      }

      // Delete billing entries for these clients (any remaining ones)
      const deletedBilling2 = await db.delete(billingEntries).where(inArray(billingEntries.clientId, clientIds));
      console.log("Deleted billing entries for clients:", deletedBilling2);

      // Delete measurements (should cascade, but being explicit)
      const deletedMeasurements = await db.delete(measurements).where(inArray(measurements.clientId, clientIds));
      console.log("Deleted measurements:", deletedMeasurements);

      // Finally delete all clients
      const deletedClients = await db.delete(clients);
      console.log("Deleted all clients:", deletedClients);
      console.log("All clients deleted successfully");
    } catch (error) {
      console.error("Error during client deletion:", error);
      throw error;
    }
  }

  async getMeasurements(clientId: string): Promise<Measurement[]> {
    return db.select().from(measurements).where(eq(measurements.clientId, clientId));
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    const [newMeasurement] = await db.insert(measurements).values(measurement).returning();
    return newMeasurement;
  }

  async updateMeasurement(id: string, data: Partial<Measurement>): Promise<Measurement | undefined> {
    const [updated] = await db.update(measurements).set(data).where(eq(measurements.id, id)).returning();
    return updated;
  }

  async getOrders(): Promise<OrderWithDetails[]> {
    const allOrders = await db.query.orders.findMany({
      with: {
        client: true,
        design: { with: { images: true } },
        files: true,
        billingEntries: true,
        measurement: true,
      },
      orderBy: desc(orders.createdAt),
    });
    return allOrders as OrderWithDetails[];
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        client: true,
        design: { with: { images: true } },
        files: true,
        billingEntries: true,
        measurement: true,
      },
    });
    return order as OrderWithDetails | undefined;
  }

  async getOrdersByClient(clientId: string): Promise<OrderWithDetails[]> {
    const clientOrders = await db.query.orders.findMany({
      where: eq(orders.clientId, clientId),
      with: {
        client: true,
        design: { with: { images: true } },
        files: true,
        billingEntries: true,
        measurement: true,
      },
      orderBy: desc(orders.createdAt),
    });
    return clientOrders as OrderWithDetails[];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrderFiles(orderId: string): Promise<OrderFile[]> {
    return db.select().from(orderFiles).where(eq(orderFiles.orderId, orderId));
  }

  async createOrderFile(file: InsertOrderFile): Promise<OrderFile> {
    const [newFile] = await db.insert(orderFiles).values(file).returning();
    return newFile;
  }

  async getBillingEntries(orderId: string): Promise<BillingEntry[]> {
    return db.select().from(billingEntries).where(eq(billingEntries.orderId, orderId));
  }

  async getBillingEntriesByClient(clientId: string): Promise<BillingEntry[]> {
    return db.select().from(billingEntries).where(eq(billingEntries.clientId, clientId));
  }

  async createBillingEntry(entry: InsertBillingEntry): Promise<BillingEntry> {
    const [newEntry] = await db.insert(billingEntries).values(entry).returning();
    return newEntry;
  }

  async updateBillingEntry(id: string, data: Partial<BillingEntry>): Promise<BillingEntry | undefined> {
    const [updated] = await db.update(billingEntries).set(data).where(eq(billingEntries.id, id)).returning();
    return updated;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
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
}

export const storage = new DatabaseStorage();

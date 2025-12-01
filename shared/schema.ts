import { z } from "zod";

// Helper function to generate IDs (compatible with MongoDB ObjectId format)
export const generateId = () => {
  // Generate a 24-character hex string similar to MongoDB ObjectId
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + random).slice(0, 24);
};

// Order status type
export type OrderStatus = "requested" | "accepted" | "in_progress" | "ready_for_delivery" | "delivered";

// Type definitions for MongoDB documents
export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  createdAt: Date;
}

export interface Design {
  _id?: string;
  id: string;
  designerId: string;
  title: string;
  description?: string;
  price: string;
  category: string;
  isPublished: boolean;
  createdAt: Date;
}

export interface DesignImage {
  _id?: string;
  id: string;
  designId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: Date;
}

export interface Client {
  _id?: string;
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  password?: string; // For client portal login
  otp?: string; // For OTP-based login
  otpExpires?: Date; // OTP expiration
  createdAt: Date;
}

export interface Measurement {
  _id?: string;
  id: string;
  clientId: string;
  label: string;
  chest?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  sleeve?: string;
  length?: string;
  inseam?: string;
  neck?: string;
  customMeasurements?: Record<string, string>;
  notes?: string;
  createdAt: Date;
}

export interface Order {
  _id?: string;
  id: string;
  clientId: string;
  designId: string;
  designerId: string;
  status: OrderStatus;
  preferredDate?: Date;
  notes?: string;
  measurementId?: string;
  createdAt: Date;
}

export interface OrderFile {
  _id?: string;
  id: string;
  orderId: string;
  fileUrl: string;
  fileType: string;
  fileName?: string;
  createdAt: Date;
}

export interface BillingEntry {
  _id?: string;
  id: string;
  orderId: string;
  clientId: string;
  description: string;
  amount: string;
  paid: boolean;
  createdAt: Date;
}

export interface Notification {
  _id?: string;
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Category {
  _id?: string;
  id: string;
  name: string;
  createdAt: Date;
}

export interface Message {
  _id?: string;
  id: string;
  clientId: string;
  designerId: string;
  orderId?: string;
  sender: "client" | "designer";
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface WhatsAppMessage {
  _id?: string;
  id: string;
  clientId: string;
  orderId?: string;
  phone: string;
  message: string;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  createdAt: Date;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().default("designer"),
  businessName: z.string().optional(),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
});

export const insertDesignSchema = z.object({
  designerId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.string(),
  category: z.string().min(1),
  isPublished: z.boolean().default(false),
});

export const insertDesignImageSchema = z.object({
  designId: z.string(),
  imageUrl: z.string().url(),
  sortOrder: z.number().default(0),
});

export const insertClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const insertMeasurementSchema = z.object({
  clientId: z.string(),
  label: z.string().min(1),
  chest: z.string().optional(),
  waist: z.string().optional(),
  hips: z.string().optional(),
  shoulder: z.string().optional(),
  sleeve: z.string().optional(),
  length: z.string().optional(),
  inseam: z.string().optional(),
  neck: z.string().optional(),
  customMeasurements: z.record(z.string()).optional(),
  notes: z.string().optional(),
});

export const insertOrderSchema = z.object({
  clientId: z.string(),
  designId: z.string(),
  designerId: z.string(),
  status: z.enum(["requested", "accepted", "in_progress", "ready_for_delivery", "delivered"]).default("requested"),
  preferredDate: z.date().optional(),
  notes: z.string().optional(),
  measurementId: z.string().optional(),
});

export const insertOrderFileSchema = z.object({
  orderId: z.string(),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  fileName: z.string().optional(),
});

export const insertBillingEntrySchema = z.object({
  orderId: z.string(),
  clientId: z.string(),
  description: z.string().min(1),
  amount: z.string(),
  paid: z.boolean().default(false),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  read: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
});

export const insertMessageSchema = z.object({
  clientId: z.string(),
  designerId: z.string(),
  orderId: z.string().optional(),
  sender: z.enum(["client", "designer"]),
  message: z.string().min(1),
  read: z.boolean().default(false),
});

export const insertWhatsAppMessageSchema = z.object({
  clientId: z.string(),
  orderId: z.string().optional(),
  phone: z.string().min(1),
  message: z.string().min(1),
  status: z.enum(["pending", "sent", "failed"]).default("pending"),
});

export const clientLoginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().optional(),
  otp: z.string().optional(),
});

export const requestOTPSchema = z.object({
  phone: z.string().min(10),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertWhatsAppMessage = z.infer<typeof insertWhatsAppMessageSchema>;
export type ClientLoginData = z.infer<typeof clientLoginSchema>;
export type RequestOTPData = z.infer<typeof requestOTPSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
  chest: z.string().optional(),
  waist: z.string().optional(),
  hips: z.string().optional(),
  shoulder: z.string().optional(),
  sleeve: z.string().optional(),
  length: z.string().optional(),
  measurementNotes: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type InsertDesignImage = z.infer<typeof insertDesignImageSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderFile = z.infer<typeof insertOrderFileSchema>;
export type InsertBillingEntry = z.infer<typeof insertBillingEntrySchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;

export type DesignWithImages = Design & { images: DesignImage[] };
export type ClientWithDetails = Client & { 
  measurements: Measurement[];
  orders: OrderWithDetails[];
  billingEntries: BillingEntry[];
  totalSpent: number;
  outstandingBalance: number;
};
export type OrderWithDetails = Order & {
  client: Client;
  design: DesignWithImages;
  files: OrderFile[];
  billingEntries: BillingEntry[];
  measurement?: Measurement;
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  accepted: "Accepted",
  in_progress: "In Progress",
  ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ready_for_delivery: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivered: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
};

import "dotenv/config";
import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has users, skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("rajiya@0121", 10);
  const [designer] = await db.insert(users).values({
    name: "M. Rajiya",
    email: "rajiya0121@gmail.com",
    password: hashedPassword,
    role: "designer",
    businessName: "Rajiya Fashion",
    businessPhone: "9182720386",
    businessAddress: "D.No. 7/394, Rayachur Street, Main Bazar, Tadipatri-515411",
  }).returning();

  console.log("Created designer account:", designer.email);
  console.log("\n=== Login Credentials ===");
  console.log("Email: rajiya0121@gmail.com");
  console.log("Password: rajiya@0121");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

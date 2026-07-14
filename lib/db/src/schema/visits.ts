import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ip: text("ip"),
  isp: text("isp"),
  country: text("country"),
  city: text("city"),
  region: text("region"),
  timezone: text("timezone"),
  org: text("org"),
  ua: text("ua"),
  platform: text("platform"),
  screenWidth: integer("screen_width"),
  screenHeight: integer("screen_height"),
  screenDpr: real("screen_dpr"),
  memoryGb: real("memory_gb"),
  cpuCores: integer("cpu_cores"),
  touchPoints: integer("touch_points"),
  lang: text("lang"),
  batteryLevel: real("battery_level"),
  batteryCharging: boolean("battery_charging"),
  networkType: text("network_type"),
  networkDownlink: real("network_downlink"),
  networkRtt: real("network_rtt"),
  rawIpinfo: text("raw_ipinfo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;

import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ip: text("ip"),
  isp: text("isp"),
  city: text("city"),
  region: text("region"),
  timezone: text("timezone"),
  org: text("org"),
  ua: text("ua"),
  browserName: text("browser_name"),
  browserVersion: text("browser_version"),
  osName: text("os_name"),
  osVersion: text("os_version"),
  deviceModel: text("device_model"),
  isMobile: boolean("is_mobile"),
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
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationAccuracy: real("location_accuracy"),
  rawIpinfo: text("raw_ipinfo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;

import { Router, type IRouter } from "express";
import { db, visitsTable } from "@workspace/db";
import { eq, desc, count, max } from "drizzle-orm";
import {
  RecordVisitBody,
  RecordVisitResponse,
  ListUsernamesResponseItem,
  GetVisitsByUsernameParams,
  GetVisitsByUsernameResponseItem,
  DeleteVisitParams,
} from "@workspace/api-zod";

const IPINFO_TOKEN = "a1b26b5b1296d2";

const router: IRouter = Router();

router.post("/visits", async (req, res): Promise<void> => {
  const parsed = RecordVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  // Capture real IP from request headers
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]?.trim()) ||
    req.ip ||
    null;

  // Fetch IP info from ipinfo.io
  let isp: string | null = null;
  let country: string | null = null;
  let city: string | null = null;
  let region: string | null = null;
  let timezone: string | null = null;
  let org: string | null = null;
  let rawIpinfo: string | null = null;

  if (ip) {
    try {
      const ipInfoRes = await fetch(`https://api.ipinfo.io/lite/${ip}?token=${IPINFO_TOKEN}`);
      if (ipInfoRes.ok) {
        const ipData = await ipInfoRes.json() as Record<string, string>;
        rawIpinfo = JSON.stringify(ipData);
        isp = ipData.as_name || ipData.org || null;
        country = ipData.country_name || ipData.country || null;
        city = ipData.city || null;
        region = ipData.region || null;
        timezone = ipData.timezone || data.deviceTimezone || null;
        org = ipData.org || null;
      }
    } catch {
      req.log.warn({ ip }, "Failed to fetch IP info");
    }
  }

  const [visit] = await db
    .insert(visitsTable)
    .values({
      username: data.username,
      ip,
      isp,
      country,
      city,
      region,
      timezone,
      org,
      ua: data.ua ?? null,
      platform: data.platform ?? null,
      browserName: data.browserName ?? null,
      browserVersion: data.browserVersion ?? null,
      osName: data.osName ?? null,
      osVersion: data.osVersion ?? null,
      deviceModel: data.deviceModel ?? null,
      isMobile: data.isMobile ?? null,
      screenWidth: data.screenWidth ?? null,
      screenHeight: data.screenHeight ?? null,
      screenDpr: data.screenDpr ?? null,
      memoryGb: data.memoryGb ?? null,
      cpuCores: data.cpuCores ?? null,
      touchPoints: data.touchPoints ?? null,
      lang: data.lang ?? null,
      batteryLevel: data.batteryLevel ?? null,
      batteryCharging: data.batteryCharging ?? null,
      networkType: data.networkType ?? null,
      networkDownlink: data.networkDownlink ?? null,
      networkRtt: data.networkRtt ?? null,
      rawIpinfo,
    })
    .returning();

  res.status(201).json(RecordVisitResponse.parse({
    ...visit,
    screenDpr: visit.screenDpr ?? null,
    memoryGb: visit.memoryGb ?? null,
    batteryLevel: visit.batteryLevel ?? null,
    networkDownlink: visit.networkDownlink ?? null,
    networkRtt: visit.networkRtt ?? null,
    createdAt: visit.createdAt.toISOString(),
  }));
});

// Must be before /visits/:username to avoid routing conflict
router.get("/visits/usernames", async (req, res): Promise<void> => {
  if (!req.session.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select({
      username: visitsTable.username,
      visitCount: count(visitsTable.id),
      lastVisit: max(visitsTable.createdAt),
    })
    .from(visitsTable)
    .groupBy(visitsTable.username)
    .orderBy(desc(max(visitsTable.createdAt)));

  res.json(
    rows.map((r) =>
      ListUsernamesResponseItem.parse({
        username: r.username,
        visitCount: r.visitCount,
        lastVisit: r.lastVisit ? r.lastVisit.toISOString() : null,
      })
    )
  );
});

router.get("/visits/:username", async (req, res): Promise<void> => {
  if (!req.session.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetVisitsByUsernameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.username, params.data.username))
    .orderBy(desc(visitsTable.createdAt));

  res.json(
    visits.map((v) =>
      GetVisitsByUsernameResponseItem.parse({
        ...v,
        screenDpr: v.screenDpr ?? null,
        memoryGb: v.memoryGb ?? null,
        batteryLevel: v.batteryLevel ?? null,
        networkDownlink: v.networkDownlink ?? null,
        networkRtt: v.networkRtt ?? null,
        createdAt: v.createdAt.toISOString(),
      })
    )
  );
});

router.delete("/visits/:username/:id", async (req, res): Promise<void> => {
  if (!req.session.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteVisitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(visitsTable)
    .where(eq(visitsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

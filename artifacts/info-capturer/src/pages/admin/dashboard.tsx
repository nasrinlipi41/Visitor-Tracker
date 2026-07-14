import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useLogout,
  useListUsernames,
  getListUsernamesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Users, LogOut, ChevronRight, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (!isLoading && !me?.authenticated) {
      setLocation("/admin");
    }
  }, [me, isLoading, setLocation]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), { authenticated: false });
        setLocation("/admin");
      }
    });
  };

  if (isLoading || !me?.authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono">
        <Activity className="w-5 h-5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-mono font-bold tracking-tight">
              <Activity className="w-4 h-4 text-primary" />
              <span>CAPT-CTRL</span>
            </div>
            <div className="h-4 w-px bg-border mx-2"></div>
            <nav className="flex items-center gap-4 text-sm font-mono">
              <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Targets
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-muted-foreground font-mono uppercase">System Active</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: targets, isLoading } = useListUsernames({
    query: { queryKey: getListUsernamesQueryKey() }
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-tight mb-1">Target Overview</h1>
            <p className="text-sm text-muted-foreground font-mono">Select a target identifier to view capture details.</p>
          </div>
          <div className="bg-card border border-border rounded-md flex items-center px-3 py-1.5 w-full md:w-64">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Filter targets..." 
              className="bg-transparent border-none outline-none text-sm font-mono w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="border border-border bg-card rounded-md overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Activity className="w-6 h-6 text-muted-foreground animate-pulse" />
            </div>
          ) : !targets || targets.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-sm border-dashed border-2 border-border m-4 rounded-md">
              No targets captured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider text-xs">Target ID</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider text-xs text-right">Capture Count</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider text-xs">Last Contact</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider text-xs w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {targets.map((target) => (
                    <tr key={target.username} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-primary flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {target.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-muted-foreground">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-bold">
                          {target.visitCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {target.lastVisit ? new Date(target.lastVisit).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/admin/dashboard/${target.username}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export { AdminLayout };

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, ShieldAlert } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { data: me, isLoading: meLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  const loginMutation = useLogin();

  useEffect(() => {
    // Force dark mode for admin pages
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    if (me?.authenticated) {
      setLocation("/admin/dashboard");
    }
  }, [me, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          if (data.authenticated) {
            queryClient.setQueryData(getGetMeQueryKey(), { authenticated: true });
            setLocation("/admin/dashboard");
          } else {
            setError("Invalid credentials");
          }
        },
        onError: () => {
          setError("Invalid credentials");
        }
      }
    );
  };

  if (meLoading) return null; // or minimal loader

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground font-mono px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 border border-border rounded flex items-center justify-center mb-6 bg-card text-muted-foreground">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-primary">Secure Access</h1>
          <p className="text-xs text-muted-foreground mt-2">RESTRICTED TO AUTHORIZED PERSONNEL</p>
        </div>

        <div className="border border-border bg-card rounded-md shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-2 text-destructive">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-sm font-sans">{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block">Admin ID</label>
              <Input
                autoFocus
                className="font-mono bg-background border-border focus-visible:ring-1 focus-visible:ring-primary h-12"
                placeholder="root"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block">Passcode</label>
              <Input
                type="password"
                className="font-mono bg-background border-border focus-visible:ring-1 focus-visible:ring-primary h-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full font-mono uppercase tracking-widest h-12 mt-4"
              disabled={loginMutation.isPending || !username || !password}
              data-testid="button-submit-login"
            >
              {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground font-mono">
            SYS.VER: 4.9.2 // IP_LOG_ACTIVE: TRUE
          </p>
        </div>
      </div>
    </div>
  );
}

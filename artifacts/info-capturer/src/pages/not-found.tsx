import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground font-mono">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary tracking-widest mb-4">404</h1>
        <p className="text-sm text-muted-foreground mb-8">TARGET ROUTE NOT FOUND</p>
        <button
          onClick={() => setLocation("/")}
          className="px-4 py-2 border border-border text-sm hover:bg-muted/20 transition-colors"
        >
          RETURN TO ORIGIN
        </button>
      </div>
    </div>
  );
}

import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getDb } from "@/mocks/db";
import { roleLabel } from "@/permissions/can";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const { loginAs } = useAuth();
  const [, setLocation] = useLocation();
  const users = getDb().users.filter((u) => u.status === "active");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.74_0.075_75/0.12),transparent_55%),linear-gradient(180deg,oklch(0.185_0.006_60),oklch(0.155_0.005_60))]" />
      <div className="relative w-full max-w-md rounded-md border border-border bg-card/80 p-8 shadow-2xl backdrop-blur">
        <p className="label-eyebrow">Joseph Mews</p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">Admin Panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with a demo account. Role switching is available after login.
        </p>
        <div className="mt-8 space-y-2">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3 text-left"
              onClick={() => {
                loginAs(user.id);
                setLocation("/");
              }}
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {roleLabel(user.role)} · {user.email}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

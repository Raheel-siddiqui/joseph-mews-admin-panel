import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Building2,
  Calculator,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Radar,
  Settings,
  Users,
  UserCircle2,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabel } from "@/permissions/can";
import type { Resource } from "@/permissions/can";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/models";

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; resource: Resource }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, resource: "dashboard" },
  { href: "/investors", label: "Investors", icon: UserCircle2, resource: "investors" },
  { href: "/properties", label: "Properties", icon: Building2, resource: "properties" },
  { href: "/enquiries", label: "Enquiries", icon: MessageSquare, resource: "enquiries" },
  { href: "/signals", label: "Intent Signals", icon: Radar, resource: "signals" },
  { href: "/assumptions", label: "Calculations & Assumptions", icon: Calculator, resource: "assumptions" },
  { href: "/users", label: "Users & Roles", icon: Users, resource: "users" },
  { href: "/activity", label: "Activity Log", icon: Activity, resource: "activity" },
  { href: "/settings", label: "Settings", icon: Settings, resource: "settings" },
];

function NavLinks({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  const { canAccessNav } = useAuth();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {navItems
        .filter((item) => canAccessNav(item.resource))
        .map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout, switchRoleDemo } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="label-eyebrow">Joseph Mews</p>
          <p className="mt-1 font-serif text-xl text-foreground">Admin</p>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavLinks pathname={location} />
        </div>
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user ? roleLabel(user.role) : ""}</p>
          </div>
          <Select
            value={user?.role}
            onValueChange={(v) => switchRoleDemo(v as Role)}
          >
            <SelectTrigger className="h-8 text-xs" aria-label="Demo role switcher">
              <SelectValue placeholder="Switch role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              logout();
              setLocation("/login");
            }}
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-sidebar border-r border-sidebar-border">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <div>
                <p className="label-eyebrow">Joseph Mews</p>
                <p className="font-serif text-lg">Admin</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <NavLinks pathname={location} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">
              Operational control for the Joseph Mews Investor Platform
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

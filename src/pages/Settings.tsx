import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormSection } from "@/components/admin/FormSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { resetDb } from "@/mocks/db";

export function SettingsPage() {
  const { can } = useAuth();

  if (!can("manage_settings", "settings")) {
    return (
      <PageHeader
        title="Settings"
        description="System configuration is restricted to Super Admins."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="System configuration for the admin panel mock environment."
      />
      <div className="space-y-4">
        <FormSection title="Platform">
          <div className="flex items-center justify-between md:col-span-2">
            <div>
              <Label>Maintenance banner</Label>
              <p className="text-xs text-muted-foreground">Show a global notice in the investor app (mock toggle).</p>
            </div>
            <Switch
              onCheckedChange={(v) =>
                toast.message(v ? "Maintenance banner enabled (mock)" : "Maintenance banner disabled")
              }
            />
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            <div>
              <Label>Require invite for new investors</Label>
              <p className="text-xs text-muted-foreground">Invitation-only onboarding policy.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </FormSection>
        <FormSection title="Developer tools" description="Frontend mock data controls.">
          <div className="md:col-span-2">
            <Button
              variant="destructive"
              onClick={() => {
                resetDb();
                toast.success("Mock database reset — reload the page");
                window.location.reload();
              }}
            >
              Reset mock data
            </Button>
          </div>
        </FormSection>
      </div>
    </div>
  );
}

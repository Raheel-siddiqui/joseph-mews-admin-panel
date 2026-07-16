import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormSection } from "@/components/admin/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import type { InternalUser, PropertyUnit } from "@/models";
import { createInvitation, listProperties, listUsers } from "@/services/api";

export function InviteInvestorPage() {
  const { canMutate } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agentId, setAgentId] = useState<string>("none");
  const [agents, setAgents] = useState<InternalUser[]>([]);
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([listUsers(), listProperties()]).then(([users, props]) => {
      setAgents(users.filter((u) => u.role === "agent"));
      setProperties(props);
    });
  }, []);

  if (!canMutate("investors")) {
    return (
      <PageHeader
        title="Invite investor"
        description="You do not have permission to invite investors."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Invite investor"
        description="Create an investor record, assign an agent, optionally attach properties, and send an invitation."
        breadcrumbs={[
          { label: "Investors", href: "/investors" },
          { label: "Invite" },
        ]}
      />

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            const { investor } = await createInvitation({
              name,
              email,
              assignedAgentId: agentId === "none" ? null : agentId,
              propertyIds: selectedProps,
            });
            toast.success("Invitation sent");
            setLocation(`/investors/${investor.id}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        <FormSection title="Investor details">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Assigned agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormSection>

        <FormSection
          title="Optional property assignment"
          description="Assign existing properties to the investor portfolio after acceptance."
        >
          <div className="md:col-span-2 space-y-3">
            {properties.slice(0, 8).map((p) => (
              <label key={p.id} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={selectedProps.includes(p.id)}
                  onCheckedChange={(checked) => {
                    setSelectedProps((prev) =>
                      checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                    );
                  }}
                />
                <span>
                  {p.name} <span className="text-muted-foreground">· {p.reference}</span>
                </span>
              </label>
            ))}
          </div>
        </FormSection>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Sending…" : "Send invitation"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setLocation("/investors")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

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
import { useAuth } from "@/contexts/AuthContext";
import type { InternalUser } from "@/models";
import { createInvestor, listUsers } from "@/services/api";

export function InvestorNewPage() {
  const { canMutate } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agentId, setAgentId] = useState("none");
  const [agents, setAgents] = useState<InternalUser[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listUsers().then((u) => setAgents(u.filter((x) => x.role === "agent")));
  }, []);

  if (!canMutate("investors")) {
    return <PageHeader title="Add investor" description="Permission denied." />;
  }

  return (
    <div>
      <PageHeader
        title="Add investor"
        description="Creates an investor record and standard document folders. Use Invite to send access."
        breadcrumbs={[
          { label: "Investors", href: "/investors" },
          { label: "New" },
        ]}
      />
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            const investor = await createInvestor({
              name,
              email,
              phone,
              assignedAgentId: agentId === "none" ? null : agentId,
            });
            toast.success("Investor created with standard folders");
            setLocation(`/investors/${investor.id}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        <FormSection title="Details">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Assigned agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormSection>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create investor"}</Button>
          <Button type="button" variant="outline" onClick={() => setLocation("/investors")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

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
import type {
  AccountStatus,
  InternalUser,
  InvitationStatus,
  ResidencyStatus,
} from "@/models";
import { createInvestor, listUsers } from "@/services/api";

export function InvestorNewPage() {
  const { canMutate } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [nationality, setNationality] = useState("British");
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>("uk_resident");
  const [agentId, setAgentId] = useState("none");
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("pending");
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus | "none">("none");
  const [ownedPropertyCount, setOwnedPropertyCount] = useState(0);
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
              country,
              nationality,
              residencyStatus,
              assignedAgentId: agentId === "none" ? null : agentId,
              accountStatus,
              invitationStatus: invitationStatus === "none" ? null : invitationStatus,
              ownedPropertyCount,
            });
            toast.success("Investor created with standard folders");
            setLocation(`/investors/${investor.id}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        <FormSection title="Contact">
          <div className="space-y-2">
            <Label htmlFor="name">Investor name</Label>
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
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Residency</Label>
            <Select
              value={residencyStatus}
              onValueChange={(v) => setResidencyStatus(v as ResidencyStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uk_resident">UK resident</SelectItem>
                <SelectItem value="non_uk_resident">Non-UK resident</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormSection>

        <FormSection title="Account & assignment">
          <div className="space-y-2">
            <Label>Assigned agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account status</Label>
            <Select
              value={accountStatus}
              onValueChange={(v) => setAccountStatus(v as AccountStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Invitation status</Label>
            <Select
              value={invitationStatus}
              onValueChange={(v) => setInvitationStatus(v as InvitationStatus | "none")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owned">Properties owned</Label>
            <Input
              id="owned"
              type="number"
              min={0}
              value={ownedPropertyCount}
              onChange={(e) => setOwnedPropertyCount(Number(e.target.value) || 0)}
            />
          </div>
        </FormSection>

        <p className="text-xs text-muted-foreground">
          Last active and date added are set automatically when the investor is created.
        </p>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create investor"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setLocation("/investors")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

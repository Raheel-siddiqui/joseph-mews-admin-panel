import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
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
import { formatDateTime } from "@/lib/format";
import type { InternalUser, Role } from "@/models";
import { inviteUser, listUsers, updateUser } from "@/services/api";
import { roleLabel } from "@/permissions/can";

export function UsersPage() {
  const { can } = useAuth();
  const canManage = can("manage_roles", "users");
  const [rows, setRows] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("agent");

  const reload = () =>
    listUsers().then((u) => {
      setRows(u);
      setLoading(false);
    });

  useEffect(() => { reload(); }, []);

  if (!canManage) {
    return (
      <PageHeader
        title="Users & Roles"
        description="Only Super Admins can manage internal users and roles."
      />
    );
  }

  const columns: Column<InternalUser>[] = [
    { key: "name", header: "Name", cell: (r) => r.name },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "role", header: "Role", cell: (r) => roleLabel(r.role) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "assigned", header: "Assigned investors", cell: (r) => r.assignedInvestorIds.length },
    { key: "login", header: "Last login", cell: (r) => formatDateTime(r.lastLoginAt) },
    { key: "invite", header: "Invitation", cell: (r) => <StatusBadge value={r.invitationStatus ?? "n/a"} /> },
    { key: "created", header: "Created", cell: (r) => formatDateTime(r.createdAt) },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          <Select
            value={r.role}
            onValueChange={async (v) => {
              await updateUser(r.id, { role: v as Role });
              toast.success("Role updated");
              reload();
            }}
          >
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await updateUser(r.id, {
                status: r.status === "active" ? "inactive" : "active",
              });
              toast.success(r.status === "active" ? "User deactivated" : "User activated");
              reload();
            }}
          >
            {r.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Internal staff access. Agents only see assigned investors."
      />
      <FormSection title="Invite internal user">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            disabled={!name.trim() || !email.trim()}
            onClick={async () => {
              await inviteUser({ name, email, role });
              setName("");
              setEmail("");
              toast.success("Internal user invited");
              reload();
            }}
          >
            Send invite
          </Button>
        </div>
      </FormSection>
      <div className="mt-6">
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={12} />
      </div>
    </div>
  );
}

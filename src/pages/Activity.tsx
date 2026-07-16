import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import type { ActivityEvent, AuditRecord, Investor } from "@/models";
import { listActivity, listAudit, listInvestors } from "@/services/api";

export function ActivityPage() {
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listActivity(),
      listAudit(),
      listInvestors({ role: user.role, userId: user.id }),
    ]).then(([acts, audits, inv]) => {
      const scopedIds =
        user.role === "agent" ? new Set(user.assignedInvestorIds) : null;
      setActivity(
        scopedIds ? acts.filter((a) => scopedIds.has(a.investorId)) : acts,
      );
      setAudit(user.role === "super_admin" ? audits : audits.slice(0, 0));
      setInvestors(inv);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="Investor behaviour vs internal admin audit trail."
      />
      <Tabs defaultValue="investor">
        <TabsList>
          <TabsTrigger value="investor">Investor activity</TabsTrigger>
          <TabsTrigger value="audit" disabled={user?.role !== "super_admin"}>
            Admin audit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="investor" className="mt-4">
          <DataTable
            columns={[
              {
                key: "investor",
                header: "Investor",
                cell: (r) =>
                  investors.find((i) => i.id === r.investorId)?.name ?? r.investorId,
              },
              { key: "title", header: "Event", cell: (r) => r.title },
              { key: "detail", header: "Detail", cell: (r) => r.detail },
              { key: "type", header: "Type", cell: (r) => <StatusBadge value={r.type} /> },
              { key: "time", header: "When", cell: (r) => formatDateTime(r.timestamp) },
            ]}
            rows={activity}
            rowKey={(r) => r.id}
            pageSize={12}
          />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          {user?.role !== "super_admin" ? (
            <p className="text-sm text-muted-foreground">Audit log is Super Admin only.</p>
          ) : (
            <DataTable
              columns={[
                { key: "user", header: "User", cell: (r) => r.userName },
                { key: "action", header: "Action", cell: (r) => r.action },
                { key: "entity", header: "Entity", cell: (r) => `${r.entityType} · ${r.entityId}` },
                { key: "prev", header: "Previous", cell: (r) => r.previousValue ?? "—" },
                { key: "next", header: "New", cell: (r) => r.newValue ?? "—" },
                { key: "time", header: "When", cell: (r) => formatDateTime(r.timestamp) },
                { key: "ip", header: "IP", cell: (r) => r.ip ?? "—" },
              ]}
              rows={audit}
              rowKey={(r) => r.id}
              pageSize={12}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

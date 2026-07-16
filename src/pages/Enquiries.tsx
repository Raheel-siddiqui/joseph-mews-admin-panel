import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import type { Enquiry, EnquiryStatus } from "@/models";
import { listEnquiries, updateEnquiry } from "@/services/api";

const statuses: EnquiryStatus[] = [
  "new", "assigned", "contacted", "qualified", "viewing_arranged",
  "in_progress", "closed", "converted", "not_interested",
];

export function EnquiriesPage() {
  const { user, canMutate } = useAuth();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const reload = () => {
    if (!user) return;
    listEnquiries({ role: user.role, userId: user.id }).then((data) => {
      setRows(data);
      setLoading(false);
    });
  };

  useEffect(() => { reload(); }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (e) =>
        !q ||
        e.investorName.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const columns: Column<Enquiry>[] = [
    { key: "investor", header: "Investor", cell: (r) => r.investorName },
    { key: "type", header: "Type", cell: (r) => r.type },
    { key: "message", header: "Message", cell: (r) => <span className="line-clamp-2 max-w-xs">{r.message}</span> },
    { key: "submitted", header: "Submitted", cell: (r) => formatDateTime(r.submittedAt) },
    { key: "priority", header: "Priority", cell: (r) => <StatusBadge value={r.priority} /> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "latest", header: "Latest action", cell: (r) => r.latestAction },
    {
      key: "actions",
      header: "Update",
      cell: (r) =>
        canMutate("enquiries") ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={r.status}
              onValueChange={async (v) => {
                await updateEnquiry(r.id, {
                  status: v as EnquiryStatus,
                  latestAction: `Status → ${v}`,
                });
                toast.success("Enquiry updated");
                reload();
              }}
            >
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Agent workflow for investor interest and follow-ups."
        actions={
          canMutate("enquiries") ? (
            <Button
              variant="outline"
              onClick={async () => {
                const first = rows[0];
                if (!first) return;
                await updateEnquiry(first.id, {
                  followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                  latestAction: "Follow-up scheduled for tomorrow",
                });
                toast.success("Follow-up date set on latest enquiry");
                reload();
              }}
            >
              Set follow-up on first
            </Button>
          ) : undefined
        }
      />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
      <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} page={page} onPageChange={setPage} />
    </div>
  );
}

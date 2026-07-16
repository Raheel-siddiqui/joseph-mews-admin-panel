import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
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
import { formatDate } from "@/lib/format";
import type { Investor } from "@/models";
import { listInvestors, listUsers } from "@/services/api";

export function InvestorsPage() {
  const { user, canMutate } = useAuth();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<Investor[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const urlFilter = new URLSearchParams(searchParams).get("filter");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listInvestors({ role: user.role, userId: user.id }),
      listUsers(),
    ]).then(([investors, users]) => {
      setRows(investors);
      setAgents(users.filter((u) => u.role === "agent").map((u) => ({ id: u.id, name: u.name })));
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => {
    return rows.filter((inv) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        inv.name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        inv.nationality.toLowerCase().includes(q);
      const matchesAgent = agentFilter === "all" || inv.assignedAgentId === agentFilter;
      let matchesStatus = statusFilter === "all" || inv.accountStatus === statusFilter;
      if (urlFilter === "pending_invite") matchesStatus = inv.invitationStatus === "sent";
      if (urlFilter === "invited") matchesStatus = inv.invitationStatus != null && inv.invitationStatus !== "revoked";
      return matchesSearch && matchesAgent && matchesStatus;
    });
  }, [rows, search, agentFilter, statusFilter, urlFilter]);

  const columns: Column<Investor>[] = [
    { key: "name", header: "Investor", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "phone", header: "Phone", cell: (r) => r.phone || "—" },
    { key: "country", header: "Country", cell: (r) => r.country },
    { key: "nationality", header: "Nationality", cell: (r) => r.nationality },
    { key: "residency", header: "Residency", cell: (r) => <StatusBadge value={r.residencyStatus} /> },
    {
      key: "agent",
      header: "Agent",
      cell: (r) => agents.find((a) => a.id === r.assignedAgentId)?.name ?? "—",
    },
    { key: "account", header: "Account", cell: (r) => <StatusBadge value={r.accountStatus} /> },
    { key: "invite", header: "Invitation", cell: (r) => <StatusBadge value={r.invitationStatus ?? "none"} /> },
    { key: "owned", header: "Properties", cell: (r) => r.ownedPropertyCount, className: "tabular-nums" },
    { key: "active", header: "Last active", cell: (r) => formatDate(r.lastActiveAt) },
    { key: "added", header: "Date added", cell: (r) => formatDate(r.createdAt) },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Investors"
        description="Searchable investor CRM with invitation and account visibility."
        actions={
          canMutate("investors") ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/investors/new">Add investor</Link>
              </Button>
              <Button asChild>
                <Link href="/investors/invite">Invite investor</Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search name, email, nationality…">
        <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        onRowClick={(r) => setLocation(`/investors/${r.id}`)}
        page={page}
        onPageChange={setPage}
        pageSize={8}
      />
    </div>
  );
}

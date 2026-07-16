import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Development } from "@/models";
import { listDevelopments } from "@/services/api";

export function DevelopmentsPage() {
  const { can } = useAuth();
  const canEdit = can("create", "developments");
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<Development[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listDevelopments().then((d) => {
      setRows(d);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.developer.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const columns: Column<Development>[] = [
    { key: "name", header: "Development", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "ref", header: "Reference", cell: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "developer", header: "Developer", cell: (r) => r.developer },
    { key: "city", header: "City", cell: (r) => `${r.city}, ${r.region}` },
    { key: "price", header: "From", cell: (r) => formatCurrency(r.startingPrice), className: "tabular-nums" },
    { key: "yield", header: "Yield", cell: (r) => formatPercent(r.expectedRentalYield) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "explore", header: "Explore", cell: (r) => (r.visibleInExplore ? "Visible" : "Hidden") },
    { key: "units", header: "Availability", cell: (r) => `${r.availableUnits}/${r.totalUnits}` },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Developments"
        description="Manage developments shown in the investor Explore marketplace."
        actions={
          canEdit ? (
            <Button asChild>
              <Link href="/developments/new">Add development</Link>
            </Button>
          ) : undefined
        }
      />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        onRowClick={(r) => setLocation(`/developments/${r.id}`)}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}

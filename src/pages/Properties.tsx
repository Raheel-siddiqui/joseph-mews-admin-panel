import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/format";
import type { Development, PropertyUnit } from "@/models";
import {
  duplicateProperty,
  listDevelopments,
  listProperties,
  saveProperty,
} from "@/services/api";

export function PropertiesPage() {
  const { can } = useAuth();
  const canPublish = can("publish", "properties");
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<PropertyUnit[]>([]);
  const [devs, setDevs] = useState<Development[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const reload = () =>
    Promise.all([listProperties(), listDevelopments()]).then(([props, developments]) => {
      setRows(props);
      setDevs(developments);
      setLoading(false);
    });

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const columns: Column<PropertyUnit>[] = [
    { key: "name", header: "Property", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "ref", header: "Reference", cell: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    {
      key: "dev",
      header: "Development",
      cell: (r) => devs.find((d) => d.id === r.developmentId)?.name ?? "—",
    },
    { key: "type", header: "Type", cell: (r) => r.propertyType },
    {
      key: "price",
      header: "Purchase",
      cell: (r) => formatCurrency(r.purchasePrice),
      className: "tabular-nums",
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    {
      key: "visibility",
      header: "Explore",
      cell: (r) => (r.visibleInExplore ? "Visible" : "Hidden"),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) =>
        canPublish ? (
          <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const publishing = !(r.status === "available" && r.visibleInExplore);
                await saveProperty({
                  ...r,
                  status: publishing ? "available" : "draft",
                  visibleInExplore: publishing,
                });
                toast.success(publishing ? "Published to Explore" : "Unpublished");
                reload();
              }}
            >
              {r.status === "available" && r.visibleInExplore ? "Unpublish" : "Publish"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const copy = await duplicateProperty(r.id);
                toast.success("Property duplicated");
                setLocation(`/properties/${copy.id}`);
              }}
            >
              Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={() => setArchiveId(r.id)}>
              Archive
            </Button>
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
        title="Properties"
        description="Units and holdings. Publish to make available in investor Explore."
        actions={
          canPublish ? (
            <Button asChild>
              <Link href="/properties/new">Add property</Link>
            </Button>
          ) : undefined
        }
      />
      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        onRowClick={(r) => setLocation(`/properties/${r.id}`)}
        page={page}
        onPageChange={setPage}
      />
      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive property?"
        description="Archived properties are hidden from Explore and marked archived."
        confirmLabel="Archive"
        destructive
        onConfirm={async () => {
          const row = rows.find((p) => p.id === archiveId);
          if (row) {
            await saveProperty({ ...row, status: "archived", visibleInExplore: false });
            toast.success("Property archived");
            reload();
          }
          setArchiveId(null);
        }}
      />
    </div>
  );
}

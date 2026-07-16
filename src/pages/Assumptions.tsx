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
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import type { Assumption, AssumptionVersion } from "@/models";
import {
  listAssumptionVersions,
  listAssumptions,
  updateAssumption,
} from "@/services/api";

export function AssumptionsPage() {
  const { can } = useAuth();
  const canEdit = can("manage_assumptions", "assumptions");
  const [rows, setRows] = useState<Assumption[]>([]);
  const [versions, setVersions] = useState<AssumptionVersion[]>([]);
  const [selected, setSelected] = useState<Assumption | null>(null);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [a, v] = await Promise.all([listAssumptions(), listAssumptionVersions()]);
    setRows(a);
    setVersions(v);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const columns: Column<Assumption>[] = [
    { key: "label", header: "Assumption", cell: (r) => r.label },
    { key: "value", header: "Value", cell: (r) => `${r.value} ${r.unit}`, className: "tabular-nums" },
    { key: "scope", header: "Scope", cell: (r) => <StatusBadge value={r.scope} /> },
    { key: "ref", header: "Scope ref", cell: (r) => r.scopeRefId ?? "—" },
    {
      key: "draft",
      header: "Status",
      cell: (r) =>
        r.isDraftPlaceholder ? (
          <StatusBadge value="draft_placeholder" />
        ) : (
          <StatusBadge value="configured" />
        ),
    },
    { key: "updated", header: "Updated", cell: (r) => formatDateTime(r.updatedAt) },
    { key: "by", header: "By", cell: (r) => r.updatedBy },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Calculations & Assumptions"
        description="Editable configuration used by the calculator and projections. Placeholders are labelled — no new finance logic invented."
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          setSelected(r);
          setValue(String(r.value));
          setNote("");
        }}
        pageSize={12}
      />

      {selected && (
        <div className="mt-6 space-y-4">
          <FormSection title={`Edit: ${selected.label}`} description={selected.description}>
            <div className="space-y-2">
              <Label>Value ({selected.unit})</Label>
              <Input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Change note</Label>
              <Input
                disabled={!canEdit}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for change"
              />
            </div>
            <div className="md:col-span-2 text-xs text-muted-foreground">
              Source: {selected.sourceNote} · Effective {selected.effectiveDate}
              {selected.isDraftPlaceholder && " · Draft placeholder — not yet used in live calculator math"}
            </div>
            {canEdit && (
              <div className="md:col-span-2">
                <Button
                  onClick={async () => {
                    await updateAssumption(selected.id, Number(value), note || "Updated via admin");
                    toast.success("Assumption updated — recorded in audit & version history");
                    const updated = rows.find((r) => r.id === selected.id);
                    setSelected(updated ? { ...updated, value: Number(value) } : selected);
                    reload();
                  }}
                >
                  Save assumption
                </Button>
              </div>
            )}
          </FormSection>

          <div>
            <h3 className="mb-2 text-sm font-medium">Version history</h3>
            <DataTable
              columns={[
                { key: "prev", header: "Previous", cell: (r) => r.previousValue },
                { key: "next", header: "New", cell: (r) => r.newValue },
                { key: "by", header: "Changed by", cell: (r) => r.changedBy },
                { key: "at", header: "When", cell: (r) => formatDateTime(r.changedAt) },
                { key: "note", header: "Note", cell: (r) => r.note },
              ]}
              rows={versions.filter((v) => v.assumptionId === selected.id)}
              rowKey={(r) => r.id}
              emptyTitle="No versions yet"
            />
          </div>
        </div>
      )}
    </div>
  );
}

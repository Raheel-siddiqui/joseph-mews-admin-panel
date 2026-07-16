import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { FormSection } from "@/components/admin/FormSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { IntentSignal, SignalRule, SignalStatus } from "@/models";
import { listRules, listSignals, updateRule, updateSignal } from "@/services/api";

const signalStatuses: SignalStatus[] = [
  "new", "viewed", "contact_planned", "contacted", "qualified", "dismissed", "converted",
];

export function SignalsPage() {
  const { user, canMutate } = useAuth();
  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [rules, setRules] = useState<SignalRule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IntentSignal | null>(null);
  const [notes, setNotes] = useState("");
  const [page, setPage] = useState(1);

  const reload = async () => {
    if (!user) return;
    const [s, r] = await Promise.all([
      listSignals({ role: user.role, userId: user.id }),
      listRules(),
    ]);
    setSignals(s);
    setRules(r);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return signals.filter(
      (s) =>
        !q ||
        s.signalType.toLowerCase().includes(q) ||
        s.triggeringActivity.toLowerCase().includes(q),
    );
  }, [signals, search]);

  const columns: Column<IntentSignal>[] = [
    { key: "type", header: "Signal", cell: (r) => r.signalType },
    { key: "activity", header: "Trigger", cell: (r) => r.triggeringActivity },
    { key: "level", header: "Intent", cell: (r) => <StatusBadge value={r.intentLevel} /> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "action", header: "Suggested next", cell: (r) => r.suggestedNextAction },
    { key: "date", header: "Generated", cell: (r) => formatDateTime(r.generatedAt) },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Intent Signals"
        description="Rule-based sales signals from investor activity. AI summary field reserved for later."
      />
      <Tabs defaultValue="signals">
        <TabsList>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="signals" className="mt-4 space-y-4">
          <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            page={page}
            onPageChange={setPage}
            onRowClick={(r) => {
              setSelected(r);
              setNotes(r.agentNotes);
            }}
          />
          {selected && canMutate("signals") && (
            <FormSection title={`Update: ${selected.signalType}`}>
              <div className="space-y-2 md:col-span-2">
                <Label>Status</Label>
                <Select
                  value={selected.status}
                  onValueChange={async (v) => {
                    const updated = await updateSignal(selected.id, { status: v as SignalStatus });
                    setSelected(updated);
                    toast.success("Signal status updated");
                    reload();
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {signalStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Agent notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  AI summary: {selected.summary ?? "— (available in a future release)"}
                </p>
                <Button
                  onClick={async () => {
                    await updateSignal(selected.id, { agentNotes: notes });
                    toast.success("Notes saved");
                    reload();
                  }}
                >
                  Save notes
                </Button>
              </div>
            </FormSection>
          )}
        </TabsContent>
        <TabsContent value="rules" className="mt-4 space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{rule.name}</p>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Threshold {rule.threshold} · {rule.windowDays}d window · {rule.intentLevel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.enabled}
                  disabled={user?.role !== "super_admin"}
                  onCheckedChange={async (v) => {
                    if (user?.role !== "super_admin") {
                      toast.error("Only Super Admins can change signal rules");
                      return;
                    }
                    await updateRule(rule.id, { enabled: v });
                    toast.success(v ? "Rule enabled" : "Rule disabled");
                    reload();
                  }}
                />
                <Label>Enabled</Label>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

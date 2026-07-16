import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { FormSection } from "@/components/admin/FormSection";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type {
  ActivityEvent,
  DocumentAsset,
  IntentSignal,
  Investor,
  Note,
  PortfolioOwnership,
  PropertyUnit,
  InternalUser,
} from "@/models";
import {
  addNote,
  getInvestor,
  listActivity,
  listDocuments,
  listNotes,
  listOwnership,
  listProperties,
  listSignals,
  listUsers,
  updateInvestor,
  saveDocument,
} from "@/services/api";

export function InvestorDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, canMutate } = useAuth();
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [ownership, setOwnership] = useState<PortfolioOwnership[]>([]);
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [agents, setAgents] = useState<InternalUser[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [docName, setDocName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!params.id) return;
    const [inv, own, props, acts, sigs, docs, nts, users] = await Promise.all([
      getInvestor(params.id),
      listOwnership(params.id),
      listProperties(),
      listActivity(params.id),
      listSignals(),
      listDocuments({ investorId: params.id }),
      listNotes(params.id),
      listUsers(),
    ]);
    setInvestor(inv ?? null);
    setOwnership(own);
    setProperties(props);
    setActivity(acts);
    setSignals(sigs.filter((s) => s.investorId === params.id));
    setDocuments(docs);
    setNotes(nts);
    setAgents(users.filter((u) => u.role === "agent"));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [params.id]);

  if (loading) return <LoadingBlock />;
  if (!investor) {
    return (
      <PageHeader title="Investor not found" description="This investor record does not exist." />
    );
  }

  const portfolioColumns: Column<PortfolioOwnership>[] = [
    {
      key: "property",
      header: "Property",
      cell: (r) => properties.find((p) => p.id === r.propertyId)?.name ?? r.propertyId,
    },
    { key: "purchase", header: "Purchase", cell: (r) => formatCurrency(r.purchaseValue) },
    { key: "value", header: "Current value", cell: (r) => formatCurrency(r.currentValue) },
    { key: "mortgage", header: "Mortgage", cell: (r) => formatCurrency(r.mortgageBalance) },
    { key: "equity", header: "Equity", cell: (r) => formatCurrency(r.equity) },
    { key: "rent", header: "Rent", cell: (r) => formatCurrency(r.monthlyRent) },
    { key: "ncf", header: "Net cash flow", cell: (r) => formatCurrency(r.netCashFlow) },
  ];

  return (
    <div>
      <PageHeader
        title={investor.name}
        description={investor.email}
        breadcrumbs={[
          { label: "Investors", href: "/investors" },
          { label: investor.name },
        ]}
      />

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="signals">Intent Signals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FormSection title="Profile" description="Contact and investment preference fields.">
            <Field label="Name" value={investor.name} />
            <Field label="Email" value={investor.email} />
            <Field label="Phone" value={investor.phone} />
            <Field label="Country" value={investor.country} />
            <Field label="Nationality" value={investor.nationality} />
            <Field label="Residency" value={investor.residencyStatus} />
            <Field label="Onboarding" value={investor.onboardingStatus} />
            <Field label="Account status" value={investor.accountStatus} />
            <Field label="Buying power" value={formatCurrency(investor.buyingPower)} />
            <Field label="Horizon" value={investor.investmentHorizon} />
            <Field label="Risk appetite" value={investor.riskAppetite} />
            <Field label="Preferences" value={investor.investmentPreferences} />
          </FormSection>

          {canMutate("investors") && (
            <FormSection title="Assignment">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="agent">Assigned agent</Label>
                <Select
                  value={investor.assignedAgentId ?? "none"}
                  onValueChange={async (v) => {
                    const updated = await updateInvestor(investor.id, {
                      assignedAgentId: v === "none" ? null : v,
                    });
                    setInvestor(updated);
                    toast.success("Agent assignment updated");
                  }}
                >
                  <SelectTrigger id="agent"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormSection>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          <DataTable
            columns={portfolioColumns}
            rows={ownership}
            rowKey={(r) => r.id}
            emptyTitle="No portfolio holdings"
            emptyDescription="Assign properties to this investor to populate portfolio metrics."
          />
        </TabsContent>

        <TabsContent value="activity">
          <DataTable
            columns={[
              { key: "title", header: "Event", cell: (r) => r.title },
              { key: "detail", header: "Detail", cell: (r) => r.detail },
              { key: "type", header: "Type", cell: (r) => <StatusBadge value={r.type} /> },
              { key: "time", header: "When", cell: (r) => formatDateTime(r.timestamp) },
            ]}
            rows={activity}
            rowKey={(r) => r.id}
            emptyTitle="No activity yet"
          />
        </TabsContent>

        <TabsContent value="signals">
          <DataTable
            columns={[
              { key: "type", header: "Signal", cell: (r) => r.signalType },
              { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
              { key: "action", header: "Suggested action", cell: (r) => r.suggestedNextAction },
              { key: "date", header: "Generated", cell: (r) => formatDateTime(r.generatedAt) },
            ]}
            rows={signals}
            rowKey={(r) => r.id}
            emptyTitle="No signals"
          />
          <div className="mt-3">
            <Button variant="outline" asChild>
              <Link href="/signals">Open signals workspace</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {canMutate("investors") && (
            <div className="flex flex-col gap-2 rounded-md border border-border p-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="doc-name">Upload document</Label>
                <Input
                  id="doc-name"
                  placeholder="Document file name.pdf"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                />
              </div>
              <Button
                disabled={!docName.trim()}
                onClick={async () => {
                  await saveDocument({
                    name: docName.trim(),
                    investorId: investor.id,
                    category: "General Documents",
                    fileType: "PDF",
                    size: "1.0 MB",
                    visibility: "both",
                  });
                  setDocName("");
                  toast.success("Document uploaded to this investor");
                  load();
                }}
              >
                Upload
              </Button>
            </div>
          )}
          <DataTable
            columns={[
              { key: "name", header: "File", cell: (r) => r.name },
              { key: "cat", header: "Category", cell: (r) => r.category },
              { key: "vis", header: "Visibility", cell: (r) => <StatusBadge value={r.visibility} /> },
              { key: "up", header: "Uploaded", cell: (r) => formatDate(r.uploadedAt) },
              { key: "exp", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
              { key: "ver", header: "Version", cell: (r) => `v${r.version}` },
              { key: "dl", header: "Downloads", cell: (r) => r.downloadCount },
            ]}
            rows={documents}
            rowKey={(r) => r.id}
            emptyTitle="No documents for this investor"
            emptyDescription="Upload a file here to attach it to this investor profile."
          />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {canMutate("investors") && (
            <div className="rounded-md border border-border p-4 space-y-3">
              <Label htmlFor="note">Add note</Label>
              <Textarea
                id="note"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Internal or follow-up note…"
              />
              <Button
                disabled={!noteBody.trim() || !user}
                onClick={async () => {
                  if (!user) return;
                  await addNote({
                    investorId: investor.id,
                    body: noteBody.trim(),
                    authorId: user.id,
                    authorName: user.name,
                    kind: "agent",
                  });
                  setNoteBody("");
                  toast.success("Note added");
                  load();
                }}
              >
                Save note
              </Button>
            </div>
          )}
          <DataTable
            columns={[
              { key: "body", header: "Note", cell: (r) => r.body },
              { key: "kind", header: "Kind", cell: (r) => <StatusBadge value={r.kind} /> },
              { key: "author", header: "Author", cell: (r) => r.authorName },
              { key: "at", header: "When", cell: (r) => formatDateTime(r.createdAt) },
            ]}
            rows={notes}
            rowKey={(r) => r.id}
            emptyTitle="No notes"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
      <Input className="sr-only" readOnly value={value} aria-hidden tabIndex={-1} />
    </div>
  );
}

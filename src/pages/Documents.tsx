import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/format";
import type { DocumentAsset, Folder, Investor } from "@/models";
import { listDocuments, listFolders, listInvestors, saveDocument } from "@/services/api";

export function DocumentsPage() {
  const { user, canMutate } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<DocumentAsset[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [folderId, setFolderId] = useState<string | "all">("all");
  const [investorId, setInvestorId] = useState<string | "all">("all");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    const [f, d, inv] = await Promise.all([
      listFolders(),
      listDocuments(),
      listInvestors({ role: user.role, userId: user.id }),
    ]);
    setFolders(f);
    setDocs(d);
    setInvestors(inv);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [user]);

  const visibleFolders = folders.filter((f) => !f.isTemplate || investorId === "templates");
  const investorFolders = folders.filter((f) =>
    investorId === "all" ? !f.isTemplate : f.investorId === investorId,
  );

  const filteredDocs = docs.filter((d) => {
    if (investorId !== "all" && d.investorId !== investorId) return false;
    if (folderId !== "all" && d.folderId !== folderId) return false;
    return true;
  });

  const columns: Column<DocumentAsset>[] = [
    { key: "name", header: "File", cell: (r) => r.name },
    { key: "cat", header: "Category", cell: (r) => r.category },
    {
      key: "investor",
      header: "Investor",
      cell: (r) => investors.find((i) => i.id === r.investorId)?.name ?? "—",
    },
    { key: "vis", header: "Visibility", cell: (r) => <StatusBadge value={r.visibility} /> },
    { key: "up", header: "Uploaded", cell: (r) => formatDate(r.uploadedAt) },
    { key: "exp", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
    { key: "ver", header: "Version", cell: (r) => `v${r.version}` },
    { key: "dl", header: "Downloads", cell: (r) => r.downloadCount },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Folders, visibility, and investor assignment. Uploads are simulated in the mock layer."
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Investor</p>
          <Select value={investorId} onValueChange={setInvestorId}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All documents</SelectItem>
              <SelectItem value="templates">Standard templates</SelectItem>
              {investors.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Folder</p>
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {(investorId === "templates" ? folders.filter((f) => f.isTemplate) : investorFolders).map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(investorId === "templates" ? folders.filter((f) => f.isTemplate) : investorFolders).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFolderId(f.id)}
            className="rounded-md border border-border bg-card/40 px-4 py-3 text-left text-sm hover:border-primary/40"
          >
            <p className="font-medium">{f.name}</p>
            <p className="text-xs text-muted-foreground">{f.category}</p>
          </button>
        ))}
        {visibleFolders.length === 0 && investorId !== "templates" && (
          <p className="text-sm text-muted-foreground">No folders for this filter.</p>
        )}
      </div>

      {canMutate("documents") && (
        <div className="mb-4 flex flex-col gap-2 rounded-md border border-border p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground">Simulate upload</p>
            <Input
              placeholder="Document file name.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <Button
            disabled={!fileName.trim()}
            onClick={async () => {
              await saveDocument({
                name: fileName.trim(),
                folderId: folderId === "all" ? null : folderId,
                investorId: investorId === "all" || investorId === "templates" ? null : investorId,
                category: "General Documents",
                fileType: "PDF",
                size: "1.0 MB",
              });
              setFileName("");
              toast.success("Document uploaded (mock)");
              reload();
            }}
          >
            Upload
          </Button>
        </div>
      )}

      <DataTable columns={columns} rows={filteredDocs} rowKey={(r) => r.id} />
    </div>
  );
}

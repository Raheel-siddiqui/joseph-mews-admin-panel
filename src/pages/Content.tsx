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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import type { ContentBlock } from "@/models";
import { listContent, saveContent } from "@/services/api";

export function ContentPage() {
  const { can } = useAuth();
  const canPublish = can("manage_content", "content") || can("publish", "content");
  const [rows, setRows] = useState<ContentBlock[]>([]);
  const [selected, setSelected] = useState<ContentBlock | null>(null);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  const reload = async () => {
    const data = await listContent();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const columns: Column<ContentBlock>[] = [
    { key: "title", header: "Title", cell: (r) => r.title },
    { key: "key", header: "Key", cell: (r) => <span className="font-mono text-xs">{r.key}</span> },
    { key: "area", header: "Area", cell: (r) => r.area },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "updated", header: "Updated", cell: (r) => formatDateTime(r.updatedAt) },
  ];

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Content"
        description="Editable investor-facing copy. Save as draft and publish when ready."
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          setSelected(r);
          setBody(r.body);
          setTitle(r.title);
          setPreview(false);
        }}
      />

      {selected && (
        <div className="mt-6 space-y-4">
          <FormSection title="Edit content block">
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input
                disabled={!canPublish}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Body</Label>
              <Textarea
                disabled={!canPublish}
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            {canPublish && (
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await saveContent({ ...selected, title, body, status: "draft" });
                    toast.success("Saved as draft");
                    reload();
                  }}
                >
                  Save draft
                </Button>
                <Button variant="outline" onClick={() => setPreview((p) => !p)}>
                  {preview ? "Hide preview" : "Preview"}
                </Button>
                <Button
                  onClick={async () => {
                    await saveContent({ ...selected, title, body, status: "published" });
                    toast.success("Published");
                    reload();
                  }}
                >
                  Publish
                </Button>
              </div>
            )}
          </FormSection>
          {preview && (
            <div className="rounded-md border border-primary/30 bg-card/50 p-5">
              <p className="label-eyebrow">Preview</p>
              <h3 className="mt-2 font-serif text-xl">{title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{body}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

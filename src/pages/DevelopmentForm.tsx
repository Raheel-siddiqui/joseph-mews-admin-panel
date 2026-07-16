import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormSection } from "@/components/admin/FormSection";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { Development, DevelopmentStatus } from "@/models";
import { getDevelopment, saveDevelopment } from "@/services/api";

export function DevelopmentFormPage() {
  const params = useParams<{ id: string }>();
  const isNew = !params.id || params.id === "new";
  const { can } = useAuth();
  const canEdit = can("create", "developments") || can("edit", "developments");
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<Partial<Development>>({
    name: "",
    status: "draft",
    visibleInExplore: false,
    featured: false,
    startingPrice: 0,
    expectedRentalYield: 0,
    expectedCapitalGrowth: 0,
    availableUnits: 0,
    totalUnits: 0,
    propertyTypes: [],
    amenities: [],
    highlights: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && params.id) {
      getDevelopment(params.id).then((d) => {
        if (d) setForm(d);
        setLoading(false);
      });
    }
  }, [isNew, params.id]);

  if (loading) return <LoadingBlock />;

  const set = <K extends keyof Development>(key: K, value: Development[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <PageHeader
        title={isNew ? "Add development" : form.name || "Edit development"}
        breadcrumbs={[
          { label: "Developments", href: "/developments" },
          { label: isNew ? "New" : form.reference || "Edit" },
        ]}
      />
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canEdit) return;
          setSaving(true);
          try {
            const saved = await saveDevelopment({
              ...form,
              name: form.name || "Untitled development",
            });
            toast.success(isNew ? "Development created" : "Development updated");
            setLocation(`/developments/${saved.id}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        <FormSection title="Basics">
          <div className="space-y-2"><Label>Name</Label><Input required disabled={!canEdit} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-2"><Label>Developer</Label><Input disabled={!canEdit} value={form.developer ?? ""} onChange={(e) => set("developer", e.target.value)} /></div>
          <div className="space-y-2"><Label>Address</Label><Input disabled={!canEdit} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-2"><Label>City</Label><Input disabled={!canEdit} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="space-y-2"><Label>Region</Label><Input disabled={!canEdit} value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} /></div>
          <div className="space-y-2"><Label>Postcode</Label><Input disabled={!canEdit} value={form.postcode ?? ""} onChange={(e) => set("postcode", e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea disabled={!canEdit} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
        </FormSection>
        <FormSection title="Commercial">
          <div className="space-y-2"><Label>Starting price</Label><Input type="number" disabled={!canEdit} value={form.startingPrice ?? 0} onChange={(e) => set("startingPrice", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Expected rental yield %</Label><Input type="number" step="0.1" disabled={!canEdit} value={form.expectedRentalYield ?? 0} onChange={(e) => set("expectedRentalYield", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Expected capital growth %</Label><Input type="number" step="0.1" disabled={!canEdit} value={form.expectedCapitalGrowth ?? 0} onChange={(e) => set("expectedCapitalGrowth", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Completion date</Label><Input disabled={!canEdit} value={form.completionDate ?? ""} onChange={(e) => set("completionDate", e.target.value)} /></div>
          <div className="space-y-2"><Label>Payment plan</Label><Input disabled={!canEdit} value={form.paymentPlanSummary ?? ""} onChange={(e) => set("paymentPlanSummary", e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status ?? "draft"} onValueChange={(v) => set("status", v as DevelopmentStatus)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "coming_soon", "available", "sold_out", "completed", "archived"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormSection>
        <FormSection title="Content">
          <div className="space-y-2 md:col-span-2"><Label>Highlights (comma-separated)</Label><Textarea disabled={!canEdit} value={(form.highlights ?? []).join(", ")} onChange={(e) => set("highlights", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Amenities (comma-separated)</Label><Textarea disabled={!canEdit} value={(form.amenities ?? []).join(", ")} onChange={(e) => set("amenities", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Location information</Label><Textarea disabled={!canEdit} value={form.locationInfo ?? ""} onChange={(e) => set("locationInfo", e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Image URL</Label><Input disabled={!canEdit} value={form.image ?? ""} onChange={(e) => set("image", e.target.value)} /></div>
        </FormSection>
        <FormSection title="Visibility">
          <div className="flex items-center gap-3"><Switch id="feat" disabled={!canEdit} checked={!!form.featured} onCheckedChange={(v) => set("featured", v)} /><Label htmlFor="feat">Featured</Label></div>
          <div className="flex items-center gap-3"><Switch id="vis" disabled={!canEdit} checked={!!form.visibleInExplore} onCheckedChange={(v) => set("visibleInExplore", v)} /><Label htmlFor="vis">Visible in Explore</Label></div>
        </FormSection>
        {canEdit && (
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save development"}</Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/developments")}>Cancel</Button>
          </div>
        )}
      </form>
    </div>
  );
}

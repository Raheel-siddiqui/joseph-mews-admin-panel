import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormSection } from "@/components/admin/FormSection";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { Development, PropertyStatus, PropertyUnit } from "@/models";
import { getProperty, listDevelopments, saveProperty } from "@/services/api";

const empty: Partial<PropertyUnit> = {
  name: "",
  reference: "",
  propertyType: "1-bed",
  bedrooms: 1,
  bathrooms: 1,
  sizeSqft: 0,
  floor: "",
  purchasePrice: 0,
  currentValue: 0,
  status: "draft",
  city: "",
  location: "",
  postcode: "",
  rentalEstimate: 0,
  serviceCharge: 0,
  groundRent: 0,
  managementFee: 0,
  projectedGrossYield: 0,
  projectedNetYield: 0,
  projectedCapitalGrowth: 0,
  paymentPlanSummary: "",
  visibleInExplore: false,
  completionDate: "",
  image: "",
};

export function PropertyFormPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new" || !params.id;
  const { can } = useAuth();
  const canEdit = can("edit", "properties") || can("create", "properties");
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<Partial<PropertyUnit>>(empty);
  const [devs, setDevs] = useState<Development[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listDevelopments().then(setDevs);
    if (!isNew && params.id) {
      getProperty(params.id).then((p) => {
        if (p) setForm(p);
        setLoading(false);
      });
    }
  }, [isNew, params.id]);

  if (loading) return <LoadingBlock />;

  const set = <K extends keyof PropertyUnit>(key: K, value: PropertyUnit[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <PageHeader
        title={isNew ? "Add property" : form.name || "Edit property"}
        description="All investor-facing property fields are editable here."
        breadcrumbs={[
          { label: "Properties", href: "/properties" },
          { label: isNew ? "New" : form.reference || "Edit" },
        ]}
        actions={
          form.id ? (
            <Button variant="outline" asChild>
              <a href={`https://invest.josephmews.com/explore/${form.id}`} target="_blank" rel="noreferrer">
                Preview investor page
              </a>
            </Button>
          ) : undefined
        }
      />

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canEdit) return;
          setSaving(true);
          try {
            const saved = await saveProperty({
              ...form,
              name: form.name || "Untitled property",
            });
            toast.success(isNew ? "Property created" : "Property updated");
            setLocation(`/properties/${saved.id}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        <FormSection title="Identity">
          <Field label="Name">
            <Input
              required
              disabled={!canEdit}
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Reference">
            <Input
              disabled={!canEdit}
              value={form.reference ?? ""}
              onChange={(e) => set("reference", e.target.value)}
            />
          </Field>
          <Field label="Development">
            <Select
              value={form.developmentId ?? "none"}
              onValueChange={(v) => set("developmentId", v === "none" ? null : v)}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {devs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status ?? "draft"}
              onValueChange={(v) => set("status", v as PropertyStatus)}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "coming_soon", "available", "reserved", "sold", "completed", "archived", "tenanted", "in_build", "vacant"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Specifications">
          <Field label="Type">
            <Input disabled={!canEdit} value={form.propertyType ?? ""} onChange={(e) => set("propertyType", e.target.value)} />
          </Field>
          <Field label="Bedrooms">
            <Input type="number" disabled={!canEdit} value={form.bedrooms ?? 0} onChange={(e) => set("bedrooms", Number(e.target.value))} />
          </Field>
          <Field label="Bathrooms">
            <Input type="number" disabled={!canEdit} value={form.bathrooms ?? 0} onChange={(e) => set("bathrooms", Number(e.target.value))} />
          </Field>
          <Field label="Size (sqft)">
            <Input type="number" disabled={!canEdit} value={form.sizeSqft ?? 0} onChange={(e) => set("sizeSqft", Number(e.target.value))} />
          </Field>
          <Field label="Floor">
            <Input disabled={!canEdit} value={form.floor ?? ""} onChange={(e) => set("floor", e.target.value)} />
          </Field>
          <Field label="Completion date">
            <Input disabled={!canEdit} value={form.completionDate ?? ""} onChange={(e) => set("completionDate", e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Location">
          <Field label="City">
            <Input disabled={!canEdit} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Location">
            <Input disabled={!canEdit} value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Postcode">
            <Input disabled={!canEdit} value={form.postcode ?? ""} onChange={(e) => set("postcode", e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Image" description="Upload a property image.">
          <div className="md:col-span-2 space-y-4">
            {form.image ? (
              <div className="overflow-hidden rounded-md border border-border bg-card/40">
                <img
                  src={form.image}
                  alt={form.name || "Property"}
                  className="h-48 w-full object-cover sm:h-56"
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border bg-card/20 text-sm text-muted-foreground sm:h-56">
                No image selected
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="property-image-upload">Upload image</Label>
                <Input
                  id="property-image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={!canEdit}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Image must be under 5 MB");
                      e.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      set("image", String(reader.result ?? ""));
                      toast.success("Image uploaded");
                    };
                    reader.onerror = () => toast.error("Failed to read image");
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              {form.image && canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    set("image", "");
                    toast.message("Image removed");
                  }}
                >
                  Remove image
                </Button>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Financials">
          <Field label="Purchase price">
            <Input type="number" disabled={!canEdit} value={form.purchasePrice ?? 0} onChange={(e) => set("purchasePrice", Number(e.target.value))} />
          </Field>
          <Field label="Current value">
            <Input type="number" disabled={!canEdit} value={form.currentValue ?? 0} onChange={(e) => set("currentValue", Number(e.target.value))} />
          </Field>
          <Field label="Rental estimate (monthly)">
            <Input type="number" disabled={!canEdit} value={form.rentalEstimate ?? 0} onChange={(e) => set("rentalEstimate", Number(e.target.value))} />
          </Field>
          <Field label="Service charge">
            <Input type="number" disabled={!canEdit} value={form.serviceCharge ?? 0} onChange={(e) => set("serviceCharge", Number(e.target.value))} />
          </Field>
          <Field label="Ground rent">
            <Input type="number" disabled={!canEdit} value={form.groundRent ?? 0} onChange={(e) => set("groundRent", Number(e.target.value))} />
          </Field>
          <Field label="Management fee">
            <Input type="number" disabled={!canEdit} value={form.managementFee ?? 0} onChange={(e) => set("managementFee", Number(e.target.value))} />
          </Field>
          <Field label="Gross yield %">
            <Input type="number" step="0.1" disabled={!canEdit} value={form.projectedGrossYield ?? 0} onChange={(e) => set("projectedGrossYield", Number(e.target.value))} />
          </Field>
          <Field label="Net yield %">
            <Input type="number" step="0.1" disabled={!canEdit} value={form.projectedNetYield ?? 0} onChange={(e) => set("projectedNetYield", Number(e.target.value))} />
          </Field>
          <Field label="Capital growth %">
            <Input type="number" step="0.1" disabled={!canEdit} value={form.projectedCapitalGrowth ?? 0} onChange={(e) => set("projectedCapitalGrowth", Number(e.target.value))} />
          </Field>
          <Field label="Payment plan">
            <Input disabled={!canEdit} value={form.paymentPlanSummary ?? ""} onChange={(e) => set("paymentPlanSummary", e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Visibility">
          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              checked={!!form.visibleInExplore}
              disabled={!canEdit}
              onCheckedChange={(v) => set("visibleInExplore", v)}
              id="visible"
            />
            <Label htmlFor="visible">Visible in Explore</Label>
          </div>
        </FormSection>

        {canEdit && (
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save property"}</Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/properties")}>Cancel</Button>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

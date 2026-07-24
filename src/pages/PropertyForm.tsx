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
import { formatCurrency } from "@/lib/format";
import {
  nextPayment,
  paidTotal,
  remainingTotal,
  stageAmount,
  summarizeStandardPlan,
} from "@/lib/paymentPlan";
import { id as newId } from "@/mocks/db";
import type {
  Development,
  PaymentInstallment,
  PaymentInstallmentStatus,
  PaymentPlan,
  PropertyStatus,
  PropertyUnit,
  StandardPaymentPlan,
  StandardPaymentStage,
} from "@/models";
import {
  assignPropertyToInvestor,
  getProperty,
  listDevelopments,
  saveProperty,
} from "@/services/api";

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
  standardPaymentPlan: null,
  paymentPlan: null,
  visibleInExplore: false,
  completionDate: "",
  image: "",
};

function emptyOwnedPlan(basisPrice = 0): PaymentPlan {
  return {
    name: "Staged off-plan plan",
    basisPrice,
    installments: [],
  };
}

function emptyStandardPlan(): StandardPaymentPlan {
  return {
    name: "Standard staged plan",
    stages: [
      { label: "Deposit", percent: 20, trigger: "On reservation" },
      { label: "Balance", percent: 80, trigger: "On completion" },
    ],
  };
}

function emptyInstallment(): PaymentInstallment {
  return {
    id: newId(),
    label: "",
    percent: 0,
    amount: 0,
    dueDate: "",
    status: "upcoming",
  };
}

export function PropertyFormPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new" || !params.id;
  const investorIdFromQuery =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("investorId")
      : null;
  const { can } = useAuth();
  const canEdit = can("edit", "properties") || can("create", "properties");
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<Partial<PropertyUnit>>({
    ...empty,
    assignedInvestorId: investorIdFromQuery,
  });
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

  const ownedPlan = form.paymentPlan ?? null;
  const standardPlan = form.standardPaymentPlan ?? null;
  const fromPrice = form.purchasePrice ?? 0;
  const exploreClosed = standardPlan === null && form.paymentPlanSummary === "Closed";

  const updateOwnedPlan = (plan: PaymentPlan | null) => set("paymentPlan", plan);

  const patchOwnedPlan = (patch: Partial<PaymentPlan>) => {
    const base = ownedPlan ?? emptyOwnedPlan(fromPrice);
    updateOwnedPlan({ ...base, ...patch });
  };

  const updateInstallment = (index: number, patch: Partial<PaymentInstallment>) => {
    if (!ownedPlan) return;
    const installments = ownedPlan.installments.map((inst, i) => {
      if (i !== index) return inst;
      const next = { ...inst, ...patch };
      if (patch.percent !== undefined && patch.amount === undefined) {
        next.amount = stageAmount(ownedPlan.basisPrice, next.percent);
      }
      if (patch.status === "paid" && !next.paidAt) {
        next.paidAt = new Date().toISOString().slice(0, 10);
      }
      if (patch.status && patch.status !== "paid") {
        next.paidAt = undefined;
      }
      return next;
    });
    updateOwnedPlan({ ...ownedPlan, installments });
  };

  const updateStandardPlan = (plan: StandardPaymentPlan | null) =>
    set("standardPaymentPlan", plan);

  const patchStandardPlan = (patch: Partial<StandardPaymentPlan>) => {
    const base = standardPlan ?? emptyStandardPlan();
    updateStandardPlan({ ...base, ...patch });
  };

  const updateStage = (index: number, patch: Partial<StandardPaymentStage>) => {
    if (!standardPlan) return;
    const stages = standardPlan.stages.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    const next = { ...standardPlan, stages };
    updateStandardPlan(next);
    set("paymentPlanSummary", summarizeStandardPlan(next));
  };

  const markExploreClosed = (closed: boolean) => {
    if (closed) {
      set("standardPaymentPlan", null);
      set("paymentPlanSummary", "Closed");
    } else {
      const plan = emptyStandardPlan();
      set("standardPaymentPlan", plan);
      set("paymentPlanSummary", summarizeStandardPlan(plan));
    }
  };

  const ownedMetrics = ownedPlan
    ? {
        paid: paidTotal(ownedPlan),
        remaining: remainingTotal(ownedPlan),
        next: nextPayment(ownedPlan),
      }
    : null;

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
              assignedInvestorId: form.assignedInvestorId ?? investorIdFromQuery,
              paymentPlanSummary: form.paymentPlanSummary ?? "",
              standardPaymentPlan: form.standardPaymentPlan ?? null,
              paymentPlan: form.paymentPlan ?? null,
            });
            if (isNew && (investorIdFromQuery || form.assignedInvestorId)) {
              const investorId = (investorIdFromQuery || form.assignedInvestorId)!;
              try {
                await assignPropertyToInvestor(investorId, saved.id);
              } catch {
                /* already assigned via property field */
              }
              toast.success("Property created and assigned to investor");
              setLocation(`/investors/${investorId}?tab=portfolio`);
            } else {
              toast.success(isNew ? "Property created" : "Property updated");
              setLocation(`/properties/${saved.id}`);
            }
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
        </FormSection>

        <FormSection
          title="Explore payment plan"
          description="Marketplace summary and standard staged plan. Stage amounts = purchase price × percent / 100."
        >
          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              checked={exploreClosed}
              disabled={!canEdit}
              onCheckedChange={markExploreClosed}
              id="explore-closed"
            />
            <Label htmlFor="explore-closed">Sold out / closed (summary = Closed, plan = null)</Label>
          </div>

          <Field label="Payment plan summary">
            <Input
              disabled={!canEdit || exploreClosed}
              value={form.paymentPlanSummary ?? ""}
              onChange={(e) => set("paymentPlanSummary", e.target.value)}
              placeholder="e.g. 20% deposit · 80% balance"
            />
          </Field>

          {!exploreClosed && (
            <>
              <Field label="Standard plan name">
                <Input
                  disabled={!canEdit}
                  value={standardPlan?.name ?? ""}
                  onChange={(e) => {
                    if (!standardPlan) {
                      updateStandardPlan({ ...emptyStandardPlan(), name: e.target.value });
                    } else {
                      patchStandardPlan({ name: e.target.value });
                    }
                  }}
                />
              </Field>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Stages</Label>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const base = standardPlan ?? emptyStandardPlan();
                        updateStandardPlan({
                          ...base,
                          stages: [...base.stages, { label: "", percent: 0, trigger: "" }],
                        });
                      }}
                    >
                      Add stage
                    </Button>
                  )}
                </div>

                {(standardPlan?.stages ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">No stages. Enable a plan or add a stage.</p>
                )}

                {(standardPlan?.stages ?? []).map((stage, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-md border border-border bg-background/40 p-3 sm:grid-cols-4"
                  >
                    <Field label="Label">
                      <Input
                        disabled={!canEdit}
                        value={stage.label}
                        onChange={(e) => updateStage(index, { label: e.target.value })}
                      />
                    </Field>
                    <Field label="Percent">
                      <Input
                        type="number"
                        step="0.1"
                        disabled={!canEdit}
                        value={stage.percent}
                        onChange={(e) => updateStage(index, { percent: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Trigger">
                      <Input
                        disabled={!canEdit}
                        value={stage.trigger}
                        onChange={(e) => updateStage(index, { trigger: e.target.value })}
                        placeholder="On reservation"
                      />
                    </Field>
                    <div className="flex items-end justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm tabular-nums">
                          {formatCurrency(stageAmount(fromPrice, stage.percent))}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!standardPlan) return;
                            const stages = standardPlan.stages.filter((_, i) => i !== index);
                            const next = { ...standardPlan, stages };
                            updateStandardPlan(next);
                            set("paymentPlanSummary", stages.length ? summarizeStandardPlan(next) : "");
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {!standardPlan && canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const plan = emptyStandardPlan();
                      updateStandardPlan(plan);
                      set("paymentPlanSummary", summarizeStandardPlan(plan));
                    }}
                  >
                    Add standard plan
                  </Button>
                )}
              </div>
            </>
          )}
        </FormSection>

        <FormSection
          title="Owned payment plan"
          description="Off-plan / in-build schedule for assigned holdings. Paid, remaining, and next payment are computed from installment status."
        >
          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              checked={!!ownedPlan}
              disabled={!canEdit}
              onCheckedChange={(on) =>
                updateOwnedPlan(on ? emptyOwnedPlan(fromPrice) : null)
              }
              id="owned-plan"
            />
            <Label htmlFor="owned-plan">Enable owned payment plan</Label>
          </div>

          {ownedPlan && (
            <>
              <Field label="Plan name">
                <Input
                  disabled={!canEdit}
                  value={ownedPlan.name}
                  onChange={(e) => patchOwnedPlan({ name: e.target.value })}
                />
              </Field>
              <Field label="Basis price (GBP)">
                <Input
                  type="number"
                  disabled={!canEdit}
                  value={ownedPlan.basisPrice}
                  onChange={(e) => {
                    const basisPrice = Number(e.target.value);
                    const installments = ownedPlan.installments.map((inst) => ({
                      ...inst,
                      amount: stageAmount(basisPrice, inst.percent),
                    }));
                    updateOwnedPlan({ ...ownedPlan, basisPrice, installments });
                  }}
                />
              </Field>

              {ownedMetrics && (
                <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Paid (computed)</p>
                    <p className="text-sm tabular-nums">{formatCurrency(ownedMetrics.paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining (computed)</p>
                    <p className="text-sm tabular-nums">{formatCurrency(ownedMetrics.remaining)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next payment (computed)</p>
                    <p className="text-sm">
                      {ownedMetrics.next
                        ? `${ownedMetrics.next.label} · ${formatCurrency(ownedMetrics.next.amount)}`
                        : "—"}
                    </p>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Installments</Label>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patchOwnedPlan({
                          installments: [
                            ...ownedPlan.installments,
                            emptyInstallment(),
                          ],
                        })
                      }
                    >
                      Add installment
                    </Button>
                  )}
                </div>

                {ownedPlan.installments.length === 0 && (
                  <p className="text-xs text-muted-foreground">No installments yet.</p>
                )}

                {ownedPlan.installments.map((inst, index) => (
                  <div
                    key={inst.id}
                    className="grid gap-2 rounded-md border border-border bg-background/40 p-3 sm:grid-cols-3 lg:grid-cols-6"
                  >
                    <Field label="Label">
                      <Input
                        disabled={!canEdit}
                        value={inst.label}
                        onChange={(e) => updateInstallment(index, { label: e.target.value })}
                      />
                    </Field>
                    <Field label="Percent">
                      <Input
                        type="number"
                        step="0.1"
                        disabled={!canEdit}
                        value={inst.percent}
                        onChange={(e) =>
                          updateInstallment(index, { percent: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Amount (GBP)">
                      <Input
                        type="number"
                        disabled={!canEdit}
                        value={inst.amount}
                        onChange={(e) =>
                          updateInstallment(index, { amount: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Due date">
                      <Input
                        disabled={!canEdit}
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(index, { dueDate: e.target.value })}
                        placeholder="2026-08-15 or On completion"
                      />
                    </Field>
                    <Field label="Status">
                      <Select
                        value={inst.status}
                        disabled={!canEdit}
                        onValueChange={(v) =>
                          updateInstallment(index, {
                            status: v as PaymentInstallmentStatus,
                          })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">paid</SelectItem>
                          <SelectItem value="due">due</SelectItem>
                          <SelectItem value="upcoming">upcoming</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="flex flex-col gap-2">
                      <Field label="Paid at (optional)">
                        <Input
                          disabled={!canEdit || inst.status !== "paid"}
                          value={inst.paidAt ?? ""}
                          onChange={(e) =>
                            updateInstallment(index, {
                              paidAt: e.target.value || undefined,
                            })
                          }
                        />
                      </Field>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-end"
                          onClick={() =>
                            patchOwnedPlan({
                              installments: ownedPlan.installments.filter((_, i) => i !== index),
                            })
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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

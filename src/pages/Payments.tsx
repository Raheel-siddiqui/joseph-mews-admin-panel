import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { FormSection } from "@/components/admin/FormSection";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Investor, PaymentSchedule, PropertyUnit, PaymentMilestoneStatus } from "@/models";
import { listInvestors, listPayments, listProperties, savePayment } from "@/services/api";
import { id as newId } from "@/mocks/db";

function scheduleMetrics(schedule: PaymentSchedule) {
  const paid = schedule.milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => {
      const amount =
        m.percentOrAmount === "amount"
          ? m.value
          : (schedule.totalPurchaseAmount * m.value) / 100;
      return sum + amount;
    }, 0);
  const overdue = schedule.milestones
    .filter((m) => m.status === "overdue")
    .reduce((sum, m) => {
      const amount =
        m.percentOrAmount === "amount"
          ? m.value
          : (schedule.totalPurchaseAmount * m.value) / 100;
      return sum + amount;
    }, 0);
  const remaining = Math.max(schedule.totalPurchaseAmount - paid, 0);
  const next = schedule.milestones.find((m) => m.status === "due" || m.status === "upcoming");
  const progress = schedule.totalPurchaseAmount
    ? Math.round((paid / schedule.totalPurchaseAmount) * 100)
    : 0;
  return { paid, overdue, remaining, next, progress };
}

export function PaymentsPage() {
  const { user, canMutate } = useAuth();
  const [rows, setRows] = useState<PaymentSchedule[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [selected, setSelected] = useState<PaymentSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    const [payments, inv, props] = await Promise.all([
      listPayments({ role: user.role, userId: user.id }),
      listInvestors({ role: user.role, userId: user.id }),
      listProperties(),
    ]);
    setRows(payments);
    setInvestors(inv);
    setProperties(props);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [user]);

  const columns: Column<PaymentSchedule>[] = useMemo(
    () => [
      {
        key: "investor",
        header: "Investor",
        cell: (r) => investors.find((i) => i.id === r.investorId)?.name ?? r.investorId,
      },
      {
        key: "property",
        header: "Property",
        cell: (r) => properties.find((p) => p.id === r.propertyId)?.name ?? r.propertyId,
      },
      {
        key: "total",
        header: "Total",
        cell: (r) => formatCurrency(r.totalPurchaseAmount),
        className: "tabular-nums",
      },
      {
        key: "paid",
        header: "Paid",
        cell: (r) => formatCurrency(scheduleMetrics(r).paid),
        className: "tabular-nums",
      },
      {
        key: "remaining",
        header: "Remaining",
        cell: (r) => formatCurrency(scheduleMetrics(r).remaining),
        className: "tabular-nums",
      },
      {
        key: "next",
        header: "Next due",
        cell: (r) => formatDate(scheduleMetrics(r).next?.dueDate),
      },
      {
        key: "progress",
        header: "Progress",
        cell: (r) => `${scheduleMetrics(r).progress}%`,
      },
    ],
    [investors, properties],
  );

  if (loading) return <LoadingBlock />;

  const metrics = selected ? scheduleMetrics(selected) : null;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Off-plan payment schedules assigned to investors and properties."
        actions={
          canMutate("payments") ? (
            <Button
              onClick={async () => {
                const investor = investors[0];
                const property = properties.find((p) => p.status === "available") ?? properties[0];
                if (!investor || !property) {
                  toast.error("Need at least one investor and property");
                  return;
                }
                const schedule: PaymentSchedule = {
                  id: newId(),
                  investorId: investor.id,
                  propertyId: property.id,
                  totalPurchaseAmount: property.purchasePrice || 250000,
                  notes: "New schedule",
                  updatedAt: new Date().toISOString(),
                  milestones: [
                    {
                      id: newId(),
                      label: "Reservation",
                      percentOrAmount: "amount",
                      value: 5000,
                      dueDate: new Date().toISOString().slice(0, 10),
                      status: "upcoming",
                      paidDate: null,
                      reference: null,
                      notes: "",
                    },
                    {
                      id: newId(),
                      label: "Exchange 10%",
                      percentOrAmount: "percent",
                      value: 10,
                      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
                      status: "upcoming",
                      paidDate: null,
                      reference: null,
                      notes: "",
                    },
                  ],
                };
                await savePayment(schedule);
                toast.success("Payment schedule created");
                reload();
              }}
            >
              Create schedule
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No payment schedules"
      />

      {selected && metrics && (
        <div className="mt-6 space-y-4">
          <FormSection title="Schedule detail">
            <div>
              <p className="text-xs text-muted-foreground">Amount paid</p>
              <p className="text-lg tabular-nums">{formatCurrency(metrics.paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg tabular-nums">{formatCurrency(metrics.remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-lg tabular-nums">{formatCurrency(metrics.overdue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next payment</p>
              <p className="text-lg">{formatDate(metrics.next?.dueDate)}</p>
            </div>
            <div className="md:col-span-2 space-y-2">
              <p className="text-xs text-muted-foreground">Progress {metrics.progress}%</p>
              <Progress value={metrics.progress} />
            </div>
          </FormSection>

          <DataTable
            columns={[
              { key: "label", header: "Milestone", cell: (r) => r.label },
              {
                key: "value",
                header: "Amount",
                cell: (r) =>
                  r.percentOrAmount === "percent"
                    ? `${r.value}%`
                    : formatCurrency(r.value),
              },
              { key: "due", header: "Due", cell: (r) => formatDate(r.dueDate) },
              { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
              {
                key: "update",
                header: "Update",
                cell: (r) =>
                  canMutate("payments") ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={r.status}
                        onValueChange={async (v) => {
                          const next: PaymentSchedule = {
                            ...selected,
                            milestones: selected.milestones.map((m) =>
                              m.id === r.id
                                ? {
                                    ...m,
                                    status: v as PaymentMilestoneStatus,
                                    paidDate: v === "paid" ? new Date().toISOString().slice(0, 10) : m.paidDate,
                                  }
                                : m,
                            ),
                          };
                          await savePayment(next);
                          setSelected(next);
                          toast.success("Milestone updated");
                          reload();
                        }}
                      >
                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["upcoming", "due", "paid", "overdue"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    "—"
                  ),
              },
            ]}
            rows={selected.milestones}
            rowKey={(r) => r.id}
          />
        </div>
      )}
    </div>
  );
}

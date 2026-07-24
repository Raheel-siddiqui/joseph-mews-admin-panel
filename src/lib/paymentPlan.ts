import type { PaymentPlan, StandardPaymentPlan } from "@/models";

export function paidTotal(plan: PaymentPlan): number {
  return plan.installments
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
}

export function remainingTotal(plan: PaymentPlan): number {
  return plan.installments
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + i.amount, 0);
}

export function progressPct(plan: PaymentPlan): number {
  const total = plan.basisPrice || paidTotal(plan) + remainingTotal(plan);
  if (total <= 0) return 0;
  return (paidTotal(plan) / total) * 100;
}

/** First due installment, else first upcoming. */
export function nextPayment(plan: PaymentPlan) {
  const due = plan.installments.find((i) => i.status === "due");
  if (due) return due;
  return plan.installments.find((i) => i.status === "upcoming");
}

export function stageAmount(basisPrice: number, percent: number): number {
  return Math.round((basisPrice * percent) / 100);
}

export function summarizeStandardPlan(plan: StandardPaymentPlan): string {
  return plan.stages
    .map((s) => `${s.percent}% ${s.label.toLowerCase()}`)
    .join(" · ");
}

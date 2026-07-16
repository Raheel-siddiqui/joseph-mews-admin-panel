import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingBlock } from "@/components/admin/LoadingBlock";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import { getDashboardStats } from "@/services/api";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-card"
    >
      <p className="label-eyebrow">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-foreground">{value}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    getDashboardStats({ role: user.role, userId: user.id }).then(setStats);
  }, [user]);

  if (!stats) return <LoadingBlock label="Loading dashboard…" />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational overview. Every card links to a filtered admin view."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total investors" value={stats.totalInvestors} href="/investors" />
        <StatCard label="Invited users" value={stats.invitedUsers} href="/investors?filter=invited" />
        <StatCard label="Pending invitations" value={stats.pendingInvitations} href="/investors?filter=pending_invite" />
        <StatCard label="Active properties" value={stats.activeProperties} href="/properties" />
        <StatCard label="Open enquiries" value={stats.openEnquiries} href="/enquiries" />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <Section title="High-priority investor signals" href="/signals">
          {stats.highPrioritySignals.map((s) => (
            <Row
              key={s.id}
              title={s.signalType}
              meta={s.triggeringActivity}
              trailing={<StatusBadge value={s.status} />}
            />
          ))}
        </Section>
        <Section title="Recent investor activity" href="/activity">
          {stats.recentActivity.map((a) => (
            <Row key={a.id} title={a.title} meta={a.detail} trailing={<span className="text-xs text-muted-foreground">{formatDateTime(a.timestamp)}</span>} />
          ))}
        </Section>
        <Section title="New enquiries" href="/enquiries">
          {stats.newEnquiries.map((e) => (
            <Row key={e.id} title={e.investorName} meta={e.message} trailing={<StatusBadge value={e.priority} />} />
          ))}
        </Section>
        <Section title="Recently invited users" href="/investors">
          {stats.recentInvites.map((i) => (
            <Row key={i.id} title={i.name} meta={i.email} trailing={<StatusBadge value={i.status} />} />
          ))}
        </Section>
        <Section title="Properties receiving attention" href="/properties">
          {stats.attentionProperties.map((p) => (
            <Row key={p.id} title={p.name} meta={p.city} trailing={<StatusBadge value={p.status} />} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card/30">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <Link href={href} className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({
  title,
  meta,
  trailing,
}: {
  title: string;
  meta: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}

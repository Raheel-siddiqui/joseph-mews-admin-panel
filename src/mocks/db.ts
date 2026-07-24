import { nanoid } from "nanoid";
import type {
  ActivityEvent,
  Assumption,
  AssumptionVersion,
  AuditRecord,
  ContentBlock,
  Development,
  DocumentAsset,
  Enquiry,
  Folder,
  IntentSignal,
  InternalUser,
  Invitation,
  Investor,
  Note,
  PaymentSchedule,
  PortfolioOwnership,
  PropertyUnit,
  SignalRule,
} from "@/models";
import {
  seedActivity,
  seedAssumptionVersions,
  seedAssumptions,
  seedAudit,
  seedContent,
  seedDevelopments,
  seedDocuments,
  seedEnquiries,
  seedFolders,
  seedInvestors,
  seedInvitations,
  seedNotes,
  seedOwnership,
  seedPayments,
  seedProperties,
  seedRules,
  seedSignals,
  seedUsers,
} from "@/mocks/seed";

export interface MockDb {
  users: InternalUser[];
  investors: Investor[];
  invitations: Invitation[];
  developments: Development[];
  properties: PropertyUnit[];
  ownership: PortfolioOwnership[];
  enquiries: Enquiry[];
  notes: Note[];
  folders: Folder[];
  documents: DocumentAsset[];
  payments: PaymentSchedule[];
  assumptions: Assumption[];
  assumptionVersions: AssumptionVersion[];
  rules: SignalRule[];
  signals: IntentSignal[];
  activity: ActivityEvent[];
  content: ContentBlock[];
  audit: AuditRecord[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

const STORAGE_KEY = "jm-admin-mock-db-v2";

function createInitialDb(): MockDb {
  return {
    users: clone(seedUsers),
    investors: clone(seedInvestors),
    invitations: clone(seedInvitations),
    developments: clone(seedDevelopments),
    properties: clone(seedProperties),
    ownership: clone(seedOwnership),
    enquiries: clone(seedEnquiries),
    notes: clone(seedNotes),
    folders: clone(seedFolders),
    documents: clone(seedDocuments),
    payments: clone(seedPayments),
    assumptions: clone(seedAssumptions),
    assumptionVersions: clone(seedAssumptionVersions),
    rules: clone(seedRules),
    signals: clone(seedSignals),
    activity: clone(seedActivity),
    content: clone(seedContent),
    audit: clone(seedAudit),
  };
}

function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* ignore */
  }
  return createInitialDb();
}

let db: MockDb = typeof localStorage !== "undefined" ? loadDb() : createInitialDb();

export function getDb(): MockDb {
  return db;
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

export function resetDb() {
  db = createInitialDb();
  persist();
}

export function recordAudit(
  partial: Omit<AuditRecord, "id" | "timestamp"> & { timestamp?: string },
) {
  db.audit.unshift({
    id: nanoid(),
    timestamp: partial.timestamp ?? new Date().toISOString(),
    ...partial,
  });
  persist();
}

export function id(): string {
  return nanoid();
}

export function nowIso(): string {
  return new Date().toISOString();
}

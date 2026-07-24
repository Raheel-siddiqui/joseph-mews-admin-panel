import { delay } from "@/lib/format";
import { getDb, id, nowIso, persist, recordAudit } from "@/mocks/db";
import type {
  Assumption,
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
  Role,
  SignalRule,
  ActivityEvent,
  AuditRecord,
  AssumptionVersion,
} from "@/models";

const actor = { userId: "user-sa-1", userName: "Sophia Langford" };

function scopedInvestorIds(role: Role, userId: string): string[] | null {
  if (role === "super_admin" || role === "viewer") return null;
  const user = getDb().users.find((u) => u.id === userId);
  return user?.assignedInvestorIds ?? [];
}

export async function listUsers(): Promise<InternalUser[]> {
  await delay();
  return [...getDb().users];
}

export async function updateUser(
  userId: string,
  patch: Partial<InternalUser>,
): Promise<InternalUser> {
  await delay();
  const db = getDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("User not found");
  const prev = db.users[idx];
  db.users[idx] = { ...prev, ...patch };
  recordAudit({
    ...actor,
    action: "user.updated",
    entityType: "InternalUser",
    entityId: userId,
    previousValue: JSON.stringify({ role: prev.role, status: prev.status }),
    newValue: JSON.stringify({ role: db.users[idx].role, status: db.users[idx].status }),
    ip: "127.0.0.1",
  });
  persist();
  return db.users[idx];
}

export async function inviteUser(input: {
  name: string;
  email: string;
  role: Role;
}): Promise<InternalUser> {
  await delay();
  const user: InternalUser = {
    id: id(),
    name: input.name,
    email: input.email,
    role: input.role,
    status: "invited",
    assignedInvestorIds: [],
    lastLoginAt: null,
    invitationStatus: "sent",
    createdAt: nowIso(),
  };
  getDb().users.push(user);
  recordAudit({
    ...actor,
    action: "user.invited",
    entityType: "InternalUser",
    entityId: user.id,
    previousValue: null,
    newValue: user.email,
    ip: "127.0.0.1",
  });
  persist();
  return user;
}

export async function listInvestors(opts?: {
  role?: Role;
  userId?: string;
}): Promise<Investor[]> {
  await delay();
  const scoped = opts?.role && opts.userId ? scopedInvestorIds(opts.role, opts.userId) : null;
  let rows = [...getDb().investors];
  if (scoped) rows = rows.filter((i) => scoped.includes(i.id));
  return rows;
}

export async function getInvestor(investorId: string): Promise<Investor | undefined> {
  await delay();
  return getDb().investors.find((i) => i.id === investorId);
}

export async function updateInvestor(
  investorId: string,
  patch: Partial<Investor>,
): Promise<Investor> {
  await delay();
  const db = getDb();
  const idx = db.investors.findIndex((i) => i.id === investorId);
  if (idx < 0) throw new Error("Investor not found");
  const prev = db.investors[idx];
  db.investors[idx] = { ...prev, ...patch };
  recordAudit({
    ...actor,
    action: "investor.updated",
    entityType: "Investor",
    entityId: investorId,
    previousValue: JSON.stringify({ agent: prev.assignedAgentId, status: prev.accountStatus }),
    newValue: JSON.stringify({
      agent: db.investors[idx].assignedAgentId,
      status: db.investors[idx].accountStatus,
    }),
    ip: "127.0.0.1",
  });
  persist();
  return db.investors[idx];
}

export async function createInvestor(
  input: Partial<Investor> & { name: string; email: string },
): Promise<Investor> {
  await delay();
  const parts = input.name.trim().split(/\s+/);
  const investor: Investor = {
    id: id(),
    name: input.name,
    firstName: parts[0] ?? input.name,
    lastName: parts.slice(1).join(" ") || "—",
    email: input.email,
    phone: input.phone ?? "",
    country: input.country ?? "United Kingdom",
    nationality: input.nationality ?? "British",
    residencyStatus: input.residencyStatus ?? "uk_resident",
    assignedAgentId: input.assignedAgentId ?? null,
    accountStatus: input.accountStatus ?? "pending",
    invitationStatus: input.invitationStatus ?? null,
    signUpStatus: input.signUpStatus ?? "not_invited",
    intentLevel: input.intentLevel ?? "low",
    ownedPropertyCount: input.ownedPropertyCount ?? 0,
    lastActiveAt: null,
    createdAt: nowIso(),
    investmentPreferences: input.investmentPreferences ?? "",
    buyingPower: input.buyingPower ?? 0,
    investmentHorizon: input.investmentHorizon ?? "",
    riskAppetite: input.riskAppetite ?? "balanced",
    onboardingStatus: "Created",
  };
  getDb().investors.push(investor);

  for (const t of getDb().folders.filter((f) => f.isTemplate)) {
    getDb().folders.push({
      id: id(),
      name: t.name,
      parentId: null,
      category: t.category,
      investorId: investor.id,
      isTemplate: false,
    });
  }

  if (input.assignedAgentId) {
    const agent = getDb().users.find((u) => u.id === input.assignedAgentId);
    if (agent && !agent.assignedInvestorIds.includes(investor.id)) {
      agent.assignedInvestorIds.push(investor.id);
    }
  }

  recordAudit({
    ...actor,
    action: "investor.created",
    entityType: "Investor",
    entityId: investor.id,
    previousValue: null,
    newValue: investor.email,
    ip: "127.0.0.1",
  });
  persist();
  return investor;
}

export async function listInvitations(): Promise<Invitation[]> {
  await delay();
  return [...getDb().invitations];
}

export async function createInvitation(input: {
  name: string;
  email: string;
  assignedAgentId: string | null;
  propertyIds?: string[];
  folderIds?: string[];
}): Promise<{ invitation: Invitation; investor: Investor }> {
  await delay();
  const investor = await createInvestor({
    name: input.name,
    email: input.email,
    assignedAgentId: input.assignedAgentId,
  });
  const invitation: Invitation = {
    id: id(),
    investorId: investor.id,
    email: input.email,
    name: input.name,
    assignedAgentId: input.assignedAgentId,
    propertyIds: input.propertyIds ?? [],
    folderIds: input.folderIds ?? [],
    status: "sent",
    sentAt: nowIso(),
    acceptedAt: null,
    lastReminderAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    link: `https://invest.josephmews.com/invite/${id()}`,
    createdAt: nowIso(),
  };
  getDb().invitations.push(invitation);
  investor.invitationStatus = "sent";
  investor.signUpStatus = "invited";
  investor.onboardingStatus = "Invitation sent";
  recordAudit({
    ...actor,
    action: "invitation.sent",
    entityType: "Invitation",
    entityId: invitation.id,
    previousValue: null,
    newValue: invitation.email,
    ip: "127.0.0.1",
  });
  persist();
  return { invitation, investor };
}

export async function updateInvitation(
  invitationId: string,
  patch: Partial<Invitation>,
): Promise<Invitation> {
  await delay();
  const db = getDb();
  const idx = db.invitations.findIndex((i) => i.id === invitationId);
  if (idx < 0) throw new Error("Invitation not found");
  const prev = db.invitations[idx];
  db.invitations[idx] = { ...prev, ...patch };
  recordAudit({
    ...actor,
    action: "invitation.updated",
    entityType: "Invitation",
    entityId: invitationId,
    previousValue: prev.status,
    newValue: db.invitations[idx].status,
    ip: "127.0.0.1",
  });
  persist();
  return db.invitations[idx];
}

export async function listDevelopments(): Promise<Development[]> {
  await delay();
  return [...getDb().developments];
}

export async function getDevelopment(devId: string): Promise<Development | undefined> {
  await delay();
  return getDb().developments.find((d) => d.id === devId);
}

export async function saveDevelopment(
  input: Partial<Development> & { name: string },
): Promise<Development> {
  await delay();
  const db = getDb();
  if (input.id) {
    const idx = db.developments.findIndex((d) => d.id === input.id);
    if (idx < 0) throw new Error("Development not found");
    const prev = db.developments[idx];
    db.developments[idx] = {
      ...prev,
      ...input,
      updatedAt: nowIso(),
      updatedBy: actor.userName,
    };
    recordAudit({
      ...actor,
      action: "development.updated",
      entityType: "Development",
      entityId: input.id,
      previousValue: prev.status,
      newValue: db.developments[idx].status,
      ip: "127.0.0.1",
    });
    persist();
    return db.developments[idx];
  }
  const created: Development = {
    id: id(),
    reference: input.reference ?? `JM-OPP-${Math.floor(Math.random() * 900 + 100)}`,
    name: input.name,
    developer: input.developer ?? "",
    address: input.address ?? "",
    city: input.city ?? "",
    region: input.region ?? "",
    postcode: input.postcode ?? "",
    description: input.description ?? "",
    status: input.status ?? "draft",
    completionDate: input.completionDate ?? "",
    propertyTypes: input.propertyTypes ?? [],
    startingPrice: input.startingPrice ?? 0,
    expectedRentalYield: input.expectedRentalYield ?? 0,
    expectedCapitalGrowth: input.expectedCapitalGrowth ?? 0,
    image: input.image ?? "",
    amenities: input.amenities ?? [],
    highlights: input.highlights ?? [],
    locationInfo: input.locationInfo ?? "",
    availableUnits: input.availableUnits ?? 0,
    totalUnits: input.totalUnits ?? 0,
    featured: input.featured ?? false,
    visibleInExplore: input.visibleInExplore ?? false,
    paymentPlanSummary: input.paymentPlanSummary ?? "",
    tenure: input.tenure ?? "Leasehold",
    leaseYears: input.leaseYears,
    updatedAt: nowIso(),
    updatedBy: actor.userName,
  };
  db.developments.push(created);
  recordAudit({
    ...actor,
    action: "development.created",
    entityType: "Development",
    entityId: created.id,
    previousValue: null,
    newValue: created.name,
    ip: "127.0.0.1",
  });
  persist();
  return created;
}

export async function listProperties(): Promise<PropertyUnit[]> {
  await delay();
  return [...getDb().properties];
}

export async function getProperty(propertyId: string): Promise<PropertyUnit | undefined> {
  await delay();
  return getDb().properties.find((p) => p.id === propertyId);
}

export async function saveProperty(
  input: Partial<PropertyUnit> & { name: string },
): Promise<PropertyUnit> {
  await delay();
  const db = getDb();
  if (input.id) {
    const idx = db.properties.findIndex((p) => p.id === input.id);
    if (idx < 0) throw new Error("Property not found");
    const prev = db.properties[idx];
    db.properties[idx] = {
      ...prev,
      ...input,
      updatedAt: nowIso(),
      updatedBy: actor.userName,
    };
    recordAudit({
      ...actor,
      action: "property.updated",
      entityType: "PropertyUnit",
      entityId: input.id,
      previousValue: prev.status,
      newValue: db.properties[idx].status,
      ip: "127.0.0.1",
    });
    persist();
    return db.properties[idx];
  }
  const created: PropertyUnit = {
    id: id(),
    reference: input.reference ?? `JM-NEW-${Math.floor(Math.random() * 900 + 100)}`,
    name: input.name,
    developmentId: input.developmentId ?? null,
    propertyType: input.propertyType ?? "1-bed",
    bedrooms: input.bedrooms ?? 1,
    bathrooms: input.bathrooms ?? 1,
    sizeSqft: input.sizeSqft ?? 0,
    floor: input.floor ?? "",
    purchasePrice: input.purchasePrice ?? 0,
    currentValue: input.currentValue ?? input.purchasePrice ?? 0,
    reservationStatus: input.reservationStatus ?? "available",
    status: input.status ?? "draft",
    completionDate: input.completionDate ?? "",
    rentalEstimate: input.rentalEstimate ?? 0,
    serviceCharge: input.serviceCharge ?? 0,
    groundRent: input.groundRent ?? 0,
    managementFee: input.managementFee ?? 0,
    projectedGrossYield: input.projectedGrossYield ?? 0,
    projectedNetYield: input.projectedNetYield ?? 0,
    projectedCapitalGrowth: input.projectedCapitalGrowth ?? 0,
    paymentPlanSummary: input.paymentPlanSummary ?? "",
    standardPaymentPlan: input.standardPaymentPlan ?? null,
    paymentPlan: input.paymentPlan ?? null,
    image: input.image ?? "",
    visibleInExplore: input.visibleInExplore ?? false,
    assignedInvestorId: input.assignedInvestorId ?? null,
    city: input.city ?? "",
    location: input.location ?? "",
    postcode: input.postcode ?? "",
    loanBalance: input.loanBalance ?? 0,
    equity: input.equity ?? 0,
    monthlyMortgage: input.monthlyMortgage ?? 0,
    occupancy: input.occupancy ?? 0,
    updatedAt: nowIso(),
    updatedBy: actor.userName,
  };
  db.properties.push(created);
  recordAudit({
    ...actor,
    action: "property.created",
    entityType: "PropertyUnit",
    entityId: created.id,
    previousValue: null,
    newValue: created.name,
    ip: "127.0.0.1",
  });
  persist();
  return created;
}

export async function duplicateProperty(propertyId: string): Promise<PropertyUnit> {
  const source = await getProperty(propertyId);
  if (!source) throw new Error("Property not found");
  const { id: _omit, reference, ...rest } = source;
  return saveProperty({
    ...rest,
    name: `${source.name} (Copy)`,
    reference: `${source.reference}-COPY`,
    status: "draft",
    visibleInExplore: false,
    assignedInvestorId: null,
  });
}

export async function listOwnership(investorId?: string): Promise<PortfolioOwnership[]> {
  await delay();
  const rows = getDb().ownership;
  return investorId ? rows.filter((o) => o.investorId === investorId) : [...rows];
}

export async function assignPropertyToInvestor(
  investorId: string,
  propertyId: string,
): Promise<PortfolioOwnership> {
  await delay();
  const db = getDb();
  const investor = db.investors.find((i) => i.id === investorId);
  const property = db.properties.find((p) => p.id === propertyId);
  if (!investor) throw new Error("Investor not found");
  if (!property) throw new Error("Property not found");

  const existing = db.ownership.find(
    (o) => o.investorId === investorId && o.propertyId === propertyId,
  );
  if (existing) throw new Error("Property already assigned to this investor");

  const ownership: PortfolioOwnership = {
    id: id(),
    investorId,
    propertyId,
    purchaseValue: property.purchasePrice,
    currentValue: property.currentValue,
    mortgageBalance: property.loanBalance,
    equity: property.equity || property.currentValue - property.loanBalance,
    monthlyRent: property.rentalEstimate,
    netCashFlow:
      property.rentalEstimate -
      property.serviceCharge -
      property.managementFee -
      property.monthlyMortgage,
  };
  db.ownership.push(ownership);
  property.assignedInvestorId = investorId;
  if (property.status === "available" || property.status === "draft") {
    property.status = "sold";
  }
  investor.ownedPropertyCount = db.ownership.filter((o) => o.investorId === investorId).length;

  recordAudit({
    ...actor,
    action: "portfolio.property_assigned",
    entityType: "PortfolioOwnership",
    entityId: ownership.id,
    previousValue: null,
    newValue: `${investor.name} ← ${property.name}`,
    ip: "127.0.0.1",
  });
  persist();
  return ownership;
}

export async function removePropertyFromInvestor(
  investorId: string,
  propertyId: string,
): Promise<void> {
  await delay();
  const db = getDb();
  db.ownership = db.ownership.filter(
    (o) => !(o.investorId === investorId && o.propertyId === propertyId),
  );
  const property = db.properties.find((p) => p.id === propertyId);
  if (property && property.assignedInvestorId === investorId) {
    property.assignedInvestorId = null;
  }
  const investor = db.investors.find((i) => i.id === investorId);
  if (investor) {
    investor.ownedPropertyCount = db.ownership.filter((o) => o.investorId === investorId).length;
  }
  recordAudit({
    ...actor,
    action: "portfolio.property_removed",
    entityType: "PortfolioOwnership",
    entityId: propertyId,
    previousValue: investorId,
    newValue: null,
    ip: "127.0.0.1",
  });
  persist();
}

export async function listEnquiries(opts?: {
  role?: Role;
  userId?: string;
}): Promise<Enquiry[]> {
  await delay();
  const scoped = opts?.role && opts.userId ? scopedInvestorIds(opts.role, opts.userId) : null;
  let rows = [...getDb().enquiries];
  if (scoped) {
    rows = rows.filter((e) => (e.investorId ? scoped.includes(e.investorId) : e.assignedAgentId === opts?.userId));
  }
  return rows;
}

export async function updateEnquiry(enquiryId: string, patch: Partial<Enquiry>): Promise<Enquiry> {
  await delay();
  const db = getDb();
  const idx = db.enquiries.findIndex((e) => e.id === enquiryId);
  if (idx < 0) throw new Error("Enquiry not found");
  db.enquiries[idx] = { ...db.enquiries[idx], ...patch };
  persist();
  return db.enquiries[idx];
}

export async function listNotes(investorId?: string): Promise<Note[]> {
  await delay();
  const rows = getDb().notes;
  return investorId ? rows.filter((n) => n.investorId === investorId) : [...rows];
}

export async function addNote(input: Omit<Note, "id" | "createdAt">): Promise<Note> {
  await delay();
  const note: Note = { ...input, id: id(), createdAt: nowIso() };
  getDb().notes.unshift(note);
  persist();
  return note;
}

export async function listFolders(investorId?: string | null): Promise<Folder[]> {
  await delay();
  const rows = getDb().folders;
  if (investorId === undefined) return [...rows];
  return rows.filter((f) => f.investorId === investorId || (investorId === null && f.isTemplate));
}

export async function listDocuments(filters?: {
  investorId?: string;
  folderId?: string | null;
}): Promise<DocumentAsset[]> {
  await delay();
  let rows = [...getDb().documents];
  if (filters?.investorId) rows = rows.filter((d) => d.investorId === filters.investorId);
  if (filters?.folderId !== undefined) {
    rows = rows.filter((d) => d.folderId === filters.folderId);
  }
  return rows;
}

export async function saveDocument(
  input: Partial<DocumentAsset> & { name: string },
): Promise<DocumentAsset> {
  await delay();
  const doc: DocumentAsset = {
    id: input.id ?? id(),
    name: input.name,
    folderId: input.folderId ?? null,
    category: input.category ?? "General Documents",
    investorId: input.investorId ?? null,
    propertyId: input.propertyId ?? null,
    developmentId: input.developmentId ?? null,
    paymentMilestoneId: input.paymentMilestoneId ?? null,
    fileType: input.fileType ?? "PDF",
    size: input.size ?? "0 KB",
    uploadedBy: input.uploadedBy ?? actor.userName,
    uploadedAt: input.uploadedAt ?? nowIso(),
    expiryDate: input.expiryDate ?? null,
    version: input.version ?? 1,
    visibility: input.visibility ?? "both",
    downloadCount: input.downloadCount ?? 0,
    lastViewedAt: input.lastViewedAt ?? null,
  };
  const db = getDb();
  const idx = db.documents.findIndex((d) => d.id === doc.id);
  if (idx >= 0) db.documents[idx] = doc;
  else db.documents.unshift(doc);
  recordAudit({
    ...actor,
    action: "document.uploaded",
    entityType: "DocumentAsset",
    entityId: doc.id,
    previousValue: null,
    newValue: doc.name,
    ip: "127.0.0.1",
  });
  persist();
  return doc;
}

export async function listPayments(opts?: {
  role?: Role;
  userId?: string;
}): Promise<PaymentSchedule[]> {
  await delay();
  const scoped = opts?.role && opts.userId ? scopedInvestorIds(opts.role, opts.userId) : null;
  let rows = [...getDb().payments];
  if (scoped) rows = rows.filter((p) => scoped.includes(p.investorId));
  return rows;
}

export async function savePayment(input: PaymentSchedule): Promise<PaymentSchedule> {
  await delay();
  const db = getDb();
  const idx = db.payments.findIndex((p) => p.id === input.id);
  const next = { ...input, updatedAt: nowIso() };
  if (idx >= 0) db.payments[idx] = next;
  else db.payments.unshift(next);
  recordAudit({
    ...actor,
    action: "payment.updated",
    entityType: "PaymentSchedule",
    entityId: next.id,
    previousValue: null,
    newValue: String(next.totalPurchaseAmount),
    ip: "127.0.0.1",
  });
  persist();
  return next;
}

export async function listAssumptions(): Promise<Assumption[]> {
  await delay();
  return [...getDb().assumptions];
}

export async function listAssumptionVersions(assumptionId?: string): Promise<AssumptionVersion[]> {
  await delay();
  const rows = getDb().assumptionVersions;
  return assumptionId ? rows.filter((v) => v.assumptionId === assumptionId) : [...rows];
}

export async function updateAssumption(
  assumptionId: string,
  value: number,
  note: string,
): Promise<Assumption> {
  await delay();
  const db = getDb();
  const idx = db.assumptions.findIndex((a) => a.id === assumptionId);
  if (idx < 0) throw new Error("Assumption not found");
  const prev = db.assumptions[idx];
  db.assumptionVersions.unshift({
    id: id(),
    assumptionId,
    previousValue: prev.value,
    newValue: value,
    changedAt: nowIso(),
    changedBy: actor.userName,
    note,
  });
  db.assumptions[idx] = {
    ...prev,
    value,
    updatedAt: nowIso(),
    updatedBy: actor.userName,
  };
  recordAudit({
    ...actor,
    action: "assumption.updated",
    entityType: "Assumption",
    entityId: assumptionId,
    previousValue: String(prev.value),
    newValue: String(value),
    ip: "127.0.0.1",
  });
  persist();
  return db.assumptions[idx];
}

export async function listRules(): Promise<SignalRule[]> {
  await delay();
  return [...getDb().rules];
}

export async function updateRule(ruleId: string, patch: Partial<SignalRule>): Promise<SignalRule> {
  await delay();
  const db = getDb();
  const idx = db.rules.findIndex((r) => r.id === ruleId);
  if (idx < 0) throw new Error("Rule not found");
  db.rules[idx] = { ...db.rules[idx], ...patch };
  persist();
  return db.rules[idx];
}

export async function listSignals(opts?: {
  role?: Role;
  userId?: string;
}): Promise<IntentSignal[]> {
  await delay();
  const scoped = opts?.role && opts.userId ? scopedInvestorIds(opts.role, opts.userId) : null;
  let rows = [...getDb().signals];
  if (scoped) rows = rows.filter((s) => scoped.includes(s.investorId));
  return rows;
}

export async function updateSignal(
  signalId: string,
  patch: Partial<IntentSignal>,
): Promise<IntentSignal> {
  await delay();
  const db = getDb();
  const idx = db.signals.findIndex((s) => s.id === signalId);
  if (idx < 0) throw new Error("Signal not found");
  const prev = db.signals[idx];
  db.signals[idx] = { ...prev, ...patch };
  recordAudit({
    ...actor,
    action: "signal.status_changed",
    entityType: "IntentSignal",
    entityId: signalId,
    previousValue: prev.status,
    newValue: db.signals[idx].status,
    ip: "127.0.0.1",
  });
  persist();
  return db.signals[idx];
}

export async function listActivity(investorId?: string): Promise<ActivityEvent[]> {
  await delay();
  const rows = getDb().activity;
  return investorId ? rows.filter((a) => a.investorId === investorId) : [...rows];
}

export async function listAudit(): Promise<AuditRecord[]> {
  await delay();
  return [...getDb().audit];
}

export async function listContent(): Promise<ContentBlock[]> {
  await delay();
  return [...getDb().content];
}

export async function saveContent(
  input: Partial<ContentBlock> & { title: string; key: string },
): Promise<ContentBlock> {
  await delay();
  const db = getDb();
  if (input.id) {
    const idx = db.content.findIndex((c) => c.id === input.id);
    if (idx < 0) throw new Error("Content not found");
    db.content[idx] = {
      ...db.content[idx],
      ...input,
      updatedAt: nowIso(),
      updatedBy: actor.userName,
    };
    persist();
    return db.content[idx];
  }
  const created: ContentBlock = {
    id: id(),
    key: input.key,
    title: input.title,
    area: input.area ?? "General",
    body: input.body ?? "",
    status: input.status ?? "draft",
    updatedAt: nowIso(),
    updatedBy: actor.userName,
  };
  db.content.unshift(created);
  persist();
  return created;
}

export async function getDashboardStats(opts?: { role?: Role; userId?: string }) {
  await delay();
  const investors = await listInvestors(opts);
  const properties = await listProperties();
  const developments = await listDevelopments();
  const enquiries = await listEnquiries(opts);
  const signals = await listSignals(opts);
  const invitations = await listInvitations();
  const payments = await listPayments(opts);
  const documents = await listDocuments();
  const activity = await listActivity();

  return {
    totalInvestors: investors.length,
    invitedUsers: invitations.length,
    signedUpUsers: investors.filter((i) =>
      ["signed_up", "first_login"].includes(i.signUpStatus),
    ).length,
    pendingInvitations: invitations.filter((i) => ["sent", "delivered", "opened"].includes(i.status))
      .length,
    activeProperties: properties.filter((p) =>
      ["available", "reserved", "tenanted", "in_build"].includes(p.status),
    ).length,
    activeDevelopments: developments.filter((d) =>
      ["available", "coming_soon"].includes(d.status),
    ).length,
    openEnquiries: enquiries.filter((e) => !["closed", "converted", "not_interested"].includes(e.status))
      .length,
    highIntentInvestors: investors.filter((i) => ["high", "urgent"].includes(i.intentLevel)).length,
    upcomingPayments: payments.reduce(
      (n, p) => n + p.milestones.filter((m) => m.status === "upcoming" || m.status === "due").length,
      0,
    ),
    recentDocuments: documents.slice(0, 5),
    highPrioritySignals: signals.filter((s) => ["high", "urgent"].includes(s.intentLevel)).slice(0, 5),
    recentActivity: activity.slice(0, 8),
    newEnquiries: enquiries.filter((e) => e.status === "new").slice(0, 5),
    recentInvites: invitations.slice(0, 5),
    upcomingMilestones: payments.flatMap((p) =>
      p.milestones
        .filter((m) => m.status === "upcoming" || m.status === "due")
        .map((m) => ({ ...m, scheduleId: p.id, investorId: p.investorId, propertyId: p.propertyId })),
    ),
    attentionProperties: properties
      .filter((p) => p.visibleInExplore)
      .slice(0, 5),
  };
}

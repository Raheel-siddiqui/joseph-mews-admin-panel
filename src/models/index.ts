export type Role = "super_admin" | "agent" | "viewer";

export type AccountStatus = "active" | "inactive" | "pending";
export type InvitationStatus =
  | "created"
  | "sent"
  | "delivered"
  | "opened"
  | "accepted"
  | "expired"
  | "revoked";
export type SignUpStatus = "not_invited" | "invited" | "signed_up" | "first_login";
export type IntentLevel = "low" | "medium" | "high" | "urgent";
export type ResidencyStatus = "uk_resident" | "non_uk_resident" | "unknown";

export type DevelopmentStatus =
  | "draft"
  | "coming_soon"
  | "available"
  | "sold_out"
  | "completed"
  | "archived";

export type PropertyStatus =
  | "draft"
  | "coming_soon"
  | "available"
  | "reserved"
  | "sold"
  | "completed"
  | "archived"
  | "tenanted"
  | "in_build"
  | "vacant";

export type EnquiryStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "qualified"
  | "viewing_arranged"
  | "in_progress"
  | "closed"
  | "converted"
  | "not_interested";

export type SignalStatus =
  | "new"
  | "viewed"
  | "contact_planned"
  | "contacted"
  | "qualified"
  | "dismissed"
  | "converted";

export type PaymentMilestoneStatus = "upcoming" | "due" | "paid" | "overdue";
export type ContentStatus = "draft" | "published";
export type AssumptionScope =
  | "global"
  | "development"
  | "property"
  | "nationality"
  | "residency";

export interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive" | "invited";
  assignedInvestorIds: string[];
  lastLoginAt: string | null;
  invitationStatus: InvitationStatus | null;
  createdAt: string;
}

export interface Investor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  nationality: string;
  residencyStatus: ResidencyStatus;
  assignedAgentId: string | null;
  accountStatus: AccountStatus;
  invitationStatus: InvitationStatus | null;
  signUpStatus: SignUpStatus;
  intentLevel: IntentLevel;
  ownedPropertyCount: number;
  lastActiveAt: string | null;
  createdAt: string;
  investmentPreferences: string;
  buyingPower: number;
  investmentHorizon: string;
  riskAppetite: "cautious" | "balanced" | "growth";
  onboardingStatus: string;
}

export interface Invitation {
  id: string;
  investorId: string;
  email: string;
  name: string;
  assignedAgentId: string | null;
  propertyIds: string[];
  folderIds: string[];
  status: InvitationStatus;
  sentAt: string | null;
  acceptedAt: string | null;
  lastReminderAt: string | null;
  expiresAt: string;
  link: string;
  createdAt: string;
}

export interface Development {
  id: string;
  reference: string;
  name: string;
  developer: string;
  address: string;
  city: string;
  region: string;
  postcode: string;
  description: string;
  status: DevelopmentStatus;
  completionDate: string;
  propertyTypes: string[];
  startingPrice: number;
  expectedRentalYield: number;
  expectedCapitalGrowth: number;
  image: string;
  amenities: string[];
  highlights: string[];
  locationInfo: string;
  availableUnits: number;
  totalUnits: number;
  featured: boolean;
  visibleInExplore: boolean;
  paymentPlanSummary: string;
  tenure: "Leasehold" | "Freehold";
  leaseYears?: number;
  updatedAt: string;
  updatedBy: string;
}

export interface PropertyUnit {
  id: string;
  reference: string;
  name: string;
  developmentId: string | null;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  floor: string;
  purchasePrice: number;
  currentValue: number;
  reservationStatus: string;
  status: PropertyStatus;
  completionDate: string;
  rentalEstimate: number;
  serviceCharge: number;
  groundRent: number;
  managementFee: number;
  projectedGrossYield: number;
  projectedNetYield: number;
  projectedCapitalGrowth: number;
  paymentPlanSummary: string;
  image: string;
  visibleInExplore: boolean;
  assignedInvestorId: string | null;
  city: string;
  location: string;
  postcode: string;
  loanBalance: number;
  equity: number;
  monthlyMortgage: number;
  occupancy: number;
  tenantName?: string;
  tenancyEnd?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PortfolioOwnership {
  id: string;
  investorId: string;
  propertyId: string;
  purchaseValue: number;
  currentValue: number;
  mortgageBalance: number;
  equity: number;
  monthlyRent: number;
  netCashFlow: number;
}

export interface Mortgage {
  id: string;
  propertyId: string;
  investorId: string;
  balance: number;
  monthlyPayment: number;
  ratePct: number;
  type: "interest_only" | "repayment";
  termYears: number;
  ltvPct: number;
}

export interface Assumption {
  id: string;
  key: string;
  label: string;
  value: number;
  unit: "%" | "GBP" | "years" | "months" | "ratio";
  description: string;
  scope: AssumptionScope;
  scopeRefId: string | null;
  effectiveDate: string;
  updatedAt: string;
  updatedBy: string;
  sourceNote: string;
  isDraftPlaceholder?: boolean;
}

export interface AssumptionVersion {
  id: string;
  assumptionId: string;
  previousValue: number;
  newValue: number;
  changedAt: string;
  changedBy: string;
  note: string;
}

export interface PaymentMilestone {
  id: string;
  label: string;
  percentOrAmount: "percent" | "amount";
  value: number;
  dueDate: string;
  status: PaymentMilestoneStatus;
  paidDate: string | null;
  reference: string | null;
  notes: string;
}

export interface PaymentSchedule {
  id: string;
  investorId: string;
  propertyId: string;
  totalPurchaseAmount: number;
  milestones: PaymentMilestone[];
  notes: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  category: string;
  investorId: string | null;
  isTemplate: boolean;
}

export interface DocumentAsset {
  id: string;
  name: string;
  folderId: string | null;
  category: string;
  investorId: string | null;
  propertyId: string | null;
  developmentId: string | null;
  paymentMilestoneId: string | null;
  fileType: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  expiryDate: string | null;
  version: number;
  visibility: "investor" | "internal" | "both";
  downloadCount: number;
  lastViewedAt: string | null;
}

export interface Enquiry {
  id: string;
  investorId: string | null;
  investorName: string;
  propertyId: string | null;
  developmentId: string | null;
  type: string;
  message: string;
  submittedAt: string;
  assignedAgentId: string | null;
  status: EnquiryStatus;
  priority: "low" | "medium" | "high";
  latestAction: string;
  followUpDate: string | null;
  linkedSignalId: string | null;
  outcome: string | null;
}

export interface Note {
  id: string;
  investorId: string;
  body: string;
  authorId: string;
  authorName: string;
  kind: "internal" | "agent" | "follow_up";
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  investorId: string;
  type: string;
  title: string;
  detail: string;
  propertyId: string | null;
  developmentId: string | null;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export interface SignalRule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  threshold: number;
  windowDays: number;
  intentLevel: IntentLevel;
  enabled: boolean;
  suggestedAction: string;
}

export interface IntentSignal {
  id: string;
  investorId: string;
  assignedAgentId: string | null;
  signalType: string;
  triggeringActivity: string;
  propertyId: string | null;
  developmentId: string | null;
  intentLevel: IntentLevel;
  generatedAt: string;
  summary: string | null;
  suggestedNextAction: string;
  status: SignalStatus;
  agentNotes: string;
  ruleId: string | null;
}

export interface ContentBlock {
  id: string;
  key: string;
  title: string;
  area: string;
  body: string;
  status: ContentStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditRecord {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: string | null;
  newValue: string | null;
  timestamp: string;
  ip: string | null;
}

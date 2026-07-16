import type { Role } from "@/models";

export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "invite"
  | "manage_roles"
  | "manage_settings"
  | "manage_assumptions"
  | "manage_content"
  | "reassign_agent";

export type Resource =
  | "dashboard"
  | "investors"
  | "properties"
  | "developments"
  | "enquiries"
  | "signals"
  | "assumptions"
  | "payments"
  | "documents"
  | "content"
  | "users"
  | "activity"
  | "settings"
  | "audit";

export function can(role: Role, action: Action, resource: Resource): boolean {
  if (role === "super_admin") return true;

  if (role === "viewer") {
    if (action !== "view") return false;
    return !["users", "settings"].includes(resource);
  }

  // agent
  if (["manage_roles", "manage_settings", "manage_assumptions", "manage_content"].includes(action)) {
    return false;
  }
  if (action === "publish") return false;
  if (resource === "users" || resource === "settings") return false;
  if (resource === "assumptions" || resource === "content") {
    return action === "view";
  }
  if (resource === "developments" || resource === "properties") {
    return action === "view";
  }
  if (
    ["investors", "enquiries", "signals", "documents", "payments", "activity", "dashboard", "audit"].includes(
      resource,
    )
  ) {
    return ["view", "create", "edit", "invite", "reassign_agent", "delete"].includes(action);
  }
  return action === "view";
}

export function canAccessNav(role: Role, resource: Resource): boolean {
  if (role === "super_admin") return true;
  if (role === "viewer") return !["users", "settings"].includes(resource);
  return !["users", "settings"].includes(resource);
}

export function canMutate(role: Role, resource: Resource): boolean {
  if (role === "super_admin") return true;
  if (role === "viewer") return false;
  return ["investors", "enquiries", "signals", "documents", "payments", "activity", "dashboard"].includes(
    resource,
  );
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "agent":
      return "Agent";
    case "viewer":
      return "Viewer";
  }
}

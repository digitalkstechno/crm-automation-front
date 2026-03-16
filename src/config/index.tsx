const API = process.env.NEXT_PUBLIC_API_URL;

export const baseUrl = {
  userSignup: `${API}users/signup`,
  userLogin: `${API}staff/login`,
  currentStaff: `${API}staff/me`,
  addRole: `${API}role`,
  getAllRoles: `${API}role`,
  findRoleById: `${API}role`,
  updateRole: `${API}role`,
  deleteRole: `${API}role`,
  addStaff: `${API}staff/create`,
  getAllStaff: `${API}staff`,
  findStaffById: `${API}staff`,
  updateStaff: `${API}staff`,
  deleteStaff: `${API}staff`,
  addLead: `${API}lead/create`,
  getAllLeads: `${API}lead`,
  findLeadById: `${API}lead`,
  updateLead: `${API}lead`,
  deleteLead: `${API}lead`,
  leadSources: `${API}leadsources`,
  leadStatuses: `${API}leadstatus`,
  leadCountSummary: `${API}lead/count-summary`,
  getKanbanData: `${API}lead/kanban`,
  updateKanbanStatus: `${API}lead`,
  leadUpcomingFollowups: `${API}lead/followups/upcoming`,
  leadDueFollowups: `${API}lead/followups/due`,
  leadLabels: `${API}leadlabel`,
  getWonLeads: `${API}lead/won`,
  getLostLeads: `${API}lead/lost`,
};

const TOKEN_COOKIE_NAME = "crm_token";

export function setAuthToken(token: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(
    token,
  )}; path=/; expires=${expires.toUTCString()}`;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    if (c.startsWith(`${TOKEN_COOKIE_NAME}=`)) {
      return decodeURIComponent(c.substring(TOKEN_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export function clearAuthToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

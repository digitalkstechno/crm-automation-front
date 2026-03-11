export const LEAD_STATUSES = [
  "New Lead",
  "Quotation Given",
  "Follow Up",
  "Order Confirmation",
  "PI",
  "Order Execution",
  "Final Payment",
  "Dispatch",
  "Completed",
  "Lost",
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];

export const STATUS_COLORS: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-100 text-blue-700",
  "Quotation Given": "bg-purple-100 text-purple-700",
  "Follow Up": "bg-amber-100 text-amber-700",
  "Order Confirmation": "bg-green-100 text-green-700",
  "PI": "bg-indigo-100 text-indigo-700",
  "Order Execution": "bg-orange-100 text-orange-700",
  "Dispatch": "bg-cyan-100 text-cyan-700",
  "Final Payment": "bg-pink-100 text-pink-700",
  "Completed": "bg-emerald-100 text-emerald-700",
  "Lost": "bg-gray-100 text-gray-700",
};

export const KANBAN_COLORS: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-400",
  "Quotation Given": "bg-purple-400",
  "Follow Up": "bg-amber-400",
  "Order Confirmation": "bg-green-400",
  "PI": "bg-indigo-400",
  "Order Execution": "bg-orange-400",
  "Dispatch": "bg-cyan-400",
  "Final Payment": "bg-pink-400",
  "Completed": "bg-emerald-400",
  "Lost": "bg-gray-400",
};

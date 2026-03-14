// "use client";

// import { useMemo, useState, useEffect } from "react";
// import Layout from "@/components/Layout";
// import Dialog from "@/components/Dialog";
// import {
//   FiPlus,
//   FiGrid,
//   FiPhone,
//   FiMail,
//   FiEye,
//   FiLink,
//   FiMapPin,
//   FiEdit,
// } from "react-icons/fi";
// import { baseUrl, getAuthToken } from "@/config";
// import { Filter, LayoutDashboard } from "lucide-react";
// import { useRouter } from "next/router";
// import axios from "axios";
// import { toast } from "react-toastify";
// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// interface ApiLead {
//   _id: string;
//   fullName: string;
//   contact: string;
//   email: string;
//   companyName?: string;
//   address?: string;
//   leadStatus?: {
//     _id: string;
//     name: string;
//     order?: number;
//     count?: number;
//   } | null;
//   leadSource?: { name: string };
//   assignedTo?: { fullName: string, avatar?: string };
//   priority?: string;
//   attachments: any[];
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
//   __v: number;
//   // local-only flags
//   isLost?: boolean;
//   isWon?: boolean;
//   amount?: number;
// }

// interface StatusGroup {
//   statusId?: string;
//   statusName?: string;
//   leads: ApiLead[];
// }

// async function getKanbanData(): Promise<StatusGroup[]> {
//   const token = getAuthToken();
//   try {
//     const response = await fetch(`${baseUrl.getKanbanData}`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) throw new Error("Failed to fetch kanban data");

//     const json = await response.json();
//     if (json.status === "Success" && Array.isArray(json.data)) {
//       return json.data;
//     }
//     return [];
//   } catch (error) {
//     console.error("Error fetching kanban data:", error);
//     return [];
//   }
// }

// async function updateLeadKanbanStatus(
//   leadId: string,
//   newStatusId: string,
// ): Promise<boolean> {
//   try {
//     const token = getAuthToken();
//     const response = await fetch(
//       `${baseUrl.updateKanbanStatus}/${leadId}/kanban-status`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           leadStatus: newStatusId,
//         }),
//       },
//     );

//     if (!response.ok) {
//       let errorMessage = "";
//       try {
//         const errorData = await response.json();
//         errorMessage = errorData.message || `HTTP ${response.status}`;
//       } catch {
//         errorMessage = (await response.text()) || `HTTP ${response.status}`;
//       }
//       console.error(`Failed to update status: ${errorMessage}`);
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error(
//       "Network or unexpected error in updateLeadKanbanStatus:",
//       error,
//     );
//     return false;
//   }
// }
// interface StatusOption {
//   _id: string;
//   name: string;
//   order?: number;
// }

// interface SourceOption {
//   _id: string;
//   name: string;
// }

// interface StaffOption {
//   _id: string;
//   fullName: string;
// }

// export default function Leads() {
//   const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [view, setView] = useState<"kanban" | "list" | "lost" | "won">("kanban");
//   const [draggingId, setDraggingId] = useState<string | null>(null);
//   const [statusFilter, setStatusFilter] = useState("");
//   const [sourceFilter, setSourceFilter] = useState("");
//   const [staffFilter, setStaffFilter] = useState("");
//   const [dateFilter, setDateFilter] = useState("");
//   const [statuses, setStatuses] = useState<StatusOption[]>([]);
//   const [sources, setSources] = useState<SourceOption[]>([]);
//   const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
//   const [lostSearch, setLostSearch] = useState("");
//   const [wonSearch, setWonSearch] = useState("");
//   const [showAddDialog, setShowAddDialog] = useState(false);
//   const [viewLead, setViewLead] = useState<{
//     id: string;
//     name: string;
//     companyName?: string;
//     address?: string;
//     phone?: string;
//     email?: string;
//     source?: string;
//     status?: string;
//     staff?: string;
//     priority?: "High" | "Medium" | "Low";
//     lastFollowUp?: string;
//     nextFollowupDate?: string;
//     nextFollowupTime?: string;
//     note?: string;
//     attachments?: { name: string; url?: string }[];
//     isActive?: boolean;
//   } | null>(null);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editLeadId, setEditLeadId] = useState<string | null>(null);
//   const [existingAttachments, setExistingAttachments] = useState<{ name: string; url?: string }[]>([]);
//   const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(null);
//  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
//   interface AddLeadForm {
//     name: string;
//     companyName?: string;
//     address?: string;
//     phone: string;
//     email: string;
//     source: string;
//     status: string;
//     staff: string;
//     priority: "High" | "Medium" | "Low";
//     lastFollowUp: string;
//     nextFollowupDate?: string;
//     nextFollowupTime?: string;
//     note?: string;
//     attachments?: File[];
//     isActive?: boolean;
//   }

//   const [addForm, setAddForm] = useState<AddLeadForm>({
//     name: "",
//     companyName: "",
//     address: "",
//     phone: "",
//     email: "",
//     source: "Website",
//     status: "New",
//     staff: "Sarah Johnson",
//     priority: "Medium",
//     lastFollowUp: "",
//     nextFollowupDate: "",
//     nextFollowupTime: "",
//     note: "",
//     attachments: [],
//     isActive: true,
//   });

//   useEffect(() => {
//     fetchKanbanData();
//   }, []);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const stored = window.localStorage.getItem("kanbanVisibleStatusNames");
//       if (stored) {
//         try {
//           const parsed = JSON.parse(stored);
//           if (Array.isArray(parsed)) {
//             setVisibleStatusNames(parsed.filter((x) => typeof x === "string"));
//           }
//         } catch {
//         }
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const token = getAuthToken();
//     if (!token) return;

//     const headers = { Authorization: `Bearer ${token}` };

//     const fetchOptions = async () => {
//       try {
//         const [statusRes, sourceRes, staffRes] = await Promise.all([
//           axios.get(baseUrl.leadStatuses, { headers }),
//           axios.get(baseUrl.leadSources, { headers }),
//           axios.get(baseUrl.getAllStaff, { headers }),
//         ]);

//         setStatuses(statusRes.data.data || []);
//         setSources(sourceRes.data.data || []);
//         setStaffMembers(staffRes.data.data || []);
//       } catch (error) {
//         console.error("Failed to load filter options:", error);
//       }
//     };

//     fetchOptions();
//   }, []);

//   const fetchKanbanData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const groups = await getKanbanData();
//       setStatusGroups(groups);
//     } catch (err) {
//       setError("Failed to load leads. Please try again.");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const allLeads = useMemo(
//     () => statusGroups.flatMap((g) => g.leads || []),
//     [statusGroups],
//   );
//   const lostCount = useMemo(
//     () => allLeads.filter((l) => l.isLost).length,
//     [allLeads],
//   );
//   const wonCount = useMemo(
//     () => allLeads.filter((l) => l.isWon).length,
//     [allLeads],
//   );
//   const router = useRouter();
//   const [showFilters, setShowFilters] = useState(false);
//   const [addingLead, setAddingLead] = useState(false);


//    const resetForm = () => {
//     setAddForm({
//       name: "",
//       companyName: "",
//       address: "",
//       phone: "",
//       email: "",
//       source: "",
//       status: "",
//       staff: "",
//       priority: "Medium",
//       lastFollowUp: new Date().toISOString().split("T")[0],
//       nextFollowupDate: "",
//       nextFollowupTime: "",
//       note: "",
//       isActive: true,
//       attachments: [],
//     });
//   };
// const handleSaveLead = async () => {
//     if (
//       !addForm.name ||
//       !addForm.phone ||
//       !addForm.email ||
//       !addForm.source ||
//       !addForm.status ||
//       !addForm.staff
//     ) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     setAddingLead(true);
//     try {
//       const token = getAuthToken();
//       const payload = {
//         fullName: addForm.name.trim(),
//         companyName: addForm.companyName?.trim() || "",
//         address: addForm.address?.trim() || "",
//         contact: addForm.phone.trim(),
//         email: addForm.email.trim().toLowerCase(),
//         leadSource: addForm.source,
//         leadStatus: addForm.status,
//         assignedTo: addForm.staff,
//         priority: addForm.priority.toLowerCase(),
//         lastFollowUp: addForm.lastFollowUp,
//         nextFollowupDate: addForm.nextFollowupDate || null,
//         nextFollowupTime: addForm.nextFollowupTime || null,
//         note: addForm.note?.trim() || "",
//         isActive: addForm.isActive ?? true,
//       };

//       if (editingLead) {
//         // Edit mode - don't include status and next follow-up date
//         const { leadStatus, nextFollowupDate, ...editPayload } = payload;
//         await axios.put(`${baseUrl.updateLead}/${editingLead._id}`, editPayload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         toast.success("Lead updated successfully");
//       } else {
//         // Add mode
//         await axios.post(baseUrl.addLead, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         toast.success("Lead added successfully");
//       }

//       setShowAddDialog(false);
//       setEditingLead(null);
//       resetForm();
//       fetchLeads();
//     } catch (error: any) {
//       console.error(error);
//       toast.error(error.response?.data?.message || "Failed to save lead");
//     } finally {
//       setAddingLead(false);
//     }
//   };

//   const handleView = async (id: string) => {
//     try {
//       const tk = getAuthToken();
//       const res = await axios.get(`${baseUrl.findLeadById}/${id}`, {
//         headers: tk ? { Authorization: `Bearer ${tk}` } : undefined,
//       });
//       const d = res.data.data;
//       const full = {
//         id: d._id,
//         name: d.fullName || "",
//         companyName: d.companyName || "",
//         address: d.address || "",
//         phone: d.contact || "",
//         email: d.email || "",
//         source: d.leadSource?.name || d.leadSource?._id || "",
//         status: d.leadStatus?.name || d.leadStatus?._id || "",
//         staff: d.assignedTo?.fullName || d.assignedTo?._id || "",
//         priority: (d.priority || "Medium").toUpperCase() as
//           | "High"
//           | "Medium"
//           | "Low",
//         lastFollowUp: d.updatedAt
//           ? new Date(d.updatedAt).toLocaleDateString()
//           : "-",
//         nextFollowupDate: d.nextFollowupDate
//           ? new Date(d.nextFollowupDate).toISOString().split("T")[0]
//           : undefined,
//         nextFollowupTime: d.nextFollowupTime || undefined,
//         note: d.note || "",
//         attachments: Array.isArray(d.attachments)
//           ? d.attachments.map((a: any) =>
//             typeof a === "string"
//               ? {
//                 name: a,
//                 url: `${API_BASE}${a.startsWith("/") ? a : a}`,
//               }
//               : {
//                 name:
//                   a?.originalName || a?.filename || a?.name || "Attachment",
//                 url:
//                   a?.url ||
//                   (a?.path ? `${API_BASE}${a.path}` : undefined) ||
//                   (a?.location ? `${API_BASE}${a.location}` : undefined),
//               },
//           )
//           : [],
//         isActive: d.isActive ?? true,
//       };
//       setViewLead(full);
//     } catch (e) {
//       console.error("Failed to fetch lead for view", e);
//     }
//   };

//   const handleEdit = (id: string) => {
//     const lead = leads.find((l) => l._id === id);
//     if (!lead) return;

//     setEditingLead(lead);
//     setAddForm({
//       name: lead.fullName || "",
//       companyName: lead.companyName || "",
//       address: lead.address || "",
//       phone: lead.contact || "",
//       email: lead.email || "",
//       source: lead.leadSource?._id || "",
//       status: lead.leadStatus?._id || "",
//       staff: lead.assignedTo?._id || "",
//       priority: lead.priority || "Medium",
//       lastFollowUp: lead.lastFollowUp || new Date().toISOString().split("T")[0],
//       nextFollowupDate: lead.nextFollowupDate || "",
//       nextFollowupTime: lead.nextFollowupTime || "",
//       note: lead.note || "",
//       isActive: lead.isActive ?? true,
//       attachments: [],
//     });
//     setShowAddDialog(true);
//   };

//   const lostLeads = useMemo(
//     () =>
//       allLeads
//         .filter((l) => l.isLost)
//         .filter(
//           (l) =>
//             l.fullName?.toLowerCase().includes(lostSearch.toLowerCase()) ||
//             l.companyName?.toLowerCase().includes(lostSearch.toLowerCase()) ||
//             l.address?.toLowerCase().includes(lostSearch.toLowerCase()),
//         ),
//     [allLeads, lostSearch],
//   );

//   const wonLeads = useMemo(
//     () =>
//       allLeads
//         .filter((l) => l.isWon)
//         .filter(
//           (l) =>
//             l.fullName?.toLowerCase().includes(wonSearch.toLowerCase()) ||
//             l.companyName?.toLowerCase().includes(wonSearch.toLowerCase()) ||
//             l.address?.toLowerCase().includes(wonSearch.toLowerCase()),
//         ),
//     [allLeads, wonSearch],
//   );

//   const handleDragStart = (leadId: string) => setDraggingId(leadId);

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

//   const handleDrop = async (targetStatusId: string) => {
//     if (!draggingId || targetStatusId === draggingId) return;

//     // Store original state for rollback
//     const originalGroups = JSON.parse(JSON.stringify(statusGroups));

//     // Optimistic UI update (move lead to new column)
//     setStatusGroups((prev) =>
//       prev.map((group) => ({
//         ...group,
//         leads: group.leads.map((lead) =>
//           lead._id === draggingId
//             ? {
//               ...lead,
//               leadStatus: { ...lead.leadStatus, _id: targetStatusId } as any,
//             }
//             : lead,
//         ),
//       })),
//     );

//     // Call API
//     const success = await updateLeadKanbanStatus(draggingId, targetStatusId);

//     if (success) {
//       // On success → refresh full data from server
//       const freshGroups = await getKanbanData();
//       setStatusGroups(freshGroups);
//       setError(null); // clear any previous error
//     } else {
//       // On failure → rollback to previous UI state
//       setStatusGroups(originalGroups);
//       setError("Failed to update lead status. Reverted changes.");
//     }

//     setDraggingId(null);
//   };

//   const markLost = async (id: string) => {
//     setStatusGroups((prev) =>
//       prev.map((g) => ({
//         ...g,
//         leads: g.leads.map((l) =>
//           l._id === id ? { ...l, isLost: true, isWon: false } : l,
//         ),
//       })),
//     );

//     try {
//       const token = getAuthToken();
//       const res = await fetch(`${baseUrl}/leads/${id}/lost`, {
//         method: "PATCH",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error();
//     } catch {
//       fetchKanbanData();
//     }
//   };

//   const markWon = async (id: string) => {
//     setStatusGroups((prev) =>
//       prev.map((g) => ({
//         ...g,
//         leads: g.leads.map((l) =>
//           l._id === id ? { ...l, isWon: true, isLost: false } : l,
//         ),
//       })),
//     );

//     try {
//       const token = getAuthToken();
//       const res = await fetch(`${baseUrl}/leads/${id}/won`, {
//         method: "PATCH",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error();
//     } catch {
//       fetchKanbanData();
//     }
//   };

//   if (loading && view === "kanban") {
//     return (
//       <Layout label="Leads Kanban">
//         <div className="flex items-center justify-center h-96">
//           <div className="text-center">
//             <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
//             <p className="mt-2 text-gray-600">Loading leads...</p>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   if (error && view === "kanban") {
//     return (
//       <Layout label="Leads Kanban">
//         <div className="rounded-lg bg-red-50 p-4">
//           <div className="flex">
//             <svg
//               className="h-5 w-5 text-red-400"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">
//                 Error loading leads
//               </h3>
//               <p className="mt-2 text-sm text-red-700">{error}</p>
//               <button
//                 onClick={fetchKanbanData}
//                 className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout label="Leads Kanban">
//       <div className="space-y-4 w-[calc(100vw-145px)]">
//         <div className="rounded-3xl border border-gray-200 bg-white shadow-sm text-slate-600 w-full">
//           <div className="flex flex-wrap justify-between items-center gap-3 p-5">
//             {/* Filters */}
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setShowFilters((v) => !v)}
//                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 transition text-sm font-medium"
//               >
//                 <Filter className="w-4 h-4 text-blue-600" />
//                 Filters
//               </button>
//             </div>

//             <div className="flex gap-2">
//               {/* Add Lead */}
//               <button
//                 onClick={() => setShowAddDialog(true)}
//                 className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900"
//               >
//                 <FiPlus className="h-4 w-4" />
//                 Add Lead
//               </button>

//               {/* Leads Button */}
//               <button
//                 onClick={() => router.push("/leads")}
//                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-sm"
//               >
//                 <LayoutDashboard className="w-4 h-4 text-gray-700" />
//                 Leads
//               </button>
//             </div>
//           </div>

//           {/* Filter Dropdown - Full Width */}
//           <div
//             className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? "max-h-[280px] opacity-100" : "max-h-0 opacity-0"
//               }`}
//           >
//             <div className="px-6 pt-4 pb-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 border-t border-gray-200">
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">All Status</option>
//                   {statuses.map((s) => (
//                     <option key={s._id} value={s._id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>

//                 <select
//                   value={sourceFilter}
//                   onChange={(e) => setSourceFilter(e.target.value)}
//                   className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-purple-500"
//                 >
//                   <option value="">All Sources</option>
//                   {sources.map((s) => (
//                     <option key={s._id} value={s._id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>

//                 <select
//                   value={staffFilter}
//                   onChange={(e) => setStaffFilter(e.target.value)}
//                   className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
//                 >
//                   <option value="">All Staff</option>
//                   {staffMembers.map((s) => (
//                     <option key={s._id} value={s._id}>
//                       {s.fullName}
//                     </option>
//                   ))}
//                 </select>

//                 <input
//                   type="date"
//                   value={dateFilter}
//                   onChange={(e) => setDateFilter(e.target.value)}
//                   className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-cyan-500"
//                 />

//                 <button
//                   onClick={() => {
//                     setStatusFilter("");
//                     setSourceFilter("");
//                     setStaffFilter("");
//                     setDateFilter("");
//                   }}
//                   className="h-11 rounded-xl border border-gray-300 hover:bg-red-50 text-sm font-medium text-red-600 transition"
//                 >
//                   Clear
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {view === "kanban" && (
//           <div className="w-full h-[calc(100vh-120px)]">
//             {/* Horizontal Scroll Container */}
//             <div className="w-full h-full overflow-x-auto">
//               {/* Flex container for columns */}
//               <div className="flex gap-6 p-4 min-w-min h-full items-stretch">
//                 {statuses
//                   .filter(
//                     (status) =>
//                       !visibleStatusNames ||
//                       visibleStatusNames.includes(status.name),
//                   )
//                   .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
//                   .map((status) => {
//                     const statusId = status._id;
//                     const title = status.name;
//                     const columnLeads =
//                       statusGroups.find((g) => g.statusId === statusId)?.leads || [];

//                     return (
//                       <div
//                         key={statusId}
//                         className="flex flex-col w-[400px] flex-shrink-0 h-full"
//                       >
//                         {/* Column Header */}
//                         <div className="bg-secondary rounded-t-xl px-6 py-4">
//                           <div className="flex items-center justify-between">
//                             <h3 className="font-semibold text-white capitalize">
//                               {title}
//                             </h3>
//                             <span className="rounded-full bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#0a2352]">
//                               {columnLeads.length}
//                             </span>
//                           </div>
//                         </div>

//                         {/* Column Content */}
//                         <div
//                           className={`flex-1 min-h-[400px] overflow-y-auto rounded-b-lg bg-[#f4f7fb] p-4 ${draggingId
//                             ? "border-2 border-dashed border-blue-500"
//                             : ""
//                             }`}
//                           onDragOver={handleDragOver}
//                           onDrop={() => handleDrop(statusId)}
//                         >
//                           {columnLeads.length === 0 ? (
//                             <div className="flex h-full items-center justify-center text-sm text-gray-500">
//                               No leads
//                             </div>
//                           ) : (
//                             <div className="space-y-3">
//                               {columnLeads.map((lead) => (
//                                 <div
//                                   key={lead._id}
//                                   className="cursor-move rounded-lg bg-[#ffffff] p-4 transition-shadow hover:shadow-md"
//                                   draggable
//                                   onDragStart={() => handleDragStart(lead._id)}
//                                 >
//                                   {/* Lead Card Header */}
//                                   <div className="flex items-start justify-between">
//                                     <div>
//                                       <div className="font-semibold text-gray-900">
//                                         {lead.fullName}
//                                       </div>
//                                       <div className="mt-1 text-sm text-gray-600">
//                                         {lead.companyName || "-"}
//                                       </div>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                       <button
//                                         onClick={() => handleView(lead._id)}
//                                         className="h-8 w-8 rounded-full bg-[#007bff] text-[#ffffff] flex items-center justify-center
//              hover:-translate-y-1 hover:shadow-md 
//              transition-transform transition-shadow duration-200 ease-out"
//                                         title="View"
//                                       >
//                                         <FiEye className="h-4 w-4" />
//                                       </button>

//                                       <button
//                                         onClick={() => handleEdit(lead._id)}
//                                         className="h-8 w-8 rounded-full bg-[#008001] text-[#ffffff] flex items-center justify-center
//              hover:-translate-y-1 hover:shadow-md 
//              transition-transform transition-shadow duration-200 ease-out"
//                                         title="Edit"
//                                       >
//                                         <FiEdit className="h-4 w-4" />
//                                       </button>
//                                     </div>
//                                   </div>

//                                   {/* Lead Details */}
//                                   <div className="mt-3 space-y-2 text-sm text-gray-700">
//                                     <div className="flex items-center gap-2">
//                                       <FiLink className="h-4 w-4 text-dark" />
//                                       <span>{lead.leadSource?.name || "N/A"}</span>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                       <FiMapPin className="h-4 w-4 text-dark" />
//                                       <span>{lead.address || "N/A"}</span>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                       <FiPhone className="h-4 w-4 text-dark" />
//                                       <span>{lead.contact}</span>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                       <FiMail className="h-4 w-4 text-dark" />
//                                       <span>{lead.email}</span>
//                                     </div>

//                                     <div className="flex items-center gap-2">
//                                       {lead.assignedTo?.avatar ? (
//                                         <img
//                                           src={lead.assignedTo.avatar}
//                                           alt={lead.assignedTo.fullName}
//                                           className="h-6 w-6 rounded-full object-cover"
//                                         />
//                                       ) : (
//                                         <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#9160ff] to-[#c387ff] flex items-center justify-center text-xs font-semibold text-white">
//                                           {lead.assignedTo?.fullName
//                                             ?.split(" ")
//                                             .map((n) => n[0])
//                                             .join("")
//                                             .toUpperCase() || "U"}
//                                         </div>
//                                       )}
//                                       <span>{lead.assignedTo?.fullName || "Unassigned"}</span>
//                                     </div>

//                                     {lead.priority && (
//                                       <div className="flex items-center gap-2">
//                                         <span className="font-medium">Priority:</span>
//                                         <span className="capitalize">
//                                           {lead.priority}
//                                         </span>
//                                       </div>
//                                     )}
//                                   </div>

//                                   {/* Lead Actions */}
//                                   <div className="mt-3 flex gap-2">
//                                     <button
//                                       onClick={() => markLost(lead._id)}
//                                       className={`rounded-lg px-3 py-1 text-xs font-medium ${lead.isLost
//                                         ? "bg-red-600 text-white"
//                                         : "bg-red-50 text-red-700 hover:bg-red-100"
//                                         }`}
//                                     >
//                                       Lost
//                                     </button>

//                                     <button
//                                       onClick={() => markWon(lead._id)}
//                                       className={`rounded-lg px-3 py-1 text-xs font-medium ${lead.isWon
//                                         ? "bg-green-600 text-white"
//                                         : "bg-green-50 text-green-700 hover:bg-green-100"
//                                         }`}
//                                     >
//                                       Won
//                                     </button>
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Lost Leads Section */}
//         {view === "lost" && (
//           <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm w-full">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="h-6 w-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center">
//                   ×
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-red-800">
//                     Lost Leads
//                   </h2>
//                   <p className="text-sm text-red-700">
//                     Leads that were not converted
//                   </p>
//                 </div>
//               </div>
//               <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-semibold text-red-800">
//                 {lostLeads.length} Total
//               </span>
//             </div>
//             <div className="mt-4 rounded-xl bg-white border border-red-100 p-4">
//               <div className="flex items-center justify-between gap-4">
//                 <div className="flex items-center gap-2 text-sm text-gray-700">
//                   Show
//                   <select className="border rounded px-2 py-1">
//                     <option>100</option>
//                   </select>
//                   entries
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-gray-700">Search:</span>
//                   <input
//                     value={lostSearch}
//                     onChange={(e) => setLostSearch(e.target.value)}
//                     className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
//                   />
//                 </div>
//               </div>
//               <div className="mt-3 overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="bg-[#dee2e6] text-black text-xs font-bold">
//                       <th className="px-4 py-3 text-left">Lead Name</th>
//                       <th className="px-4 py-3 text-left">Company</th>
//                       <th className="px-4 py-3 text-left">Location</th>
//                       <th className="px-4 py-3 text-left">Contact</th>
//                       <th className="px-4 py-3 text-left">Lost Date</th>
//                       <th className="px-4 py-3 text-left">Assigned To</th>
//                       <th className="px-4 py-3 text-left">Reason</th>
//                       <th className="px-4 py-3 text-left">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white">
//                     {lostLeads.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan={8}
//                           className="px-6 py-12 text-center text-gray-600"
//                         >
//                           No data available in table
//                         </td>
//                       </tr>
//                     ) : (
//                       lostLeads.map((l) => (
//                         <tr key={l._id} className="border-b">
//                           <td className="px-4 py-3">
//                             <div className="flex flex-col">
//                               <span className="font-semibold text-gray-900">
//                                 {l.fullName}
//                               </span>
//                               <span className="text-xs text-red-600">• Lost</span>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3">{l.companyName}</td>
//                           <td className="px-4 py-3">{l.address}</td>
//                           <td className="px-4 py-3">
//                             <div className="flex flex-col gap-1 text-sm text-gray-700">
//                               <div className="flex items-center gap-2">
//                                 <FiPhone className="h-4 w-4 text-gray-500" />
//                                 {l.contact}
//                               </div>
//                               <div className="flex items-center gap-2">
//                                 <FiMail className="h-4 w-4 text-gray-500" />
//                                 {l.email}
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3">3 days ago</td>
//                           <td className="px-4 py-3">{l.assignedTo?.fullName || '-'}</td>
//                           <td className="px-4 py-3">Not required</td>
//                           <td className="px-4 py-3">
//                             <button
//                               onClick={() =>
//                                 setStatusGroups((prev) =>
//                                   prev.map((group) => ({
//                                     ...group,
//                                     leads: group.leads.map((x) =>
//                                       x._id === l._id
//                                         ? {
//                                           ...x,
//                                           isLost: false,
//                                           leadStatus: { ...(x.leadStatus || {}), name: 'Qualified' } as any,
//                                         }
//                                         : x,
//                                     ),
//                                   })),
//                                 )
//                               }
//                               className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
//                             >
//                               Reactivate
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Won Leads Section */}
//         {view === "won" && (
//           <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm w-full">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="h-6 w-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center">
//                   ✓
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-green-800">
//                     Won Leads
//                   </h2>
//                   <p className="text-sm text-green-700">
//                     Leads that were converted
//                   </p>
//                 </div>
//               </div>
//               <span className="rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-800">
//                 {wonLeads.length} Total
//               </span>
//             </div>
//             <div className="mt-4 rounded-xl bg-white border border-green-100 p-4">
//               <div className="flex items-center justify-between gap-4">
//                 <div className="flex items-center gap-2 text-sm text-gray-700">
//                   Show
//                   <select className="border rounded px-2 py-1">
//                     <option>100</option>
//                   </select>
//                   entries
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-gray-700">Search:</span>
//                   <input
//                     value={wonSearch}
//                     onChange={(e) => setWonSearch(e.target.value)}
//                     className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
//                   />
//                 </div>
//               </div>
//               <div className="mt-3 overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="bg-[#dee2e6] text-black text-xs font-bold">
//                       <th className="px-4 py-3 text-left">Lead Name</th>
//                       <th className="px-4 py-3 text-left">Company</th>
//                       <th className="px-4 py-3 text-left">Location</th>
//                       <th className="px-4 py-3 text-left">Contact</th>
//                       <th className="px-4 py-3 text-left">Assigned To</th>
//                       <th className="px-4 py-3 text-left">Amount</th>
//                       <th className="px-4 py-3 text-left">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white">
//                     {wonLeads.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan={7}
//                           className="px-6 py-12 text-center text-gray-600"
//                         >
//                           No data available in table
//                         </td>
//                       </tr>
//                     ) : (
//                       wonLeads.map((l) => (
//                         <tr key={l._id} className="border-b">
//                           <td className="px-4 py-3">
//                             <span className="font-semibold text-gray-900">
//                               {l.fullName}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3">{l.companyName}</td>
//                           <td className="px-4 py-3">{l.address}</td>
//                           <td className="px-4 py-3">
//                             <div className="flex flex-col gap-1 text-sm text-gray-700">
//                               <div className="flex items-center gap-2">
//                                 <FiPhone className="h-4 w-4 text-gray-500" />
//                                 {l.contact}
//                               </div>
//                               <div className="flex items-center gap-2">
//                                 <FiMail className="h-4 w-4 text-gray-500" />
//                                 {l.email}
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3">{l.assignedTo?.fullName || '-'}</td>
//                           <td className="px-4 py-3">
//                             {l.amount ? `₹${l.amount.toLocaleString()}` : "-"}
//                           </td>
//                           <td className="px-4 py-3">
//                             <div className="flex gap-2">
//                               <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
//                                 View
//                               </button>
//                               <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
//                                 Edit
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Add Lead Dialog */}
//         <Dialog
//           isOpen={showAddDialog}
//           onClose={() => {
//             setShowAddDialog(false);
//             setEditingLead(null);
//             resetForm();
//           }}
//           title={editingLead ? "Edit Lead" : "Add Lead"}
//           size="xl"
//           footer={
//             <>
//               <button
//                 onClick={() => {
//                   setShowAddDialog(false);
//                   setEditingLead(null);
//                   resetForm();
//                 }}
//                 className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveLead}
//                 className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
//                 disabled={addingLead}
//               >
//                 {addingLead ? "Saving..." : editingLead ? "Update Lead" : "Save Lead"}
//               </button>
//             </>
//           }
//         >
//           <form className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Full Name
//               </label>
//               <input
//                 type="text"
//                 value={addForm.name}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, name: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Company Name
//               </label>
//               <input
//                 type="text"
//                 value={addForm.companyName ?? ""}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, companyName: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Address
//               </label>
//               <textarea
//                 rows={3}
//                 value={addForm.address ?? ""}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, address: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Phone
//               </label>
//               <input
//                 type="text"
//                 value={addForm.phone}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, phone: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 value={addForm.email}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, email: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700">
//                   Source
//                 </label>
//                 <select
//                   value={addForm.source}
//                   onChange={(e) =>
//                     setAddForm((p) => ({ ...p, source: e.target.value }))
//                   }
//                   className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select Source</option>
//                   {sources.map((s) => (
//                     <option key={s._id} value={s._id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               {/* Status field only shown in add mode */}
//               {!editingLead && (
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700">
//                     Status
//                   </label>
//                   <select
//                     value={addForm.status}
//                     className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                     onChange={(e) =>
//                       setAddForm((p) => ({ ...p, status: e.target.value }))
//                     }
//                   >
//                     <option value="">Select Status</option>
//                     {statuses.map((s) => (
//                       <option key={s._id} value={s._id}>
//                         {s.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700">
//                   Assigned Staff
//                 </label>
//                 <select
//                   value={addForm.staff}
//                   onChange={(e) =>
//                     setAddForm((p) => ({ ...p, staff: e.target.value }))
//                   }
//                   className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select Staff</option>
//                   {staffMembers.map((s) => (
//                     <option key={s._id} value={s._id}>
//                       {s.fullName}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700">
//                   Priority
//                 </label>
//                 <select
//                   value={addForm.priority}
//                   onChange={(e) =>
//                     setAddForm((p) => ({
//                       ...p,
//                       priority: e.target.value as AddLeadForm["priority"],
//                     }))
//                   }
//                   className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option>High</option>
//                   <option>Medium</option>
//                   <option>Low</option>
//                 </select>
//               </div>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Last Follow-Up
//               </label>
//               <input
//                 type="date"
//                 value={addForm.lastFollowUp}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, lastFollowUp: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             {/* Next Follow-up fields only shown in add mode */}
//             {!editingLead && (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700">
//                     Next Follow-Up Date
//                   </label>
//                   <input
//                     type="date"
//                     value={addForm.nextFollowupDate ?? ""}
//                     onChange={(e) =>
//                       setAddForm((p) => ({
//                         ...p,
//                         nextFollowupDate: e.target.value,
//                       }))
//                     }
//                     className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700">
//                     Next Follow-Up Time
//                   </label>
//                   <input
//                     type="time"
//                     value={addForm.nextFollowupTime ?? ""}
//                     onChange={(e) =>
//                       setAddForm((p) => ({
//                         ...p,
//                         nextFollowupTime: e.target.value,
//                       }))
//                     }
//                     className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>
//             )}
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Note
//               </label>
//               <textarea
//                 rows={3}
//                 value={addForm.note ?? ""}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, note: e.target.value }))
//                 }
//                 className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700">
//                 Attachments
//               </label>
//               <input
//                 type="file"
//                 multiple
//                 onChange={(e) => {
//                   const files = e.target.files
//                     ? Array.from(e.target.files)
//                     : [];
//                   setAddForm((p) => ({ ...p, attachments: files }));
//                 }}
//                 className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//               />
//               {addForm?.attachments && addForm.attachments.length > 0 && (
//                 <ul className="mt-2 space-y-1 text-sm text-slate-600">
//                   {addForm.attachments.map((file, index) => (
//                     <li key={index}>📎 {file.name}</li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//             <div className="flex items-center gap-2">
//               <input
//                 id="isActive"
//                 type="checkbox"
//                 checked={addForm.isActive ?? true}
//                 onChange={(e) =>
//                   setAddForm((p) => ({ ...p, isActive: e.target.checked }))
//                 }
//                 className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//               />
//               <label
//                 htmlFor="isActive"
//                 className="text-sm font-medium text-slate-700"
//               >
//                 Active
//               </label>
//             </div>
//           </form>
//         </Dialog>

//         {/* View Lead Dialog with Edit Capabilities */}
//         <Dialog
//           isOpen={!!viewLead}
//           onClose={() => setViewLead(null)}
//           title="Lead Details"
//           size="xl"
//           footer={
//             <>
//               <button
//                 onClick={() => setViewLead(null)}
//                 className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//               >
//                 Close
//               </button>
//               <button
//                 onClick={handleSaveViewChanges}
//                 className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
//               >
//                 Save Changes
//               </button>
//             </>
//           }
//         >
//           {viewLead && (
//             <div className="space-y-4">
//               <div className="font-semibold text-xl">{viewLead.fullName}</div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Company</div>
//                   <div>{viewLead.companyName || "-"}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Phone</div>
//                   <div>{viewLead.contact || "-"}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Email</div>
//                   <div>{viewLead.email || "-"}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Source</div>
//                   <div>{viewLead.leadSource?.name || "-"}</div>
//                 </div>
//                 {/* Editable Status */}
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600 mb-2">Status</div>
//                   <select
//                     value={editingStatus}
//                     onChange={(e) => setEditingStatus(e.target.value)}
//                     className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Status</option>
//                     {statuses.map((s) => (
//                       <option key={s._id} value={s._id}>
//                         {s.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Assigned Staff</div>
//                   <div>{viewLead.assignedTo?.fullName || "-"}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Priority</div>
//                   <div>{viewLead.priority || "-"}</div>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Last Follow-Up</div>
//                   <div>{viewLead.lastFollowUp || "-"}</div>
//                 </div>
//               </div>
//               {/* Editable Next Follow-up */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600 mb-2">Next Follow-Up Date</div>
//                   <input
//                     type="date"
//                     value={editingNextFollowupDate}
//                     onChange={(e) => setEditingNextFollowupDate(e.target.value)}
//                     className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600 mb-2">Next Follow-Up Time</div>
//                   <input
//                     type="time"
//                     value={editingNextFollowupTime}
//                     onChange={(e) => setEditingNextFollowupTime(e.target.value)}
//                     className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>
//               {viewLead.note && (
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Note</div>
//                   <div>{viewLead.note}</div>
//                 </div>
//               )}
//               {viewLead.attachments && viewLead.attachments.length > 0 && (
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm text-gray-600">Attachments</div>
//                   <div className="space-y-2 mt-2">
//                     {viewLead.attachments.map((attachment, index) => (
//                       <a
//                         key={index}
//                         href={attachment.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:underline block"
//                       >
//                         {attachment.name}
//                       </a>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </Dialog>
//       </div>
//     </Layout>
//   );
// }

// function normalizePriority(p: "High" | "Medium" | "Low" | undefined) {
//   if (!p) return "medium";
//   return p.toLowerCase();
// }

// function findIdByName<
//   T extends { _id: string; name?: string; fullName?: string },
// >(list: T[], value: string) {
//   const byId = list.find((x) => x._id === value);
//   if (byId) return byId._id;
//   const byName = list.find((x) => x.name === value || x.fullName === value);
//   return byName?._id || "";
// }

// async function addLeadRequest(
//   form: {
//     name: string;
//     companyName?: string;
//     address?: string;
//     phone: string;
//     email: string;
//     sourceId: string;
//     statusId: string;
//     staffId: string;
//     priority: "high" | "medium" | "low";
//     nextFollowupDate?: string;
//     nextFollowupTime?: string;
//     note?: string;
//     isActive?: boolean;
//     attachments?: File[];
//   },
//   token: string,
// ) {
//   const hasFiles = (form.attachments || []).length > 0;
//   if (hasFiles) {
//     const fd = new FormData();
//     fd.append("fullName", form.name.trim());
//     fd.append("companyName", (form.companyName || "").trim());
//     fd.append("address", (form.address || "").trim());
//     fd.append("contact", form.phone.trim());
//     fd.append("email", form.email.trim().toLowerCase());
//     fd.append("leadSource", form.sourceId);
//     fd.append("leadStatus", form.statusId);
//     fd.append("assignedTo", form.staffId);
//     fd.append("priority", form.priority);
//     if (form.nextFollowupDate)
//       fd.append("nextFollowupDate", form.nextFollowupDate);
//     if (form.nextFollowupTime)
//       fd.append("nextFollowupTime", form.nextFollowupTime);
//     fd.append("note", (form.note || "").trim());
//     fd.append("isActive", String(form.isActive ?? true));
//     (form.attachments || []).forEach((file) => fd.append("attachments", file));
//     await axios.post(baseUrl.addLead, fd, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//   } else {
//     const payload = {
//       fullName: form.name.trim(),
//       companyName: (form.companyName || "").trim(),
//       address: (form.address || "").trim(),
//       contact: form.phone.trim(),
//       email: form.email.trim().toLowerCase(),
//       leadSource: form.sourceId,
//       leadStatus: form.statusId,
//       assignedTo: form.staffId,
//       priority: form.priority,
//       nextFollowupDate: form.nextFollowupDate || null,
//       nextFollowupTime: form.nextFollowupTime || null,
//       note: (form.note || "").trim(),
//       isActive: form.isActive ?? true,
//     };
//     await axios.post(baseUrl.addLead, payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });
//   }
// }

// async function updateLeadRequest(
//   id: string,
//   form: {
//     name: string;
//     companyName?: string;
//     address?: string;
//     phone: string;
//     email: string;
//     sourceId: string;
//     statusId: string;
//     staffId: string;
//     priority: "high" | "medium" | "low";
//     nextFollowupDate?: string;
//     nextFollowupTime?: string;
//     note?: string;
//     isActive?: boolean;
//     attachments?: File[];
//   },
//   existingAttachments: { name: string; url?: string }[],
//   token: string,
// ): Promise<ApiLead | null> {
//   const hasFiles = (form.attachments || []).length > 0;
//   if (hasFiles) {
//     const fd = new FormData();
//     fd.append("fullName", form.name.trim());
//     fd.append("companyName", (form.companyName || "").trim());
//     fd.append("address", (form.address || "").trim());
//     fd.append("contact", form.phone.trim());
//     fd.append("email", form.email.trim().toLowerCase());
//     fd.append("leadSource", form.sourceId);
//     fd.append("leadStatus", form.statusId);
//     fd.append("assignedTo", form.staffId);
//     fd.append("priority", form.priority);
//     if (form.nextFollowupDate)
//       fd.append("nextFollowupDate", form.nextFollowupDate);
//     if (form.nextFollowupTime)
//       fd.append("nextFollowupTime", form.nextFollowupTime);
//     fd.append("note", (form.note || "").trim());
//     fd.append("isActive", String(form.isActive ?? true));
//     (form.attachments || []).forEach((file) => fd.append("attachments", file));
//     const res = await axios.put(`${baseUrl.updateLead}/${id}`, fd, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return res.data?.data ?? res.data;
//   } else {
//     const payload: any = {
//       fullName: form.name.trim(),
//       companyName: (form.companyName || "").trim(),
//       address: (form.address || "").trim(),
//       contact: form.phone.trim(),
//       email: form.email.trim().toLowerCase(),
//       leadSource: form.sourceId,
//       leadStatus: form.statusId,
//       assignedTo: form.staffId,
//       priority: form.priority,
//       nextFollowupDate: form.nextFollowupDate || null,
//       nextFollowupTime: form.nextFollowupTime || null,
//       note: (form.note || "").trim(),
//       isActive: form.isActive ?? true,
//     };
//     if (existingAttachments.length > 0) {
//       payload.attachments = existingAttachments.map((a) => a.name);
//     }
//     const res = await axios.put(`${baseUrl.updateLead}/${id}`, payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });
//     return res.data?.data ?? res.data;
//   }
//   // Fallback, should not hit
//   return null;
// }
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
// import { Dialog } from "../components/Dialog";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPhone,
  FiMail,
  FiMapPin,
  FiLink,
  FiEye,
  FiEdit,
} from "react-icons/fi";
import axios from "axios";
// import { baseUrl } from "../utils/baseUrl";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { baseUrl, getAuthToken } from "@/config";
import Dialog from "@/components/Dialog";

type ApiUser = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
};

type ApiSource = {
  _id: string;
  name: string;
};

type ApiStatus = {
  _id: string;
  name: string;
};

type ApiLead = {
  _id: string;
  fullName: string;
  companyName?: string;
  address?: string;
  contact: string;
  email: string;
  leadSource?: ApiSource;
  leadStatus?: ApiStatus;
  assignedTo?: ApiUser;
  priority?: "High" | "Medium" | "Low";
  lastFollowUp?: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  attachments?: { name: string; url?: string }[];
  isLost?: boolean;
  isWon?: boolean;
  amount?: number;
};

type StatusGroup = {
  id: string;
  title: string;
  leads: ApiLead[];
};

type AddLeadForm = {
  name: string;
  companyName?: string;
  address?: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  staff: string;
  priority: "High" | "Medium" | "Low";
  lastFollowUp: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  attachments?: File[];
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [staffMembers, setStaffMembers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "board" | "lost" | "won">("board");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
  const [viewLead, setViewLead] = useState<ApiLead | null>(null);
  const [addingLead, setAddingLead] = useState(false);
  const [lostSearch, setLostSearch] = useState("");
  const [wonSearch, setWonSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(null);
  const [addForm, setAddForm] = useState<AddLeadForm>({
    name: "",
    companyName: "",
    address: "",
    phone: "",
    email: "",
    source: "",
    status: "",
    staff: "",
    priority: "Medium",
    lastFollowUp: new Date().toISOString().split("T")[0],
    nextFollowupDate: "",
    nextFollowupTime: "",
    note: "",
    isActive: true,
    attachments: [],
  });

  // View dialog edit states
  const [editingStatus, setEditingStatus] = useState("");
  const [editingNextFollowupDate, setEditingNextFollowupDate] = useState("");
  const [editingNextFollowupTime, setEditingNextFollowupTime] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kanbanVisibleStatusNames");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setVisibleStatusNames(parsed.filter((x) => typeof x === "string"));
          }
        } catch {
        }
      }
    }
  }, []);
  const fetchLeads = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch leads", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.leadSources, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch sources", error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.leadStatuses, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setStatuses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.getAllStaff, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setStaffMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchSources();
    fetchStatuses();
    fetchStaff();
  }, []);

  const handleSaveLead = async () => {
    if (
      !addForm.name ||
      !addForm.phone ||
      !addForm.email ||
      !addForm.source ||
      !addForm.status ||
      !addForm.staff
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setAddingLead(true);
    try {
      const token = getAuthToken();
      const payload = {
        fullName: addForm.name.trim(),
        companyName: addForm.companyName?.trim() || "",
        address: addForm.address?.trim() || "",
        contact: addForm.phone.trim(),
        email: addForm.email.trim().toLowerCase(),
        leadSource: addForm.source,
        leadStatus: addForm.status,
        assignedTo: addForm.staff,
        priority: addForm.priority.toLowerCase(),
        lastFollowUp: addForm.lastFollowUp,
        nextFollowupDate: addForm.nextFollowupDate || null,
        nextFollowupTime: addForm.nextFollowupTime || null,
        note: addForm.note?.trim() || "",
        isActive: addForm.isActive ?? true,
      };

      if (editingLead) {
        // Edit mode - don't include status and next follow-up date
        const { leadStatus, nextFollowupDate, ...editPayload } = payload;
        await axios.put(`${baseUrl.updateLead}/${editingLead._id}`, editPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Lead updated successfully");
      } else {
        // Add mode
        await axios.post(baseUrl.addLead, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Lead added successfully");
      }

      setShowAddDialog(false);
      setEditingLead(null);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save lead");
    } finally {
      setAddingLead(false);
    }
  };

  const resetForm = () => {
    setAddForm({
      name: "",
      companyName: "",
      address: "",
      phone: "",
      email: "",
      source: "",
      status: "",
      staff: "",
      priority: "Medium",
      lastFollowUp: new Date().toISOString().split("T")[0],
      nextFollowupDate: "",
      nextFollowupTime: "",
      note: "",
      isActive: true,
      attachments: [],
    });
  };

  const handleEdit = (id: string) => {
    const lead = leads.find((l) => l._id === id);
    if (!lead) return;

    setEditingLead(lead);
    setAddForm({
      name: lead.fullName || "",
      companyName: lead.companyName || "",
      address: lead.address || "",
      phone: lead.contact || "",
      email: lead.email || "",
      source: lead.leadSource?._id || "",
      status: lead.leadStatus?._id || "",
      staff: lead.assignedTo?._id || "",
      priority: lead.priority || "Medium",
      lastFollowUp: lead.lastFollowUp || new Date().toISOString().split("T")[0],
      nextFollowupDate: lead.nextFollowupDate || "",
      nextFollowupTime: lead.nextFollowupTime || "",
      note: lead.note || "",
      isActive: lead.isActive ?? true,
      attachments: [],
    });
    setShowAddDialog(true);
  };

  const handleView = (id: string) => {
    const lead = leads.find((l) => l._id === id);
    if (!lead) return;

    setViewLead(lead);
    // Initialize edit states with current values
    setEditingStatus(lead.leadStatus?._id || "");
    setEditingNextFollowupDate(lead.nextFollowupDate || "");
    setEditingNextFollowupTime(lead.nextFollowupTime || "");
  };

  const handleSaveViewChanges = async () => {
    if (!viewLead) return;

    try {
      const token = getAuthToken();
      const payload: any = {
        leadStatus: editingStatus,
        nextFollowupDate: editingNextFollowupDate || null,
        nextFollowupTime: editingNextFollowupTime || null,
      };

      await axios.put(`${baseUrl.updateLead}/${viewLead._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Lead updated successfully");
      fetchLeads();
      setViewLead(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update lead");
    }
  };

  const markLost = async (id: string) => {
    try {
      const token = getAuthToken();
      await axios.put(
        `${baseUrl.updateLead}/${id}`,
        { isLost: true },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Lead marked as lost");
      fetchLeads();
    } catch (error) {
      toast.error("Failed to update lead");
    }
  };

  const markWon = async (id: string) => {
    try {
      const token = getAuthToken();
      await axios.put(
        `${baseUrl.updateLead}/${id}`,
        { isWon: true },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Lead marked as won");
      fetchLeads();
    } catch (error) {
      toast.error("Failed to update lead");
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggingId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (statusId: string) => {
    if (!draggingId) return;

    const lead = leads.find((l) => l._id === draggingId);
    if (!lead) return;

    const status = statuses.find((s) => s._id === statusId);
    if (!status) return;

    const updateLeadStatus = async () => {
      try {
        const token = getAuthToken();
        await axios.put(
          `${baseUrl.updateLead}/${draggingId}`,
          { leadStatus: statusId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success(`Lead moved to ${status.name}`);
        fetchLeads();
      } catch (error) {
        toast.error("Failed to update lead status");
      }
    };

    updateLeadStatus();
    setDraggingId(null);
  };

  const filteredLeads = leads.filter(
    (lead) =>
      !lead.isLost &&
      !lead.isWon &&
      (lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
        lead.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase())),
  );

  const lostLeads = leads.filter(
    (lead) =>
      lead.isLost &&
      (lead.fullName.toLowerCase().includes(lostSearch.toLowerCase()) ||
        lead.companyName?.toLowerCase().includes(lostSearch.toLowerCase())),
  );

  const wonLeads = leads.filter(
    (lead) =>
      lead.isWon &&
      (lead.fullName.toLowerCase().includes(wonSearch.toLowerCase()) ||
        lead.companyName?.toLowerCase().includes(wonSearch.toLowerCase())),
  );

  const statusGroups: StatusGroup[] = statuses.map((status) => ({
    id: status._id,
    title: status.name,
    leads: filteredLeads.filter((lead) => lead.leadStatus?._id === status._id),
  }));

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-xl text-gray-600">Loading leads...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout label='Leads'>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-600">Manage your leads pipeline</p>
          </div>
          <button
            onClick={() => {
              setEditingLead(null);
              resetForm();
              setShowAddDialog(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
          >
            <FiPlus className="h-4 w-4" />
            Add Lead
          </button>
        </div>

        {/* View Toggle and Filters */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("board")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "board"
                  ? "bg-secondary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Board View
            </button>
            <button
              onClick={() => setView("lost")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "lost"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Lost Leads
            </button>
            <button
              onClick={() => setView("won")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "won"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Won Leads
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto px-6 pb-6">

          {/* Board View */}
          {view === "board" && (
            <div className="h-full overflow-x-auto">
              <div className="flex gap-4 h-full w-100">
                {statusGroups.filter(
                  (status) =>
                    !visibleStatusNames ||
                    visibleStatusNames.includes(status.title),
                ).map((status) => (
                  <div
                    key={status.id}
                    className="w-80 flex-shrink-0 h-full"
                  >
                    {/* Column Header */}
                    <div className="bg-secondary rounded-t-xl px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white capitalize">
                          {status.title}
                        </h3>
                        <span className="rounded-full bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#0a2352]">
                          {status.leads.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div
                      className={`flex-1 min-h-[400px] overflow-y-auto rounded-b-lg bg-[#f4f7fb] p-4 ${draggingId ? "border-2 border-dashed border-blue-500" : ""
                        }`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(status.id)}
                    >
                      {status.leads.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          No leads
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {status.leads.map((lead) => (
                            <div
                              key={lead._id}
                              className="cursor-move rounded-lg bg-[#ffffff] p-4 transition-shadow hover:shadow-md"
                              draggable
                              onDragStart={() => handleDragStart(lead._id)}
                            >
                              {/* Lead Card Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {lead.fullName}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    {lead.companyName || "-"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleView(lead._id)}
                                    className="h-8 w-8 rounded-full bg-[#007bff] text-[#ffffff] flex items-center justify-center
             hover:-translate-y-1 hover:shadow-md 
             transition-transform transition-shadow duration-200 ease-out"
                                    title="View"
                                  >
                                    <FiEye className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={() => handleEdit(lead._id)}
                                    className="h-8 w-8 rounded-full bg-[#008001] text-[#ffffff] flex items-center justify-center
             hover:-translate-y-1 hover:shadow-md 
             transition-transform transition-shadow duration-200 ease-out"
                                    title="Edit"
                                  >
                                    <FiEdit className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Lead Details */}
                              <div className="mt-3 space-y-2 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                  <FiLink className="h-4 w-4 text-dark" />
                                  <span>{lead.leadSource?.name || "N/A"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <FiMapPin className="h-4 w-4 text-dark" />
                                  <span>{lead.address || "N/A"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <FiPhone className="h-4 w-4 text-dark" />
                                  <span>{lead.contact}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <FiMail className="h-4 w-4 text-dark" />
                                  <span>{lead.email}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {lead.assignedTo?.avatar ? (
                                    <img
                                      src={lead.assignedTo.avatar}
                                      alt={lead.assignedTo.fullName}
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#9160ff] to-[#c387ff] flex items-center justify-center text-xs font-semibold text-white">
                                      {lead.assignedTo?.fullName
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase() || "U"}
                                    </div>
                                  )}
                                  <span>{lead.assignedTo?.fullName || "Unassigned"}</span>
                                </div>

                                {lead.priority && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Priority:</span>
                                    <span className="capitalize">
                                      {lead.priority}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Lead Actions */}
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => markLost(lead._id)}
                                  className={`rounded-lg px-3 py-1 text-xs font-medium ${lead.isLost
                                      ? "bg-red-600 text-white"
                                      : "bg-red-50 text-red-700 hover:bg-red-100"
                                    }`}
                                >
                                  Lost
                                </button>

                                <button
                                  onClick={() => markWon(lead._id)}
                                  className={`rounded-lg px-3 py-1 text-xs font-medium ${lead.isWon
                                      ? "bg-green-600 text-white"
                                      : "bg-green-50 text-green-700 hover:bg-green-100"
                                    }`}
                                >
                                  Won
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lost Leads Section */}
          {view === "lost" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center">
                    ×
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-800">
                      Lost Leads
                    </h2>
                    <p className="text-sm text-red-700">
                      Leads that were not converted
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-semibold text-red-800">
                  {lostLeads.length} Total
                </span>
              </div>
              <div className="mt-4 rounded-xl bg-white border border-red-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    Show
                    <select className="border rounded px-2 py-1">
                      <option>100</option>
                    </select>
                    entries
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Search:</span>
                    <input
                      value={lostSearch}
                      onChange={(e) => setLostSearch(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#dee2e6] text-black text-xs font-bold">
                        <th className="px-4 py-3 text-left">Lead Name</th>
                        <th className="px-4 py-3 text-left">Company</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-left">Lost Date</th>
                        <th className="px-4 py-3 text-left">Assigned To</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {lostLeads.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-12 text-center text-gray-600"
                          >
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        lostLeads.map((l) => (
                          <tr key={l._id} className="border-b">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">
                                  {l.fullName}
                                </span>
                                <span className="text-xs text-red-600">• Lost</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{l.companyName}</td>
                            <td className="px-4 py-3">{l.address}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                  <FiPhone className="h-4 w-4 text-gray-500" />
                                  {l.contact}
                                </div>
                                <div className="flex items-center gap-2">
                                  <FiMail className="h-4 w-4 text-gray-500" />
                                  {l.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">3 days ago</td>
                            <td className="px-4 py-3">{l.assignedTo?.fullName || '-'}</td>
                            <td className="px-4 py-3">Not required</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() =>
                                  setLeads((prev) =>
                                    prev.map((lead) =>
                                      lead._id === l._id
                                        ? {
                                          ...lead,
                                          isLost: false,
                                          leadStatus: statuses.find(s => s.name === 'Qualified') || lead.leadStatus,
                                        }
                                        : lead,
                                    ),
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Reactivate
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Won Leads Section */}
          {view === "won" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-green-800">
                      Won Leads
                    </h2>
                    <p className="text-sm text-green-700">
                      Leads that were converted
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-800">
                  {wonLeads.length} Total
                </span>
              </div>
              <div className="mt-4 rounded-xl bg-white border border-green-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    Show
                    <select className="border rounded px-2 py-1">
                      <option>100</option>
                    </select>
                    entries
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Search:</span>
                    <input
                      value={wonSearch}
                      onChange={(e) => setWonSearch(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#dee2e6] text-black text-xs font-bold">
                        <th className="px-4 py-3 text-left">Lead Name</th>
                        <th className="px-4 py-3 text-left">Company</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-left">Assigned To</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {wonLeads.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-gray-600"
                          >
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        wonLeads.map((l) => (
                          <tr key={l._id} className="border-b">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900">
                                {l.fullName}
                              </span>
                            </td>
                            <td className="px-4 py-3">{l.companyName}</td>
                            <td className="px-4 py-3">{l.address}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                  <FiPhone className="h-4 w-4 text-gray-500" />
                                  {l.contact}
                                </div>
                                <div className="flex items-center gap-2">
                                  <FiMail className="h-4 w-4 text-gray-500" />
                                  {l.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{l.assignedTo?.fullName || '-'}</td>
                            <td className="px-4 py-3">
                              {l.amount ? `₹${l.amount.toLocaleString()}` : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                                  View
                                </button>
                                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Lead Dialog */}
        <Dialog
          isOpen={showAddDialog}
          onClose={() => {
            setShowAddDialog(false);
            setEditingLead(null);
            resetForm();
          }}
          title={editingLead ? "Edit Lead" : "Add Lead"}
          size="xl"
          footer={
            <>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingLead(null);
                  resetForm();
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLead}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={addingLead}
              >
                {addingLead ? "Saving..." : editingLead ? "Update Lead" : "Save Lead"}
              </button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Company Name
              </label>
              <input
                type="text"
                value={addForm.companyName ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, companyName: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Address
              </label>
              <textarea
                rows={3}
                value={addForm.address ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, address: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                type="text"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, email: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Source
                </label>
                <select
                  value={addForm.source}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, source: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Source</option>
                  {sources.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Status field only shown in add mode */}
              {!editingLead && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={addForm.status}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="">Select Status</option>
                    {statuses.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Assigned Staff
                </label>
                <select
                  value={addForm.staff}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, staff: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Staff</option>
                  {staffMembers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Priority
                </label>
                <select
                  value={addForm.priority}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      priority: e.target.value as AddLeadForm["priority"],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Last Follow-Up
              </label>
              <input
                type="date"
                value={addForm.lastFollowUp}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, lastFollowUp: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Next Follow-up fields only shown in add mode */}
            {!editingLead && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={addForm.nextFollowupDate ?? ""}
                    onChange={(e) =>
                      setAddForm((p) => ({
                        ...p,
                        nextFollowupDate: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Next Follow-Up Time
                  </label>
                  <input
                    type="time"
                    value={addForm.nextFollowupTime ?? ""}
                    onChange={(e) =>
                      setAddForm((p) => ({
                        ...p,
                        nextFollowupTime: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Note
              </label>
              <textarea
                rows={3}
                value={addForm.note ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, note: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Attachments
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                    ? Array.from(e.target.files)
                    : [];
                  setAddForm((p) => ({ ...p, attachments: files }));
                }}
                className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {addForm?.attachments && addForm.attachments.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {addForm.attachments.map((file, index) => (
                    <li key={index}>📎 {file.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={addForm.isActive ?? true}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-slate-700"
              >
                Active
              </label>
            </div>
          </form>
        </Dialog>

        {/* View Lead Dialog with Edit Capabilities */}
        <Dialog
          isOpen={!!viewLead}
          onClose={() => setViewLead(null)}
          title="Lead Details"
          size="xl"
          footer={
            <>
              <button
                onClick={() => setViewLead(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleSaveViewChanges}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
              >
                Save Changes
              </button>
            </>
          }
        >
          {viewLead && (
            <div className="space-y-4">
              <div className="font-semibold text-xl">{viewLead.fullName}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Company</div>
                  <div>{viewLead.companyName || "-"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Phone</div>
                  <div>{viewLead.contact || "-"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Email</div>
                  <div>{viewLead.email || "-"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Source</div>
                  <div>{viewLead.leadSource?.name || "-"}</div>
                </div>
                {/* Status Selection Boxes */}
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <div className="text-sm text-gray-600 mb-3">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setEditingStatus(s._id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${editingStatus === s._id
                            ? 'bg-secondary text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Assigned Staff</div>
                  <div>{viewLead.assignedTo?.fullName || "-"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Priority</div>
                  <div>{viewLead.priority || "-"}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Last Follow-Up</div>
                  <div>{viewLead.lastFollowUp || "-"}</div>
                </div>
              </div>
              {/* Editable Next Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Next Follow-Up Date</div>
                  <input
                    type="date"
                    value={editingNextFollowupDate}
                    onChange={(e) => setEditingNextFollowupDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Next Follow-Up Time</div>
                  <input
                    type="time"
                    value={editingNextFollowupTime}
                    onChange={(e) => setEditingNextFollowupTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {viewLead.note && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Note</div>
                  <div>{viewLead.note}</div>
                </div>
              )}
              {viewLead.attachments && viewLead.attachments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Attachments</div>
                  <div className="space-y-2 mt-2">
                    {viewLead.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block"
                      >
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </Layout>
  );
}
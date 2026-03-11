import { useState } from "react";
import { MessageCircle, Edit } from "lucide-react";
import { LeadStatus } from "@/constants/leadStatus";

type Lead = {
  _id: string;
  leadDate: string;
  clientType: string;
  deliveryDate: string;
  leadStatus: LeadStatus;
  totalAmount: string;
  accountMaster?: {
    companyName: string;
    clientName: string;
    mobile?: string;
    sourcebyTypeOfClient?: {
      _id: string;
      name: string;
      isHighlight?: boolean;
    };
    assignBy?: {
      _id: string;
      fullName: string;
    };
  };
  items: any[];
  maxStatusReached?: LeadStatus;
  paymentHistory?: { amount: string; date: string }[];
  followUps?: { date: string; description: string; createdAt: string }[];
};

export default function KanbanCard({
  lead,
  status,
  onDragStart,
  onViewLead,
  onFollowUpClick,
  onOrderExecutionClick,
  onMoveToLost,
  onMakePayment,
  onEditLead,
}: {
  lead: Lead;
  status: LeadStatus;
  onDragStart: (e: React.DragEvent, leadId: string, fromStatus: LeadStatus) => void;
  onViewLead: (lead: Lead) => void;
  onFollowUpClick: (leadId: string) => void;
  onOrderExecutionClick: (lead: Lead) => void;
  onMoveToLost: (leadId: string) => void;
  onMakePayment: (lead: Lead) => void;
  onEditLead?: (leadId: string) => void;
}) {
  const [showAllItems, setShowAllItems] = useState(false);
  const isHighlighted = lead.accountMaster?.sourcebyTypeOfClient?.isHighlight || false;
  const doneItems = lead.items?.filter((item: any) => item.isDone).length || 0;
  const totalItems = lead.items?.length || 0;
  const displayItems = showAllItems ? lead.items : lead.items?.slice(0, 2);
  
  const totalAmount = parseFloat(lead.totalAmount || "0");
  const paidAmount = (lead.paymentHistory || []).reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const isPaid = totalAmount - paidAmount === 0;

  return (
    <div
      draggable={status !== "Completed" && status !== "Lost"}
      onDragStart={(e) => onDragStart(e, lead._id, status)}
      className={`group rounded-2xl p-4 shadow-sm transition-all hover:shadow-lg ${
        status !== "Completed" && status !== "Lost" ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      } ${
        isHighlighted ? "bg-yellow-50 ring-2 ring-yellow-400" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
            {lead.accountMaster?.companyName || "N/A"}
          </h4>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {lead.accountMaster?.clientName || "N/A"}
          </p>
        </div>
        {lead.accountMaster?.mobile && (
          <a
            href={`https://wa.me/${lead.accountMaster.mobile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5" fill="currentColor">
              <path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z"/>
            </svg>
          </a>
        )}
      </div>

      {totalItems > 0 && (
        <div className="mt-3 space-y-1.5">
          {displayItems?.map((item: any, index: number) => (
            <div key={index} className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">
                  {item.inquiryCategory?.name || "N/A"}
                </span>
                <span className="text-gray-500">Qty: {item.qty}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-gray-500">
                <span>{item.modelSuggestion?.modelNo || "-"} - {typeof item.modelSuggestion?.color === 'object' ? item.modelSuggestion?.color?.name : item.modelSuggestion?.color || "-"}</span>
                <span className="font-medium">₹{item.rate}</span>
              </div>
            </div>
          ))}
          {totalItems > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAllItems(!showAllItems);
              }}
              className="w-full rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              {showAllItems ? "Show Less" : `Show ${totalItems - 2} More`}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {isHighlighted && (
          <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
            {lead.accountMaster?.sourcebyTypeOfClient?.name}
          </span>
        )}
        {status === "Follow Up" && lead.followUps && lead.followUps.length > 0 && (
          <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            Next: {new Date(lead.followUps[lead.followUps.length - 1].date).toLocaleString('en-IN', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        )}
        {status === "Order Execution" && totalItems > 0 && (
          <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            {doneItems}/{totalItems} Done
          </span>
        )}
        {(status === "Final Payment" || status === "Dispatch" || status === "Completed") && isPaid && (
          <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            Payment Done
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-green-600">₹{lead.totalAmount}</span>
          {(status === "Final Payment" || status === "Dispatch" || status === "Completed") && !isPaid && (
            <p className="text-xs text-red-600 font-medium">Pending: ₹{(totalAmount - paidAmount).toFixed(2)}</p>
          )}
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
          {lead.accountMaster?.assignBy?.fullName
            ? lead.accountMaster.assignBy.fullName.split(" ").map(word => word.charAt(0)).join("").toUpperCase()
            : "AU"}
        </div>
      </div>

      <div className="mt-3 flex gap-1.5">
        <button
          onClick={() => onViewLead(lead)}
          className="flex-1 rounded-xl bg-indigo-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          View
        </button>
        {(status === "New Lead" || status === "Quotation Given") && onEditLead && (
          <button
            onClick={() => onEditLead(lead._id)}
            className="flex-1 rounded-xl bg-purple-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 inline-flex items-center justify-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </button>
        )}
        {status === "Follow Up" && (
          <button
            onClick={() => onFollowUpClick(lead._id)}
            className="flex-1 rounded-xl bg-blue-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Follow Up
          </button>
        )}
        {status === "Order Execution" && (
          <button
            onClick={() => onOrderExecutionClick(lead)}
            className="flex-1 rounded-xl bg-green-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
          >
            Items
          </button>
        )}
        {(status === "PI" || status === "Final Payment" || status === "Dispatch" || status === "Completed") && !isPaid && (
          <button
            onClick={() => onMakePayment(lead)}
            className="flex-1 rounded-xl bg-green-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
          >
            {status === "PI" ? "Advance Payment" : "Make Payment"}
          </button>
        )}
        {status !== "Lost" && status !== "Completed" && (
          <button
            onClick={() => onMoveToLost(lead._id)}
            className="rounded-xl bg-rose-500 px-2 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
          >
            Lost
          </button>
        )}
      </div>
    </div>
  );
}

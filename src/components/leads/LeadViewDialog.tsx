// components/leads/LeadViewDialog.tsx
// View dialog with editable Status + Next Follow-up (shared by List and Kanban)

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';

interface Props {
  lead: ApiLead | null;
  statuses: ApiStatus[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function LeadViewDialog({ lead, statuses, onClose, onRefresh }: Props) {
  const [editStatus, setEditStatus] = useState('');
  const [editNextDate, setEditNextDate] = useState('');
  const [editNextTime, setEditNextTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setEditStatus(lead.leadStatus?._id || '');
      setEditNextDate(lead.nextFollowupDate || '');
      setEditNextTime(lead.nextFollowupTime || '');
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        {
          leadStatus: editStatus,
          nextFollowupDate: editNextDate || null,
          nextFollowupTime: editNextTime || null,
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      toast.success('Lead updated successfully');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={!!lead}
      onClose={onClose}
      title="Lead Details"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      {lead && (
        <div className="space-y-4 text-sm">
          <h2 className="text-xl font-bold text-gray-900">{lead.fullName}</h2>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoCard label="Company" value={lead.companyName} />
            <InfoCard label="Phone" value={lead.contact} />
            <InfoCard label="Email" value={lead.email} />
            <InfoCard label="Source" value={lead.leadSource?.name} />
            <InfoCard label="Assigned Staff" value={lead.assignedTo?.fullName} />
            <InfoCard
              label="Priority"
              value={
                lead.priority ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    lead.priority.toLowerCase() === 'high'
                      ? 'bg-red-100 text-red-600'
                      : lead.priority.toLowerCase() === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {lead.priority}
                  </span>
                ) : '-'
              }
            />
            <InfoCard label="Last Follow-Up" value={lead.lastFollowUp} />
            <InfoCard label="Active" value={lead.isActive ? 'Yes' : 'No'} />
          </div>

          {/* Address */}
          {lead.address && <InfoCard label="Address" value={lead.address} />}

          {/* Status picker */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-3 text-sm font-medium text-gray-600">Status</div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setEditStatus(s._id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    editStatus === s._id
                      ? 'bg-secondary text-white shadow'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editable next follow-up */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-600">Next Follow-Up Date</div>
              <input
                type="date"
                value={editNextDate}
                onChange={(e) => setEditNextDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-600">Next Follow-Up Time</div>
              <input
                type="time"
                value={editNextTime}
                onChange={(e) => setEditNextTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          {/* Labels */}
          {lead.leadLabel && lead.leadLabel.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-600">Labels</div>
              <div className="flex flex-wrap gap-2">
                {lead.leadLabel.map((l) => (
                  <span
                    key={l._id}
                    style={{ backgroundColor: l.color }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-white"
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {lead.note && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-1 text-sm font-medium text-gray-600">Note</div>
              <p className="text-gray-800">{lead.note}</p>
            </div>
          )}

          {/* Attachments */}
          {lead.attachments && lead.attachments.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-600">Attachments</div>
              <ul className="space-y-1">
                {lead.attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-gray-700">{a.name}</span>
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline">
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lost info */}
          {lead.isLost && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="mb-2 text-sm font-semibold text-red-600">Lost Information</div>
              <div className="space-y-1 text-sm text-red-800">
                <div>Lost Date: {lead.lostDate ? new Date(lead.lostDate).toLocaleDateString() : 'N/A'}</div>
                <div>Reason: {lead.lostReason || 'Not specified'}</div>
              </div>
            </div>
          )}

          {/* Won info */}
          {lead.isWon && (
            <div className="rounded-lg bg-green-50 p-4">
              <div className="mb-2 text-sm font-semibold text-green-700">Won Information</div>
              <div className="space-y-1 text-sm text-green-800">
                <div>Won Date: {lead.wonDate ? new Date(lead.wonDate).toLocaleDateString() : 'N/A'}</div>
                <div>Amount: {lead.amount ? `₹${lead.amount.toLocaleString()}` : 'Not specified'}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | React.ReactNode | null;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-gray-900">
        {typeof value === 'string' || value === undefined || value === null
          ? value || '-'
          : value}
      </div>
    </div>
  );
}
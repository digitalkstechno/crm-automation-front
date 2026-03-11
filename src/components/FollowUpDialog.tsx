import { useState } from "react";
import { X } from "lucide-react";

type FollowUpDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, description: string) => void;
};

export default function FollowUpDialog({ isOpen, onClose, onSubmit }: FollowUpDialogProps) {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const today = new Date().toISOString().slice(0, 16);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && description) {
      onSubmit(date, description);
      setDate("");
      setDescription("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Follow Up</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Follow Up Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="Enter follow up details..."
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Follow Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

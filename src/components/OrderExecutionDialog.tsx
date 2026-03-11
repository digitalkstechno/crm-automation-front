import { useState } from "react";
import { X, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { api } from "@/utils/axiosInstance";
import { baseUrl } from "../../config";
import toast from "react-hot-toast";

type Item = {
  _id: string;
  inquiryCategory: { name: string };
  modelSuggestion: { name: string };
  customizationType: { name: string };
  qty: string;
  isDone: boolean;
};

type OrderExecutionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  items: Item[];
  onUpdate: () => void;
};

export default function OrderExecutionDialog({ isOpen, onClose, leadId, items: initialItems, onUpdate }: OrderExecutionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null });

  if (!isOpen) return null;

  const handleToggle = async (itemId: string) => {
    const item = items.find(i => i._id === itemId);
    if (item && !item.isDone) {
      // If marking as done, show confirmation
      setConfirmDialog({ isOpen: true, itemId });
    } else {
      // If marking as pending, do it directly
      await performToggle(itemId);
    }
  };

  const performToggle = async (itemId: string) => {
    setLoading(true);
    try {
      await api.patch(`${baseUrl.LEAD}/${leadId}/item/${itemId}/toggle`);
      
      // Update local state immediately
      setItems(prev => prev.map(item => 
        item._id === itemId ? { ...item, isDone: !item.isDone } : item
      ));
      
      toast.success("Item status updated");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const doneCount = items.filter(i => i.isDone).length;
  const pendingCount = items.length - doneCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Execution - Items Status</h2>
            <div className="mt-2 flex gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                <CheckCircle className="h-4 w-4" />
                Done: {doneCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                <Circle className="h-4 w-4" />
                Pending: {pendingCount}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div 
              key={item._id} 
              className={`rounded-xl border-2 p-4 transition-all ${
                item.isDone 
                  ? "border-green-300 bg-green-50" 
                  : "border-orange-300 bg-orange-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">
                      {item.modelSuggestion.name}
                    </h3>
                  </div>
                  <div className="ml-8 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Category:</span> {item.inquiryCategory.name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Customization:</span> {item.customizationType.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      Quantity: {item.qty}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(item._id)}
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50 ${
                    item.isDone
                      ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                      : "bg-orange-500 text-white hover:bg-orange-600 shadow-md"
                  }`}
                >
                  {item.isDone ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Done
                    </>
                  ) : (
                    <>
                      <Circle className="h-5 w-5" />
                      Mark Done
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <AlertCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Mark Item as Done?</h2>
              </div>
              <button onClick={() => setConfirmDialog({ isOpen: false, itemId: null })} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-6 text-sm text-gray-600 leading-relaxed">
              Are you sure you want to mark this item as done? This will update the item status in the order execution.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, itemId: null })}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.itemId) {
                    performToggle(confirmDialog.itemId);
                  }
                  setConfirmDialog({ isOpen: false, itemId: null });
                }}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
              >
                Yes, Mark as Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

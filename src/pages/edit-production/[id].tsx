import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "@/utils/axiosInstance";
import { ArrowLeft, Save, X } from "lucide-react";
import { getTokenData } from "@/utils/tokenHelper";
import toast from "react-hot-toast";

export default function EditProduction() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [tokenData, setTokenData] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: "",
    category: "",
    model: "",
    qty: "",
    remarks: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await getTokenData();
      setTokenData(data);
      if (!data?.canAccessProduction) {
        router.push("/");
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (tokenData?.canAccessProduction && id) {
      fetchProduction();
      fetchCategories();
    }
  }, [tokenData, id]);

  const fetchProduction = async () => {
    try {
      setFetchLoading(true);
      const response = await api.get(`/production/${id}`);
      const prod = response.data.data;
      setFormData({
        date: new Date(prod.date).toISOString().split("T")[0],
        category: prod.category._id,
        model: prod.model._id,
        qty: prod.qty.toString(),
        remarks: prod.remarks || "",
      });
      fetchModelsByCategory(prod.category._id);
    } catch (error) {
      toast.error("Error fetching production");
      router.push("/production");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/inquirycategory/dropdown");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchModelsByCategory = async (categoryId: string) => {
    try {
      const response = await api.get(`/model/category/${categoryId}`);
      setModels(response.data.data);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setFormData({ ...formData, category: categoryId, model: "" });
    setModels([]);
    if (categoryId) {
      fetchModelsByCategory(categoryId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/production/${id}`, formData);
      toast.success("Production updated successfully!");
      router.push("/production");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating production");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenData?.canAccessProduction || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Edit Production</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.qty}
                onChange={(e) =>
                  setFormData({ ...formData, qty: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300 focus:bg-white"
            >
              <option value="">Select Category</option>
              {categories.map((cat: any) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Model No - Color <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              disabled={!formData.category}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300 focus:bg-white disabled:opacity-50"
            >
              <option value="">Select Model</option>
              {models.map((model: any) => (
                <option key={model._id} value={model._id}>
                  {model.modelNo} - {model.color?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300 focus:bg-white resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/production")}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Updating..." : "Update Production"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

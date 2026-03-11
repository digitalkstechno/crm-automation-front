import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DataTable from "@/components/DataTable";
import { api } from "@/utils/axiosInstance";
import { Plus, CheckCircle, Edit, Trash2 } from "lucide-react";
import { getTokenData } from "@/utils/tokenHelper";

export default function Production() {
  const router = useRouter();
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });
  const [tokenData, setTokenData] = useState<any>(null);

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
    if (tokenData?.canAccessProduction) {
      fetchProductions();
    }
  }, [pagination.currentPage, search, tokenData]);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/production?page=${pagination.currentPage}&limit=${pagination.limit}&search=${search}`
      );
      setProductions(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching productions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      await api.put(`/production/${id}/mark-done`);
      fetchProductions();
    } catch (error) {
      console.error("Error marking entry as done:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this production entry?")) {
      try {
        await api.delete(`/production/${id}`);
        fetchProductions();
      } catch (error) {
        console.error("Error deleting production:", error);
      }
    }
  };

  const columns = [
    {
      key: "srNo",
      label: "Sr No",
      render: (_: any, row: any, index: number) => 
        (pagination.currentPage - 1) * pagination.limit + index + 1,
    },
    {
      key: "date",
      label: "Date",
      render: (value: any) => new Date(value).toLocaleDateString(),
    },
    {
      key: "category",
      label: "Category",
      render: (value: any) => value?.name || "N/A",
    },
    {
      key: "model",
      label: "Model No - Color",
      render: (value: any) => `${value?.modelNo || "N/A"} - ${value?.color?.name || "N/A"}`,
    },
    {
      key: "qty",
      label: "Qty",
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (value: any) => value || "-",
    },
    {
      key: "isEntryDone",
      label: "Status",
      render: (value: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value ? "Entry Done" : "Pending"}
        </span>
      ),
    },
    {
      key: "_id",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/edit-production/${row._id}`)}
            disabled={row.isEntryDone}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              row.isEntryDone
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            disabled={row.isEntryDone}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              row.isEntryDone
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {!row.isEntryDone && (
            <button
              onClick={() => handleMarkDone(row._id)}
              className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 transition hover:bg-green-100"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!tokenData?.canAccessProduction) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Production</h1>
        <button
          onClick={() => router.push("/add-production")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Add Production
        </button>
      </div>

      <DataTable
        title="Production Management"
        columns={columns}
        data={productions}
        pageSize={10}
        searchPlaceholder="Search production..."
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        onPageChange={(page) =>
          setPagination((prev) => ({ ...prev, currentPage: page }))
        }
        onSearch={setSearch}
        initialSearch={search}
      />
    </div>
  );
}

import DataTable, { Column } from "@/components/DataTable";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import TableSkeleton from "@/components/TableSkeleton";
import axios from "axios";
import { Plus, Edit, Trash2, SendToBack, Download, Upload, FileSpreadsheet, MessageCircle } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { baseUrl } from "../../config";
import toast from "react-hot-toast";
import { api } from "@/utils/axiosInstance";
import { useRouter } from "next/router";
import { validateEmail, validatePhone, validateWebsite, sanitizePhoneInput } from "@/utils/validation";
type Staff = {
  _id: string;
  fullName: string;
};

type AccountRow = {
  _id?: string;
  companyName: string;
  clientName: string;
  mobile: string;
  email: string;
  website: string;
  sourcebyTypeOfClient?: {
    _id: string;
    name: string;
    isHighlight?: boolean;
  };
  sourceFrom?: {
    _id: string;
    name: string;
  };
  assignBy?: Staff;
  remark?: string;
  address?: {
    line1?: string;
    line2?: string;
    cityName?: string;
    stateName?: string;
    countryName?: string;
  };
  leadCount?: number;
};

const sourceOptions = [
  "B to B Vendor",
  "Direct Com",
  "Networking Group",
  "EndUser Retail",
  "O.E.M",
];

export default function AccountMasterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [clientTypes, setClientTypes] = useState<any[]>([]);
  const [sourceFroms, setSourceFroms] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editMode, setEditMode] = useState<{ isEdit: boolean; id: string | null }>({ isEdit: false, id: null });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importConfirmDialog, setImportConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResultDialog, setImportResultDialog] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const [noLeadsFilter, setNoLeadsFilter] = useState(false);
  const [importProgress, setImportProgress] = useState(false);

  useEffect(() => {
    fetchAccounts(page === 1 && search === "" && !noLeadsFilter);
  }, [page, search, noLeadsFilter]);

  const fetchStaff = async () => {
    try {
      const response = await api.get(baseUrl.STAFF_DROPDOWN);
      const filteredStaff = response.data.data?.filter((staff: any) =>
        staff.role?.canAccessAccountMaster === true
      ) || [];
      setStaffList(filteredStaff);
    } catch (error) {
      toast.error("Failed to fetch user");
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [clientTypesRes, sourceFromsRes] = await Promise.all([
        api.get(baseUrl.CLIENTTYPE_DROPDOWN),
        api.get(baseUrl.SOURCEFROM_DROPDOWN)
      ]);
      setClientTypes(clientTypesRes.data.data || []);
      setSourceFroms(sourceFromsRes.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch dropdowns");
    }
  };

  const getHighlightedClientType = () => {
    return clientTypes.find(type => type.isHighlight)?.name || null;
  };

  const fetchAccounts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get(`${baseUrl.ACCOUNTMASTER}?page=${page}&limit=10&search=${search}&noLeadsOnly=${noLeadsFilter}`);

      const userRole = localStorage.getItem("userRole");
      const staffId = localStorage.getItem("staffId");
      const accountMasterViewType = localStorage.getItem("accountMasterViewType");

      let filteredAccounts = response.data.data || [];

      if (accountMasterViewType === "view_own" && staffId) {
        filteredAccounts = filteredAccounts.filter((account: AccountRow) =>
          account.assignBy?._id === staffId
        );
      }

      setAccounts(filteredAccounts);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalRecords(response.data.pagination?.totalRecords || 0);
    } catch (error) {
      toast.error("Failed to fetch accounts");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const [form, setForm] = useState({
    companyName: "",
    clientName: "",
    line1: "",
    line2: "",
    cityName: "",
    stateName: "",
    countryName: "",
    mobile: "",
    email: "",
    website: "",
    sourcebyTypeOfClient: "",
    sourceFrom: "",
    assignById: "",
    remark: "",
  });

  const columns: Column<AccountRow>[] = useMemo(
    () => [
      { key: "companyName", label: "Company" },
      { key: "clientName", label: "Client" },
      { key: "mobile", label: "Mobile" },
      { key: "email", label: "Email" },
      {
        key: "sourcebyTypeOfClient",
        label: "Type of client",
        render: (value: any) => value?.name || "-",
      },
      {
        key: "assignBy",
        label: "Assigned Staff",
        render: (value) =>
          value ? (value as Staff).fullName : "-",
      },
      {
        key: "createdAt",
        label: "Created At",
        render: (value) => {
          if (!value) return "-";
          const date = new Date(value);
          return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        },
      },
      {
        key: "leadCount",
        label: "Leads",
        render: (value: any) => (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {value || 0}
          </span>
        ),
      },
      {
        key: "_id",
        label: "Actions",
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/convert-to-lead?accountId=${row._id}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-3 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Convert
              <SendToBack className="h-3 w-3" />
            </button>
            <button
              onClick={() => window.open(`https://wa.me/91${row.mobile}`, '_blank')}
              className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-3 text-sm font-medium text-green-600 transition hover:bg-green-100"
              title="Open WhatsApp"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </button>
            <button
              onClick={() => setDeleteDialog({ open: true, id: row._id! })}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [router]
  );

  const resetForm = () => {
    setForm({
      companyName: "",
      clientName: "",
      line1: "",
      line2: "",
      cityName: "",
      stateName: "",
      countryName: "",
      mobile: "",
      email: "",
      website: "",
      sourcebyTypeOfClient: "",
      sourceFrom: "",
      assignById: "",
      remark: "",
    });
    setEditMode({ isEdit: false, id: null });
  };

  const handleEdit = (row: AccountRow) => {
    setForm({
      companyName: row.companyName,
      clientName: row.clientName,
      line1: row.address?.line1 || "",
      line2: row.address?.line2 || "",
      cityName: row.address?.cityName || "",
      stateName: row.address?.stateName || "",
      countryName: row.address?.countryName || "",
      mobile: row.mobile,
      email: row.email,
      website: row.website,
      sourcebyTypeOfClient: row.sourcebyTypeOfClient?._id || "",
      sourceFrom: row.sourceFrom?._id || "",
      assignById: row.assignBy?._id || "",
      remark: row.remark || "",
    });
    setEditMode({ isEdit: true, id: row._id! });
    fetchStaff();
    fetchDropdowns();
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await api.delete(`${baseUrl.ACCOUNTMASTER}/${deleteDialog.id}`);
      setAccounts((prev) => prev.filter((a) => a._id !== deleteDialog.id));
      toast.success("Account deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleUpdate = async () => {
    if (!editMode.id) return;

    try {
      const payload = {
        companyName: form.companyName,
        clientName: form.clientName,
        address: {
          line1: form.line1,
          line2: form.line2,
          cityName: form.cityName,
          stateName: form.stateName,
          countryName: form.countryName,
        },
        mobile: form.mobile,
        email: form.email,
        website: form.website,
        sourcebyTypeOfClient: form.sourcebyTypeOfClient,
        sourceFrom: form.sourceFrom,
        assignBy: form.assignById || null,
        remark: form.remark,
      };

      await api.put(`${baseUrl.ACCOUNTMASTER}/${editMode.id}`, payload);
      await fetchAccounts();
      toast.success("Account updated successfully!");
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update account");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation - Only Mobile is required (Company Name is already HTML required)
    if (!validatePhone(form.mobile)) {
      toast.error("Mobile number must be exactly 12 digits (91 + 10 digits)");
      return;
    }
    
    // Optional field validations
    if (form.email && !validateEmail(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (form.website && !validateWebsite(form.website)) {
      toast.error("Please enter a valid website URL");
      return;
    }
    
    setConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (editMode.isEdit) {
      await handleUpdate();
    } else {
      try {
        const payload = {
          companyName: form.companyName,
          clientName: form.clientName,
          address: {
            line1: form.line1,
            line2: form.line2,
            cityName: form.cityName,
            stateName: form.stateName,
            countryName: form.countryName,
          },
          mobile: form.mobile,
          email: form.email,
          website: form.website,
          sourcebyTypeOfClient: form.sourcebyTypeOfClient,
          sourceFrom: form.sourceFrom,
          assignBy: form.assignById || null,
          remark: form.remark,
        };

        const response = await api.post(
          baseUrl.ACCOUNTMASTER,
          payload);

        const newAccount = response.data.data;
        fetchAccounts();
        toast.success("Account created successfully!");
        setOpen(false);
        resetForm();

      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Failed to create account"
        );
      }
    }
  };

  const downloadSampleExcel = async () => {
    try {
      const response = await api.get(`${baseUrl.ACCOUNTMASTER}/sample-excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AccountMaster_Sample.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Sample Excel downloaded!');
    } catch (error) {
      toast.error('Failed to download sample');
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get(`${baseUrl.ACCOUNTMASTER}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AccountMaster_Export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const exportNoLeadsToExcel = async () => {
    try {
      const response = await api.get(`${baseUrl.ACCOUNTMASTER}/export?noLeadsOnly=true`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AccountMaster_NoLeads_Export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('No leads data exported successfully!');
    } catch (error) {
      toast.error('Failed to export no leads data');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportConfirmDialog(true);
  };

  const confirmImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress(true);
    setImportConfirmDialog(false);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post(`${baseUrl.ACCOUNTMASTER}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const results = response.data.data;
      setImportResults(results);
      setImportResultDialog(true);
      
      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.success} records!`);
      }

      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import data');
    } finally {
      setImporting(false);
      setImportProgress(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadErrorExcel = () => {
    if (!importResults?.failedRecords || importResults.failedRecords.length === 0) return;

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Failed Records');

    sheet.columns = [
      { header: 'Row Number', key: 'rowNumber', width: 12 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Client Name', key: 'clientName', width: 20 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Website', key: 'website', width: 25 },
      { header: 'Issue', key: 'issue', width: 40 }
    ];

    importResults.failedRecords.forEach((record: any) => {
      sheet.addRow({
        rowNumber: record.rowNumber,
        companyName: record.companyName,
        clientName: record.clientName,
        mobile: record.mobile,
        email: record.email,
        website: record.website,
        issue: record.issue
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Failed_Records.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    });
  };


  return (
    <>
      <div className="mb-6 flex justify-end items-center">
        <div className="flex gap-3">
          <button
            onClick={() => setNoLeadsFilter(!noLeadsFilter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              noLeadsFilter
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {noLeadsFilter ? "Show All" : "No Leads Only"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setOpen(true);
              fetchStaff();
              fetchDropdowns();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
          
          <div className="relative">
            <button
              onClick={() => setExcelMenuOpen(!excelMenuOpen)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel Options
            </button>
            
            {excelMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setExcelMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        downloadSampleExcel();
                        setExcelMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span>Download Sample</span>
                    </button>
                    <button
                      onClick={() => {
                        exportToExcel();
                        setExcelMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4 text-blue-600" />
                      <span>Export Data</span>
                    </button>
                    <button
                      onClick={() => {
                        exportNoLeadsToExcel();
                        setExcelMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4 text-orange-600" />
                      <span>Export No Leads Only</span>
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setExcelMenuOpen(false);
                      }}
                      disabled={importing}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="h-4 w-4 text-purple-600" />
                      <span>{importing ? 'Importing...' : 'Import Data'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title="Account Master"
          data={accounts}
          pageSize={10}
          searchPlaceholder="Search company, client..."
          columns={columns}
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={setPage}
          onSearch={setSearch}
          initialSearch={search}
          rowClassName={(row) => {
            return row.sourcebyTypeOfClient?.isHighlight ? "bg-yellow-50 hover:bg-yellow-100" : "";
          }}
        />
      )}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editMode.isEdit ? "Edit Account" : "Add Account"}
        description={editMode.isEdit ? "Update account entry." : "Create new account entry."}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="border px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="account-form"
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              {editMode.isEdit ? "Update" : "Save"}
            </button>
          </div>
        }
      >
        <form
          id="account-form"
          onSubmit={handleSubmit}
          className="space-y-6 text-black"
        >
          {/* Basic Information */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Basic Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">Company Name</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Client Name</label>
                <input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Mobile</label>
                <input
                  required
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({ ...form, mobile: sanitizePhoneInput(e.target.value) })
                  }
                  maxLength={12}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                  placeholder="91XXXXXXXXXX (12 digits)"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value.toLowerCase().trim() })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                  placeholder="Enter email address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Website</label>
                <input
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value.trim() })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Address Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                placeholder="Address Line 1"
                value={form.line1}
                onChange={(e) =>
                  setForm({ ...form, line1: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
              />

              <input
                placeholder="Address Line 2"
                value={form.line2}
                onChange={(e) =>
                  setForm({ ...form, line2: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
              />

              <input
                placeholder="City"
                value={form.cityName}
                onChange={(e) =>
                  setForm({ ...form, cityName: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
              />

              <input
                placeholder="State"
                value={form.stateName}
                onChange={(e) =>
                  setForm({ ...form, stateName: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
              />

              <input
                placeholder="Country"
                value={form.countryName}
                onChange={(e) =>
                  setForm({ ...form, countryName: e.target.value })
                }
                className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Source */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Source
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">
                  Type of Client
                </label>
                <select
                  value={form.sourcebyTypeOfClient}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sourcebyTypeOfClient: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                >
                  <option value="">Select Type</option>
                  {clientTypes.map((type) => (
                    <option key={type._id} value={type._id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Source From
                </label>
                <select
                  value={form.sourceFrom}
                  onChange={(e) =>
                    setForm({ ...form, sourceFrom: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                >
                  <option value="">Select Source</option>
                  {sourceFroms.map((source) => (
                    <option key={source._id} value={source._id}>{source.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Assignment
            </h3>

            <div>
              <label className="text-sm text-gray-600">
                Assign Staff
              </label>
              <select
                value={form.assignById}
                onChange={(e) =>
                  setForm({ ...form, assignById: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
              >
                <option value="">Select Staff</option>
                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Remark */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Remark
            </h3>

            <div>
              <textarea
                value={form.remark}
                onChange={(e) =>
                  setForm({ ...form, remark: e.target.value })
                }
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white outline-none"
                placeholder="Enter remark"
              />
            </div>
          </div>
        </form>

      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={confirmSubmit}
        title={editMode.isEdit ? "Update Account" : "Add Account"}
        message={editMode.isEdit ? "Are you sure you want to update this account?" : "Are you sure you want to add this account?"}
        confirmText={editMode.isEdit ? "Update" : "Add"}
      />

      <ConfirmDialog
        open={importConfirmDialog}
        onClose={() => {
          setImportConfirmDialog(false);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onConfirm={confirmImport}
        title="Import Excel File"
        message={`Are you sure you want to import "${selectedFile?.name}"? This will add all records from the file.`}
        confirmText="Upload"
      />

      {importProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
              <p className="text-sm font-medium text-gray-700">Importing data, please wait...</p>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={importResultDialog}
        onClose={() => setImportResultDialog(false)}
        title="Import Results"
        description="Summary of import operation"
      >
        {importResults && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Total Records:</span>
                  <span className="font-semibold text-gray-900">{importResults.success + importResults.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Successfully Added:</span>
                  <span className="font-semibold text-green-900">{importResults.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-red-700">Failed:</span>
                  <span className="font-semibold text-red-900">{importResults.failed}</span>
                </div>
              </div>
            </div>

            {importResults.failed > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Failed Records:</h4>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                  {importResults.errors.map((error: string, index: number) => (
                    <p key={index} className="text-xs text-red-700">{error}</p>
                  ))}
                </div>
                <button
                  onClick={downloadErrorExcel}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Download className="h-4 w-4" />
                  Download Failed Records Excel
                </button>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}

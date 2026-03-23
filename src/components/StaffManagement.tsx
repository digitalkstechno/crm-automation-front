'use client';

import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import Select from 'react-select';

interface SalesExecutive {
  image?: string;
  fullName: string;
  number: string;
  email: string;
  password: string;
  status?: string;
  role?: string;
  id?: string | number;
  teams?: string[];
  organizations?: string[];
}

interface SalesExecutiveFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalesExecutive) => void;
  initialData?: SalesExecutive | null;
}

export default function SalesExecutiveForm({
  isOpen,
  onClose,
  onSubmit: parentOnSubmit,
  initialData,
}: SalesExecutiveFormProps) {

  const [formData, setFormData] = useState<SalesExecutive>({
    fullName: '',
    number: '',
    email: '',
    password: '',
    status: 'Active',
    role: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('No file chosen');

  // ✅ ADDED: preview image state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUpdate = !!initialData?.id;
  const [roles, setRoles] = useState<{ _id: string; roleName: string }[]>([]);
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
  const [organizations, setOrganizations] = useState<{ _id: string; name: string }[]>([]);
  const statusOptions = ['Active', 'Inactive', 'Pending'];
  const [token, setToken] = useState<string | null>(null);
  // Only run on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = getAuthToken();
      setToken(storedToken);
    }
  }, []);
  const resetForm = () => {
    setFormData({
      fullName: '',
      number: '',
      email: '',
      password: '',
      status: 'Active',
      role: '',
      teams: [],
      organizations: [],
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setFileName('No file chosen');
    setShowPassword(false);
    setError(null);
  };

  useEffect(() => {
    if (initialData?.id) {
      // 🟢 EDIT MODE
      setFormData({
        id: initialData.id,
        image: initialData.image,
        fullName: initialData.fullName || '',
        number: initialData.number || '',
        email: initialData.email || '',
        password: '',
        status: initialData.status || 'Active',
        role: initialData.role || '',
        teams: initialData.teams || [],
        organizations: initialData.organizations || [],
      });

      if (initialData.image) {
        setPreviewImage(
          `${process.env.NEXT_PUBLIC_IMAGE_URL}/images/StaffProfileImages/${initialData.image}`
        );
        setFileName('Current image');
      }
    } else {
      // 🔵 ADD MODE → RESET FORM
      resetForm();
    }
  }, [initialData]);


  useEffect(() => {
    const storedToken = getAuthToken();
    const headers = { Authorization: `Bearer ${storedToken}` };

    axios.get(baseUrl.getAllRoles, { headers })
      .then((res) => setRoles(res.data?.data || res.data?.roles || []))
      .catch(() => setRoles([]));

    axios.get(baseUrl.teams, { headers })
      .then((res) => setTeams(res.data?.data ?? []))
      .catch(() => setTeams([]));

    axios.get(baseUrl.organizations, { headers })
      .then((res) => setOrganizations(res.data?.data ?? []))
      .catch(() => setOrganizations([]));
  }, []);


  // ✅ UPDATED: handle image change with preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = new FormData();

      // Append text fields
      payload.append('fullName', formData.fullName);
      payload.append('phone', formData.number);
      payload.append('email', formData.email);
      payload.append('status', formData.status || 'Active');
      payload.append('role', formData.role || '');
      payload.append('teams', JSON.stringify(formData.teams || []));
      payload.append('organizations', JSON.stringify(formData.organizations || []));

      // Only send password when creating or when it's changed (not empty)
      if (formData.password.trim()) {
        payload.append('password', formData.password);
      }

      if (selectedFile) {
        payload.append('profileImage', selectedFile);
      }

      const response = isUpdate
        ? await axios.put(`${baseUrl.updateStaff}/${formData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        : await axios.post(baseUrl.addStaff, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

      parentOnSubmit?.(response.data);

      if (isUpdate) {
        toast.success('Staff updated successfully');
      } else {
        toast.success('Staff created successfully');
      }

      // ✅ reset only when creating
      if (!isUpdate) {
        resetForm();
      }

      onClose();

    } catch (err: any) {
      const message = err.response?.data?.message || 'Something went wrong';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isUpdate ? 'Edit User' : 'Add User'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 cursor-pointer rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="submit"
            form="sales-executive-form"
            className="px-4 py-2 cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? 'Saving...' : isUpdate ? 'Update' : 'Add'}
          </button>
        </>
      }
    >
      <form id="sales-executive-form" onSubmit={handleSubmit} className="space-y-6">

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ✅ IMAGE PREVIEW (ADDED, UI UNCHANGED) */}
        {previewImage && (
          <div className="flex justify-center">
            <img
              src={previewImage}
              alt="Preview"
              className="h-24 w-24 rounded-full object-cover border"
            />
          </div>
        )}

        {/* IMAGE UPLOAD */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Image <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <span className="inline-flex items-center rounded-lg border px-4 py-2.5 text-sm">
                Choose File
              </span>
            </label>
            <span className="text-sm text-gray-500">{fileName}</span>
          </div>
        </div>

        {/* Full Name + Mobile */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter mobile number"
            />
          </div>
        </div>

        {/* Email + Password */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {isUpdate ? 'New Password (optional)' : 'Password'} <span className="text-red-500">*</span>
              {!isUpdate && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isUpdate}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={isUpdate ? 'Leave blank to keep current' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status + Role */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Teams + Organizations */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Teams</label>
            <Select
              isMulti
              options={teams.map((t) => ({ value: t._id, label: t.name }))}
              value={teams
                .filter((t) => (formData.teams || []).includes(t._id))
                .map((t) => ({ value: t._id, label: t.name }))}
              onChange={(selected) =>
                setFormData({ ...formData, teams: selected.map((s) => s.value) })
              }
              placeholder="Select teams..."
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Organizations</label>
            <Select
              isMulti
              options={organizations.map((o) => ({ value: o._id, label: o.name }))}
              value={organizations
                .filter((o) => (formData.organizations || []).includes(o._id))
                .map((o) => ({ value: o._id, label: o.name }))}
              onChange={(selected) =>
                setFormData({ ...formData, organizations: selected.map((s) => s.value) })
              }
              placeholder="Select organizations..."
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}

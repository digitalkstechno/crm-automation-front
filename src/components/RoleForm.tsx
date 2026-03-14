'use client';

import { useEffect, useState } from 'react';
import Dialog from './Dialog';

type CapabilityKey = 'create' | 'readOwn' | 'readAll' | 'update' | 'delete';
type CapabilitySet = Record<CapabilityKey, boolean>;

interface Role {
  roleName: string;
  permissions: Record<string, CapabilitySet>;
}

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (role: any) => void | Promise<void>;
  initialData?: any;
}

export default function RoleForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: RoleFormProps) {
  type Feature = 'lead' | 'setup';
  const features: Feature[] = ['lead', 'setup'];
  const defaultCaps: CapabilitySet = {
    create: false,
    readOwn: false,
    readAll: false,
    update: false,
    delete: false,
  };
  
  const initialPermissions: Record<Feature, CapabilitySet> = features.reduce((acc, f) => {
    acc[f] = { ...defaultCaps };
    return acc;
  }, {} as Record<Feature, CapabilitySet>);
const sanitizeCaps = (caps?: Partial<CapabilitySet>): CapabilitySet => ({
  create: !!caps?.create,
  readOwn: !!caps?.readOwn,
  readAll: !!caps?.readAll,
  update: !!caps?.update,
  delete: !!caps?.delete,
});

type RawRole = {
  roleName?: string;
  permissions?: Record<string, Partial<CapabilitySet>> | Array<Record<string, Partial<CapabilitySet>>>;
};

const normalizePermissions = (data?: RawRole | null) => {
  const base: Record<Feature, CapabilitySet> = {
    lead: { ...defaultCaps },
    setup: { ...defaultCaps },
  };

  if (!data?.permissions) return base;

  const raw = Array.isArray(data.permissions)
    ? data.permissions[0]
    : data.permissions;

  (Object.keys(base) as Feature[]).forEach((feature) => {
    base[feature] = {
      ...base[feature],
      ...(raw?.[feature] || {}),
    };
  });

  return base;
};

const [formData, setFormData] = useState<Role>({
  roleName: '',
    permissions: normalizePermissions(),
});

 
useEffect(() => {
  if (!initialData) return;

  const rawPerms: unknown = (initialData as unknown as { permissions?: unknown }).permissions;
  const perms = Array.isArray(rawPerms)
    ? (rawPerms[0] as Record<string, Partial<CapabilitySet>>)
    : (rawPerms as Record<string, Partial<CapabilitySet>>);

  console.log('RoleForm: initialData received', initialData);
  console.log('RoleForm: rawPerms parsed', rawPerms);
  console.log('RoleForm: perms object used', perms);

  setFormData({
    roleName: initialData.roleName || '',
    permissions: features.reduce((acc, f) => {
      acc[f] = sanitizeCaps(perms?.[f]);
      return acc;
    }, {} as Record<Feature, CapabilitySet>),
  });
}, [initialData, isOpen]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const toggleCapability = (feature: Feature, capability: CapabilityKey) => {
    setFormData((prev) => {
      const current = prev.permissions[feature] || defaultCaps;
      const nextValue = !current[capability];
      let nextCaps: CapabilitySet = { ...current, [capability]: nextValue };
      if (capability === 'readAll' && nextValue) {
        nextCaps = { ...nextCaps, readOwn: false };
      }
      if (capability === 'readOwn' && nextValue) {
        nextCaps = { ...nextCaps, readAll: false };
      }
      console.log('RoleForm: toggle', { feature, capability, nextCaps });
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [feature]: nextCaps,
        },
      };
    });
  };

  useEffect(() => {
  if (!initialData) return;

  setFormData({
    roleName: initialData.roleName || '',
    permissions: features.reduce((acc, f) => {
      acc[f] = sanitizeCaps(initialData.permissions?.[f]);
      return acc;
    }, {} as Record<string, CapabilitySet>),
  });
}, [initialData, isOpen]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Role: ${initialData.roleName}` : "Add New Role"}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="role-form"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {initialData ? 'Update' : 'Save'}
          </button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.roleName}
            onChange={(e) =>
              setFormData({ ...formData, roleName: e.target.value })
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Enter role name"
          />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Permissions</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <div className="col-span-5">Features</div>
              <div className="col-span-7">Capabilities</div>
            </div>
            <div>
              {features.map((feature) => {
                const caps = formData.permissions[feature] || defaultCaps;
                return (
                  <div key={feature} className="grid grid-cols-12 items-center border-t border-gray-200 px-4 py-4">
                    <div className="col-span-5 text-gray-800">{feature}</div>
                    <div className="col-span-7">
                      <div className="flex flex-wrap gap-4">
                        {(['readAll', 'readOwn', 'create', 'update', 'delete'] as CapabilityKey[]).map((cap) => (
                          <label key={cap} className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={caps[cap]}
                              onChange={() => toggleCapability(feature, cap)}
                              className="h-4 w-4 rounded border-gray-300 text-sky-950 focus:ring-sky-200"
                            />
                            <span>
                              {cap === 'readAll'
                                ? 'View ( Global )'
                                : cap === 'readOwn'
                                ? 'View ( Own )'
                                : cap === 'create'
                                ? 'Create'
                                : cap === 'update'
                                ? 'Update'
                                : 'Delete'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, CheckCircle2, Circle } from 'lucide-react';

const LEAD_FIELDS = [
  { id: 'fullName', label: 'Full Name' },
  { id: 'companyName', label: 'Company Name' },
  { id: 'address', label: 'Address' },
  { id: 'contact', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'leadSource', label: 'Source' },
  { id: 'leadStatus', label: 'Status' },
  { id: 'assignedTo', label: 'Assigned Staff' },
  { id: 'priority', label: 'Priority' },
  { id: 'labels', label: 'Lead Labels' },
];

const TASK_FIELDS = [
  { id: 'subject', label: 'Subject' },
  { id: 'description', label: 'Description' },
  { id: 'startDate', label: 'Start Date' },
  { id: 'endDate', label: 'End Date' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'assignedTeams', label: 'Assign Teams' },
  { id: 'assignedUsers', label: 'Assign Users' },
];

import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

export function FieldSettingsContent() {
  const [requiredLeads, setRequiredLeads] = useState<string[]>([]);
  const [requiredTasks, setRequiredTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${getAuthToken()}` });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl.getBaseUrl}/settings`, { headers: getHeaders() });
        const data = res.data?.data || {};
        
        if (data.leadRequiredFields) {
          setRequiredLeads(data.leadRequiredFields);
        } else {
          setRequiredLeads(['fullName', 'contact', 'email', 'leadSource', 'leadStatus', 'assignedTo']);
        }

        if (data.taskRequiredFields) {
          setRequiredTasks(data.taskRequiredFields);
        } else {
          setRequiredTasks(['subject', 'status', 'priority']);
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
        // Fallback to localStorage or defaults
        const savedLeads = localStorage.getItem('leadRequiredFields');
        const savedTasks = localStorage.getItem('taskRequiredFields');
        if (savedLeads) setRequiredLeads(JSON.parse(savedLeads));
        if (savedTasks) setRequiredTasks(JSON.parse(savedTasks));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleLead = (id: string) => {
    setRequiredLeads(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleToggleTask = (id: string) => {
    setRequiredTasks(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      await axios.post(`${baseUrl.getBaseUrl}/settings`, {
        settings: {
          leadRequiredFields: requiredLeads,
          taskRequiredFields: requiredTasks
        }
      }, { headers: getHeaders() });
      
      // Also update localStorage for immediate offline access if needed
      localStorage.setItem('leadRequiredFields', JSON.stringify(requiredLeads));
      localStorage.setItem('taskRequiredFields', JSON.stringify(requiredTasks));
      
      toast.success('Field requirements saved successfully');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('fieldSettingsUpdated'));
    } catch (e) {
      console.error('Failed to save settings:', e);
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Field Settings</h2>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Select the fields that should be mandatory (required) in the "Add Lead" and "Add Task" forms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lead Fields */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            Add Lead Required Fields
          </h3>
          <div className="space-y-2">
            {LEAD_FIELDS.map(field => (
              <label
                key={field.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  requiredLeads.includes(field.id)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{field.label}</span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={requiredLeads.includes(field.id)}
                  onChange={() => handleToggleLead(field.id)}
                />
                {requiredLeads.includes(field.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Task Fields */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            Add Task Required Fields
          </h3>
          <div className="space-y-2">
            {TASK_FIELDS.map(field => (
              <label
                key={field.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  requiredTasks.includes(field.id)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{field.label}</span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={requiredTasks.includes(field.id)}
                  onChange={() => handleToggleTask(field.id)}
                />
                {requiredTasks.includes(field.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldSettings() {
  return <FieldSettingsContent />;
}

'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { Settings, Plus, Trash2, Edit2, Save } from 'lucide-react';
import FormInput from '@/components/ui/Input';

type Rule = {
  keyword: string;
  template: string;
  lang: string;
  parameters: string[];
};

type WhatsappConfig = {
  apiBaseUrl: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
};

export function WhatsappSettingsContent() {
  const [loading, setLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // WhatsApp Configuration State
  const [config, setConfig] = useState<WhatsappConfig>({
    apiBaseUrl: 'https://crmapi.crmbot.in/api/meta/v19.0',
    phoneNumberId: '730141010176205',
    accessToken: 'YOUR_CRMBOT_AUTHORIZATION_TOKEN_HERE',
    verifyToken: 'MySecretToken123',
  });

  // Keyword rules list state
  const [rules, setRules] = useState<Rule[]>([]);

  // Add rule form state
  const [newRule, setNewRule] = useState<{
    keyword: string;
    template: string;
    lang: string;
    parametersRaw: string;
  }>({
    keyword: '',
    template: '',
    lang: 'en',
    parametersRaw: '{{leadName}}, Campaign Inquiry',
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Fetch settings from MongoDB
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(baseUrl.settings, { headers });
      const settingsMap = res.data?.data || {};

      // Load config if exists
      if (settingsMap.whatsapp_config) {
        setConfig(prev => ({
          ...prev,
          ...settingsMap.whatsapp_config
        }));
      }

      // Load rules if exists
      if (settingsMap.whatsapp_keyword_rules) {
        const dbRules = settingsMap.whatsapp_keyword_rules;
        const parsedRules: Rule[] = Object.entries(dbRules).map(([key, val]: [string, any]) => ({
          keyword: key,
          template: val.template || '',
          lang: val.lang || 'en',
          parameters: val.parameters || [],
        }));
        setRules(parsedRules);
      }
    } catch (err: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  // Save Credentials (whatsapp_config)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await axios.post(
        baseUrl.settings,
        {
          settings: {
            whatsapp_config: config,
          },
        },
        { headers }
      );
      toast.success('WhatsApp credentials updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update credentials');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Convert Rules array back to object format expected by MongoDB (e.g. { keyword: { template, lang, parameters } })
  const saveRulesToDB = async (updatedRules: Rule[]) => {
    setIsSavingRules(true);
    try {
      const rulesPayload: Record<string, { template: string; lang: string; parameters: string[] }> = {};
      updatedRules.forEach(rule => {
        rulesPayload[rule.keyword.trim().toLowerCase()] = {
          template: rule.template.trim(),
          lang: rule.lang.trim() || 'en',
          parameters: rule.parameters,
        };
      });

      await axios.post(
        baseUrl.settings,
        {
          settings: {
            whatsapp_keyword_rules: rulesPayload,
          },
        },
        { headers }
      );
      toast.success('Keyword reply rules saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save rules');
    } finally {
      setIsSavingRules(false);
    }
  };

  // Add rule helper
  const handleAddRule = async () => {
    const kw = newRule.keyword.trim().toLowerCase();
    const temp = newRule.template.trim();
    if (!kw || !temp) {
      toast.warn('Please fill in both Keyword and Template name.');
      return;
    }

    // Check duplicate
    if (rules.some(r => r.keyword === kw)) {
      toast.warn(`Rule for keyword "${kw}" already exists.`);
      return;
    }

    const newRuleObj: Rule = {
      keyword: kw,
      template: temp,
      lang: newRule.lang.trim() || 'en',
      parameters: newRule.parametersRaw
        ? newRule.parametersRaw.split(',').map(p => p.trim())
        : [],
    };

    const updated = [...rules, newRuleObj];
    setRules(updated);
    await saveRulesToDB(updated);

    // Reset Form
    setNewRule({
      keyword: '',
      template: '',
      lang: 'en',
      parametersRaw: '{{leadName}}, Campaign Inquiry',
    });
  };

  // Remove rule helper
  const handleDeleteRule = async (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
    await saveRulesToDB(updated);
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500 animate-pulse">
        Loading WhatsApp Settings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          WhatsApp Webhook & Auto-Reply Settings
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure API credentials, webhook tokens, and keyword-triggered templates for campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: API Config */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">CRMBot API Credentials</h2>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <FormInput
                label="API Base URL"
                name="apiBaseUrl"
                value={config.apiBaseUrl}
                onChange={e => setConfig({ ...config, apiBaseUrl: e.target.value })}
                required
                placeholder="https://crmapi.crmbot.in/api/meta/v19.0"
              />
              <FormInput
                label="Phone Number ID"
                name="phoneNumberId"
                value={config.phoneNumberId}
                onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })}
                required
                placeholder="730141010176205"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authorization Access Token</label>
                <textarea
                  value={config.accessToken}
                  onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                  required
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Paste your Meta/CRMBot token here"
                />
              </div>
              <FormInput
                label="Webhook Handshake Verification Token"
                name="verifyToken"
                value={config.verifyToken}
                onChange={e => setConfig({ ...config, verifyToken: e.target.value })}
                required
                placeholder="MySecretToken123"
              />
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {isSavingConfig ? 'Saving...' : 'Save API Credentials'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-sm text-blue-950">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Meta Webhook Setup Instructions</h3>
            <p className="mb-2">In the Facebook App / Meta Developer Portal:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Navigate to **WhatsApp** &rarr; **Configuration**.</li>
              <li>Click **Edit** Webhook URL.</li>
              <li>Set Callback URL to: <br /><code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs border border-blue-200">https://yourdomain.com/v1/api/whatsapp-webhook/webhook</code></li>
              <li>Set Verify Token to: <br /><code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs border border-blue-200">{config.verifyToken || 'MySecretToken123'}</code></li>
              <li>Under Webhook Fields, subscribe to **`messages`**.</li>
            </ol>
          </div>
        </div>

        {/* Right column: Reply Rules List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Keyword Reply Templates Map</h2>

            {/* Add Rule Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6">
              <FormInput
                label="Trigger Keyword"
                name="keyword"
                value={newRule.keyword}
                onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                placeholder="e.g. price"
              />
              <FormInput
                label="Template Name"
                name="template"
                value={newRule.template}
                onChange={e => setNewRule({ ...newRule, template: e.target.value })}
                placeholder="e.g. price_details"
              />
              <FormInput
                label="Language Code"
                name="lang"
                value={newRule.lang}
                onChange={e => setNewRule({ ...newRule, lang: e.target.value })}
                placeholder="en"
              />
              <FormInput
                label="Parameters (Comma-separated)"
                name="parametersRaw"
                value={newRule.parametersRaw}
                onChange={e => setNewRule({ ...newRule, parametersRaw: e.target.value })}
                placeholder="e.g. {{leadName}}, campaign_val"
              />
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={isSavingRules}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add/Save Rule
                </button>
              </div>
            </div>

            {/* Rules Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 font-semibold">
                    <th className="px-4 py-2.5 text-left">Keyword</th>
                    <th className="px-4 py-2.5 text-left">Template</th>
                    <th className="px-4 py-2.5 text-left">Language</th>
                    <th className="px-4 py-2.5 text-left">Parameters</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">
                        No keyword rules defined yet. System will use default rules (hello, price, interested).
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-800">{rule.keyword}</td>
                        <td className="px-4 py-3 text-slate-700">{rule.template}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{rule.lang}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {rule.parameters.length > 0 ? (
                            <span className="flex flex-wrap gap-1">
                              {rule.parameters.map((p, pIdx) => (
                                <code key={pIdx} className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                                  {p}
                                </code>
                              ))}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete Rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatsappSettingsPage() {
  return <WhatsappSettingsContent />;
}

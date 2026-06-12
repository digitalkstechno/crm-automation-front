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
  bodyText?: string;
};

type WhatsappConfig = {
  apiBaseUrl: string;
  phoneNumberId: string;
  wabaId: string;
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
    wabaId: '',
    accessToken: 'YOUR_CRMBOT_AUTHORIZATION_TOKEN_HERE',
    verifyToken: 'MySecretToken123',
  });

  // Keyword rules list state
  const [rules, setRules] = useState<Rule[]>([]);

  // Synced Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string>('');
  const [isManual, setIsManual] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [customParamCount, setCustomParamCount] = useState<number>(0);
  const [paramValues, setParamValues] = useState<string[]>([]);

  // Add/Edit rule form state
  const [newRule, setNewRule] = useState<{
    keyword: string;
    template: string;
    lang: string;
    bodyText: string;
    parametersRaw: string;
  }>({
    keyword: '',
    template: '',
    lang: 'en',
    bodyText: '',
    parametersRaw: '',
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
          bodyText: val.bodyText || '',
        }));
        setRules(parsedRules);
      }
    } catch (err: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates from Meta/CRMBot API via Backend (using the direct API URL base endpoint)
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setTemplateError('');
      const getBaseUrl = baseUrl.getBaseUrl || '';
      const res = await axios.get(`${getBaseUrl}whatsapp-webhook/templates`, { headers });
      if (res.data?.success) {
        setTemplates(res.data.templates || []);
        if (res.data.isFallback && res.data.error) {
          setTemplateError(res.data.error);
        }
      }
    } catch (err: any) {
      console.error('Failed to sync templates:', err);
      setTemplateError('Failed to communicate with the WhatsApp settings backend.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
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
      // Instantly sync templates
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update credentials');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Convert Rules array back to object format expected by MongoDB
  const saveRulesToDB = async (updatedRules: Rule[]) => {
    setIsSavingRules(true);
    try {
      const rulesPayload: Record<string, { template: string; lang: string; parameters: string[]; bodyText: string }> = {};
      updatedRules.forEach(rule => {
        rulesPayload[rule.keyword.trim()] = {
          template: rule.template.trim(),
          lang: rule.lang.trim() || 'en',
          parameters: rule.parameters,
          bodyText: rule.bodyText || '',
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

  // Handle template selection
  const handleTemplateSelect = (val: string) => {
    setSelectedTemplateName(val);
    if (val === 'custom') {
      setIsManual(true);
      setNewRule(prev => ({ ...prev, template: '', lang: 'en', bodyText: '' }));
      setCustomParamCount(0);
      setParamValues([]);
    } else if (val === '') {
      setIsManual(false);
      setParamValues([]);
      setNewRule(prev => ({ ...prev, template: '', lang: 'en', bodyText: '' }));
    } else {
      setIsManual(false);
      const tplObj = templates.find(t => t.name === val);
      if (tplObj) {
        const count = tplObj.parametersCount || 0;
        setParamValues(Array(count).fill(''));
        setNewRule(prev => ({ ...prev, template: tplObj.name, lang: tplObj.language || 'en', bodyText: tplObj.bodyText || '' }));
      }
    }
  };

  // Handle custom body text change, parse variable count, and dynamically resize parameters
  const handleCustomBodyTextChange = (text: string) => {
    setNewRule(prev => ({ ...prev, bodyText: text }));
    // Parse matches of {{number}}
    const matches = text.match(/\{\{\d+\}\}/g);
    let count = 0;
    if (matches) {
      const indexes = matches.map(m => parseInt(m.replace(/[^0-9]/g, ""), 10));
      count = Math.max(...indexes, 0);
    }
    setCustomParamCount(count);
    setParamValues(prev => {
      const updated = [...prev];
      if (updated.length < count) {
        while (updated.length < count) {
          updated.push('');
        }
      } else if (updated.length > count) {
        return updated.slice(0, count);
      }
      return updated;
    });
  };

  // Insert variable tags into selected parameter input
  const handleInsertVar = (paramIdx: number, varName: string) => {
    setParamValues(prev => {
      const updated = [...prev];
      updated[paramIdx] = (updated[paramIdx] || "") + varName;
      return updated;
    });
  };

  // Get dynamic preview text
  const getPreviewText = () => {
    let tplName = isManual ? (newRule.template || '(Template Name)') : selectedTemplateName;
    if (!tplName) return "Please choose a template or configure a custom one to preview.";

    let text = "";
    if (isManual) {
      text = newRule.bodyText || "";
    } else {
      const currentTemplate = templates.find(t => t.name === selectedTemplateName);
      if (!currentTemplate) return "Please select a template to see details.";
      text = currentTemplate.bodyText || "";
    }

    let preview = text;
    paramValues.forEach((val, idx) => {
      const placeholder = `{{${idx + 1}}}`;
      preview = preview.replaceAll(placeholder, val || placeholder);
    });
    return preview;
  };

  // Add or Update rule helper
  const handleAddRule = async () => {
    const kw = newRule.keyword.trim();
    let tplName = isManual ? newRule.template.trim() : selectedTemplateName;
    let tplLang = isManual ? (newRule.lang.trim() || 'en') : 'en';
    let tplBodyText = "";

    if (isManual) {
      tplBodyText = newRule.bodyText.trim();
    } else if (tplName) {
      const tplObj = templates.find(t => t.name === tplName);
      if (tplObj) {
        if (tplObj.language) tplLang = tplObj.language;
        if (tplObj.bodyText) tplBodyText = tplObj.bodyText;
      }
    }

    if (!kw || !tplName) {
      toast.warn('Please fill in both Trigger Keyword and Template Name.');
      return;
    }

    // Check duplicate case-insensitively (exclude current editing index)
    const duplicateIndex = rules.findIndex(r => r.keyword.trim().toLowerCase() === kw.toLowerCase());
    if (duplicateIndex !== -1 && duplicateIndex !== editingIndex) {
      toast.warn(`Rule for keyword "${kw}" already exists.`);
      return;
    }

    const ruleObj: Rule = {
      keyword: kw,
      template: tplName,
      lang: tplLang,
      parameters: paramValues,
      bodyText: tplBodyText,
    };

    let updated: Rule[] = [];
    if (editingIndex !== null) {
      updated = [...rules];
      updated[editingIndex] = ruleObj;
      setEditingIndex(null);
      toast.success('Rule updated successfully!');
    } else {
      updated = [...rules, ruleObj];
      toast.success('Rule added successfully!');
    }

    setRules(updated);
    await saveRulesToDB(updated);

    // Reset Form
    setNewRule({
      keyword: '',
      template: '',
      lang: 'en',
      bodyText: '',
      parametersRaw: '',
    });
    setSelectedTemplateName('');
    setParamValues([]);
    setIsManual(false);
    setCustomParamCount(0);
  };

  // Edit rule helper
  const handleEditRule = (index: number) => {
    const rule = rules[index];
    setEditingIndex(index);

    const tplExists = templates.some(t => t.name === rule.template);

    setNewRule({
      keyword: rule.keyword,
      template: rule.template,
      lang: rule.lang,
      bodyText: rule.bodyText || '',
      parametersRaw: '',
    });

    if (tplExists) {
      setIsManual(false);
      setSelectedTemplateName(rule.template);
      setParamValues(rule.parameters);
    } else {
      setIsManual(true);
      setSelectedTemplateName('custom');
      setCustomParamCount(rule.parameters.length);
      setParamValues(rule.parameters);
    }
  };

  // Cancel edit helper
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewRule({
      keyword: '',
      template: '',
      lang: 'en',
      bodyText: '',
      parametersRaw: '',
    });
    setSelectedTemplateName('');
    setParamValues([]);
    setIsManual(false);
    setCustomParamCount(0);
  };

  // Remove rule helper
  const handleDeleteRule = async (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
    await saveRulesToDB(updated);
    if (editingIndex === index) {
      handleCancelEdit();
    }
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
              <FormInput
                label="WhatsApp Business Account ID (WABA ID) - Optional"
                name="wabaId"
                value={config.wabaId || ''}
                onChange={e => setConfig({ ...config, wabaId: e.target.value })}
                placeholder="Enter WABA ID if auto-sync fails (e.g. 234123456789012)"
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

          {/* Webhook Setup Instructions block removed per user request */}
        </div>

        {/* Right column: Reply Rules List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingIndex !== null ? '✏️ Edit Keyword Reply Rule' : '🆕 Add Keyword Reply Rule'}
            </h2>

            {/* Tabs selection removed to prioritize Synced Meta Templates */}

            {/* Add/Edit Rule Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6">
              <FormInput
                label="Trigger Keyword"
                name="keyword"
                value={newRule.keyword}
                onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                placeholder="e.g. price"
              />

              {!isManual ? (
                /* Synced Template Mode */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select WhatsApp Template</label>
                  <select
                    value={selectedTemplateName}
                    onChange={e => handleTemplateSelect(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map((t, index) => (
                      <option key={`${t.name}-${index}`} value={t.name}>
                        {t.name} ({t.language})
                      </option>
                    ))}
                  </select>
                  {templateError ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-2 text-[10px] mt-1.5 leading-relaxed">
                      ⚠️ <strong>Sync Warning:</strong> {templateError}
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-[10px] text-amber-600 mt-1">
                      ⚠️ No synced templates found. Please check your credentials configuration.
                    </p>
                  ) : null}
                </div>
              ) : (
                /* Custom/Manual Template Mode */
                <>
                  <FormInput
                    label="Custom Template Name"
                    name="template"
                    value={newRule.template}
                    onChange={e => setNewRule({ ...newRule, template: e.target.value })}
                    placeholder="e.g. order_data"
                  />
                  <FormInput
                    label="Language Code"
                    name="lang"
                    value={newRule.lang}
                    onChange={e => setNewRule({ ...newRule, lang: e.target.value })}
                    placeholder="en"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message Body Text</label>
                    <textarea
                      value={newRule.bodyText}
                      onChange={e => handleCustomBodyTextChange(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                      placeholder="e.g. Hello {{1}}, thank you for buying {{2}}! Your order status is {{3}}."
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      💡 Tip: Write your message text. Use <code>{"{{"}1{"}}"}</code>, <code>{"{{"}2{"}}"}</code>, etc. to mark parameter placeholders. Inputs for each placeholder will appear automatically.
                    </p>
                    {(newRule.bodyText.includes('{{leadName}}') || newRule.bodyText.includes('{{contact}}')) && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-2.5 text-xs mt-1.5 leading-relaxed">
                        <strong>⚠️ Format Warning:</strong> Do not write <code>{"{{"}leadName{"}}"}</code> or <code>{"{{"}contact{"}}"}</code> directly in the template text. Meta WhatsApp templates only accept numeric placeholders like <code>{"{{"}1{"}}"}</code>. Please write <code>{"{{"}1{"}}"}</code> in the template text above, and set its value to Customer Name or Phone Number in the parameter section below.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Template Text / Structure Preview */}
              {(selectedTemplateName || (isManual && newRule.template)) ? (
                <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-900 shadow-sm">
                  <span className="font-bold text-sm block mb-2 text-blue-950">Template Message Preview:</span>
                  <pre className="whitespace-pre-wrap font-sans bg-white border border-blue-200 p-3 rounded-md text-slate-800 leading-relaxed max-h-48 overflow-y-auto shadow-inner text-sm">
                    {getPreviewText()}
                  </pre>
                </div>
              ) : (
                <div className="md:col-span-2 border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 text-sm">
                  Please select a WhatsApp template from the dropdown above to view the message preview and configure parameters.
                </div>
              )}

              {/* Individual parameter inputs */}
              {paramValues.length > 0 && (
                <div className="md:col-span-2 space-y-3.5 pt-2 border-t border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Configure Parameter Values</h3>
                  {paramValues.map((val, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-gray-700">
                          Parameter {idx + 1} ({"{{"}{idx + 1}{"}}"})
                        </label>
                        <span className="text-[10px] text-gray-400">Values can be raw text or dynamics tags</span>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={e => {
                          const updated = [...paramValues];
                          updated[idx] = e.target.value;
                          setParamValues(updated);
                        }}
                        placeholder={`Enter parameter value for {{${idx + 1}}}`}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-gray-500 font-medium">Auto tags:</span>
                        <button
                          type="button"
                          onClick={() => handleInsertVar(idx, '{{leadName}}')}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Customer Name
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertVar(idx, '{{contact}}')}
                          className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Phone Number
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertVar(idx, '{{orderId}}')}
                          className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                          title="Generate a random Order ID (e.g. ORD-123456)"
                        >
                          Order ID (Random)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form buttons */}
              <div className="md:col-span-2 flex justify-end gap-2">
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={isSavingRules}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {editingIndex !== null ? (
                    <>
                      <Save className="h-4 w-4" />
                      Update Rule
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Rule
                    </>
                  )}
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
                      <tr key={`${rule.keyword}-${idx}`} className="hover:bg-slate-50 transition-colors">
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
                          <div className="flex justify-center items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRule(idx)}
                              className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer"
                              title="Edit Rule"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(idx)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Delete Rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

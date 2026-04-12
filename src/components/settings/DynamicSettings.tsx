import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Save, Settings as SettingsIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

interface SettingField {
  value: any;
  type: string;
  label: string;
  description: string;
  input_type: string;
  options: string[] | null;
  option_labels: Record<string, string> | null;
  is_editable: boolean;
  is_public: boolean;
  sort_order: number;
  visible_when: string | null;
  visible_when_value: any;
  in_db: boolean;
}

interface DynamicSettingsProps {
  group: string;
  title?: string;
  description?: string;
}

const DynamicSettings: React.FC<DynamicSettingsProps> = ({ group, title, description }) => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', group],
    queryFn: async () => {
      const res = await api.get(`/settings/${group}`);
      return res.data.data as Record<string, SettingField>;
    },
  });

  // Initialize values from fetched data
  useEffect(() => {
    if (data) {
      const vals: Record<string, any> = {};
      Object.entries(data).forEach(([key, setting]) => {
        vals[key] = setting.value;
      });
      setValues(vals);
      setHasChanges(false);
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Only send changed values
      const changed: Record<string, any> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (data && data[key] && data[key].value !== value) {
          changed[key] = value;
        }
      });

      if (Object.keys(changed).length === 0) {
        throw new Error('No changes to save');
      }

      const res = await api.put(`/settings/${group}`, changed);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`${title || group} settings saved successfully`);
      queryClient.invalidateQueries({ queryKey: ['settings', group] });
      setHasChanges(false);
    },
    onError: (err: any) => {
      if (err.message === 'No changes to save') {
        toast.error('No changes to save');
        return;
      }
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleChange = useCallback((key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation, values]);

  const handleReset = useCallback(() => {
    if (data) {
      const vals: Record<string, any> = {};
      Object.entries(data).forEach(([key, setting]) => {
        vals[key] = setting.value;
      });
      setValues(vals);
      setHasChanges(false);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-500">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Failed to load settings</h4>
            <p className="text-sm text-red-700 mt-1">
              {(error as any)?.response?.data?.message || 'An error occurred while loading settings.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">No settings found</h4>
            <p className="text-sm text-yellow-700 mt-1">
              No settings group '{group}' found. Add config/settings/{group}.php in backend.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sort fields by sort_order
  const sortedFields = Object.entries(data).sort(
    ([, a], [, b]) => a.sort_order - b.sort_order
  );

  return (
    <div className="space-y-6">
      {/* Header with Save/Reset buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title || group}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>

        {hasChanges && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saveMutation.isPending}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Settings Fields */}
      <div className="space-y-4">
        {sortedFields.map(([key, field]) => {
          // Check visibility conditions
          if (field.visible_when && values[field.visible_when] !== field.visible_when_value) {
            return null;
          }

          return (
            <div
              key={key}
              className={`bg-white rounded-lg border p-4 transition-all ${
                !field.is_editable ? 'opacity-60 bg-gray-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {field.label}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                  )}
                  {field.in_db && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Custom value
                    </span>
                  )}
                </div>

                <div className="ml-4">
                  <FieldInput
                    type={field.input_type}
                    value={values[key]}
                    options={field.options}
                    optionLabels={field.option_labels}
                    onChange={(val) => handleChange(key, val)}
                    disabled={!field.is_editable}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Field Input Component
const FieldInput: React.FC<{
  type: string;
  value: any;
  options: string[] | null;
  optionLabels: Record<string, string> | null;
  onChange: (value: any) => void;
  disabled: boolean;
}> = ({ type, value, options, optionLabels, onChange, disabled }) => {
  const getLabel = (option: string) => {
    return optionLabels?.[option] || option;
  };

  switch (type) {
    case 'switch':
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {options?.map(opt => (
            <option key={opt} value={opt}>{getLabel(opt)}</option>
          ))}
        </select>
      );

    case 'radio':
      return (
        <div className="flex gap-3">
          {options?.map(opt => (
            <label
              key={opt}
              className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                value === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`radio-${opt}`}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-sm font-medium">{getLabel(opt)}</span>
            </label>
          ))}
        </div>
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={disabled}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      );

    case 'email':
      return (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      );

    case 'text':
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      );
  }
};

export default DynamicSettings;

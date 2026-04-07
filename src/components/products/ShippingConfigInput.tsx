import React, { useState, useEffect } from 'react';
import { Truck, Package } from 'lucide-react';

interface ShippingZoneConfig {
  shipping: number | null;
  cod: number | null;
}

interface ShippingConfig {
  zones?: Record<string, ShippingZoneConfig>;
}

interface ShippingConfigInputProps {
  value: ShippingConfig;
  onChange: (config: ShippingConfig) => void;
  disabled?: boolean;
}

const ZONES = ['A', 'B', 'C', 'D', 'E'] as const;

const ZONE_NAMES: Record<string, string> = {
  A: 'Same City',
  B: 'Same State',
  C: 'Metro Cities',
  D: 'Rest of India',
  E: 'Remote Areas',
};

function isAllZonesFree(zones?: Record<string, ShippingZoneConfig>): boolean {
  if (!zones) return true;
  return ZONES.every(z => (zones[z]?.shipping ?? 0) === 0);
}

export function ShippingConfigInput({ value, onChange, disabled }: ShippingConfigInputProps) {
  const [mode, setMode] = useState<'free' | 'fixed'>(() => isAllZonesFree(value.zones) ? 'free' : 'fixed');
  const [freeCod, setFreeCod] = useState<number>(() => {
    const firstZone = value.zones?.['A'];
    return firstZone?.cod ?? 0;
  });

  const handleModeChange = (newMode: 'free' | 'fixed') => {
    setMode(newMode);
    if (newMode === 'free') {
      const zones: Record<string, ShippingZoneConfig> = {};
      ZONES.forEach(zone => {
        zones[zone] = { shipping: 0, cod: freeCod || 0 };
      });
      onChange({ zones });
    }
  };

  const handleFreeCodChange = (cod: number) => {
    setFreeCod(cod);
    const zones: Record<string, ShippingZoneConfig> = {};
    ZONES.forEach(zone => {
      zones[zone] = { shipping: 0, cod: cod || 0 };
    });
    onChange({ zones });
  };

  const handleZoneShippingChange = (zone: string, shipping: number | null) => {
    const newZones = { ...value.zones };
    if (!newZones[zone]) {
      newZones[zone] = { shipping: null, cod: null };
    }
    newZones[zone] = { ...newZones[zone], shipping };
    onChange({ zones: newZones });
  };

  const handleZoneCodChange = (zone: string, cod: number | null) => {
    const newZones = { ...value.zones };
    if (!newZones[zone]) {
      newZones[zone] = { shipping: null, cod: null };
    }
    newZones[zone] = { ...newZones[zone], cod };
    onChange({ zones: newZones });
  };

  const handleApplyToAllZones = (shipping: number | null, cod: number | null) => {
    const newZones: Record<string, ShippingZoneConfig> = {};
    ZONES.forEach(zone => {
      newZones[zone] = { shipping, cod };
    });
    onChange({ zones: newZones });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Shipping Configuration Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleModeChange('free')}
            disabled={disabled}
            className={`p-4 border rounded-lg text-left transition-all ${
              mode === 'free'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-green-500" />
              <span className="font-medium">Free Shipping</span>
            </div>
            <p className="text-xs text-gray-500">
              Free shipping to all zones across India
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('fixed')}
            disabled={disabled}
            className={`p-4 border rounded-lg text-left transition-all ${
              mode === 'fixed'
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Custom Charges</span>
            </div>
            <p className="text-xs text-gray-500">
              Set custom shipping and COD charges per zone
            </p>
          </button>
        </div>
      </div>

      {mode === 'free' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-green-800">Free Shipping Options</h4>
          <p className="text-sm text-gray-600">Shipping charge will be ₹0 for all zones.</p>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              COD Charge (₹) — applies to all zones
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={freeCod || ''}
              onChange={(e) => handleFreeCodChange(e.target.value !== '' ? parseFloat(e.target.value) : 0)}
              disabled={disabled}
              placeholder="0"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set a COD charge for cash on delivery orders. Leave 0 for no COD charge.
            </p>
          </div>
        </div>
      )}

      {mode === 'fixed' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-purple-800">Custom Shipping Charges</h4>

          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Shipping (all zones)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                id="bulk-shipping"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">COD (all zones)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                id="bulk-cod"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const shippingInput = (document.getElementById('bulk-shipping') as HTMLInputElement)?.value;
                const codInput = (document.getElementById('bulk-cod') as HTMLInputElement)?.value;
                const shipping = shippingInput !== '' && shippingInput !== undefined ? parseFloat(shippingInput) : null;
                const cod = codInput !== '' && codInput !== undefined ? parseFloat(codInput) : null;
                handleApplyToAllZones(shipping, cod);
              }}
              disabled={disabled}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Apply to All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-purple-200">
                  <th className="text-left text-sm font-medium text-gray-700 py-2 px-2">Zone</th>
                  <th className="text-left text-sm font-medium text-gray-700 py-2 px-2">Description</th>
                  <th className="text-left text-sm font-medium text-gray-700 py-2 px-3">Shipping (₹)</th>
                  <th className="text-left text-sm font-medium text-gray-700 py-2 px-3">COD (₹)</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map(zone => (
                  <tr key={zone} className="border-b border-gray-100">
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                        {zone}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600">{ZONE_NAMES[zone]}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.zones?.[zone]?.shipping ?? ''}
                        onChange={(e) => handleZoneShippingChange(zone, e.target.value !== '' ? parseFloat(e.target.value) : null)}
                        disabled={disabled}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.zones?.[zone]?.cod ?? ''}
                        onChange={(e) => handleZoneCodChange(zone, e.target.value !== '' ? parseFloat(e.target.value) : null)}
                        disabled={disabled}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            Set 0 for free shipping or no COD charge.
          </p>
        </div>
      )}
    </div>
  );
}

export default ShippingConfigInput;

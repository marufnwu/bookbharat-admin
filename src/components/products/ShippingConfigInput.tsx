import React from 'react';
import { Truck, Info, Package } from 'lucide-react';

interface ShippingZoneConfig {
  shipping: number | null;
  cod: number | null;
}

interface ShippingConfig {
  type: 'free' | 'fixed' | 'zone_based';
  all_zones_free?: boolean;
  min_quantity?: number;
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

export function ShippingConfigInput({ value, onChange, disabled }: ShippingConfigInputProps) {
  const handleTypeChange = (type: 'free' | 'fixed' | 'zone_based') => {
    const newConfig: ShippingConfig = {
      type,
      min_quantity: value.min_quantity || 1,
      all_zones_free: type === 'free' ? true : false,
      zones: type === 'fixed' ? initZones() : undefined,
    };
    onChange(newConfig);
  };

  const initZones = (): Record<string, ShippingZoneConfig> => {
    const zones: Record<string, ShippingZoneConfig> = {};
    ZONES.forEach(zone => {
      zones[zone] = { shipping: null, cod: null };
    });
    return zones;
  };

  const handleAllZonesFreeChange = (checked: boolean) => {
    onChange({
      ...value,
      all_zones_free: checked,
      zones: checked ? undefined : value.zones,
    });
  };

  const handleMinQuantityChange = (qty: number) => {
    onChange({
      ...value,
      min_quantity: qty,
    });
  };

  const handleZoneShippingChange = (zone: string, shipping: number | null) => {
    const newZones = { ...value.zones };
    if (!newZones[zone]) {
      newZones[zone] = { shipping: null, cod: null };
    }
    newZones[zone].shipping = shipping;
    onChange({ ...value, zones: newZones });
  };

  const handleZoneCodChange = (zone: string, cod: number | null) => {
    const newZones = { ...value.zones };
    if (!newZones[zone]) {
      newZones[zone] = { shipping: null, cod: null };
    }
    newZones[zone].cod = cod;
    onChange({ ...value, zones: newZones });
  };

  const handleApplyToAllZones = (shipping: number | null, cod: number | null) => {
    const newZones: Record<string, ShippingZoneConfig> = {};
    ZONES.forEach(zone => {
      newZones[zone] = { shipping, cod };
    });
    onChange({ ...value, zones: newZones });
  };

  return (
    <div className="space-y-6">
      {/* Shipping Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Shipping Configuration Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Zone Based */}
          <button
            type="button"
            onClick={() => handleTypeChange('zone_based')}
            disabled={disabled}
            className={`p-4 border rounded-lg text-left transition-all ${
              value.type === 'zone_based'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Zone-Based Rates</span>
            </div>
            <p className="text-xs text-gray-500">
              Use default shipping rates based on delivery zone
            </p>
          </button>

          {/* Free Shipping */}
          <button
            type="button"
            onClick={() => handleTypeChange('free')}
            disabled={disabled}
            className={`p-4 border rounded-lg text-left transition-all ${
              value.type === 'free'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-green-500" />
              <span className="font-medium">Free Shipping</span>
            </div>
            <p className="text-xs text-gray-500">
              Offer free shipping to customers
            </p>
          </button>

          {/* Fixed Charges */}
          <button
            type="button"
            onClick={() => handleTypeChange('fixed')}
            disabled={disabled}
            className={`p-4 border rounded-lg text-left transition-all ${
              value.type === 'fixed'
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

      {/* Free Shipping Options */}
      {value.type === 'free' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-green-800">Free Shipping Options</h4>

          {/* All Zones Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="all_zones_free"
              checked={value.all_zones_free || false}
              onChange={(e) => handleAllZonesFreeChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="all_zones_free" className="text-sm text-gray-700">
              Free shipping to all zones across India
            </label>
          </div>

          {/* Minimum Quantity */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Minimum Quantity for Free Shipping
            </label>
            <input
              type="number"
              min="1"
              value={value.min_quantity || 1}
              onChange={(e) => handleMinQuantityChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer must order at least this quantity to qualify for free shipping
            </p>
          </div>

          {!value.all_zones_free && (
            <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
              <Info className="h-4 w-4 inline mr-1" />
              Use "Custom Charges" type if you want free shipping only for specific zones.
            </div>
          )}
        </div>
      )}

      {/* Fixed Charges Options */}
      {value.type === 'fixed' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-purple-800">Custom Shipping Charges</h4>

          {/* Quick Fill */}
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

          {/* Zone-by-Zone Configuration */}
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
                        placeholder="Default"
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
                        placeholder="Default"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            Leave empty to use default zone rates. Set 0 for free shipping or no COD charge.
          </p>
        </div>
      )}

      {/* Zone Based Info */}
      {value.type === 'zone_based' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                Standard zone-based shipping rates will be calculated automatically based on:
              </p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Delivery pincode zone (A-E)</li>
                <li>Package weight and dimensions</li>
                <li>Available courier partners</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShippingConfigInput;
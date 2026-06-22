import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building,
  Settings,
  Zap,
} from 'lucide-react';
import PincodeZones from './PincodeZones';
import Warehouses from './Warehouses';
import CarrierConfiguration from './CarrierConfiguration';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';

type TabType = 'carriers' | 'warehouses' | 'pincodes' | 'settings';

const Shipping: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('carriers');
  const [fastDeliveryEnabled, setFastDeliveryEnabled] = useState(false);
  const [fastDeliveryCharge, setFastDeliveryCharge] = useState(30);
  const [saving, setSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs: TabType[] = ['carriers', 'warehouses', 'pincodes', 'settings'];
    if (hash && validTabs.includes(hash as TabType)) {
      setActiveTab(hash as TabType);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && !settingsLoaded) {
      loadSettings();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings/shipping');
      if (res.data?.success) {
        setFastDeliveryEnabled(res.data.data.fast_delivery_enabled);
        setFastDeliveryCharge(res.data.data.fast_delivery_charge);
        setSettingsLoaded(true);
      }
    } catch {}
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings/shipping', {
        fast_delivery_enabled: fastDeliveryEnabled,
        fast_delivery_charge: fastDeliveryCharge,
      });
      toast.success('Shipping settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const tabs = [
    { id: 'carriers', label: 'Carriers', icon: Building },
    { id: 'warehouses', label: 'Warehouses', icon: Building },
    { id: 'pincodes', label: 'Pincode Zones', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shipping Configuration</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage carriers, warehouses, and pincode zones
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'carriers' && <CarrierConfiguration />}
          {activeTab === 'warehouses' && <Warehouses />}
          {activeTab === 'pincodes' && <PincodeZones />}
          {activeTab === 'settings' && (
            <div className="max-w-xl space-y-6">
              <div className="border border-gray-200 rounded-lg p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-medium text-gray-900">Fast Delivery</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Offer an expedited delivery option to customers at an additional charge.
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="fast-enabled" className="text-sm font-medium text-gray-700">
                      Enable Fast Delivery
                    </label>
                    <p className="text-xs text-gray-500">Show fast delivery option at checkout</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fastDeliveryEnabled}
                    onClick={() => setFastDeliveryEnabled(!fastDeliveryEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      fastDeliveryEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      fastDeliveryEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {fastDeliveryEnabled && (
                  <div>
                    <label htmlFor="fast-charge" className="block text-sm font-medium text-gray-700 mb-1">
                      Fast Delivery Charge (₹)
                    </label>
                    <input
                      id="fast-charge"
                      type="number"
                      min="0"
                      step="1"
                      value={fastDeliveryCharge}
                      onChange={(e) => setFastDeliveryCharge(parseFloat(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Additional amount added to regular shipping cost for fast delivery.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shipping;

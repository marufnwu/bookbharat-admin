import React, { useState, useEffect } from 'react';
import {
  Package,
  MapPin,
  Calculator,
  BarChart,
  Settings,
  Truck,
  DollarSign,
  Globe,
  Building,
  Gift
} from 'lucide-react';
import WeightSlabs from './WeightSlabs';
import ZoneRates from './ZoneRates';
import PincodeZones from './PincodeZones';
import TestCalculator from './TestCalculator';
import ShippingAnalytics from './Analytics';
import Warehouses from './Warehouses';
import FreeShippingThresholds from './FreeShippingThresholds';
import CarrierConfiguration from './CarrierConfiguration';

type TabType = 'carriers' | 'warehouses' | 'weight-slabs' | 'zone-rates' | 'pincodes' | 'free-shipping' | 'calculator' | 'analytics';

const Shipping: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('carriers');

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs: TabType[] = ['carriers', 'warehouses', 'weight-slabs', 'zone-rates', 'pincodes', 'free-shipping', 'calculator', 'analytics'];
    if (hash && validTabs.includes(hash as TabType)) {
      setActiveTab(hash as TabType);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const tabs = [
    { id: 'carriers', label: 'Carriers', icon: Truck },
    { id: 'warehouses', label: 'Warehouses', icon: Building },
    { id: 'weight-slabs', label: 'Weight Slabs', icon: Package },
    { id: 'zone-rates', label: 'Zone Rates', icon: DollarSign },
    { id: 'pincodes', label: 'Pincode Zones', icon: MapPin },
    { id: 'free-shipping', label: 'Free Shipping', icon: Gift },
    { id: 'calculator', label: 'Test Calculator', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shipping Configuration</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage shipping rates, zones, and delivery settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Truck className="h-4 w-4 mr-2" />
            Sync Rates
          </button>
        </div>
      </div>

      {/* Zone Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs font-medium uppercase tracking-wide">Zone A</p>
              <p className="mt-1 text-2xl font-semibold text-green-900">₹30-50</p>
              <p className="text-xs text-green-700 mt-1">Same City</p>
            </div>
            <Globe className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs font-medium uppercase tracking-wide">Zone B</p>
              <p className="mt-1 text-2xl font-semibold text-blue-900">₹50-80</p>
              <p className="text-xs text-blue-700 mt-1">Same State</p>
            </div>
            <Globe className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-xs font-medium uppercase tracking-wide">Zone C</p>
              <p className="mt-1 text-2xl font-semibold text-purple-900">₹70-100</p>
              <p className="text-xs text-purple-700 mt-1">Metro-Metro</p>
            </div>
            <Globe className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-xs font-medium uppercase tracking-wide">Zone D</p>
              <p className="mt-1 text-2xl font-semibold text-orange-900">₹80-120</p>
              <p className="text-xs text-orange-700 mt-1">Rest of India</p>
            </div>
            <Globe className="h-8 w-8 text-orange-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-xs font-medium uppercase tracking-wide">Zone E</p>
              <p className="mt-1 text-2xl font-semibold text-red-900">₹120-170</p>
              <p className="text-xs text-red-700 mt-1">Northeast/J&K</p>
            </div>
            <Globe className="h-8 w-8 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'carriers' && <CarrierConfiguration />}
          {activeTab === 'warehouses' && <Warehouses />}
          {activeTab === 'weight-slabs' && <WeightSlabs />}
          {activeTab === 'zone-rates' && <ZoneRates />}
          {activeTab === 'pincodes' && <PincodeZones />}
          {activeTab === 'free-shipping' && <FreeShippingThresholds />}
          {activeTab === 'calculator' && <TestCalculator />}
          {activeTab === 'analytics' && <ShippingAnalytics />}
        </div>
      </div>
    </div>
  );
};

export default Shipping;
import { useState, useEffect } from 'react';
import { api } from '../../api/axios';

interface MarketingSettings {
    google_analytics: { enabled: boolean; measurement_id: string };
    google_tag_manager: { enabled: boolean; container_id: string };
    google_ads: { enabled: boolean; conversion_id: string };
    meta_pixel: { enabled: boolean; pixel_id: string };
}

const defaultSettings: MarketingSettings = {
    google_analytics: { enabled: false, measurement_id: '' },
    google_tag_manager: { enabled: false, container_id: '' },
    google_ads: { enabled: false, conversion_id: '' },
    meta_pixel: { enabled: false, pixel_id: '' },
};

export default function MarketingSettings() {
    const [settings, setSettings] = useState<MarketingSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/marketing/settings');
            const data = response.data;
            setSettings({
                google_analytics: { enabled: data?.google_analytics?.enabled ?? false, measurement_id: data?.google_analytics?.measurement_id ?? '' },
                google_tag_manager: { enabled: data?.google_tag_manager?.enabled ?? false, container_id: data?.google_tag_manager?.container_id ?? '' },
                google_ads: { enabled: data?.google_ads?.enabled ?? false, conversion_id: data?.google_ads?.conversion_id ?? '' },
                meta_pixel: { enabled: data?.meta_pixel?.enabled ?? false, pixel_id: data?.meta_pixel?.pixel_id ?? '' },
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (path: string, value: any) => {
        setSettings(prev => {
            const keys = path.split('.');
            const newSettings = { ...prev };
            let current: any = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/marketing/settings', settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Marketing Settings</h1>
                    <p className="text-gray-500 mt-1">Configure your tracking and analytics</p>
                </div>

                <div className="space-y-6">
                    {/* Google Analytics */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-medium">Google Analytics</h3>
                                <p className="text-sm text-gray-500">Track website traffic and user behavior</p>
                            </div>
                            <button
                                onClick={() => handleFieldChange('google_analytics.enabled', !settings.google_analytics.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.google_analytics.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.google_analytics.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        {settings.google_analytics.enabled && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Measurement ID (G-XXXXXXXXXX)
                                </label>
                                <input
                                    type="text"
                                    value={settings.google_analytics.measurement_id}
                                    onChange={(e) => handleFieldChange('google_analytics.measurement_id', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="G-XXXXXXXXXX"
                                />
                            </div>
                        )}
                    </div>

                    {/* Google Tag Manager */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-medium">Google Tag Manager</h3>
                                <p className="text-sm text-gray-500">Container for multiple tags</p>
                            </div>
                            <button
                                onClick={() => handleFieldChange('google_tag_manager.enabled', !settings.google_tag_manager.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.google_tag_manager.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.google_tag_manager.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        {settings.google_tag_manager.enabled && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Container ID (GTM-XXXXXXX)
                                </label>
                                <input
                                    type="text"
                                    value={settings.google_tag_manager.container_id}
                                    onChange={(e) => handleFieldChange('google_tag_manager.container_id', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="GTM-XXXXXXX"
                                />
                            </div>
                        )}
                    </div>

                    {/* Google Ads */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-medium">Google Ads Conversion</h3>
                                <p className="text-sm text-gray-500">Track conversions from Google Ads</p>
                            </div>
                            <button
                                onClick={() => handleFieldChange('google_ads.enabled', !settings.google_ads.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.google_ads.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.google_ads.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        {settings.google_ads.enabled && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Conversion ID (AW-XXXXXXXXX)
                                </label>
                                <input
                                    type="text"
                                    value={settings.google_ads.conversion_id}
                                    onChange={(e) => handleFieldChange('google_ads.conversion_id', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="AW-XXXXXXXXX"
                                />
                            </div>
                        )}
                    </div>

                    {/* Meta Pixel */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-medium">Meta Pixel (Facebook)</h3>
                                <p className="text-sm text-gray-500">Track conversions from Facebook & Instagram</p>
                            </div>
                            <button
                                onClick={() => handleFieldChange('meta_pixel.enabled', !settings.meta_pixel.enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.meta_pixel.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.meta_pixel.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        {settings.meta_pixel.enabled && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pixel ID
                                </label>
                                <input
                                    type="text"
                                    value={settings.meta_pixel.pixel_id}
                                    onChange={(e) => handleFieldChange('meta_pixel.pixel_id', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="123456789"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    {saved && <span className="text-green-600 text-sm">Settings saved!</span>}
                </div>
            </div>
        </div>
    );
}

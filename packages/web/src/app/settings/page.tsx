'use client';

import { useState, useEffect } from 'react';

interface Settings {
  pageSpeedApiKey: string;
  googleSearchConsoleClientId: string;
  googleSearchConsoleClientSecret: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    pageSpeedApiKey: '',
    googleSearchConsoleClientId: '',
    googleSearchConsoleClientSecret: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, we'd save to the database
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure API keys and integrations</p>
      </div>

      {/* PageSpeed Insights */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">PageSpeed Insights API</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add your Google PageSpeed Insights API key for performance analysis.
          Get a free API key from the{' '}
          <a
            href="https://developers.google.com/speed/docs/insights/v5/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            Google Cloud Console
          </a>
          .
        </p>
        <input
          type="password"
          value={settings.pageSpeedApiKey}
          onChange={(e) =>
            setSettings({ ...settings, pageSpeedApiKey: e.target.value })
          }
          placeholder="Enter your API key"
          className="input"
        />
      </div>

      {/* Google Search Console */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Google Search Console</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect to Google Search Console to access search performance data.
          Set up OAuth credentials in the{' '}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            Google Cloud Console
          </a>
          .
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={settings.googleSearchConsoleClientId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  googleSearchConsoleClientId: e.target.value,
                })
              }
              placeholder="Enter your OAuth Client ID"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret
            </label>
            <input
              type="password"
              value={settings.googleSearchConsoleClientSecret}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  googleSearchConsoleClientSecret: e.target.value,
                })
              }
              placeholder="Enter your OAuth Client Secret"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Crawler Settings */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Crawler Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Respect robots.txt</p>
              <p className="text-sm text-gray-500">
                Follow robots.txt rules when crawling
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Include sitemaps</p>
              <p className="text-sm text-gray-500">
                Analyze sitemap.xml during audits
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="text-green-600 font-medium">✓ Settings saved!</span>
        )}
      </div>
    </div>
  );
}

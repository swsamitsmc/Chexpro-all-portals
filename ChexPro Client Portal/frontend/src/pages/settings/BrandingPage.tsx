import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Palette, Upload, Save, Loader2, CheckCircle, AlertCircle, 
  Plus, X, Eye, EyeOff, Image
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface BrandingConfig {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  customCss: string;
  customLinks: Array<{ label: string; url: string }>;
  applicantPortalTitle: string;
  applicantPortalSubtitle: string;
  showPoweredBy: boolean;
}

const defaultBranding: BrandingConfig = {
  logoUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#10B981',
  backgroundColor: '#F9FAFB',
  fontFamily: 'Inter',
  customCss: '',
  customLinks: [],
  applicantPortalTitle: 'Applicant Portal',
  applicantPortalSubtitle: 'Complete your background check',
  showPoweredBy: true,
};

const fontOptions = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Poppins', 'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu'
];

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [previewMode, setPreviewMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const res = await axios.get(`${API_URL}/client/branding`);
      if (res.data.data) {
        setBranding({ ...defaultBranding, ...res.data.data });
      }
    } catch (err) {
      // Use demo data
      setBranding({
        ...defaultBranding,
        logoUrl: 'https://via.placeholder.com/200x60?text=Acme+Corp',
        primaryColor: '#3B82F6',
        customLinks: [
          { label: 'Privacy Policy', url: 'https://acme.com/privacy' },
          { label: 'Terms of Service', url: 'https://acme.com/terms' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.put(`${API_URL}/client/branding`, branding);
      setMessage({ type: 'success', text: 'Branding saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save branding' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/client/branding/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBranding({ ...branding, logoUrl: res.data.data.url });
    } catch (err) {
      // Demo: use object URL
      const url = URL.createObjectURL(file);
      setBranding({ ...branding, logoUrl: url });
    }
  };

  const addCustomLink = () => {
    setBranding({
      ...branding,
      customLinks: [...branding.customLinks, { label: '', url: '' }]
    });
  };

  const removeCustomLink = (index: number) => {
    setBranding({
      ...branding,
      customLinks: branding.customLinks.filter((_, i) => i !== index)
    });
  };

  const updateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...branding.customLinks];
    updated[index] = { ...updated[index], [field]: value };
    setBranding({ ...branding, customLinks: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="text-gray-600">Customize your portal appearance</p>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {previewMode ? 'Edit Mode' : 'Preview'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {previewMode ? (
        /* Preview Mode */
        <div className="bg-white rounded-xl border border-gray-200 p-8" style={{ backgroundColor: branding.backgroundColor }}>
          {/* Preview Header */}
          <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: branding.primaryColor }}>
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-12" />
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: branding.primaryColor }}>
                  Logo
                </div>
              )}
            </div>
            <nav className="flex items-center gap-4">
              {branding.customLinks.map((link, idx) => (
                <a key={idx} href={link.url} className="text-sm hover:underline" style={{ color: branding.primaryColor }}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          
          {/* Preview Content */}
          <div className="py-12 text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: branding.secondaryColor }}>
              {branding.applicantPortalTitle}
            </h1>
            <p className="text-lg mb-8" style={{ color: branding.accentColor }}>
              {branding.applicantPortalSubtitle}
            </p>
            <button
              className="px-8 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Get Started
            </button>
          </div>

          {/* Preview Footer */}
          {branding.showPoweredBy && (
            <div className="pt-6 border-t text-center text-sm text-gray-500">
              Powered by ChexPro
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Logo
            </h3>
            <div className="flex items-start gap-6">
              <div className="w-48 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-gray-400 text-sm">No logo uploaded</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 200x60px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Colors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'primaryColor', label: 'Primary' },
                { key: 'secondaryColor', label: 'Secondary' },
                { key: 'accentColor', label: 'Accent' },
                { key: 'backgroundColor', label: 'Background' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding[key as keyof BrandingConfig] as string}
                      onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={branding[key as keyof BrandingConfig] as string}
                      onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Typography</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select
                value={branding.fontFamily}
                onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {fontOptions.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Portal Text */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Portal Text</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal Title</label>
                <input
                  type="text"
                  value={branding.applicantPortalTitle}
                  onChange={(e) => setBranding({ ...branding, applicantPortalTitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal Subtitle</label>
                <input
                  type="text"
                  value={branding.applicantPortalSubtitle}
                  onChange={(e) => setBranding({ ...branding, applicantPortalSubtitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Custom Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Custom Links</h3>
              <button
                onClick={addCustomLink}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Link
              </button>
            </div>
            {branding.customLinks.length === 0 ? (
              <p className="text-gray-500 text-sm">No custom links added</p>
            ) : (
              <div className="space-y-3">
                {branding.customLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateCustomLink(idx, 'label', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="url"
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) => updateCustomLink(idx, 'url', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={() => removeCustomLink(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Options</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={branding.showPoweredBy}
                onChange={(e) => setBranding({ ...branding, showPoweredBy: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show "Powered by ChexPro" in footer</span>
            </label>
          </div>

          {/* Custom CSS */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Custom CSS</h3>
            <textarea
              value={branding.customCss}
              onChange={(e) => setBranding({ ...branding, customCss: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
              rows={6}
              placeholder="/* Add custom CSS here */"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Building2, Mail, Phone, MapPin, Save, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface CompanyProfile {
  companyName: string;
  legalName: string;
  industry: string;
  companySize: string;
  website: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  taxId: string;
  billingEmail: string;
}

interface AccountProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  department: string;
  jobTitle: string;
  avatar?: string;
  mfaEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    companyName: '',
    legalName: '',
    industry: '',
    companySize: '',
    website: '',
    phone: '',
    address: { street: '', city: '', province: '', postalCode: '', country: 'Canada' },
    billingAddress: { street: '', city: '', province: '', postalCode: '', country: 'Canada' },
    taxId: '',
    billingEmail: '',
  });
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'account'>('company');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, accountRes] = await Promise.all([
          axios.get(`${API_URL}/client/profile`),
          axios.get(`${API_URL}/auth/me`),
        ]);
        if (companyRes.data.data) {
          setCompanyProfile(companyRes.data.data);
        }
        if (accountRes.data.data) {
          setAccountProfile(accountRes.data.data);
        }
      } catch (err) {
        // Demo data
        setCompanyProfile({
          companyName: 'Acme Corporation',
          legalName: 'Acme Corp Inc.',
          industry: 'Technology',
          companySize: '50-200',
          website: 'https://acme.com',
          phone: '+1-555-123-4567',
          address: { street: '123 Main St', city: 'Toronto', province: 'ON', postalCode: 'M5V 1A1', country: 'Canada' },
          billingAddress: { street: '123 Main St', city: 'Toronto', province: 'ON', postalCode: 'M5V 1A1', country: 'Canada' },
          taxId: '123456789',
          billingEmail: 'billing@acme.com',
        });
        setAccountProfile({
          userId: '1',
          email: 'john.doe@acme.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'owner',
          phone: '+1-555-987-6543',
          department: 'HR',
          jobTitle: 'HR Manager',
          mfaEnabled: true,
          lastLogin: '2024-01-15T10:30:00Z',
          createdAt: '2023-06-01T00:00:00Z',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCompanySave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.put(`${API_URL}/client/profile`, companyProfile);
      setMessage({ type: 'success', text: 'Company profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAccountSave = async () => {
    if (!accountProfile) return;
    setSaving(true);
    setMessage(null);
    try {
      await axios.put(`${API_URL}/users/${accountProfile.userId}`, {
        firstName: accountProfile.firstName,
        lastName: accountProfile.lastName,
        phone: accountProfile.phone,
        department: accountProfile.department,
        jobTitle: accountProfile.jobTitle,
      });
      setMessage({ type: 'success', text: 'Account profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your company and account information</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'company'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Company Profile
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Account Profile
          </button>
        </nav>
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

      {/* Company Profile */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyProfile.companyName}
                onChange={e => setCompanyProfile({ ...companyProfile, companyName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
              <input
                type="text"
                value={companyProfile.legalName}
                onChange={e => setCompanyProfile({ ...companyProfile, legalName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={companyProfile.industry}
                onChange={e => setCompanyProfile({ ...companyProfile, industry: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select...</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select
                value={companyProfile.companySize}
                onChange={e => setCompanyProfile({ ...companyProfile, companySize: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={companyProfile.website}
                onChange={e => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={companyProfile.phone}
                onChange={e => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={companyProfile.billingEmail}
                onChange={e => setCompanyProfile({ ...companyProfile, billingEmail: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Company Address</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={companyProfile.address.street}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    address: { ...companyProfile.address, street: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={companyProfile.address.city}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    address: { ...companyProfile.address, city: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province/State</label>
                <input
                  type="text"
                  value={companyProfile.address.province}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    address: { ...companyProfile.address, province: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal/ZIP Code</label>
                <input
                  type="text"
                  value={companyProfile.address.postalCode}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    address: { ...companyProfile.address, postalCode: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={companyProfile.address.country}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    address: { ...companyProfile.address, country: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Billing Address</h3>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={companyProfile.billingAddress.street === companyProfile.address.street}
                onChange={e => {
                  if (e.target.checked) {
                    setCompanyProfile({ 
                      ...companyProfile, 
                      billingAddress: { ...companyProfile.address }
                    });
                  }
                }}
              />
              <span className="text-sm text-gray-600">Same as company address</span>
            </label>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={companyProfile.billingAddress.street}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    billingAddress: { ...companyProfile.billingAddress, street: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={companyProfile.billingAddress.city}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    billingAddress: { ...companyProfile.billingAddress, city: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province/State</label>
                <input
                  type="text"
                  value={companyProfile.billingAddress.province}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    billingAddress: { ...companyProfile.billingAddress, province: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal/ZIP Code</label>
                <input
                  type="text"
                  value={companyProfile.billingAddress.postalCode}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    billingAddress: { ...companyProfile.billingAddress, postalCode: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={companyProfile.billingAddress.country}
                  onChange={e => setCompanyProfile({ 
                    ...companyProfile, 
                    billingAddress: { ...companyProfile.billingAddress, country: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / GST/HST Number</label>
                <input
                  type="text"
                  value={companyProfile.taxId}
                  onChange={e => setCompanyProfile({ ...companyProfile, taxId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCompanySave}
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

      {/* Account Profile */}
      {activeTab === 'account' && accountProfile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {accountProfile.firstName[0]}{accountProfile.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{accountProfile.firstName} {accountProfile.lastName}</h3>
              <p className="text-gray-500">{accountProfile.jobTitle}</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {accountProfile.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={accountProfile.firstName}
                onChange={e => setAccountProfile({ ...accountProfile, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={accountProfile.lastName}
                onChange={e => setAccountProfile({ ...accountProfile, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={accountProfile.email}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Contact support to change email</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={accountProfile.phone}
                onChange={e => setAccountProfile({ ...accountProfile, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={accountProfile.department}
                onChange={e => setAccountProfile({ ...accountProfile, department: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={accountProfile.jobTitle}
                onChange={e => setAccountProfile({ ...accountProfile, jobTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Security</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">
                    {accountProfile.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <button className="text-blue-600 hover:underline text-sm">
                {accountProfile.mfaEnabled ? 'Manage' : 'Enable'}
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Account Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Account created:</span>
                <span className="ml-2 text-gray-900">{new Date(accountProfile.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Last login:</span>
                <span className="ml-2 text-gray-900">
                  {accountProfile.lastLogin ? new Date(accountProfile.lastLogin).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAccountSave}
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

import { NavLink, Outlet } from 'react-router-dom';
import { 
  User, Users, Palette, Key, CreditCard, Bell, Shield, 
  Globe, Settings as SettingsIcon, ChevronRight
} from 'lucide-react';

const settingsNav = [
  { to: '/settings/profile', label: 'Profile', icon: User },
  { to: '/settings/users', label: 'Users', icon: Users },
  { to: '/settings/branding', label: 'Branding', icon: Palette },
  { to: '/settings/api-keys', label: 'API Keys', icon: Key },
  { to: '/settings/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings/notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsLayout() {
  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <nav className="w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500">Manage your account</p>
            </div>
          </div>
          
          <ul className="space-y-1">
            {settingsNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

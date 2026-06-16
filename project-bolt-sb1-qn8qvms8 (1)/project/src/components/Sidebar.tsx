import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  CreditCard,
  DollarSign,
  Shield,
  Activity,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'customers', label: 'Customer Database', icon: Users },
  { id: 'devices', label: 'Device Management', icon: Smartphone },
  { id: 'emi', label: 'EMI Plans', icon: CreditCard },
  { id: 'payments', label: 'Collections & Payments', icon: DollarSign },
  { id: 'dealers', label: 'All Dealers', icon: Users },
  { id: 'lock', label: 'Remote Lock/Unlock', icon: Shield },
  { id: 'activity', label: 'Activity Log', icon: Activity },
];

const dealerTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'customers', label: 'Customer Database', icon: Users },
  { id: 'devices', label: 'Device Management', icon: Smartphone },
  { id: 'emi', label: 'EMI Plans', icon: CreditCard },
  { id: 'payments', label: 'EMI Collection', icon: DollarSign },
  { id: 'lock', label: 'Remote Lock/Unlock', icon: Shield },
  { id: 'activity', label: 'Activity Log', icon: Activity },
];

const customerTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'devices', label: 'My Devices', icon: Smartphone },
  { id: 'emi', label: 'EMI & Payments', icon: CreditCard },
];

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  dealer: 'Dealer',
  customer: 'Customer',
};

const rolePanelLabels: Record<UserRole, string> = {
  admin: 'Admin Panel',
  dealer: 'Dealer Panel',
  customer: 'Customer Panel',
};

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = profile?.role || 'customer';
  const tabs = role === 'admin' ? adminTabs : role === 'dealer' ? dealerTabs : customerTabs;

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">TA</span>
          </div>
          <span className="text-white font-semibold text-sm">TA Tech Solutions</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-300">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-60 h-full bg-slate-900 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">TA</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">TA Tech Solutions</p>
                  <p className="text-gray-400 text-xs">{rolePanelLabels[role]}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">TA</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">TA Tech Solutions</p>
              <p className="text-gray-400 text-xs">{rolePanelLabels[role]}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-gray-300" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-gray-400 text-xs">{roleLabels[role]}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

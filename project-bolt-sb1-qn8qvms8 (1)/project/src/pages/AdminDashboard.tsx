import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import type { Customer, Device, EmiSchedule, Payment, ActivityLog } from '../types';
import {
  Users, Smartphone, CreditCard, DollarSign, BarChart3,
  Plus, Lock, Unlock, AlertCircle, RefreshCw, Shield, Activity,
} from 'lucide-react';

const INPUT = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-sm';
const BTN_PRIMARY = 'px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition';
const BTN_CANCEL = 'px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [emis, setEmis] = useState<EmiSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // modals
  const [showCust, setShowCust] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [showEmi, setShowEmi] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [selectedDev, setSelectedDev] = useState<Device | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [payId, setPayId] = useState('');

  // form states
  const EMPTY_CUST = { first_name: '', last_name: '', email: '', phone: '', company_name: '', address: '', city: '', state: '', pincode: '' };
  const EMPTY_DEV = { imei: '', device_name: '', device_model: '', customer_id: '' };
  const EMPTY_EMI = { customer_id: '', device_id: '', total_amount: '', duration_months: '', start_date: new Date().toISOString().split('T')[0] };
  const [cust, setCust] = useState(EMPTY_CUST);
  const [dev, setDev] = useState(EMPTY_DEV);
  const [emi, setEmi] = useState(EMPTY_EMI);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [c, d, e, p, l] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('devices').select('*').order('created_at', { ascending: false }),
        supabase.from('emi_schedules').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('due_date', { ascending: true }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      if (c.error) throw c.error;
      setCustomers(c.data || []);
      setDevices(d.data || []);
      setEmis(e.data || []);
      setPayments(p.data || []);
      setLogs(l.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const custName = (id: string | null) => {
    if (!id) return '—';
    const c = customers.find((c) => c.id === id);
    return c ? `${c.first_name} ${c.last_name}` : '—';
  };
  const devLabel = (id: string) => {
    const d = devices.find((d) => d.id === id);
    return d ? `${d.device_name} (${d.imei})` : '—';
  };

  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status !== 'paid');
  const totalCollected = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);

  async function addCustomer() {
    if (!user) return;
    const { error } = await supabase.from('customers').insert({
      ...cust,
      dealer_id: user.id,
      // user_id intentionally null — customer's own auth account can be linked later
    });
    if (error) { alert(error.message); return; }
    await logActivity('customer_added', 'customer', `${cust.first_name} ${cust.last_name}`);
    setShowCust(false); setCust(EMPTY_CUST); load();
  }

  async function registerDevice() {
    if (!user) return;
    if (dev.imei.replace(/\D/g, '').length !== 15) { alert('IMEI must be exactly 15 digits'); return; }
    const { error } = await supabase.from('devices').insert({
      imei: dev.imei,
      device_name: dev.device_name,
      device_model: dev.device_model,
      customer_id: dev.customer_id || null,
      dealer_id: user.id,
      status: 'active',
    });
    if (error) { alert(error.message); return; }
    await logActivity('device_registered', 'device', dev.device_name);
    setShowDev(false); setDev(EMPTY_DEV); load();
  }

  async function createEmi() {
    if (!user) return;
    const total = Number(emi.total_amount);
    const months = Number(emi.duration_months);
    if (!total || !months || !emi.customer_id || !emi.device_id) {
      alert('Please fill all fields'); return;
    }
    const { data: emiData, error } = await supabase
      .from('emi_schedules')
      .insert({ dealer_id: user.id, customer_id: emi.customer_id, device_id: emi.device_id, total_amount: total, duration_months: months, start_date: emi.start_date, status: 'active' })
      .select()
      .single();
    if (error || !emiData) { alert(error?.message || 'Failed'); return; }

    const monthly = Math.round((total / months) * 100) / 100;
    const rows = Array.from({ length: months }, (_, i) => {
      const d = new Date(emi.start_date);
      d.setMonth(d.getMonth() + i + 1);
      return { emi_schedule_id: emiData.id, month_number: i + 1, amount: monthly, due_date: d.toISOString().split('T')[0], status: 'pending' };
    });
    await supabase.from('payments').insert(rows);
    await logActivity('emi_created', 'emi_schedule', `${fmt(total)} / ${months}mo`);
    setShowEmi(false); setEmi(EMPTY_EMI); load();
  }

  async function recordPayment() {
    if (!payId) { alert('No payment selected'); return; }
    const { error } = await supabase.from('payments').update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: payMethod,
      reference_id: payRef,
    }).eq('id', payId);
    if (error) { alert(error.message); return; }
    await logActivity('payment_recorded', 'payment', payMethod);
    setShowPay(false); setPayId(''); setPayMethod('Cash'); setPayRef(''); load();
  }

  async function lockDevice() {
    if (!selectedDev || !user) return;
    await supabase.from('devices').update({ status: 'locked', updated_at: new Date().toISOString() }).eq('id', selectedDev.id);
    await supabase.from('device_locks').insert({ device_id: selectedDev.id, lock_status: 'locked', reason: lockReason, locked_at: new Date().toISOString(), locked_by: user.id });
    await logActivity('device_locked', 'device', lockReason || 'No reason');
    setShowLock(false); setSelectedDev(null); setLockReason(''); load();
  }

  async function unlockDevice(d: Device) {
    if (!user) return;
    await supabase.from('devices').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', d.id);
    await supabase.from('device_locks').insert({ device_id: d.id, lock_status: 'unlocked', locked_at: new Date().toISOString(), locked_by: user.id });
    await logActivity('device_unlocked', 'device', d.device_name);
    load();
  }

  async function logActivity(action: string, entity: string, detail: string) {
    if (!user) return;
    await supabase.from('activity_logs').insert({ user_id: user.id, action_type: action, entity_type: entity, entity_id: crypto.randomUUID(), details: { detail } });
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={tab} onTabChange={setTab} />
      <div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-primary-500 animate-spin" /></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={tab} onTabChange={setTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <button onClick={load} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Customers', value: customers.length, icon: Users, color: 'bg-blue-100 text-blue-600' },
                  { label: 'Total Devices', value: devices.length, icon: Smartphone, color: 'bg-green-100 text-green-600' },
                  { label: 'Active EMIs', value: emis.filter((e) => e.status === 'active').length, icon: CreditCard, color: 'bg-orange-100 text-orange-600' },
                  { label: 'Amount Collected', value: fmt(totalCollected), icon: DollarSign, color: 'bg-primary-100 text-primary-600' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}><Icon className="w-5 h-5" /></div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-600" /> Collection Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200"><p className="text-sm text-green-700 font-medium">Total Collected</p><p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalCollected)}</p></div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200"><p className="text-sm text-red-700 font-medium">Pending Amount</p><p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalPending)}</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Payments</h3>
                {paidPayments.length === 0 ? <p className="text-sm text-gray-400">No payments recorded yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100"><th className="text-left py-2 px-3 font-medium text-gray-500">Customer</th><th className="text-left py-2 px-3 font-medium text-gray-500">Month</th><th className="text-left py-2 px-3 font-medium text-gray-500">Amount</th><th className="text-left py-2 px-3 font-medium text-gray-500">Method</th><th className="text-left py-2 px-3 font-medium text-gray-500">Paid On</th></tr></thead>
                      <tbody>{paidPayments.slice(0, 10).map((p) => { const e = emis.find((e) => e.id === p.emi_schedule_id); return (<tr key={p.id} className="border-b border-gray-50"><td className="py-2 px-3">{e ? custName(e.customer_id) : '—'}</td><td className="py-2 px-3">Month {p.month_number}</td><td className="py-2 px-3 font-medium">{fmt(Number(p.amount))}</td><td className="py-2 px-3">{p.payment_method || '—'}</td><td className="py-2 px-3">{p.paid_date || '—'}</td></tr>); })}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {tab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Customer Database</h2>
                <button onClick={() => setShowCust(true)} className={BTN_PRIMARY + ' flex items-center gap-2'}><Plus className="w-4 h-4" />Add Customer</button>
              </div>
              {customers.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-100 text-center"><Users className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No customers yet. Add your first customer.</p></div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left py-3 px-4 font-medium text-gray-500">Name</th><th className="text-left py-3 px-4 font-medium text-gray-500">Email</th><th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th><th className="text-left py-3 px-4 font-medium text-gray-500">Company</th><th className="text-left py-3 px-4 font-medium text-gray-500">City</th></tr></thead>
                    <tbody>{customers.map((c) => (<tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="py-3 px-4 font-medium text-gray-900">{c.first_name} {c.last_name}</td><td className="py-3 px-4 text-gray-600">{c.email}</td><td className="py-3 px-4 text-gray-600">{c.phone}</td><td className="py-3 px-4 text-gray-600">{c.company_name || '—'}</td><td className="py-3 px-4 text-gray-600">{c.city || '—'}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DEVICES */}
          {tab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Device Management</h2>
                <button onClick={() => setShowDev(true)} className={BTN_PRIMARY + ' flex items-center gap-2'}><Plus className="w-4 h-4" />Register Device</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm"><p className="text-2xl font-bold text-gray-900">{devices.length}</p><p className="text-xs text-gray-500 mt-1">Total</p></div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm"><p className="text-2xl font-bold text-green-600">{devices.filter((d) => d.status === 'active').length}</p><p className="text-xs text-gray-500 mt-1">Active</p></div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm"><p className="text-2xl font-bold text-red-600">{devices.filter((d) => d.status === 'locked').length}</p><p className="text-xs text-gray-500 mt-1">Locked</p></div>
              </div>
              {devices.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-100 text-center"><Smartphone className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No devices registered yet.</p></div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left py-3 px-4 font-medium text-gray-500">Device</th><th className="text-left py-3 px-4 font-medium text-gray-500">IMEI</th><th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th><th className="text-left py-3 px-4 font-medium text-gray-500">Status</th><th className="text-left py-3 px-4 font-medium text-gray-500">Action</th></tr></thead>
                    <tbody>
                      {devices.map((d) => (
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                          <td className="py-3 px-4 font-medium text-gray-900">{d.device_name}</td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">{d.imei}</td>
                          <td className="py-3 px-4 text-gray-600">{custName(d.customer_id)}</td>
                          <td className="py-3 px-4"><StatusBadge status={d.status} /></td>
                          <td className="py-3 px-4">
                            {d.status === 'active' && <button onClick={() => { setSelectedDev(d); setShowLock(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition"><Lock className="w-3 h-3" />Lock</button>}
                            {d.status === 'locked' && <button onClick={() => unlockDevice(d)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100 transition"><Unlock className="w-3 h-3" />Unlock</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* EMI PLANS */}
          {tab === 'emi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">EMI Plans</h2>
                <button onClick={() => setShowEmi(true)} className={BTN_PRIMARY + ' flex items-center gap-2'}><Plus className="w-4 h-4" />Create EMI Plan</button>
              </div>
              {emis.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-100 text-center"><CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No EMI plans yet. Add customers and devices first.</p></div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th><th className="text-left py-3 px-4 font-medium text-gray-500">Device</th><th className="text-left py-3 px-4 font-medium text-gray-500">Total</th><th className="text-left py-3 px-4 font-medium text-gray-500">Monthly</th><th className="text-left py-3 px-4 font-medium text-gray-500">Duration</th><th className="text-left py-3 px-4 font-medium text-gray-500">Status</th></tr></thead>
                    <tbody>{emis.map((e) => (<tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="py-3 px-4 font-medium text-gray-900">{custName(e.customer_id)}</td><td className="py-3 px-4 text-gray-600">{devLabel(e.device_id)}</td><td className="py-3 px-4 font-medium">{fmt(Number(e.total_amount))}</td><td className="py-3 px-4 text-gray-600">{fmt(Number(e.total_amount) / e.duration_months)}</td><td className="py-3 px-4 text-gray-600">{e.duration_months} months</td><td className="py-3 px-4"><StatusBadge status={e.status} /></td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Collections &amp; Payments</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p className="text-sm text-gray-500">Total Collected</p><p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalCollected)}</p></div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalPending)}</p></div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p className="text-sm text-gray-500">Overdue Payments</p><p className="text-2xl font-bold text-orange-600 mt-1">{payments.filter((p) => p.status === 'overdue').length}</p></div>
              </div>
              {pendingPayments.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-100 text-center"><DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No pending payments.</p></div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th><th className="text-left py-3 px-4 font-medium text-gray-500">Month</th><th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th><th className="text-left py-3 px-4 font-medium text-gray-500">Due Date</th><th className="text-left py-3 px-4 font-medium text-gray-500">Status</th><th className="text-left py-3 px-4 font-medium text-gray-500">Action</th></tr></thead>
                    <tbody>{pendingPayments.map((p) => { const e = emis.find((e) => e.id === p.emi_schedule_id); return (<tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="py-3 px-4 font-medium text-gray-900">{e ? custName(e.customer_id) : '—'}</td><td className="py-3 px-4 text-gray-600">Month {p.month_number}</td><td className="py-3 px-4 font-medium">{fmt(Number(p.amount))}</td><td className="py-3 px-4 text-gray-600">{p.due_date}</td><td className="py-3 px-4"><StatusBadge status={p.status} /></td><td className="py-3 px-4"><button onClick={() => { setPayId(p.id); setShowPay(true); }} className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100 transition">Collect</button></td></tr>); })}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DEALERS */}
          {tab === 'dealers' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">All Dealers</h2>
              <p className="text-sm text-gray-500 bg-white rounded-xl p-6 border border-gray-100">Dealer accounts are created via the Sign Up page with the "Dealer" role selected.</p>
            </div>
          )}

          {/* LOCK/UNLOCK */}
          {tab === 'lock' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-primary-600" />Remote Lock System</h2>
              <p className="text-sm text-gray-500">Lock devices instantly when EMI defaults.</p>
              {devices.length === 0 && <div className="bg-white rounded-xl p-8 border border-gray-100 text-center"><p className="text-gray-400">No devices registered yet.</p></div>}
              <div className="grid md:grid-cols-2 gap-4">
                {devices.filter((d) => d.status === 'active').map((d) => (
                  <div key={d.id} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between shadow-sm">
                    <div><p className="font-medium text-gray-900">{d.device_name}</p><p className="text-xs text-gray-500 font-mono mt-0.5">{d.imei}</p><p className="text-xs text-gray-400">{custName(d.customer_id)}</p></div>
                    <button onClick={() => { setSelectedDev(d); setShowLock(true); }} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition"><Lock className="w-4 h-4" />Lock</button>
                  </div>
                ))}
                {devices.filter((d) => d.status === 'locked').map((d) => (
                  <div key={d.id} className="bg-white rounded-xl p-5 border border-red-200 flex items-center justify-between shadow-sm">
                    <div><p className="font-medium text-gray-900">{d.device_name}</p><p className="text-xs text-gray-500 font-mono mt-0.5">{d.imei}</p><StatusBadge status="locked" /></div>
                    <button onClick={() => unlockDevice(d)} className="flex items-center gap-1 px-4 py-2 bg-green-50 text-green-600 text-sm font-medium rounded-lg hover:bg-green-100 transition"><Unlock className="w-4 h-4" />Unlock</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {tab === 'activity' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-5 h-5 text-primary-600" />System Activity Log</h2>
              {logs.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-100 text-center"><Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No activities yet.</p></div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left py-3 px-4 font-medium text-gray-500">Action</th><th className="text-left py-3 px-4 font-medium text-gray-500">Entity</th><th className="text-left py-3 px-4 font-medium text-gray-500">Detail</th><th className="text-left py-3 px-4 font-medium text-gray-500">Time</th></tr></thead>
                    <tbody>{logs.map((l) => (<tr key={l.id} className="border-b border-gray-50"><td className="py-3 px-4 capitalize text-gray-900">{l.action_type.replace(/_/g, ' ')}</td><td className="py-3 px-4 text-gray-600 capitalize">{l.entity_type.replace(/_/g, ' ')}</td><td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{(l.details as { detail?: string }).detail || ''}</td><td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Customer Modal */}
      <Modal isOpen={showCust} onClose={() => setShowCust(false)} title="Add New Customer">
        <form onSubmit={(e) => { e.preventDefault(); addCustomer(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First Name" value={cust.first_name} onChange={(e) => setCust({ ...cust, first_name: e.target.value })} required className={INPUT} />
            <input placeholder="Last Name" value={cust.last_name} onChange={(e) => setCust({ ...cust, last_name: e.target.value })} required className={INPUT} />
          </div>
          <input placeholder="Email" type="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} required className={INPUT} />
          <input placeholder="Phone" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} required className={INPUT} />
          <input placeholder="Company Name (optional)" value={cust.company_name} onChange={(e) => setCust({ ...cust, company_name: e.target.value })} className={INPUT} />
          <input placeholder="Address" value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} className={INPUT} />
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="City" value={cust.city} onChange={(e) => setCust({ ...cust, city: e.target.value })} className={INPUT} />
            <input placeholder="State" value={cust.state} onChange={(e) => setCust({ ...cust, state: e.target.value })} className={INPUT} />
            <input placeholder="Pincode" value={cust.pincode} onChange={(e) => setCust({ ...cust, pincode: e.target.value })} className={INPUT} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCust(false)} className={BTN_CANCEL}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY}>Add Customer</button>
          </div>
        </form>
      </Modal>

      {/* Register Device Modal */}
      <Modal isOpen={showDev} onClose={() => setShowDev(false)} title="Register Device">
        <form onSubmit={(e) => { e.preventDefault(); registerDevice(); }} className="space-y-3">
          <input placeholder="Device Name" value={dev.device_name} onChange={(e) => setDev({ ...dev, device_name: e.target.value })} required className={INPUT} />
          <input placeholder="Device Model" value={dev.device_model} onChange={(e) => setDev({ ...dev, device_model: e.target.value })} className={INPUT} />
          <div>
            <input placeholder="IMEI (15 digits)" value={dev.imei} onChange={(e) => setDev({ ...dev, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })} required className={INPUT} />
            <p className="text-xs text-gray-400 mt-1">Dial *#06# on the device to get the IMEI number.</p>
          </div>
          <select value={dev.customer_id} onChange={(e) => setDev({ ...dev, customer_id: e.target.value })} className={INPUT + ' bg-white'}>
            <option value="">Assign to Customer (optional)</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowDev(false)} className={BTN_CANCEL}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY}>Register</button>
          </div>
        </form>
      </Modal>

      {/* Create EMI Modal */}
      <Modal isOpen={showEmi} onClose={() => setShowEmi(false)} title="Create EMI Plan">
        <form onSubmit={(e) => { e.preventDefault(); createEmi(); }} className="space-y-3">
          <select value={emi.customer_id} onChange={(e) => setEmi({ ...emi, customer_id: e.target.value })} required className={INPUT + ' bg-white'}>
            <option value="">Select Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
          <select value={emi.device_id} onChange={(e) => setEmi({ ...emi, device_id: e.target.value })} required className={INPUT + ' bg-white'}>
            <option value="">Select Device</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.device_name} — {d.imei}</option>)}
          </select>
          <input placeholder="Total Device Price (₹)" type="number" min="1" value={emi.total_amount} onChange={(e) => setEmi({ ...emi, total_amount: e.target.value })} required className={INPUT} />
          <input placeholder="Duration in Months" type="number" min="1" max="60" value={emi.duration_months} onChange={(e) => setEmi({ ...emi, duration_months: e.target.value })} required className={INPUT} />
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label><input type="date" value={emi.start_date} onChange={(e) => setEmi({ ...emi, start_date: e.target.value })} required className={INPUT} /></div>
          {emi.total_amount && emi.duration_months && (
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 text-sm text-primary-700">
              Monthly EMI: <strong>{fmt(Number(emi.total_amount) / Number(emi.duration_months))}</strong>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowEmi(false)} className={BTN_CANCEL}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY}>Create EMI Plan</button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={showPay} onClose={() => setShowPay(false)} title="Record Payment">
        <form onSubmit={(e) => { e.preventDefault(); recordPayment(); }} className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={INPUT + ' bg-white'}>
              {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'CreditCard'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <input placeholder="Reference / Transaction ID (optional)" value={payRef} onChange={(e) => setPayRef(e.target.value)} className={INPUT} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowPay(false)} className={BTN_CANCEL}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition">Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Lock Device Modal */}
      <Modal isOpen={showLock} onClose={() => setShowLock(false)} title="Lock Device">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            This will remotely lock the device. The customer will be unable to use it until unlocked.
          </div>
          {selectedDev && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p><span className="font-medium">Device:</span> {selectedDev.device_name}</p>
              <p><span className="font-medium">IMEI:</span> <span className="font-mono">{selectedDev.imei}</span></p>
              <p><span className="font-medium">Customer:</span> {custName(selectedDev.customer_id)}</p>
            </div>
          )}
          <textarea placeholder="Reason for locking (e.g. EMI default, reported stolen)..." value={lockReason} onChange={(e) => setLockReason(e.target.value)} className={INPUT + ' resize-none'} rows={3} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowLock(false)} className={BTN_CANCEL}>Cancel</button>
            <button onClick={lockDevice} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">Lock Device</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

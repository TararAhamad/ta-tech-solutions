import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import type { Device, EmiSchedule, Payment, Customer } from '../types';
import { RefreshCw, Smartphone, CreditCard, DollarSign, AlertCircle } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [emis, setEmis] = useState<EmiSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const custRes = await supabase.from('customers').select('*').eq('user_id', user.id).maybeSingle();
      if (custRes.error) throw custRes.error;
      const cust = custRes.data as Customer | null;
      setCustomer(cust);

      if (cust) {
        const [devRes, emiRes] = await Promise.all([
          supabase.from('devices').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false }),
          supabase.from('emi_schedules').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false }),
        ]);
        if (devRes.error) throw devRes.error;
        if (emiRes.error) throw emiRes.error;
        setDevices(devRes.data || []);
        setEmis(emiRes.data || []);

        const emiIds = (emiRes.data || []).map((e: EmiSchedule) => e.id);
        if (emiIds.length > 0) {
          const payRes = await supabase.from('payments').select('*').in('emi_schedule_id', emiIds).order('month_number', { ascending: true });
          if (payRes.error) throw payRes.error;
          setPayments(payRes.data || []);
        } else {
          setPayments([]);
        }
      } else {
        setDevices([]);
        setEmis([]);
        setPayments([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
  const totalPaid = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const nextDue = pendingPayments.length > 0 ? pendingPayments[0] : null;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar activeTab={tab} onTabChange={setTab} />
        <div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-primary-500 animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={tab} onTabChange={setTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
            <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Refresh">
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <Smartphone className="w-8 h-8 text-primary-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
                  <p className="text-sm text-gray-500">My Devices</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <CreditCard className="w-8 h-8 text-orange-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{emis.length}</p>
                  <p className="text-sm text-gray-500">Active Plans</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalPaid)}</p>
                  <p className="text-sm text-gray-500">Total Paid</p>
                </div>
              </div>

              {nextDue && (
                <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-1">Next Payment Due</h3>
                  <p className="text-sm text-orange-700">Month {nextDue.month_number} — {fmt(Number(nextDue.amount))} due on {nextDue.due_date}</p>
                </div>
              )}

              {!customer && (
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <p className="text-gray-500">Your dealer will assign devices to your account.</p>
                  <p className="text-sm text-gray-400 mt-2">Contact Support if you need help.</p>
                </div>
              )}
            </div>
          )}

          {/* My Devices */}
          {tab === 'devices' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">My Devices</h2>
              {devices.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No devices assigned to your account yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map((d) => (
                    <div key={d.id} className="bg-white rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-gray-900">{d.device_name}</p>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-gray-500 font-mono mb-1">IMEI: {d.imei}</p>
                      <p className="text-xs text-gray-500">{d.device_model || 'No model info'}</p>
                      {d.status === 'locked' && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          Device locked. Contact your dealer for assistance.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EMI & Payments */}
          {tab === 'emi' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">EMI & Payments</h2>

              {emis.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No EMI plans assigned to your account yet.</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                      <p className="text-sm text-green-700 font-medium">Total Paid</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalPaid)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                      <p className="text-sm text-red-700 font-medium">Due Amount</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalDue)}</p>
                    </div>
                  </div>

                  {emis.map((emi) => {
                    const emiPayments = payments.filter((p) => p.emi_schedule_id === emi.id);
                    const paid = emiPayments.filter((p) => p.status === 'paid').length;
                    const progress = emiPayments.length > 0 ? (paid / emiPayments.length) * 100 : 0;

                    return (
                      <div key={emi.id} className="bg-white rounded-xl p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-gray-900">EMI Plan — {fmt(Number(emi.total_amount))}</p>
                            <p className="text-sm text-gray-500">{emi.duration_months} months starting {emi.start_date}</p>
                          </div>
                          <StatusBadge status={emi.status} />
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Payment Progress</span>
                            <span>{paid}/{emiPayments.length} paid</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-3 font-medium text-gray-500">Month</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-500">Amount</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-500">Due Date</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emiPayments.map((p) => (
                                <tr key={p.id} className="border-b border-gray-50">
                                  <td className="py-2 px-3">Month {p.month_number}</td>
                                  <td className="py-2 px-3 font-medium">{fmt(Number(p.amount))}</td>
                                  <td className="py-2 px-3 text-gray-600">{p.due_date}</td>
                                  <td className="py-2 px-3"><StatusBadge status={p.status} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

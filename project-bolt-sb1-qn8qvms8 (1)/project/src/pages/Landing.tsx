import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Lock, CreditCard, Users, BarChart2, Zap } from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'Device Management',
    desc: 'Register devices with IMEI. Track ownership and status.',
  },
  {
    icon: Lock,
    title: 'Remote Lock/Unlock',
    desc: 'Secure devices remotely when EMI payments default.',
  },
  {
    icon: CreditCard,
    title: 'EMI Collection',
    desc: 'Create EMI plans and collect payments with full tracking.',
  },
  {
    icon: Users,
    title: 'Customer Database',
    desc: 'Manage customers with contact details and device history.',
  },
];

const steps = [
  {
    title: 'Register Devices',
    desc: 'Add devices with IMEI numbers and assign to customers',
  },
  {
    title: 'Create EMI Plans',
    desc: 'Set up EMI schedules with auto-generated payment records',
  },
  {
    title: 'Track & Collect',
    desc: 'Monitor payments and secure devices when needed',
  },
];

const securityPoints = [
  'Row-Level Security - users only see their own data',
  'JWT Authentication with secure sessions',
  'Complete activity audit trail',
  'Real-time data synchronization',
];

const activityLogs = [
  'customer added',
  'device registered',
  'payment recorded',
  'device locked',
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TA</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">TA Tech Solutions</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#workflow" className="text-sm text-gray-600 hover:text-gray-900 transition">How It Works</a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900 transition px-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 pt-16 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full mb-6">
              <Shield className="w-4 h-4" />
              Trusted EMI Management Platform
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
              Complete EMI &amp; Device<br />
              <span className="text-primary-600">Security Solution</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
              Manage customer EMIs, track devices by IMEI, collect payments, and
              remotely secure devices when needed. Built for mobile dealers,
              distributors, and retailers.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              Login to Dashboard
            </button>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-900">Dealer Dashboard</h3>
                <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Active Devices</p>
                  <p className="text-xl font-bold text-gray-700">--</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Collections</p>
                  <p className="text-xl font-bold text-primary-500">--</p>
                </div>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Remote Lock System</p>
                  <p className="text-gray-400 text-xs">Lock devices instantly when EMI defaults</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need</h2>
            <p className="text-gray-500">A complete platform to manage EMIs, devices, and customers from one dashboard.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-md transition">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple Workflow */}
      <section id="workflow" className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple Workflow</h2>
            <p className="text-gray-500">Get started in minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-white text-xl font-bold">{i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Security */}
      <section className="bg-slate-900 py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">Enterprise-Grade Security</h2>
            <div className="space-y-5">
              {securityPoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-300">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Activity Logging Card */}
          <div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">Activity Logging</h3>
              </div>
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-4 py-3">
                    <span className="text-gray-300 text-sm">{log}</span>
                    <span className="text-green-400 text-sm font-medium">logged</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 border-t border-slate-800 pt-12 pb-6 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TA</span>
                </div>
                <span className="text-white font-semibold">TA Tech Solutions</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                EMI &amp; Device Management Platform for mobile dealers and distributors.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <div className="space-y-3">
                <a onClick={() => navigate('/signup')} className="block text-gray-400 text-sm hover:text-white transition cursor-pointer">Sign Up</a>
                <a onClick={() => navigate('/login')} className="block text-gray-400 text-sm hover:text-white transition cursor-pointer">Login</a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>Tarar Ahamad</p>
                <p>+91 7818848908</p>
                <p>tararahamad8@gmail.com</p>
                <p>Delhi, India</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-gray-500 text-sm">© 2026 TA Tech Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

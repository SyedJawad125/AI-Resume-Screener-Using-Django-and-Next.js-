'use client';
import React, { useState, useRef } from 'react';
import AxiosInstance from "@/components/AxiosInstance";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

const PLAN_OPTIONS: { value: SubscriptionPlan; label: string; description: string; color: string }[] = [
  { value: 'free',         label: 'Free',         description: 'Up to 50 screenings/month',   color: 'from-slate-500/30 to-slate-600/30'   },
  { value: 'starter',      label: 'Starter',      description: 'Up to 100 screenings/month',  color: 'from-blue-500/30 to-cyan-500/30'     },
  { value: 'professional', label: 'Professional', description: 'Up to 500 screenings/month',  color: 'from-amber-500/30 to-yellow-500/30'  },
  { value: 'enterprise',   label: 'Enterprise',   description: 'Unlimited screenings',         color: 'from-purple-500/30 to-violet-500/30' },
];

const PLAN_ACTIVE: Record<SubscriptionPlan, string> = {
  free:         'border-slate-400/60  shadow-slate-400/20  bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-200',
  starter:      'border-blue-400/60   shadow-blue-400/20   bg-gradient-to-br from-blue-500/20  to-cyan-500/20  text-blue-200',
  professional: 'border-amber-400/60  shadow-amber-400/20  bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-200',
  enterprise:   'border-purple-400/60 shadow-purple-400/20 bg-gradient-to-br from-purple-500/20 to-violet-500/20 text-purple-200',
};

export default function AddCompany() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name:                    '',
    email:                   '',
    phone:                   '',
    address:                 '',
    website:                 '',
    description:             '',
    subscription_plan:       'free' as SubscriptionPlan,
    monthly_screening_limit: 50,
    is_active:               true,
  });

  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);

  // ── Field handlers ─────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) { toast.error('Company name is required.'); return; }
    if (!formData.email.trim()) { toast.error('Email is required.'); return; }

    setIsLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, val]) => payload.append(key, String(val)));
      if (logoFile) payload.append('logo', logoFile);

      await AxiosInstance.post('/api/user/v1/company/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Company created successfully!');
      setTimeout(() => router.push('/company'), 1500);
    } catch (error: any) {
      console.error('Error creating company:', error);
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to create company.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black py-16 px-4 relative overflow-hidden">

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-yellow-500/8 to-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/5 to-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <ToastContainer />

      <div className="relative max-w-4xl mx-auto">
        {/* Card */}
        <div className="backdrop-blur-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-3xl border border-amber-400/30 shadow-2xl shadow-amber-500/20 p-10 relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 animate-pulse opacity-30 pointer-events-none"></div>
          <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-2xl pointer-events-none"></div>

          <div className="relative z-10">

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-2xl shadow-amber-500/50 mb-6">
                <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9zm-4 4h2v2H7v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent mb-3 tracking-tight">
                Add Company
              </h2>
              <p className="text-slate-400 text-lg">Register a new tenant and configure its plan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ── Logo upload ── */}
              <div className="flex flex-col items-center space-y-3">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-amber-400/40 hover:border-amber-400/70 bg-slate-900/50 hover:bg-slate-800/60 flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden group"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-amber-400/50 group-hover:text-amber-400/80 mx-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">Logo</p>
                    </div>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <p className="text-xs text-slate-500">Click to upload logo (max 2 MB)</p>
              </div>

              {/* ── Row 1: Name + Email ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Company Name" icon={nameIcon} required>
                  <input
                    type="text" name="name" placeholder="e.g. Acme Corp"
                    value={formData.name} onChange={handleChange} required
                    className={inputCls}
                  />
                </Field>
                <Field label="Email" icon={emailIcon} required>
                  <input
                    type="email" name="email" placeholder="contact@company.com"
                    value={formData.email} onChange={handleChange} required
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* ── Row 2: Phone + Website ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Phone" icon={phoneIcon}>
                  <input
                    type="text" name="phone" placeholder="+1-555-0100"
                    value={formData.phone} onChange={handleChange}
                    className={inputCls}
                  />
                </Field>
                <Field label="Website" icon={websiteIcon}>
                  <input
                    type="url" name="website" placeholder="https://company.com"
                    value={formData.website} onChange={handleChange}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* ── Address ── */}
              <Field label="Address" icon={addressIcon}>
                <input
                  type="text" name="address" placeholder="123 Main St, City, Country"
                  value={formData.address} onChange={handleChange}
                  className={inputCls}
                />
              </Field>

              {/* ── Description ── */}
              <Field label="Description" icon={descIcon}>
                <textarea
                  name="description" placeholder="Brief description of the company…"
                  value={formData.description} onChange={handleChange}
                  rows={3} className={`${inputCls} resize-none`}
                />
              </Field>

              {/* ── Subscription Plan ── */}
              <div className="space-y-4">
                <label className={labelCls}>
                  {planIcon}
                  Subscription Plan
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PLAN_OPTIONS.map(plan => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, subscription_plan: plan.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        formData.subscription_plan === plan.value
                          ? `${PLAN_ACTIVE[plan.value]} shadow-lg scale-105`
                          : 'border-slate-700/40 bg-slate-900/40 text-slate-400 hover:border-slate-600/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <p className="font-bold text-sm">{plan.label}</p>
                      <p className="text-xs opacity-70 mt-0.5 leading-tight">{plan.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Screening Limit + Active ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Monthly Screening Limit" icon={screeningIcon}>
                  <input
                    type="number" name="monthly_screening_limit" min={0}
                    placeholder="50 (0 = unlimited)"
                    value={formData.monthly_screening_limit} onChange={handleChange}
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-500 mt-1.5 pl-1">Set 0 for unlimited screenings</p>
                </Field>

                <div className="space-y-3">
                  <label className={labelCls}>{statusIcon} Status</label>
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      formData.is_active
                        ? 'border-green-400/50 bg-green-500/10 shadow-lg shadow-green-500/10'
                        : 'border-slate-700/40 bg-slate-900/40 hover:border-slate-600/60'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${formData.is_active ? 'text-green-300' : 'text-slate-400'}`}>
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Company is {formData.is_active ? 'visible and operational' : 'hidden from system'}</p>
                    </div>
                    {/* Toggle pill */}
                    <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${formData.is_active ? 'bg-green-500' : 'bg-slate-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${formData.is_active ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex items-center justify-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/company')}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-600 hover:border-slate-500 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative px-12 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-900 font-bold text-lg rounded-full shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm4 0h2v2h-2V5z" clipRule="evenodd" />
                    </svg>
                    <span>{isLoading ? 'Creating…' : 'Create Company'}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 flex items-center justify-center space-x-2 text-sm">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure Multi-Tenant Company Management</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-5 py-4 rounded-xl bg-slate-900/60 border-2 border-slate-700/50 text-amber-100 placeholder-slate-500 focus:border-amber-400 focus:bg-slate-900/80 focus:shadow-lg focus:shadow-amber-500/20 transition-all duration-300 outline-none backdrop-blur-sm';

const labelCls =
  'text-amber-300 font-semibold text-sm uppercase tracking-wider flex items-center gap-2';

function Field({ label, icon, required, children }: { label: string; icon: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className={labelCls}>
        {icon}
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative group">
        {children}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/0 to-yellow-500/0 group-focus-within:from-amber-500/5 group-focus-within:to-yellow-500/5 transition-all duration-300 pointer-events-none"></div>
      </div>
    </div>
  );
}

// ── Icon snippets ─────────────────────────────────────────────────────────────
const nameIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm4 0h2v2h-2V5z" clipRule="evenodd" />
  </svg>
);
const emailIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
  </svg>
);
const phoneIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
  </svg>
);
const websiteIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
  </svg>
);
const addressIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);
const descIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);
const planIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const screeningIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);
const statusIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
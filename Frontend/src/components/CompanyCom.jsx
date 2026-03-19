import React, { useEffect, useState, useContext } from 'react';
import AxiosInstance from "@/components/AxiosInstance";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from '@/components/AuthContext';

const PLAN_CONFIG = {
  free:         { label: 'Free',         color: 'from-slate-500/20 to-slate-600/20',  text: 'text-slate-300',  border: 'border-slate-500/30'  },
  starter:      { label: 'Starter',      color: 'from-blue-500/20 to-cyan-500/20',    text: 'text-blue-300',   border: 'border-blue-500/30'   },
  professional: { label: 'Professional', color: 'from-amber-500/20 to-yellow-500/20', text: 'text-amber-300',  border: 'border-amber-500/30'  },
  enterprise:   { label: 'Enterprise',   color: 'from-purple-500/20 to-violet-500/20',text: 'text-purple-300', border: 'border-purple-500/30' },
};

const PlanBadge = ({ plan }) => {
  const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${cfg.color} ${cfg.text} border ${cfg.border} backdrop-blur-sm`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {cfg.label}
    </span>
  );
};

const CompanyCom = () => {
  const router = useRouter();
  const { permissions = {} } = useContext(AuthContext);

  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [pagination, setPagination]       = useState({
    page: 1, limit: 10, total: 0, totalPages: 1
  });

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchCompanies = async (page = 1) => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get('/api/user/v1/company/', {
        params: { page, limit: pagination.limit }
      });
      if (response.data && response.data.data) {
        setCompaniesList(response.data.data);
        setPagination(prev => ({
          ...prev,
          page,
          total:      response.data.count || response.data.data.length,
          totalPages: Math.ceil((response.data.count || response.data.data.length) / prev.limit)
        }));
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Error fetching companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(1); }, []);

  // ── Pagination ─────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchCompanies(newPage);
    }
  };

  // ── CRUD helpers ───────────────────────────────────────────────
  const updateCompany = (id) => router.push(`/updatecompany?id=${id}`);

  const deleteCompany = async (id) => {
    try {
      // Backend: DELETE /api/user/v1/company/?id=  (query param, not path param)
      const res = await AxiosInstance.delete('/api/user/v1/company/', { params: { id } });
      toast.success(res.data?.message || 'Company deleted successfully!');

      const newTotal      = pagination.total - 1;
      const newTotalPages = Math.ceil(newTotal / pagination.limit) || 1;
      const newPage       = Math.max(1, Math.min(pagination.page, newTotalPages));

      setPagination(prev => ({ ...prev, total: newTotal, totalPages: newTotalPages, page: newPage }));
      setCompaniesList(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Delete company error:', error);
      if (error.response) {
        const { status, data } = error.response;
        const msg = data?.detail || data?.message || 'Error deleting company';
        switch (status) {
          case 400: toast.error(msg);  break; // active users linked or ID not provided
          case 401: toast.error('You are not authorized to delete companies'); break;
          case 403: toast.error("You don't have permission to delete companies"); break;
          case 404: toast.error(msg);  break;
          case 500: toast.error(msg);  break;
          default:  toast.error(msg);
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Unexpected error occurred while deleting company');
      }
    }
  };

  // ── Access guard ───────────────────────────────────────────────
  // Permission: read_company  (code_name from Permission model)
  if (!permissions.read_company) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl text-amber-400 mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">
            You don&apos;t have permission to view Companies. Please contact your administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-amber-600 rounded-full hover:bg-amber-700 text-white"
          >
            Return to Dashboard
          </button>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  // ── Shared page-button class helper ────────────────────────────
  const pageBtn = (active, disabled) => {
    if (disabled) return 'text-slate-600 bg-slate-800/30 border border-slate-700/30 cursor-not-allowed';
    if (active)   return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30 scale-110';
    return 'text-slate-300 bg-gradient-to-r from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:from-amber-500/20 hover:to-yellow-500/20 hover:border-amber-400/50 hover:text-amber-200 hover:scale-105 backdrop-blur-sm';
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8 relative overflow-hidden">

      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-amber-500/8 to-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-yellow-500/6 to-amber-500/6 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/4 to-yellow-500/4 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9zm-4 4h2v2H7v-2zm4 0h2v2h-2v-2z"
                  clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                Companies Management
              </h1>
              <p className="text-slate-400 text-lg mt-1">Manage tenants, plans and company profiles</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm flex-wrap gap-y-2">
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900/60 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300">Total: <span className="text-amber-300 font-semibold">{pagination.total}</span> records</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900/60 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-slate-300">
                  Page <span className="text-amber-300 font-semibold">{pagination.page}</span> of{' '}
                  <span className="text-amber-300 font-semibold">{pagination.totalPages}</span>
                </span>
              </div>
            </div>

            {/* Permission: create_company */}
            {permissions.create_company && (
              <button
                onClick={() => router.push('/addcompany')}
                className="group relative px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-semibold rounded-full shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Add Company</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ── Skeleton loader ── */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(pagination.limit)].map((_, i) => (
              <div key={i} className="backdrop-blur-xl bg-gradient-to-r from-slate-900/60 to-slate-800/40 rounded-2xl border border-slate-700/30 shadow-xl p-6 animate-pulse">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2 h-6 bg-slate-700/50 rounded-lg"></div>
                  <div className="col-span-2 h-6 bg-slate-700/50 rounded-lg"></div>
                  <div className="col-span-2 h-6 bg-slate-700/50 rounded-lg"></div>
                  <div className="col-span-2 h-6 bg-slate-700/50 rounded-lg"></div>
                  <div className="col-span-2 h-6 bg-slate-700/50 rounded-lg"></div>
                  <div className="col-span-1 h-6 bg-slate-700/50 rounded-lg"></div>
                  <div className="col-span-1 h-6 bg-slate-700/50 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>

        ) : (
          <>
            {/* ── Table container ── */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-2xl border border-amber-400/20 shadow-2xl shadow-amber-500/10 overflow-hidden">

              {/* Table header */}
              <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-b border-amber-400/20">
                <div className="grid grid-cols-12 gap-3 px-8 py-4">
                  <div className="col-span-2 font-semibold text-amber-300 text-xs uppercase tracking-wider">Company</div>
                  <div className="col-span-2 font-semibold text-amber-300 text-xs uppercase tracking-wider">Slug</div>
                  <div className="col-span-2 font-semibold text-amber-300 text-xs uppercase tracking-wider">Contact</div>
                  <div className="col-span-2 font-semibold text-amber-300 text-xs uppercase tracking-wider">Plan</div>
                  <div className="col-span-2 font-semibold text-amber-300 text-xs uppercase tracking-wider">Screening Limit</div>
                  <div className="col-span-1 font-semibold text-amber-300 text-xs uppercase tracking-wider">Status</div>
                  <div className="col-span-1 font-semibold text-amber-300 text-xs uppercase tracking-wider text-right">Actions</div>
                </div>
              </div>

              {/* Data rows */}
              <div className="divide-y divide-slate-700/30">
                {companiesList.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-slate-600/30 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm4 0h2v2h-2V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <p className="text-slate-400 text-lg font-medium">No companies found</p>
                    <p className="text-slate-500 text-sm mt-1">Add your first company to get started</p>
                  </div>
                ) : (
                  companiesList.map((company, index) => (
                    <div
                      key={company.id}
                      className={`grid grid-cols-12 gap-3 items-center px-8 py-5 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-yellow-500/5 transition-all duration-300 group ${
                        index % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'
                      }`}
                    >
                      {/* Company name + logo */}
                      <div className="col-span-2 flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-amber-400/10 to-yellow-500/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-amber-300">
                              {company.name?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-amber-100 font-semibold text-sm group-hover:text-amber-200 transition-colors truncate" title={company.name}>
                            {company.name}
                          </p>
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-500 hover:text-amber-400 transition-colors truncate block max-w-[120px]"
                              title={company.website}
                              onClick={e => e.stopPropagation()}
                            >
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Slug */}
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/25 backdrop-blur-sm font-mono truncate max-w-full"
                          title={company.slug}
                        >
                          /{company.slug || '—'}
                        </span>
                      </div>

                      {/* Contact */}
                      <div className="col-span-2 space-y-1">
                        {company.email && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <svg className="w-3 h-3 text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                            <span className="text-slate-300 text-xs truncate" title={company.email}>{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                            </svg>
                            <span className="text-slate-300 text-xs">{company.phone}</span>
                          </div>
                        )}
                        {!company.email && !company.phone && (
                          <span className="text-slate-500 italic text-xs">No contact</span>
                        )}
                      </div>

                      {/* Plan */}
                      <div className="col-span-2">
                        <PlanBadge plan={company.subscription_plan} />
                      </div>

                      {/* Screening limit */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                              style={{
                                width: company.monthly_screening_limit === 0
                                  ? '100%'
                                  : `${Math.min(100, (company.monthly_screening_limit / 200) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-amber-200 text-sm font-semibold">
                            {company.monthly_screening_limit === 0 ? '∞' : company.monthly_screening_limit}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        {company.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-300 border border-green-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Actions — Permission: update_company / delete_company */}
                      <div className="col-span-1 flex justify-end space-x-2">
                        {permissions.update_company && (
                          <button
                            onClick={() => updateCompany(company.id)}
                            className="group/btn p-2.5 text-slate-400 hover:text-blue-300 bg-slate-800/30 hover:bg-blue-500/20 rounded-xl border border-slate-700/50 hover:border-blue-400/50 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                            title="Edit Company"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        )}
                        {permissions.delete_company && (
                          <button
                            onClick={() => deleteCompany(company.id)}
                            className="group/btn p-2.5 text-slate-400 hover:text-red-300 bg-slate-800/30 hover:bg-red-500/20 rounded-xl border border-slate-700/50 hover:border-red-400/50 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                            title="Delete Company"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Pagination ── */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 px-2">
                <div className="px-6 py-3 bg-gradient-to-r from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <span className="text-slate-400 text-sm">
                    Showing{' '}
                    <span className="font-semibold text-amber-300">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-semibold text-amber-300">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}
                    of <span className="font-semibold text-amber-300">{pagination.total}</span> results
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${pageBtn(false, pagination.page === 1)}`}
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let p;
                      if      (pagination.totalPages <= 5)                   p = i + 1;
                      else if (pagination.page <= 3)                         p = i + 1;
                      else if (pagination.page >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                      else                                                   p = pagination.page - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-12 h-12 rounded-xl font-semibold transition-all duration-300 ${pageBtn(pagination.page === p, false)}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${pageBtn(false, pagination.page === pagination.totalPages)}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default CompanyCom;



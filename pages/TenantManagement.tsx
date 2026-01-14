
import React, { useState } from 'react';
import { Tenant } from '../types';

interface TenantManagementProps {
  tenants: Tenant[];
  onAddTenant: (t: Tenant) => void;
  onUpdateTenant: (t: Tenant) => void;
  onDeleteTenant: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ 
  tenants, onAddTenant, onUpdateTenant, onDeleteTenant, onToggleStatus 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({ name: '', domain: '' });

  const openModal = (tenant: Tenant | null = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({ name: tenant.name, domain: tenant.domain });
    } else {
      setEditingTenant(null);
      setFormData({ name: '', domain: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      onUpdateTenant({ ...editingTenant, ...formData });
    } else {
      onAddTenant({
        id: `t-${Date.now()}`,
        name: formData.name,
        domain: formData.domain,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Global Corporate Hub</h3>
          <p className="text-sm text-slate-500">Corporate isolation and entity lifecycle management</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-violet-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span>➕</span> Provision Company
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-2 group">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl font-black text-violet-600 border border-violet-100 shadow-sm group-hover:bg-violet-600 group-hover:text-white transition-colors duration-500">
                  {tenant.name.charAt(0)}
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  tenant.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {tenant.status}
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 truncate uppercase tracking-tight">{tenant.name}</h4>
              <p className="text-xs font-black text-violet-600/60 mb-8 uppercase tracking-widest">{tenant.domain}</p>
              
              <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Activation Node</span>
                  <span className="text-slate-800 font-bold">{tenant.createdAt}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Isolation ID</span>
                  <span className="text-slate-800 font-bold font-mono">{tenant.id}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
              <button 
                onClick={() => openModal(tenant)}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 hover:bg-violet-100 py-3 rounded-xl transition-all border border-violet-100 shadow-sm active:scale-95"
              >
                Configure
              </button>
              <button
                onClick={() => onToggleStatus(tenant.id)}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95"
              >
                {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
              </button>
              <button
                onClick={() => { if(confirm(`Delete ${tenant.name} and all associated data?`)) onDeleteTenant(tenant.id); }}
                className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                title="Wipe Data"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 overflow-hidden animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">{editingTenant ? 'Edit' : 'Provision'} Corporate Identity</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Entity Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all font-bold text-slate-700" placeholder="E.g. SpaceX" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Digital Domain</label>
                <input required type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all font-bold text-slate-700" placeholder="spacex.com" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-600 hover:bg-slate-200 transition-all order-2 sm:order-1">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-violet-700 shadow-2xl shadow-violet-100 transition-all active:scale-95 order-1 sm:order-2">Save Assets</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;

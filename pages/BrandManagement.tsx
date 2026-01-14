
import React, { useState } from 'react';
import { Brand, Tenant, User, UserRole, Role } from '../types';

interface BrandManagementProps {
  brands: Brand[];
  tenants: Tenant[];
  currentUser: User;
  currentUserRoleDetails: Role | null;
  onAddBrand: (brand: Brand) => void;
  onUpdateBrand: (brand: Brand) => void;
  onDeleteBrand: (id: string) => void;
}

const BrandManagement: React.FC<BrandManagementProps> = ({
  brands, tenants, currentUser, currentUserRoleDetails, onAddBrand, onUpdateBrand, onDeleteBrand
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '', tenantId: '', description: '', status: 'Active' as 'Active' | 'Inactive' });

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const canManage = isSuperAdmin || currentUserRoleDetails?.permissions.includes('brands:manage');

  const visibleBrands = isSuperAdmin 
    ? brands 
    : brands.filter(b => b.tenantId === currentUser.tenantId && (canManage || currentUser.assignedBrands.includes(b.id)));

  const openModal = (brand: Brand | null = null) => {
    if (!canManage) return;
    if (brand) {
      setEditingBrand(brand);
      setFormData({ 
        name: brand.name, 
        tenantId: brand.tenantId, 
        description: brand.description || '', 
        status: brand.status 
      });
    } else {
      setEditingBrand(null);
      setFormData({ 
        name: '', 
        tenantId: isSuperAdmin ? '' : (currentUser.tenantId || ''), 
        description: '', 
        status: 'Active' 
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      onUpdateBrand({ ...editingBrand, ...formData });
    } else {
      onAddBrand({
        id: `b-${Date.now()}`,
        name: formData.name,
        tenantId: formData.tenantId,
        description: formData.description,
        status: formData.status
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Portfolio Brand Assets</h3>
          <p className="text-sm text-slate-500">
            {isSuperAdmin ? 'Global brand governance across all Sofverse entities' : `Brands for ${tenants.find(t => t.id === currentUser.tenantId)?.name}`}
          </p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="w-full sm:w-auto bg-violet-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all flex items-center justify-center gap-2 active:scale-95">
            <span>➕</span> Launch Brand
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleBrands.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-inner">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">No active brand assets identified in this scope.</p>
          </div>
        ) : visibleBrands.map(brand => {
          const tenant = tenants.find(t => t.id === brand.tenantId);
          return (
            <div key={brand.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-1.5 group">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl font-black text-violet-600 border border-violet-100 shadow-sm group-hover:bg-violet-600 group-hover:text-white transition-colors duration-500">
                    {brand.name.charAt(0)}
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    brand.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                  }`}>
                    {brand.status}
                  </span>
                </div>
                <h4 className="text-xl font-black text-slate-800 truncate uppercase tracking-tight mb-2">{brand.name}</h4>
                <p className="text-xs font-medium text-slate-500 line-clamp-3 min-h-[48px] leading-relaxed">{brand.description || 'No asset documentation provided.'}</p>
                
                {isSuperAdmin && (
                  <div className="mt-6 flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietary:</span>
                    <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100 uppercase tracking-tighter">{tenant?.name}</span>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                  <button 
                    onClick={() => openModal(brand)}
                    className="flex-1 text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 hover:bg-violet-100 py-3 rounded-xl transition-all border border-violet-100 active:scale-95"
                  >
                    Configure
                  </button>
                  <button
                    onClick={() => { if(confirm(`Delete brand ${brand.name}?`)) onDeleteBrand(brand.id); }}
                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 text-slate-800">
              <h3 className="text-xl font-black uppercase tracking-tight">{editingBrand ? 'Modify Asset' : 'Ingest New Brand'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Brand Identifier</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all font-bold text-slate-700" placeholder="E.g. Neuralink" />
                </div>
                {isSuperAdmin && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Assigned Corporate Hub</label>
                    <select required value={formData.tenantId} onChange={e => setFormData({...formData, tenantId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 font-bold text-slate-700 appearance-none">
                      <option value="">Select an entity</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Asset Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all h-28 resize-none font-medium leading-relaxed" placeholder="Positioning strategy..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Activation Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 font-bold text-slate-700 appearance-none">
                    <option value="Active">Active Asset</option>
                    <option value="Inactive">Offline / Vaulted</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all order-2 sm:order-1">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-violet-700 shadow-2xl shadow-violet-100 transition-all active:scale-95 order-1 sm:order-2">
                  {editingBrand ? 'Commit Changes' : 'Initialize Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManagement;

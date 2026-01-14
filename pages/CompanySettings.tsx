
import React, { useState, useEffect } from 'react';
import { Tenant, UserRole, User } from '../types.ts';

interface CompanySettingsProps {
  currentTenant: Tenant | null;
  onUpdateTenant: (t: Tenant) => void;
  currentUser: User;
  globalSettings: { globalAppName: string; globalPrimaryColor: string };
  onUpdateGlobalSettings: (settings: { globalAppName: string; globalPrimaryColor: string }) => void;
}

export default function CompanySettings({ 
  currentTenant, 
  onUpdateTenant, 
  currentUser,
  globalSettings,
  onUpdateGlobalSettings
}: CompanySettingsProps) {
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  
  const [formData, setFormData] = useState({ 
    name: '', 
    domain: '', 
    primaryColor: '#7c3aed', 
    customAppName: 'Sofverse' 
  });

  const [globalForm, setGlobalForm] = useState({
    appName: globalSettings.globalAppName,
    primaryColor: globalSettings.globalPrimaryColor
  });

  useEffect(() => {
    if (currentTenant) {
      setFormData({ 
        name: currentTenant.name, 
        domain: currentTenant.domain,
        primaryColor: currentTenant.primaryColor || '#7c3aed',
        customAppName: currentTenant.customAppName || 'Sofverse'
      });
    }
  }, [currentTenant]);

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTenant) {
      onUpdateTenant({ ...currentTenant, ...formData });
      alert("Company white-label parameters updated.");
    }
  };

  const handleGlobalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGlobalSettings({
      globalAppName: globalForm.appName,
      globalPrimaryColor: globalForm.primaryColor
    });
    alert("Global system branding updated.");
  };

  const colorPresets = ['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#0f172a'];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* Global Settings (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 p-8 text-white">
            <h3 className="text-2xl font-black uppercase tracking-tight">System Global Branding</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Master configuration for the entire SOFVERSE instance</p>
          </div>
          <form onSubmit={handleGlobalSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Global App Name</label>
                <input required type="text" value={globalForm.appName} onChange={e => setGlobalForm({...globalForm, appName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:bg-white outline-none transition-all font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Global Theme Color</label>
                <div className="flex items-center gap-4">
                  <input type="color" value={globalForm.primaryColor} onChange={e => setGlobalForm({...globalForm, primaryColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                  <input type="text" value={globalForm.primaryColor} onChange={e => setGlobalForm({...globalForm, primaryColor: e.target.value})} className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm uppercase" />
                </div>
              </div>
            </div>
            <button type="submit" className="px-10 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-95">Apply Global Changes</button>
          </form>
        </div>
      )}

      {/* Company Specific Branding */}
      {currentTenant && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Company White-Label</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Branding overrides for {currentTenant.name}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: formData.primaryColor }}>{formData.customAppName.charAt(0)}</div>
          </div>
          <form onSubmit={handleTenantSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">White-Label App Name</label>
                <input required type="text" value={formData.customAppName} onChange={e => setFormData({...formData, customAppName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Brand Color Palette</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {colorPresets.map(color => (
                    <button key={color} type="button" onClick={() => setFormData({...formData, primaryColor: color})} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.primaryColor === color ? 'border-slate-900 scale-125' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
                <input type="text" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm uppercase" />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-10 py-4 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all active:scale-95" style={{ backgroundColor: formData.primaryColor }}>Save Identity Updates</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

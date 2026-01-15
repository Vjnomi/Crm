
import React, { useState, useEffect } from 'react';
import { Tenant, UserRole, User, AppSettings, AppTheme } from '../types.ts';
import { APP_THEMES } from '../constants.tsx';

interface CompanySettingsProps {
  currentTenant: Tenant | null;
  onUpdateTenant: (t: Tenant) => void;
  currentUser: User;
  globalSettings: AppSettings;
  onUpdateGlobalSettings: (settings: AppSettings) => void;
  onToggleDarkMode: () => void;
}

export default function CompanySettings({ 
  currentTenant, 
  onUpdateTenant, 
  currentUser,
  globalSettings,
  onUpdateGlobalSettings,
  onToggleDarkMode
}: CompanySettingsProps) {
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  
  const [tenantFormData, setTenantFormData] = useState({ 
    customAppName: 'Sofverse',
    navigationOrder: [] as string[],
    theme: APP_THEMES[0] as AppTheme
  });

  const [globalForm, setGlobalForm] = useState({
    appName: globalSettings.globalAppName,
    navigationOrder: globalSettings.globalNavigationOrder,
    theme: globalSettings.globalTheme
  });

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tenants', label: 'Companies', icon: '🏢' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'roles', label: 'Roles & Permissions', icon: '🔐' },
    { id: 'brands', label: 'Brands', icon: '🏷️' },
    { id: 'leads', label: 'Leads', icon: '⚡' },
    { id: 'connections', label: 'Connections', icon: '🤝' },
    { id: 'clients', label: 'Portfolio', icon: '💼' },
    { id: 'projects', label: 'Operations', icon: '🏗️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  useEffect(() => {
    if (currentTenant) {
      setTenantFormData({ 
        customAppName: currentTenant.customAppName || 'Sofverse',
        navigationOrder: currentTenant.navigationOrder || globalSettings.globalNavigationOrder,
        theme: (currentTenant.theme as AppTheme) || APP_THEMES[0]
      });
    }
  }, [currentTenant, globalSettings]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number, list: string[], setList: (newList: string[]) => void) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newList = [...list];
    const draggedItem = newList[draggedItemIndex];
    newList.splice(draggedItemIndex, 1);
    newList.splice(index, 0, draggedItem);
    setList(newList);
    setDraggedItemIndex(index);
  };

  const NavDraggableList = ({ list, onUpdate }: { list: string[], onUpdate: (newList: string[]) => void }) => (
    <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-theme">
      <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.2em] mb-4">Sidebar Interface Order (Drag to Reorder)</p>
      {list.map((id, index) => {
        const item = allNavItems.find(i => i.id === id);
        if (!item) return null;
        return (
          <div 
            key={id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index, list, onUpdate)}
            onDragEnd={() => setDraggedItemIndex(null)}
            className={`flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-theme shadow-sm cursor-grab active:cursor-grabbing transition-all ${draggedItemIndex === index ? 'opacity-20 scale-95' : 'opacity-100'}`}
          >
            <span className="text-slate-300 dark:text-slate-600 font-black">⠿</span>
            <span className="text-lg">{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-widest theme-text-main">{item.label}</span>
          </div>
        );
      })}
    </div>
  );

  const ThemePicker = ({ selectedTheme, onSelect, onColorChange }: { selectedTheme: AppTheme, onSelect: (t: AppTheme) => void, onColorChange: (key: keyof AppTheme, val: string) => void }) => (
    <div className="space-y-10">
      <div>
        <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.2em] mb-6">Corporate Theme Presets</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {APP_THEMES.map(theme => (
            <button 
              key={theme.id}
              onClick={() => onSelect(theme)}
              className={`p-4 rounded-3xl border-2 transition-all text-left group ${selectedTheme.id === theme.id ? 'border-primary ring-4 ring-primary/10' : 'border-theme hover:border-slate-300'}`}
              style={{ '--tw-ring-color': theme.primary } as any}
            >
              <div className="flex gap-1 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }}></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-tight theme-text-main">{theme.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 theme-surface rounded-[2.5rem] border border-theme shadow-inner">
        <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.2em] mb-8">Granular Branding Tokens</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { key: 'primary', label: 'Primary Brand' },
            { key: 'secondary', label: 'Secondary Brand' },
            { key: 'accent', label: 'Accent Brand' },
            { key: 'bgApp', label: 'Application Background' },
            { key: 'bgSurface', label: 'Surface Background' },
            { key: 'textMain', label: 'Main Text' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-[9px] font-black theme-text-muted uppercase mb-3 tracking-widest">{label}</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={(selectedTheme as any)[key]} 
                  onChange={e => onColorChange(key as keyof AppTheme, e.target.value)} 
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" 
                />
                <input 
                  type="text" 
                  value={(selectedTheme as any)[key]} 
                  onChange={e => onColorChange(key as keyof AppTheme, e.target.value)} 
                  className="flex-1 px-4 py-3 theme-bg border border-theme rounded-xl font-mono text-[10px] uppercase tracking-widest theme-text-main" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      
      {/* Global Instance Settings */}
      {isSuperAdmin && (
        <div className="theme-surface rounded-[3.5rem] border border-theme shadow-sm overflow-hidden">
          <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
            <div>
              <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Global Master Control</h3>
              <p className="text-slate-400 text-[10px] font-black mt-3 uppercase tracking-[0.3em] opacity-60">System-wide inheritance configurations</p>
            </div>
            <button onClick={onToggleDarkMode} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all font-black uppercase text-[10px] tracking-widest">Toggle System Night Mode</button>
          </div>
          
          <div className="p-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-12">
              <div>
                <label className="block text-[10px] font-black theme-text-muted uppercase mb-4 tracking-[0.2em]">Application Entity Name</label>
                <input 
                  type="text" 
                  value={globalForm.appName} 
                  onChange={e => setGlobalForm({...globalForm, appName: e.target.value})} 
                  className="w-full px-8 py-5 theme-bg border border-theme rounded-[2rem] text-xl font-black theme-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              
              <ThemePicker 
                selectedTheme={globalForm.theme} 
                onSelect={t => setGlobalForm({...globalForm, theme: t})} 
                onColorChange={(k, v) => setGlobalForm({...globalForm, theme: {...globalForm.theme, [k]: v, id: 'custom-global'}})}
              />
            </div>

            <div className="lg:col-span-5">
              <NavDraggableList 
                list={globalForm.navigationOrder} 
                onUpdate={newList => setGlobalForm({...globalForm, navigationOrder: newList})} 
              />
            </div>
          </div>
          
          <div className="p-10 border-t border-theme bg-slate-50/30 dark:bg-slate-900/30 flex justify-end">
             <button 
              onClick={() => { onUpdateGlobalSettings({ ...globalSettings, globalAppName: globalForm.appName, globalNavigationOrder: globalForm.navigationOrder, globalTheme: globalForm.theme }); alert("Global settings deployed."); }}
              className="px-16 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-[0.3em] rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all"
             >
               Deploy Global Payload
             </button>
          </div>
        </div>
      )}

      {/* Corporate Identity Kit (Tenant Only) */}
      {currentTenant && (
        <div className="theme-surface rounded-[3.5rem] border border-theme shadow-sm overflow-hidden">
          <div className="p-12 border-b border-theme flex items-center justify-between">
            <div>
              <h3 className="text-4xl font-black theme-text-main uppercase tracking-tighter leading-none">Corporate Identity Kit</h3>
              <p className="text-[10px] font-black theme-text-muted mt-3 uppercase tracking-[0.3em]">{currentTenant.name} Configuration Overrides</p>
            </div>
            <div 
              className="w-20 h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-white font-black text-3xl transition-all duration-700" 
              style={{ backgroundColor: tenantFormData.theme.primary, border: `6px solid ${tenantFormData.theme.secondary}` }}
            >
              {tenantFormData.customAppName.charAt(0)}
            </div>
          </div>

          <div className="p-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-12">
               <div>
                  <label className="block text-[10px] font-black theme-text-muted uppercase mb-4 tracking-[0.2em]">White-Label App Label</label>
                  <input 
                    type="text" 
                    value={tenantFormData.customAppName} 
                    onChange={e => setTenantFormData({...tenantFormData, customAppName: e.target.value})} 
                    className="w-full px-8 py-5 theme-bg border border-theme rounded-[2rem] text-xl font-black theme-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
               </div>

               <ThemePicker 
                selectedTheme={tenantFormData.theme} 
                onSelect={t => setTenantFormData({...tenantFormData, theme: t})} 
                onColorChange={(k, v) => setTenantFormData({...tenantFormData, theme: {...tenantFormData.theme, [k]: v, id: 'custom-tenant'}})}
              />
            </div>

            <div className="lg:col-span-5">
              <NavDraggableList 
                list={tenantFormData.navigationOrder} 
                onUpdate={newList => setTenantFormData({...tenantFormData, navigationOrder: newList})} 
              />
            </div>
          </div>

          <div className="p-12 border-t border-theme flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
             <div className="flex items-center gap-6">
                <button 
                  onClick={onToggleDarkMode} 
                  className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all ${currentTenant.isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
                >
                  {currentTenant.isDarkMode ? '🌙 Active Dark Mode' : '☀️ Active Light Mode'}
                </button>
             </div>
             <button 
                onClick={() => { onUpdateTenant({ ...currentTenant, customAppName: tenantFormData.customAppName, navigationOrder: tenantFormData.navigationOrder, theme: tenantFormData.theme }); alert("Corporate identity updated."); }}
                className="px-16 py-6 text-white font-black uppercase text-xs tracking-[0.3em] rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                style={{ backgroundColor: tenantFormData.theme.primary }}
             >
               Finalize Identity Protocol
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

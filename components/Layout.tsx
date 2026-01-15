
import React, { useState, useEffect } from 'react';
import { UserRole, User, Tenant, Role, AppSettings, AppTheme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentUserRoleDetails: Role | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  globalSettings: AppSettings;
  onToggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  currentTenant, 
  currentUserRoleDetails, 
  onLogout, 
  activeTab, 
  setActiveTab,
  globalSettings,
  onToggleDarkMode
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isCompanyAdmin = currentUser?.role === UserRole.COMPANY_ADMIN;

  const activeAppName = currentTenant?.customAppName || globalSettings.globalAppName;
  const activeTheme: Partial<AppTheme> = currentTenant?.theme || globalSettings.globalTheme;
  const isDarkMode = currentTenant ? currentTenant.isDarkMode : globalSettings.isDarkMode;
  const navOrder = currentTenant?.navigationOrder || globalSettings.globalNavigationOrder;

  useEffect(() => {
    const root = document.documentElement;
    const theme = activeTheme as AppTheme;

    root.style.setProperty('--primary-brand', theme.primary);
    root.style.setProperty('--secondary-brand', theme.secondary);
    root.style.setProperty('--accent-brand', theme.accent);
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.setProperty('--bg-app', '#020617');
      root.style.setProperty('--bg-surface', '#0f172a');
      root.style.setProperty('--text-main', '#f8fafc');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--border-subtle', '#1e293b');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-app', theme.bgApp || '#f8fafc');
      root.style.setProperty('--bg-surface', theme.bgSurface || '#ffffff');
      root.style.setProperty('--text-main', theme.textMain || '#0f172a');
      root.style.setProperty('--text-muted', theme.textMuted || '#64748b');
      root.style.setProperty('--border-subtle', theme.border || '#e2e8f0');
    }
  }, [activeTheme, isDarkMode]);

  const hasPerm = (permId: string) => {
    if (isSuperAdmin) return true;
    return !!(currentUserRoleDetails?.permissions && currentUserRoleDetails.permissions.includes(permId));
  };

  const navItemsRaw = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', perm: 'nav:dashboard' },
    { id: 'tenants', label: 'Companies', icon: '🏢', perm: 'nav:companies', hidden: !isSuperAdmin },
    { id: 'users', label: 'Users', icon: '👥', perm: 'nav:users', hidden: !(isSuperAdmin || isCompanyAdmin) },
    { id: 'roles', label: 'Roles & Permissions', icon: '🔐', perm: 'nav:roles' },
    { id: 'brands', label: 'Brands', icon: '🏷️', perm: 'nav:brands' },
    { id: 'leads', label: 'Leads', icon: '⚡', perm: 'nav:leads' },
    { id: 'connections', label: 'Connections', icon: '🤝', perm: 'nav:connections' },
    { id: 'clients', label: 'Portfolio', icon: '💼', perm: 'nav:clients' },
    { id: 'projects', label: 'Operations', icon: '🏗️', perm: 'nav:projects' },
    { id: 'settings', label: 'Settings', icon: '⚙️', perm: 'nav:settings' },
  ];

  const navItems = [...navItemsRaw].sort((a, b) => {
    const indexA = navOrder.indexOf(a.id);
    const indexB = navOrder.indexOf(b.id);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--primary-brand)' }}>
          <span className="text-white p-1 rounded-lg" style={{ backgroundColor: 'var(--primary-brand)' }}>
            {activeAppName.charAt(0)}
          </span> 
          {activeAppName.toUpperCase()}
        </h1>
        <div className="mt-2 text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">
          {isSuperAdmin ? 'Global Admin Core' : `${currentTenant?.name || 'Company'} Portal`}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-4">
        {navItems.filter(item => !item.hidden && hasPerm(item.perm)).map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                isActive 
                  ? 'text-white shadow-xl' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              style={{ 
                backgroundColor: isActive ? 'var(--primary-brand)' : 'transparent',
                boxShadow: isActive ? `0 10px 20px -5px ${activeTheme.primary}44` : 'none'
              }}
            >
              <span className="text-lg grayscale-0">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-slate-800/50 rounded-2xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ backgroundColor: 'var(--primary-brand)' }}>
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black truncate text-white uppercase tracking-tight">{currentUser?.name || 'Guest User'}</p>
            <p className="text-[9px] text-slate-500 truncate uppercase font-bold tracking-widest">{currentUser?.role?.replace('_', ' ') || 'Guest'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-red-900/20 transition-all"
        >
          <span>🚪</span> Terminate Session
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen theme-bg text-theme overflow-hidden">
      <style>{`
        :root {
          --primary-brand: #7c3aed;
          --secondary-brand: #0f172a;
          --accent-brand: #10b981;
          --bg-app: #f8fafc;
          --bg-surface: #ffffff;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border-subtle: #e2e8f0;
        }
        .theme-bg { background-color: var(--bg-app); }
        .theme-surface { background-color: var(--bg-surface); }
        .theme-text-main { color: var(--text-main); }
        .theme-text-muted { color: var(--text-muted); }
        .border-theme { border-color: var(--border-subtle); }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }
      `}</style>
      
      <aside className="hidden lg:flex w-72 flex-col transition-all duration-500" style={{ backgroundColor: 'var(--secondary-brand)' }}>
        <SidebarContent />
      </aside>
      
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="h-20 theme-surface border-b border-theme px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-xl">≡</button>
            <h2 className="text-xl font-black theme-text-main uppercase tracking-tighter">{navItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={onToggleDarkMode} 
              className="w-12 h-12 rounded-2xl theme-surface border border-theme flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all shadow-sm"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl theme-bg border border-theme">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-brand animate-pulse" style={{ backgroundColor: 'var(--accent-brand)' }}></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] theme-text-muted">Operations Stable</span>
            </div>
          </div>
        </header>
        
        <div className="p-8 theme-bg min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="absolute top-0 left-0 bottom-0 w-72 flex flex-col shadow-2xl" style={{ backgroundColor: 'var(--secondary-brand)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}
    </div>
  );
};

export default Layout;

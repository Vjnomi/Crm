
import React, { useState, useEffect } from 'react';
import { UserRole, User, Tenant, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentUserRoleDetails: Role | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  globalSettings: { globalAppName: string; globalPrimaryColor: string };
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  currentTenant, 
  currentUserRoleDetails, 
  onLogout, 
  activeTab, 
  setActiveTab,
  globalSettings
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isCompanyAdmin = currentUser?.role === UserRole.COMPANY_ADMIN;

  const activeAppName = currentTenant?.customAppName || globalSettings.globalAppName;
  const activeColor = currentTenant?.primaryColor || globalSettings.globalPrimaryColor;

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-brand', activeColor);
    const darkerColor = activeColor + 'CC';
    document.documentElement.style.setProperty('--primary-brand-dark', darkerColor);
  }, [activeColor]);

  const hasPerm = (permId: string) => {
    if (isSuperAdmin) return true;
    return !!(currentUserRoleDetails?.permissions && currentUserRoleDetails.permissions.includes(permId));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', perm: 'nav:dashboard' },
    { id: 'tenants', label: 'Companies', icon: '🏢', perm: 'nav:companies', hidden: !isSuperAdmin },
    { id: 'users', label: 'Users', icon: '👥', perm: 'nav:users', hidden: !(isSuperAdmin || isCompanyAdmin) },
    { id: 'roles', label: 'Roles & Permissions', icon: '🔐', perm: 'nav:roles' },
    { id: 'brands', label: 'Brands', icon: '🏷️', perm: 'nav:brands' },
    { id: 'leads', label: 'Leads', icon: '⚡', perm: 'nav:leads' },
    { id: 'connections', label: 'Connections', icon: '🤝', perm: 'nav:connections' },
    { id: 'clients', label: 'Portfolio', icon: '💼', perm: 'nav:clients' },
    { id: 'projects', label: 'Operations', icon: '🏗️', perm: 'nav:projects' }, // ADDED PROJECTS TAB
    { id: 'settings', label: 'Settings', icon: '⚙️', perm: 'nav:settings' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: activeColor }}>
          <span className="text-white p-1 rounded" style={{ backgroundColor: activeColor }}>
            {activeAppName.charAt(0)}
          </span> 
          {activeAppName.toUpperCase()}
        </h1>
        <div className="mt-2 text-xs text-slate-400 uppercase font-semibold">
          {isSuperAdmin ? 'System Portal' : `${currentTenant?.name || 'Company'} Portal`}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => !item.hidden && hasPerm(item.perm)).map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              style={{ 
                backgroundColor: isActive ? activeColor : 'transparent',
                boxShadow: isActive ? `0 10px 15px -3px ${activeColor}33` : 'none'
              }}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-2 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ backgroundColor: activeColor }}>
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-white">{currentUser?.name || 'Guest User'}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.role?.replace('_', ' ') || 'Guest'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-red-900/20 transition-colors"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <style>{`
        :root {
          --primary-brand: ${activeColor};
        }
        .text-primary { color: var(--primary-brand); }
        .bg-primary { background-color: var(--primary-brand); }
        .border-primary { border-color: var(--primary-brand); }
        .ring-primary { --tw-ring-color: var(--primary-brand); }
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col">
        <SidebarContent />
      </aside>
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">≡</button>
            <h2 className="text-lg font-semibold text-slate-800">{navItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

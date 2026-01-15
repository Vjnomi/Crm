
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import RoleSwitcher from './components/RoleSwitcher.tsx';
import TenantManagement from './pages/TenantManagement.tsx';
import UserManagement from './pages/UserManagement.tsx';
import RolesPermissions from './pages/RolesPermissions.tsx';
import CompanySettings from './pages/CompanySettings.tsx';
import BrandManagement from './pages/BrandManagement.tsx';
import LeadManagement from './pages/LeadManagement.tsx';
import ConnectionsManagement from './pages/ConnectionsManagement.tsx';
import ClientManagement from './pages/ClientManagement.tsx';
import ProjectManagement from './pages/ProjectManagement.tsx';
import { User, Tenant, Role, UserRole, Permission, Brand, Lead, Project, AppSettings, AppTheme } from './types.ts';
import { 
  INITIAL_TENANTS, 
  INITIAL_USERS, 
  INITIAL_ROLES, 
  INITIAL_BRANDS,
  INITIAL_LEADS,
  INITIAL_PROJECTS,
  SYSTEM_PERMISSIONS,
  APP_THEMES
} from './constants.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [permissions] = useState<Permission[]>(SYSTEM_PERMISSIONS);
  
  const [globalSettings, setGlobalSettings] = useState<AppSettings>({
    globalAppName: 'Sofverse CRM',
    globalNavigationOrder: ['dashboard', 'tenants', 'users', 'roles', 'brands', 'leads', 'connections', 'clients', 'projects', 'settings'],
    globalTheme: APP_THEMES[0],
    isDarkMode: false
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('sofverse_current_user');
    const savedProjects = localStorage.getItem('sofverse_projects');
    if (savedProjects) { try { setProjects(JSON.parse(savedProjects)); } catch (e) {} }

    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { setCurrentUser(INITIAL_USERS[0]); }
    } else {
      const defaultUser = INITIAL_USERS[0];
      setCurrentUser(defaultUser);
      localStorage.setItem('sofverse_current_user', JSON.stringify(defaultUser));
    }
  }, []);

  useEffect(() => { localStorage.setItem('sofverse_projects', JSON.stringify(projects)); }, [projects]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sofverse_current_user');
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sofverse_current_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const currentTenant = tenants.find(t => t.id === currentUser?.tenantId) || null;
  const currentUserRoleDetails = roles.find(r => r.id === currentUser?.customRoleId) || null;

  const handleUpdateLead = (lead: Lead) => {
    if (lead.isClient && !projects.some(p => p.clientId === lead.id)) {
      const newProject: Project = {
        id: `p-${Date.now()}`,
        clientId: lead.id,
        tenantId: lead.tenantId,
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        columns: [
          { id: `col-${Date.now()}-1`, title: 'Discovery', cards: [] },
          { id: `col-${Date.now()}-2`, title: 'Active Flow', cards: [] },
          { id: `col-${Date.now()}-3`, title: 'Success', cards: [] }
        ]
      };
      setProjects(prev => [...prev, newProject]);
    }
    setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
  };

  const handleUpdateMultipleLeads = (updatedLeads: Lead[]) => {
    setLeads(prev => {
      const leadMap = new Map(updatedLeads.map(l => [l.id, l]));
      return prev.map(l => leadMap.has(l.id) ? leadMap.get(l.id)! : l);
    });
  };

  const handleAddLead = (lead: Lead) => setLeads(prev => [...prev, lead]);
  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setProjects(prev => prev.filter(p => p.clientId !== id));
  };

  const handleToggleDarkMode = () => {
    if (currentTenant) {
      setTenants(prev => prev.map(t => t.id === currentTenant.id ? { ...t, isDarkMode: !t.isDarkMode } : t));
    } else {
      setGlobalSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'System Health', value: '100%', change: 'Stable', color: 'emerald' },
                { label: 'Ops Velocity', value: projects.length.toString(), change: 'Projects', color: 'blue' },
                { label: 'Global Assets', value: leads.length.toString(), change: '+12', color: 'amber' },
                { label: 'Portfolio Clients', value: leads.filter(l => l.isClient).length.toString(), change: 'Milestone', color: 'emerald' },
              ].map((stat, i) => (
                <div key={i} className="theme-surface p-6 rounded-2xl shadow-sm border border-theme">
                  <p className="text-[10px] theme-text-muted font-black uppercase tracking-widest mb-2">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <h4 className="text-2xl font-black theme-text-main">{stat.value}</h4>
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 theme-text-muted uppercase">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'tenants':
        return <TenantManagement tenants={tenants} onAddTenant={(t) => setTenants([...tenants, t])} onUpdateTenant={(t) => setTenants(tenants.map(it => it.id === t.id ? t : it))} onDeleteTenant={(id) => setTenants(tenants.filter(t => t.id !== id))} onToggleStatus={(id) => setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' } : t))} />;
      case 'users':
        return <UserManagement users={users} tenants={tenants} roles={roles} brands={brands} currentUser={currentUser!} onAddUser={(u) => setUsers([...users, u])} onUpdateUser={(u) => setUsers(users.map(it => it.id === u.id ? u : it))} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} onUpdateStatus={(id, s) => setUsers(users.map(u => u.id === id ? { ...u, status: s } : u))} isSuperAdmin={currentUser?.role === UserRole.SUPER_ADMIN} />;
      case 'roles':
        return <RolesPermissions roles={roles.filter(r => currentUser?.role === UserRole.SUPER_ADMIN || r.tenantId === currentUser?.tenantId)} permissions={permissions} onUpdateRole={(r) => setRoles(roles.map(it => it.id === r.id ? r : it))} onCreateRole={(r) => setRoles([...roles, r])} currentUser={currentUser} isSuperAdmin={currentUser?.role === UserRole.SUPER_ADMIN} tenantId={currentUser?.tenantId || null} />;
      case 'brands':
        return <BrandManagement brands={brands} tenants={tenants} currentUser={currentUser!} currentUserRoleDetails={currentUserRoleDetails} onAddBrand={(b) => setBrands([...brands, b])} onUpdateBrand={(b) => setBrands(brands.map(it => it.id === b.id ? b : it))} onDeleteBrand={(id) => setBrands(brands.filter(b => b.id !== id))} />;
      case 'leads':
        return <LeadManagement leads={leads} brands={brands} users={users} tenants={tenants} roles={roles} currentUser={currentUser!} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onUpdateMultipleLeads={handleUpdateMultipleLeads} />;
      case 'connections':
        return <ConnectionsManagement leads={leads} brands={brands} users={users} tenants={tenants} roles={roles} currentUser={currentUser!} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onUpdateMultipleLeads={handleUpdateMultipleLeads} />;
      case 'clients':
        return <ClientManagement leads={leads} users={users} brands={brands} roles={roles} currentUser={currentUser!} onUpdateLead={handleUpdateLead} />;
      case 'projects':
        return <ProjectManagement projects={projects} leads={leads} users={users} roles={roles} currentUser={currentUser!} onUpdateProject={(p) => setProjects(projects.map(it => it.id === p.id ? p : it))} />;
      case 'settings':
        return <CompanySettings currentTenant={currentTenant} onUpdateTenant={(t) => setTenants(tenants.map(it => it.id === t.id ? t : it))} currentUser={currentUser!} globalSettings={globalSettings} onUpdateGlobalSettings={setGlobalSettings} onToggleDarkMode={handleToggleDarkMode} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Layout 
        currentUser={currentUser} 
        currentTenant={currentTenant} 
        currentUserRoleDetails={currentUserRoleDetails}
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        globalSettings={globalSettings}
        onToggleDarkMode={handleToggleDarkMode}
      >
        <div className="max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </Layout>
      <RoleSwitcher users={users} currentUser={currentUser} onSwitch={handleSwitchUser} />
    </>
  );
}

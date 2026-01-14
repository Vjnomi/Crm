
import React, { useState, useEffect } from 'react';
import { User, Tenant, UserRole, Role, Brand } from '../types';

interface UserManagementProps {
  users: User[];
  tenants: Tenant[];
  roles: Role[];
  brands: Brand[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdateStatus: (userId: string, status: 'Active' | 'Inactive') => void;
  isSuperAdmin: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users, tenants, roles, brands, currentUser, onAddUser, onUpdateUser, onDeleteUser, onUpdateStatus, isSuperAdmin
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: UserRole.USER, 
    tenantId: currentUser?.tenantId || '', 
    customRoleId: '',
    assignedBrands: [] as string[]
  });
  const [isBrandsLoading, setIsBrandsLoading] = useState(false);

  const currentUserRole = roles.find(r => r.id === currentUser?.customRoleId);
  const permissions = currentUserRole?.permissions || [];
  
  const isCompanyAdmin = currentUser?.role === UserRole.COMPANY_ADMIN;
  const isAdmin = isSuperAdmin || isCompanyAdmin;
  
  const canRead = isAdmin && (isSuperAdmin || permissions.includes('users:read'));
  const canCreate = isAdmin && (isSuperAdmin || permissions.includes('users:create'));
  const canUpdate = isAdmin && (isSuperAdmin || permissions.includes('users:update'));
  const canDelete = isAdmin && (isSuperAdmin || permissions.includes('users:delete'));

  useEffect(() => {
    if (showModal) {
      setIsBrandsLoading(true);
      const timer = setTimeout(() => {
        setIsBrandsLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [formData.tenantId, showModal]);

  if (!canRead) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-4xl mb-4">🚫</div>
        <h3 className="text-xl font-bold text-slate-800">Access Restricted</h3>
        <p className="text-slate-500 mt-2">The User Directory is only visible to System and Company Administrators.</p>
      </div>
    );
  }

  const getRoleBranding = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('super admin')) {
      return { icon: '🛡️', color: 'bg-violet-100 text-violet-700 border-violet-200' };
    }
    if (name.includes('company admin')) {
      return { icon: '🏛️', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (name.includes('front seller')) {
      return { icon: '🎯', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
    if (name.includes('upseller')) {
      return { icon: '📈', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (name.includes('project manager') || name.includes('pm')) {
      return { icon: '📋', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { icon: '👤', color: 'bg-slate-50 text-slate-500 border-slate-200' };
  };

  const filteredUsers = isSuperAdmin ? users : users.filter(u => u.tenantId === currentUser?.tenantId);
  const availableBrandsForForm = brands.filter(b => b.tenantId === (formData.tenantId === 'SYSTEM' ? null : formData.tenantId));

  const openModal = (user: User | null = null) => {
    if (user) {
      setEditUser(user);
      setFormData({ 
        name: user.name, 
        email: user.email, 
        password: user.password || '', 
        role: user.role, 
        tenantId: user.tenantId || (isSuperAdmin ? 'SYSTEM' : ''), 
        customRoleId: user.customRoleId || '',
        assignedBrands: user.assignedBrands || []
      });
    } else {
      setEditUser(null);
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        role: UserRole.USER, 
        tenantId: isSuperAdmin ? 'SYSTEM' : (currentUser?.tenantId || ''), 
        customRoleId: '',
        assignedBrands: []
      });
    }
    setShowModal(true);
  };

  const toggleBrandSelection = (brandId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedBrands: prev.assignedBrands.includes(brandId)
        ? prev.assignedBrands.filter(id => id !== brandId)
        : [...prev.assignedBrands, brandId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTenantId = formData.tenantId === 'SYSTEM' ? null : formData.tenantId;
    
    const userData = { 
      name: formData.name, 
      email: formData.email, 
      password: formData.password, 
      role: formData.role, 
      tenantId: finalTenantId, 
      customRoleId: formData.customRoleId,
      assignedBrands: formData.assignedBrands
    };

    if (editUser) {
      if (!canUpdate) return;
      onUpdateUser({ ...editUser, ...userData });
    } else {
      if (!canCreate) return;
      onAddUser({ 
        ...userData,
        id: `u-${Date.now()}`, 
        status: 'Active' 
      } as User);
    }
    setShowModal(false);
  };

  const handleDelete = (userId: string, userName: string) => {
    if (!canDelete) {
      alert("Permission Denied: You do not have 'users:delete' authorization.");
      return;
    }
    if (window.confirm(`Permanently remove ${userName}? This action is immediate and irreversible.`)) {
      onDeleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Personnel Directory</h3>
          <p className="text-sm text-slate-500">
            {isSuperAdmin ? 'Global user governance' : `Managing personnel for ${tenants.find(t => t.id === currentUser?.tenantId)?.name || 'Company'}`}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => openModal()} className="w-full sm:w-auto bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all flex items-center justify-center gap-2">
            <span>➕</span> Provision User
          </button>
        )}
      </div>

      <div className="bg-white sm:rounded-3xl shadow-sm sm:border sm:border-slate-200 overflow-hidden -mx-4 sm:mx-0">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions & Scoping</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-400 italic">No users available for this view.</td>
                </tr>
              ) : filteredUsers.map(user => {
                const isSelf = user.id === currentUser?.id;
                const company = tenants.find(t => t.id === user.tenantId);
                const assignedRole = roles.find(r => r.id === user.customRoleId);
                const roleName = assignedRole?.name || user.role.replace('_', ' ');
                const branding = getRoleBranding(roleName);
                
                return (
                  <tr key={user.id} className={`${isSelf ? 'bg-violet-50/20' : ''} hover:bg-slate-50/50 transition-colors group`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border text-xl shadow-sm flex-shrink-0 transition-transform group-hover:scale-110 ${branding.color}`}>
                          {branding.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 flex items-center gap-2 truncate">
                            {user.name} 
                            {isSelf && <span className="text-violet-600 text-[8px] bg-violet-50 px-2 py-0.5 rounded-lg uppercase font-black tracking-widest border border-violet-100">Owner</span>}
                          </p>
                          <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border w-fit shadow-sm ${branding.color}`}>
                          {roleName}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter truncate">{company?.name || 'Sofverse Global'}</span>
                          {user.assignedBrands.length > 0 && (
                            <span className="text-[9px] text-violet-600 font-black bg-violet-50 px-2 py-0.5 rounded-lg uppercase border border-violet-100">
                              {user.assignedBrands.length} Brands
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canUpdate && (
                          <button onClick={() => openModal(user)} className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-all">Edit</button>
                        )}
                        {!isSelf && canDelete && (
                          <button 
                            onClick={() => handleDelete(user.id, user.name)} 
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">No users found.</div>
          ) : (
            filteredUsers.map(user => {
              const isSelf = user.id === currentUser?.id;
              const company = tenants.find(t => t.id === user.tenantId);
              const assignedRole = roles.find(r => r.id === user.customRoleId);
              const roleName = assignedRole?.name || user.role.replace('_', ' ');
              const branding = getRoleBranding(roleName);

              return (
                <div key={user.id} className={`p-5 space-y-5 ${isSelf ? 'bg-violet-50/30' : 'bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border text-xl shadow-sm flex-shrink-0 ${branding.color}`}>
                      {branding.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2 leading-none">
                        {user.name} 
                        {isSelf && <span className="text-violet-600 text-[8px] bg-violet-50 px-2 py-0.5 rounded-lg uppercase font-black tracking-widest border border-violet-100">Owner</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 text-[10px]">
                    <div className="space-y-1.5">
                      <p className="font-black text-slate-400 uppercase tracking-widest">Scope</p>
                      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg font-bold uppercase border shadow-sm ${branding.color}`}>
                        {roleName}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-black text-slate-400 uppercase tracking-widest">Assigned Assets</p>
                      <p className="text-[11px] font-bold text-violet-600 uppercase">
                        {user.assignedBrands.length > 0 ? `${user.assignedBrands.length} Portfolio Brands` : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                    {canUpdate && (
                      <button onClick={() => openModal(user)} className="px-5 py-2 text-[10px] font-black uppercase text-slate-600 bg-slate-100 rounded-xl tracking-widest">Configure</button>
                    )}
                    {!isSelf && canDelete && (
                      <button onClick={() => handleDelete(user.id, user.name)} className="px-5 py-2 text-[10px] font-black uppercase text-rose-600 bg-rose-50 rounded-xl tracking-widest">Terminate</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{editUser ? 'Modify Identity' : 'Register New Entity'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" placeholder="E.g. Elon Musk" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Email Identity</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium" placeholder="name@sofverse.com" />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">System Persona</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 font-bold text-slate-700">
                      <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                      <option value={UserRole.COMPANY_ADMIN}>Company Admin</option>
                      <option value={UserRole.USER}>Standard User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Home Company</label>
                    <select value={formData.tenantId} onChange={e => setFormData({...formData, tenantId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 font-bold text-slate-700">
                      <option value="SYSTEM">Sofverse Global (Core)</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Capability Mapping (Role)</label>
                <select value={formData.customRoleId} onChange={e => setFormData({...formData, customRoleId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 font-bold text-slate-700">
                  <option value="">-- Inherit System Defaults --</option>
                  {roles.filter(r => isSuperAdmin ? (r.tenantId === null || r.tenantId === (formData.tenantId === 'SYSTEM' ? null : formData.tenantId)) : (r.tenantId === currentUser?.tenantId)).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                  Portfolio Brand Mapping
                  {isBrandsLoading && <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping" />}
                </label>
                <div className={`p-6 rounded-2xl border border-slate-100 min-h-[120px] transition-all duration-300 ${isBrandsLoading ? 'opacity-30 blur-sm' : 'opacity-100 bg-slate-50/50'}`}>
                  {availableBrandsForForm.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-bold italic py-6 text-center">No brands available for the current company scope.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableBrandsForForm.map(brand => (
                        <label key={brand.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white cursor-pointer border border-transparent hover:border-violet-100 hover:shadow-sm transition-all group">
                          <input 
                            type="checkbox" 
                            checked={formData.assignedBrands.includes(brand.id)} 
                            onChange={() => toggleBrandSelection(brand.id)}
                            className="w-5 h-5 rounded-lg border-slate-300 text-violet-600 focus:ring-violet-500 transition-all"
                          />
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight group-hover:text-violet-700">{brand.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 order-2 sm:order-1 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 shadow-xl shadow-violet-100 order-1 sm:order-2 transition-all active:scale-95">
                  {editUser ? 'Confirm Changes' : 'Initialize Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

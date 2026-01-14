
import React, { useState, useMemo } from 'react';
import { Role, Permission, UserRole } from '../types';
import { getRoleRecommendation } from '../services/geminiService';

interface RolesPermissionsProps {
  roles: Role[];
  permissions: Permission[];
  onUpdateRole: (role: Role) => void;
  onCreateRole: (role: Role) => void;
  currentUser: any;
  isSuperAdmin: boolean;
  tenantId: string | null;
}

const RolesPermissions: React.FC<RolesPermissionsProps> = ({
  roles,
  permissions,
  onUpdateRole,
  onCreateRole,
  currentUser,
  isSuperAdmin,
  tenantId
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const currentUserRole = roles.find(r => r.id === currentUser.customRoleId);
  const canManageRoles = isSuperAdmin || currentUserRole?.permissions.includes('nav:roles');

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isEditingOwnRole = selectedRole?.id === currentUser.customRoleId;
  const isProtectedRole = selectedRole?.tenantId === null && !isSuperAdmin;
  const isViewOnly = !canManageRoles || isEditingOwnRole || isProtectedRole;

  const togglePermission = (permId: string) => {
    if (!selectedRole || isViewOnly) return;
    const newPermissions = selectedRole.permissions.includes(permId)
      ? selectedRole.permissions.filter(p => p !== permId)
      : [...selectedRole.permissions, permId];
    onUpdateRole({ ...selectedRole, permissions: newPermissions });
  };

  const handleBulkPermission = (category: string, action: 'grant' | 'revoke') => {
    if (!selectedRole || isViewOnly) return;
    const categoryPerms = permissions.filter(p => p.category === category).map(p => p.id);
    let newPermissions = [...selectedRole.permissions];
    
    if (action === 'grant') {
      newPermissions = Array.from(new Set([...newPermissions, ...categoryPerms]));
    } else {
      newPermissions = newPermissions.filter(p => !categoryPerms.includes(p));
    }
    
    onUpdateRole({ ...selectedRole, permissions: newPermissions });
  };

  const handleCreateRole = async () => {
    if (!newRoleName || !canManageRoles) return;
    setIsAiLoading(true);
    const recommendation = await getRoleRecommendation(newRoleName, 'CRM Operations');
    const newRole: Role = {
      id: `r-${Date.now()}`,
      name: newRoleName,
      description: recommendation?.description || 'Strategic personnel node.',
      tenantId: tenantId,
      permissions: recommendation?.suggestedPermissions?.filter((p: string) =>
        permissions.some(perm => perm.id === p)
      ) || []
    };
    onCreateRole(newRole);
    setNewRoleName('');
    setSelectedRoleId(newRole.id);
    setIsAiLoading(false);
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  return (
    <div className="grid grid-cols-12 gap-10 animate-in fade-in duration-700">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Personnel Hierarchy</h3>
          <div className="space-y-3">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all relative group ${
                  selectedRoleId === role.id
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black uppercase tracking-tight text-sm ${selectedRoleId === role.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {role.name}
                  </span>
                  <div className="flex gap-2">
                    {role.tenantId === null && <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">System</span>}
                    {role.id === currentUser.customRoleId && <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Active</span>}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 leading-relaxed">{role.description}</p>
              </button>
            ))}
          </div>

          {canManageRoles && (
            <div className="mt-10 pt-8 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Provision Strategic Role</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g. Senior Success Analyst"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 transition-all"
                />
                <button
                  onClick={handleCreateRole}
                  disabled={isAiLoading || !newRoleName}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                >
                  {isAiLoading ? '...' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
        {selectedRole ? (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-10 py-10 border-b border-slate-100 flex justify-between items-center ${isViewOnly ? 'bg-slate-50' : 'bg-indigo-50/10'}`}>
              <div className="flex-1 mr-8">
                {isViewOnly ? (
                  <>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">{selectedRole.name}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedRole.description}</p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <input 
                      className="text-3xl font-black text-indigo-600 uppercase tracking-tighter bg-transparent border-none p-0 outline-none w-full"
                      value={selectedRole.name}
                      onChange={(e) => onUpdateRole({...selectedRole, name: e.target.value})}
                    />
                    <input 
                      className="text-sm text-slate-500 font-medium leading-relaxed bg-transparent border-none p-0 outline-none w-full"
                      value={selectedRole.description}
                      onChange={(e) => onUpdateRole({...selectedRole, description: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-3 text-[10px] font-black uppercase px-5 py-2.5 rounded-2xl border shadow-sm ${isViewOnly ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {isViewOnly ? '🔒 Security Lock' : '🔓 Authority Active'}
              </div>
            </div>

            {isViewOnly && (
              <div className="px-10 py-4 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-800 font-black flex items-center gap-3 uppercase tracking-widest">
                <span className="text-lg">⚠️</span> {isProtectedRole ? 'SYSTEM PROTECTED NODE: PARAMETERS CANNOT BE ALTERED' : 'CONTEXT SECURITY: YOU CANNOT EDIT YOUR OWN AUTHORITY'}
              </div>
            )}

            <div className="p-10 space-y-12 h-[calc(100vh-25rem)] overflow-y-auto custom-scrollbar">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="group/cat">
                  <div className="flex justify-between items-end mb-6">
                    <h4 className="text-[11px] font-black text-slate-900 flex items-center gap-3 uppercase tracking-[0.25em]">
                      <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                      {category} Hub
                    </h4>
                    {!isViewOnly && (
                      <div className="flex gap-4 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                        <button onClick={() => handleBulkPermission(category, 'grant')} className="text-[9px] font-black text-emerald-600 uppercase hover:underline">Grant All</button>
                        <button onClick={() => handleBulkPermission(category, 'revoke')} className="text-[9px] font-black text-rose-500 uppercase hover:underline">Revoke All</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perms.map(perm => {
                      const isActive = selectedRole.permissions.includes(perm.id);
                      return (
                        <div 
                          key={perm.id} 
                          onClick={() => togglePermission(perm.id)}
                          className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                            isActive 
                              ? 'border-indigo-200 bg-indigo-50/30 shadow-sm ring-1 ring-indigo-100' 
                              : 'border-slate-100 bg-white opacity-60 hover:opacity-100'
                          } ${isViewOnly ? 'pointer-events-none' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-xs font-black uppercase tracking-tight mb-2 ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{perm.name}</h5>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2">{perm.description}</p>
                            </div>
                            <div className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {!isViewOnly && (
               <div className="p-8 bg-slate-50 border-t border-slate-100 italic text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">
                  Authority updates are committed in real-time to the persistent state
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-slate-300">
            <span className="text-8xl mb-6 grayscale opacity-20">🔐</span>
            <p className="font-black uppercase text-xs tracking-widest">Select a role to audit or modify permissions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesPermissions;


import React, { useState } from 'react';
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
  const canManageRoles = isSuperAdmin || currentUserRole?.permissions.includes('roles:manage');

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  
  // LOGIC: A user cannot edit their OWN role's permissions.
  const isEditingOwnRole = selectedRole?.id === currentUser.customRoleId;
  const isProtectedRole = selectedRole?.name === 'Company Admin' && !isSuperAdmin;
  const isViewOnly = !canManageRoles || isEditingOwnRole || isProtectedRole;

  const togglePermission = (permId: string) => {
    if (!selectedRole || isViewOnly) return;
    if (selectedRole.tenantId === null && !isSuperAdmin) return;

    const newPermissions = selectedRole.permissions.includes(permId)
      ? selectedRole.permissions.filter(p => p !== permId)
      : [...selectedRole.permissions, permId];

    onUpdateRole({ ...selectedRole, permissions: newPermissions });
  };

  const handleCreateRole = async () => {
    if (!newRoleName || !canManageRoles) return;
    setIsAiLoading(true);

    const recommendation = await getRoleRecommendation(newRoleName, 'General Business');

    const newRole: Role = {
      id: `r-${Date.now()}`,
      name: newRoleName,
      description: recommendation?.description || 'Custom role description',
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

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Roles Catalog</h3>
          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedRoleId === role.id
                    ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${selectedRoleId === role.id ? 'text-violet-700' : 'text-slate-700'}`}>
                    {role.name}
                  </span>
                  {role.id === currentUser.customRoleId && <span className="text-[8px] bg-violet-100 text-violet-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">You</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{role.description}</p>
              </button>
            ))}
          </div>

          {canManageRoles && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">Provision Specialty Role</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Role Name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
                />
                <button
                  onClick={handleCreateRole}
                  disabled={isAiLoading || !newRoleName}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-100"
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-8 py-6 border-b border-slate-200 flex justify-between items-center ${isViewOnly ? 'bg-slate-50' : 'bg-violet-50/10'}`}>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedRole.name}</h3>
                <p className="text-sm text-slate-500">{selectedRole.description}</p>
              </div>
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${isViewOnly ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-600 border border-green-200'}`}>
                {isViewOnly ? '🔒 Locked' : '🔓 Active Control'}
              </div>
            </div>

            {isViewOnly && (
              <div className="px-8 py-3 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-700 font-bold flex items-center gap-2">
                ⚠️ {isProtectedRole ? 'This is a system protected role. Modifications are restricted.' : 'Self-configuration is disabled for security safety.'}
              </div>
            )}

            <div className="p-8">
              {(Object.entries(groupedPermissions) as [string, Permission[]][]).map(([category, perms]) => (
                <div key={category} className="mb-10 last:mb-0">
                  <h4 className="text-xs font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-1.5 h-4 bg-violet-500 rounded-full"></span>
                    {category} Capabilities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perms.map(perm => {
                      const isActive = selectedRole.permissions.includes(perm.id);
                      const disabled = isViewOnly;
                      
                      return (
                        <div key={perm.id} className={`p-5 rounded-2xl border transition-all ${isActive ? 'border-violet-200 bg-violet-50/20 shadow-sm' : 'border-slate-100 bg-white opacity-60'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className={`text-sm font-bold ${isActive ? 'text-violet-900' : 'text-slate-600'}`}>{perm.name}</h5>
                              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{perm.description}</p>
                            </div>
                            <button
                              disabled={disabled}
                              onClick={() => togglePermission(perm.id)}
                              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-violet-600' : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            <span className="text-5xl mb-4">🔐</span>
            <p className="font-bold text-sm uppercase tracking-widest">Identify a role to manage scope</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesPermissions;

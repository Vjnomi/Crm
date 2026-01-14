
import React, { useState, useMemo } from 'react';
import { Lead, Brand, User, UserRole, Role, LeadStatus, CallStatus, Tenant, LeadComment, SaleItem } from '../types';

interface LeadManagementProps {
  leads: Lead[];
  brands: Brand[];
  users: User[];
  tenants: Tenant[];
  roles: Role[];
  currentUser: User;
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  isConnectionsView?: boolean;
}

const LeadManagement: React.FC<LeadManagementProps> = ({
  leads, brands, users, tenants, roles, currentUser, onAddLead, onUpdateLead, onDeleteLead, isConnectionsView = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  
  const [showClientForm, setShowClientForm] = useState(false);
  const [packageTitle, setPackageTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    number: '',
    email: '',
    inquiry: '',
    status: LeadStatus.NEW,
    callStatus: CallStatus.PENDING,
    lTag: '',
    sentFrom: '',
    assignedTo: '',
    followupCount: 0,
    followupStatus: 'Not Started',
    marketingEmailStatus: 'Pending',
    isConnection: isConnectionsView,
    isClient: false
  });

  const currentUserRole = roles.find(r => r.id === currentUser?.customRoleId);
  const permissions = currentUserRole?.permissions || [];
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isCompanyAdmin = currentUser?.role === UserRole.COMPANY_ADMIN;
  const isAdmin = isSuperAdmin || isCompanyAdmin;
  
  const canRead = isAdmin || permissions.includes('leads:read');
  const canCreate = isAdmin || permissions.includes('leads:create');
  const canUpdate = isAdmin || permissions.includes('leads:update');
  const canDelete = isAdmin || permissions.includes('leads:delete');
  const canConvert = permissions.includes('leads:convert_client');
  const canAssignBroad = isAdmin || permissions.includes('leads:assign');
  const canAssignTeam = permissions.includes('leads:assign_team');

  const availableBrands = useMemo(() => {
    if (isSuperAdmin) return editingLead ? brands.filter(b => b.tenantId === editingLead.tenantId) : brands;
    return brands.filter(b => b.tenantId === currentUser?.tenantId);
  }, [brands, currentUser, isSuperAdmin, editingLead]);

  const assignmentOptions = useMemo(() => {
    if (isSuperAdmin && editingLead) return users.filter(u => u.tenantId === editingLead.tenantId);
    const companyUsers = users.filter(u => u.tenantId === currentUser?.tenantId);
    if (canAssignBroad) return companyUsers;
    if (canAssignTeam) return companyUsers.filter(u => u.id === currentUser.id || roles.find(r => r.id === u.customRoleId)?.name.toLowerCase().includes('seller'));
    return [currentUser];
  }, [users, currentUser, canAssignBroad, canAssignTeam, roles, isSuperAdmin, editingLead]);

  const processedLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesScope = isSuperAdmin || (lead.tenantId === currentUser?.tenantId);
      if (!matchesScope) return false;
      if (!isAdmin && !canAssignTeam && lead.assignedTo !== currentUser.id) return false;
      
      // Filter Logic: 
      // Leads View: Show only if NOT a client.
      // Connections View: Show if isConnection AND NOT a client.
      if (lead.isClient) return false; 
      if (isConnectionsView) return lead.isConnection;
      return true;
    });

    if (filterStatus !== 'all') filtered = filtered.filter(l => l.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads, filterStatus, searchQuery, isAdmin, isSuperAdmin, canAssignTeam, currentUser, isConnectionsView]);

  const openEditModal = (lead: Lead | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name,
        brandId: lead.brandId,
        number: lead.number || '',
        email: lead.email,
        inquiry: lead.inquiry,
        status: lead.status,
        callStatus: lead.callStatus,
        lTag: lead.lTag,
        sentFrom: lead.sentFrom || '',
        assignedTo: lead.assignedTo || '',
        followupCount: lead.followupCount,
        followupStatus: lead.followupStatus,
        marketingEmailStatus: lead.marketingEmailStatus,
        isConnection: lead.isConnection,
        isClient: lead.isClient
      });
    } else {
      setEditingLead(null);
      setFormData({
        name: '',
        brandId: availableBrands[0]?.id || '',
        number: '',
        email: '',
        inquiry: '',
        status: LeadStatus.NEW,
        callStatus: CallStatus.PENDING,
        lTag: '',
        sentFrom: '',
        assignedTo: currentUser.id,
        followupCount: 0,
        followupStatus: 'Not Started',
        marketingEmailStatus: 'Pending',
        isConnection: isConnectionsView,
        isClient: false
      });
    }
    setShowModal(true);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      onUpdateLead({ ...editingLead, ...formData, lastUpdatedBy: currentUser.name, timestamp: new Date().toISOString() });
    } else {
      const targetTenantId = isSuperAdmin ? (brands.find(b => b.id === formData.brandId)?.tenantId || '') : (currentUser.tenantId || '');
      onAddLead({
        ...formData,
        id: `l-${Date.now()}`,
        tenantId: targetTenantId,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        comments: [{ id: `c-${Date.now()}`, text: 'Lead manually entered into system.', authorName: currentUser.name, timestamp: new Date().toISOString() }],
        upsellComments: [],
        lastUpdatedBy: currentUser.name
      } as Lead);
    }
    setShowModal(false);
  };

  const handlePromoteToConnection = (lead: Lead) => {
    onUpdateLead({
      ...lead,
      isConnection: true,
      timestamp: new Date().toISOString(),
      comments: [...lead.comments, { id: `pc-${Date.now()}`, text: 'Promoted to Warm Connection.', authorName: currentUser.name, timestamp: new Date().toISOString() }]
    });
    alert(`${lead.name} promoted to Connection.`);
  };

  const handleFinalConversion = () => {
    const lead = leads.find(l => l.id === viewingLeadId);
    if (!lead || !packageTitle || totalAmount <= 0) return;
    const itemsSum = saleItems.reduce((acc, item) => acc + item.amount, 0);
    const balance = totalAmount - itemsSum;
    onUpdateLead({
      ...lead,
      isClient: true,
      isConnection: true,
      status: LeadStatus.CONVERTED,
      timestamp: new Date().toISOString(),
      saleRecord: { packageTitle, totalAmount, items: saleItems, remainingBalance: balance, convertedDate: new Date().toISOString() },
      upsellComments: [{ id: `uc-conv-${Date.now()}`, text: `Converted to Client. Contract: $${totalAmount.toLocaleString()}.`, authorName: 'System Auditor', timestamp: new Date().toISOString() }]
    });
    setShowClientForm(false);
    setViewingLeadId(null);
  };

  const renderDetailedView = () => {
    const lead = leads.find(l => l.id === viewingLeadId);
    if (!lead) return null;
    const assignedUser = users.find(u => u.id === lead.assignedTo);
    const brand = brands.find(b => b.id === lead.brandId);

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-500 max-w-7xl mx-auto pb-20">
        <div className="flex items-center justify-between border-b border-slate-200 pb-8">
          <button onClick={() => setViewingLeadId(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">← Return to Database</button>
          <div className="flex gap-4">
             {!lead.isConnection && (
                <button onClick={() => handlePromoteToConnection(lead)} className="px-8 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center gap-3 active:scale-95">
                  <span className="text-lg">🤝</span> Promote to Connection
                </button>
             )}
             {canConvert && (
               <button onClick={() => setShowClientForm(true)} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3 active:scale-95">
                 <span className="text-lg">🚀</span> Convert to Client
               </button>
             )}
          </div>
        </div>

        {showClientForm && (
          <div className="bg-emerald-50 border border-emerald-200 p-12 rounded-[3.5rem] animate-in slide-in-from-bottom-6 duration-700 shadow-2xl">
            <h4 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter mb-10">Deploy Sale Package</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
               <div>
                  <label className="block text-[11px] font-black text-emerald-700 uppercase mb-3">Package Title</label>
                  <input type="text" value={packageTitle} onChange={e => setPackageTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-none shadow-inner" placeholder="E.g. Full CRM Suite" />
               </div>
               <div>
                  <label className="block text-[11px] font-black text-emerald-700 uppercase mb-3">Contract Value ($)</label>
                  <input type="number" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} className="w-full px-6 py-4 rounded-2xl border-none shadow-inner font-black text-emerald-600" />
               </div>
            </div>
            <button onClick={handleFinalConversion} className="bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 transition-all">Complete Conversion</button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12">
                <div className="flex items-center gap-5 flex-wrap mb-10">
                   <h3 className="text-5xl font-black text-slate-800 uppercase tracking-tighter leading-none">{lead.name}</h3>
                   <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-5 py-2 rounded-full border border-indigo-100 uppercase tracking-widest">{brand?.name}</span>
                </div>
                <div className="p-10 bg-slate-50 rounded-[2.5rem] italic text-xl text-slate-600 leading-relaxed border border-slate-100 shadow-inner mb-12">
                  "{lead.inquiry}"
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lead Status</p>
                     <p className="font-bold text-slate-800">{lead.status}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Call Priority</p>
                     <p className="font-bold text-slate-800">{lead.callStatus}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Owner</p>
                     <p className="font-bold text-slate-800">{assignedUser?.name || 'Unassigned'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last Sync</p>
                     <p className="text-[10px] font-bold text-slate-500">{new Date(lead.timestamp).toLocaleString()}</p>
                   </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12">
               <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Marketing Automation Log
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Email Status</p>
                     <p className="font-black text-slate-800 uppercase tracking-tight">{lead.marketingEmailStatus}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Followup Cadence</p>
                     <p className="font-black text-slate-800 uppercase tracking-tight">{lead.followupStatus}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Source / Campaign</p>
                     <p className="font-black text-slate-800 uppercase tracking-tight">{lead.sentFrom || 'N/A'}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 h-full">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[700px]">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Audit Trail</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                 {lead.comments.slice().reverse().map(c => (
                   <div key={c.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase text-slate-800">{c.authorName}</span>
                        <span className="text-[8px] text-slate-400 font-bold">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{c.text}</p>
                   </div>
                 ))}
              </div>
              <div className="p-8 border-t border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); if(!newComment.trim()) return; onUpdateLead({...lead, comments: [...lead.comments, {id: Date.now().toString(), text: newComment, authorName: currentUser.name, timestamp: new Date().toISOString()}]}); setNewComment(''); }} className="flex gap-3">
                   <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add note..." className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium" />
                   <button type="submit" className="bg-primary text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Post</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {viewingLeadId ? renderDetailedView() : (
        <div className="space-y-10 pb-20">
          <div className="flex justify-between items-center">
             <div>
               <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">{isConnectionsView ? 'Warm Engagement Portfolio' : 'Lead Acquisition Pipeline'}</h3>
               <p className="text-slate-500 font-medium mt-2">Managing {processedLeads.length} prioritized nodes</p>
             </div>
             {canCreate && (
               <button onClick={() => openEditModal()} className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all flex items-center gap-3 active:scale-95">
                  <span className="text-lg">➕</span> Provision Lead
               </button>
             )}
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <th className="px-8 py-6">Entity / Brand</th>
                    <th className="px-8 py-6">Lead Status</th>
                    <th className="px-8 py-6">Call Status</th>
                    <th className="px-8 py-6">Snapshot Inquiry</th>
                    <th className="px-8 py-6">Latest Update</th>
                    <th className="px-8 py-6">Marketing / Automation</th>
                    <th className="px-8 py-6">Ownership</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {processedLeads.map(lead => {
                    const brand = brands.find(b => b.id === lead.brandId);
                    const owner = users.find(u => u.id === lead.assignedTo);
                    const latestComment = lead.comments[lead.comments.length - 1];

                    return (
                      <tr key={lead.id} onClick={() => setViewingLeadId(lead.id)} className="hover:bg-slate-50/80 cursor-pointer transition-all group">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-800 uppercase tracking-tight group-hover:text-primary transition-colors">{lead.name}</span>
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{brand?.name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-blue-50 text-blue-600 border-blue-100">{lead.status}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-slate-50 text-slate-500 border-slate-100">{lead.callStatus}</span>
                        </td>
                        <td className="px-8 py-6 max-w-xs">
                           <p className="text-xs text-slate-500 font-medium italic line-clamp-2 leading-relaxed">"{lead.inquiry}"</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-0.5 max-w-[140px]">
                              <p className="text-[10px] text-slate-800 font-black truncate">{latestComment?.text || 'No Logs'}</p>
                              <p className="text-[8px] text-slate-400 font-bold">{latestComment ? new Date(latestComment.timestamp).toLocaleDateString() : '-'}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                 <span className={`w-1.5 h-1.5 rounded-full ${lead.marketingEmailStatus === 'Sent' ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                                 {lead.marketingEmailStatus}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold">{lead.followupStatus}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] border border-primary/10">{owner?.name.charAt(0) || '?'}</div>
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{owner?.name.split(' ')[0] || 'Unassigned'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canUpdate && (
                                <button onClick={(e) => openEditModal(lead, e)} className="p-2 text-primary hover:bg-primary/5 rounded-lg">✎</button>
                              )}
                              {canDelete && (
                                <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete lead?')) onDeleteLead(lead.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">✕</button>
                              )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                  {processedLeads.length === 0 && (
                    <tr>
                       <td colSpan={8} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic">Database Inactive</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 animate-in zoom-in-95 duration-200">
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">Asset Provisioning</h3>
             <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Entity Name</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Email Identity</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" />
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Primary Inquiry</label>
                   <textarea required value={formData.inquiry} onChange={e => setFormData({...formData, inquiry: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none outline-none font-medium h-32 resize-none" />
                </div>
                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-500">Cancel</button>
                   <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20">Commit Provisioning</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;

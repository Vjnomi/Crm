
import React, { useState, useMemo } from 'react';
import { Lead, Brand, User, UserRole, Role, LeadStatus, CallStatus, Tenant, LeadComment, SaleRecord } from '../types';

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
  onUpdateMultipleLeads?: (leads: Lead[]) => void;
  isConnectionsView?: boolean;
}

const LeadManagement: React.FC<LeadManagementProps> = ({
  leads, brands, users, tenants, roles, currentUser, onAddLead, onUpdateLead, onDeleteLead, onUpdateMultipleLeads, isConnectionsView = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  
  const [showClientForm, setShowClientForm] = useState(false);
  const [packageTitle, setPackageTitle] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [conversionComments, setConversionComments] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [contractFileName, setContractFileName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCallStatus, setFilterCallStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTargetUserId, setBulkTargetUserId] = useState('');
  const [bulkTargetBrandId, setBulkTargetBrandId] = useState('');

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
  const isTL = currentUserRole?.name.toLowerCase().includes('team lead') || currentUserRole?.name.toLowerCase().includes('tl');
  
  const canRead = isAdmin || permissions.includes('leads:read');
  const canCreate = isAdmin || permissions.includes('leads:create');
  const canUpdate = isAdmin || permissions.includes('leads:update');
  const canDelete = isAdmin || permissions.includes('leads:delete');
  const canConvert = permissions.includes('leads:convert_client');
  const canAssign = isAdmin || permissions.includes('leads:assign_team');

  const availableBrands = useMemo(() => {
    if (isSuperAdmin) return editingLead ? brands.filter(b => b.tenantId === editingLead.tenantId) : brands;
    return brands.filter(b => b.tenantId === currentUser?.tenantId);
  }, [brands, currentUser, isSuperAdmin, editingLead]);

  // Hierarchical Assignment Selection:
  // Admin can assign to TLs or Sellers.
  // TL can only assign to Sellers.
  const assignableUsers = useMemo(() => {
    return users.filter(u => {
      if (isSuperAdmin) return true;
      if (u.tenantId !== currentUser.tenantId) return false;
      const uRole = roles.find(r => r.id === u.customRoleId)?.name.toLowerCase() || '';
      
      if (isCompanyAdmin) {
        // Company Admin can assign to TLs and Sellers
        return uRole.includes('team lead') || uRole.includes('tl') || uRole.includes('seller');
      }
      if (isTL) {
        // TL can only assign to Sellers
        return uRole.includes('seller');
      }
      return false;
    });
  }, [users, isSuperAdmin, isCompanyAdmin, isTL, roles, currentUser]);

  const processedLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesScope = isSuperAdmin || (lead.tenantId === currentUser?.tenantId);
      if (!matchesScope) return false;
      
      const canSeeAll = isAdmin || isTL || permissions.includes('leads:assign_team');
      if (!canSeeAll && lead.assignedTo !== currentUser.id) return false;
      
      if (lead.isClient) return false; 
      if (isConnectionsView) return lead.isConnection;
      return true;
    });

    if (filterStatus !== 'all') filtered = filtered.filter(l => l.status === filterStatus);
    if (filterCallStatus !== 'all') filtered = filtered.filter(l => l.callStatus === filterCallStatus);
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.email.toLowerCase().includes(q) || 
        (l.number || '').toLowerCase().includes(q) || 
        (l.lTag || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads, filterStatus, filterCallStatus, searchQuery, isAdmin, isSuperAdmin, isTL, permissions, currentUser, isConnectionsView]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === processedLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedLeads.map(l => l.id));
    }
  };

  const handleBulkAssignUser = () => {
    if (!bulkTargetUserId || selectedIds.length === 0 || !onUpdateMultipleLeads) return;
    const targetUser = users.find(u => u.id === bulkTargetUserId);
    const updated = leads.filter(l => selectedIds.includes(l.id)).map(l => ({
      ...l,
      assignedTo: bulkTargetUserId,
      lastUpdatedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      comments: [...l.comments, { id: `bulk-${Date.now()}`, text: `Bulk assigned to ${targetUser?.name || 'User'}.`, authorName: currentUser.name, timestamp: new Date().toISOString() }]
    }));
    onUpdateMultipleLeads(updated);
    setSelectedIds([]);
    setBulkTargetUserId('');
    alert(`Successfully assigned ${updated.length} leads.`);
  };

  const handleBulkAssignBrand = () => {
    if (!bulkTargetBrandId || selectedIds.length === 0 || !onUpdateMultipleLeads) return;
    const targetBrand = brands.find(b => b.id === bulkTargetBrandId);
    const updated = leads.filter(l => selectedIds.includes(l.id)).map(l => ({
      ...l,
      brandId: bulkTargetBrandId,
      lastUpdatedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      comments: [...l.comments, { id: `bulk-b-${Date.now()}`, text: `Bulk reassigned to brand: ${targetBrand?.name || 'Brand'}.`, authorName: currentUser.name, timestamp: new Date().toISOString() }]
    }));
    onUpdateMultipleLeads(updated);
    setSelectedIds([]);
    setBulkTargetBrandId('');
    alert(`Successfully reassigned ${updated.length} leads to ${targetBrand?.name}.`);
  };

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
        lTag: lead.lTag || '',
        sentFrom: lead.sentFrom || '',
        assignedTo: lead.assignedTo || '',
        followupCount: lead.followupCount || 0,
        followupStatus: lead.followupStatus || 'Not Started',
        marketingEmailStatus: lead.marketingEmailStatus || 'Pending',
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
        comments: [{ id: `c-${Date.now()}`, text: 'Lead manually provisioned.', authorName: currentUser.name, timestamp: new Date().toISOString() }],
        upsellComments: [],
        lastUpdatedBy: currentUser.name
      } as Lead);
    }
    setShowModal(false);
  };

  const renderDetailedView = () => {
    const lead = leads.find(l => l.id === viewingLeadId);
    if (!lead) return null;
    const assignedUser = users.find(u => u.id === lead.assignedTo);
    const brand = brands.find(b => b.id === lead.brandId);

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-500 max-w-7xl mx-auto pb-20">
        <div className="flex items-center justify-between border-b border-theme pb-8">
          <div className="flex gap-4">
            <button onClick={() => setViewingLeadId(null)} className="px-6 py-3 theme-surface border border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest theme-text-muted hover:scale-105 transition-all shadow-sm">← Return to Database</button>
            {canUpdate && (
              <button onClick={(e) => openEditModal(lead, e)} className="px-6 py-3 bg-primary text-white border border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">✎ Edit Identity Node</button>
            )}
          </div>
          <div className="flex gap-4">
             {!lead.isConnection && (
                <button onClick={() => { onUpdateLead({...lead, isConnection: true}); alert("Promoted to connection."); }} className="px-8 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all active:scale-95">
                  🤝 Promote to Connection
                </button>
             )}
             {canConvert && (
               <button onClick={() => setShowClientForm(true)} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
                 🚀 Convert to Client
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <div className="theme-surface rounded-[3rem] border border-theme shadow-sm p-12">
                <div className="flex items-center gap-5 flex-wrap mb-10">
                   <h3 className="text-5xl font-black theme-text-main uppercase tracking-tighter leading-none">{lead.name}</h3>
                   <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black px-5 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/40 uppercase tracking-widest">{brand?.name}</span>
                   {lead.lTag && <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/40 uppercase tracking-widest">{lead.lTag}</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="p-8 theme-bg rounded-[2rem] border border-theme shadow-inner">
                      <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-2">Direct Contact Node</p>
                      <p className="font-black theme-text-main text-lg">{lead.email}</p>
                      <p className="font-bold theme-text-muted mt-1">{lead.number || 'No Phone Node'}</p>
                   </div>
                   <div className="p-8 theme-bg rounded-[2rem] border border-theme shadow-inner">
                      <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-2">Original Inquiry</p>
                      <p className="text-sm theme-text-muted leading-relaxed italic line-clamp-3">"{lead.inquiry}"</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                   <div>
                     <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-2">Pipeline State</p>
                     <p className="font-bold theme-text-main">{lead.status}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-2">Call Node</p>
                     <p className="font-bold theme-text-main">{lead.callStatus}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-2">Strategic Owner</p>
                     <p className="font-bold theme-text-main">{assignedUser?.name || 'Unassigned'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-2">Latest Sync</p>
                     <p className="text-[10px] font-bold theme-text-muted">{new Date(lead.timestamp).toLocaleString()}</p>
                   </div>
                </div>
            </div>

            <div className="theme-surface rounded-[3rem] border border-theme shadow-sm p-12">
               <h4 className="text-xs font-black theme-text-main uppercase tracking-widest mb-10 flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> n8n Marketing Intelligence
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 theme-bg rounded-3xl border border-theme">
                     <p className="text-[9px] font-black theme-text-muted uppercase mb-2">Email Status</p>
                     <p className="font-black theme-text-main uppercase tracking-tight text-[11px]">{lead.marketingEmailStatus}</p>
                  </div>
                  <div className="p-6 theme-bg rounded-3xl border border-theme">
                     <p className="text-[9px] font-black theme-text-muted uppercase mb-2">Followup Status</p>
                     <p className="font-black theme-text-main uppercase tracking-tight text-[11px]">{lead.followupStatus}</p>
                  </div>
                  <div className="p-6 theme-bg rounded-3xl border border-theme col-span-1 lg:col-span-2">
                     <p className="text-[9px] font-black theme-text-muted uppercase mb-2">Marketing Sent From</p>
                     <p className="font-black text-primary lowercase tracking-tight text-[11px] truncate">{lead.sentFrom || 'awaiting_first_drip@sofverse.com'}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
            {(canAssign || isTL) && (
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                 <h5 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6">Strategic Delegation</h5>
                 <div className="space-y-6">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Assign Portfolio Owner</label>
                      <select 
                        value={lead.assignedTo || ''} 
                        onChange={(e) => onUpdateLead({...lead, assignedTo: e.target.value, lastUpdatedBy: currentUser.name, timestamp: new Date().toISOString()})}
                        className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-white text-xs outline-none focus:ring-4 focus:ring-primary/20"
                      >
                         <option value="">-- Unassigned --</option>
                         {assignableUsers.map(u => {
                            const uRole = roles.find(r => r.id === u.customRoleId)?.name || u.role;
                            return <option key={u.id} value={u.id}>{u.name} [{uRole}]</option>;
                         })}
                      </select>
                    </div>
                    <p className="text-[9px] text-slate-500 italic leading-relaxed">
                      {isTL ? "As Team Lead, delegate to verified Sellers within your scope." : "As Admin, authorize global personnel assignments."}
                    </p>
                 </div>
              </div>
            )}

            <div className="theme-surface rounded-[3rem] border border-theme shadow-sm flex flex-col h-[550px]">
              <div className="p-10 border-b border-theme flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                 <h4 className="text-xs font-black theme-text-main uppercase tracking-widest">Operation Audit Trail</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                 {lead.comments.slice().reverse().map(c => (
                   <div key={c.id} className="p-5 rounded-2xl border theme-bg border-theme">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase theme-text-main">{c.authorName}</span>
                        <span className="text-[8px] theme-text-muted font-bold">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed theme-text-muted">{c.text}</p>
                   </div>
                 ))}
              </div>
              <div className="p-8 border-t border-theme">
                <form onSubmit={(e) => { e.preventDefault(); if(!newComment.trim()) return; onUpdateLead({...lead, comments: [...lead.comments, {id: Date.now().toString(), text: newComment, authorName: currentUser.name, timestamp: new Date().toISOString()}]}); setNewComment(''); }} className="flex gap-3">
                   <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Append operational note..." className="flex-1 px-5 py-3 theme-bg border border-theme rounded-xl outline-none text-sm font-medium theme-text-main" />
                   <button type="submit" className="bg-primary text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Post Log</button>
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
             <div>
               <h3 className="text-4xl font-black theme-text-main uppercase tracking-tighter">{isConnectionsView ? 'Warm Engagement Portfolio' : 'Lead Acquisition Pipeline'}</h3>
               <p className="theme-text-muted font-medium mt-2">Managing {processedLeads.length} prioritized nodes</p>
             </div>
             
             <div className="flex flex-wrap items-center gap-4 theme-surface p-3 rounded-[2.2rem] border border-theme shadow-sm w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64 min-w-[200px]">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                   <input 
                      type="text" 
                      placeholder="Search identity, email, tag..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="w-full pl-11 pr-4 py-2.5 theme-bg border border-theme rounded-2xl outline-none text-[11px] font-bold theme-text-main" 
                   />
                </div>
                {canCreate && (
                  <button onClick={() => openEditModal()} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all flex items-center gap-3 active:scale-95">
                      Provision Lead
                  </button>
                )}
             </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedIds.length > 0 && (
            <div className="sticky top-24 z-50 bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black">{selectedIds.length}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest leading-none">Nodes Selected</p>
                  <button onClick={() => setSelectedIds([])} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold">Clear Selection</button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700">
                  <select value={bulkTargetUserId} onChange={e => setBulkTargetUserId(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-300 w-40 px-3">
                    <option value="">Assign To Personnel</option>
                    {assignableUsers.map(u => <option key={u.id} value={u.id} className="text-black">{u.name}</option>)}
                  </select>
                  <button onClick={handleBulkAssignUser} disabled={!bulkTargetUserId} className="bg-primary px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Execute</button>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700">
                    <select value={bulkTargetBrandId} onChange={e => setBulkTargetBrandId(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-300 w-40 px-3">
                      <option value="">Reassign Brand</option>
                      {availableBrands.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                    </select>
                    <button onClick={handleBulkAssignBrand} disabled={!bulkTargetBrandId} className="bg-indigo-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Execute</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="theme-surface rounded-[3rem] border border-theme shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="theme-bg border-b border-theme text-[10px] font-black theme-text-muted uppercase tracking-[0.15em]">
                    <th className="px-8 py-6 w-10">
                      <input type="checkbox" checked={selectedIds.length === processedLeads.length && processedLeads.length > 0} onChange={toggleSelectAll} className="w-5 h-5 rounded-lg border-theme text-primary focus:ring-primary" />
                    </th>
                    <th className="px-8 py-6">Entity / Contact Hub</th>
                    <th className="px-8 py-6">Lead Status</th>
                    <th className="px-8 py-6">Call Node</th>
                    <th className="px-8 py-6">Lead Tag</th>
                    <th className="px-8 py-6">Automation Feed</th>
                    <th className="px-8 py-6">Ownership</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {processedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-8 py-20 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">No assets found in current scope</td>
                    </tr>
                  ) : processedLeads.map(lead => {
                    const brand = brands.find(b => b.id === lead.brandId);
                    const owner = users.find(u => u.id === lead.assignedTo);
                    const isSelected = selectedIds.includes(lead.id);

                    return (
                      <tr key={lead.id} onClick={() => setViewingLeadId(lead.id)} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/80 cursor-pointer transition-all group ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="px-8 py-6">
                           <input type="checkbox" checked={isSelected} onClick={(e) => toggleSelect(lead.id, e)} onChange={() => {}} className="w-5 h-5 rounded-lg border-theme text-primary focus:ring-primary" />
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-black theme-text-main uppercase tracking-tight group-hover:text-primary transition-colors">{lead.name}</span>
                              <span className="text-[9px] font-black theme-text-muted uppercase tracking-widest mt-0.5">{lead.email}</span>
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{brand?.name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/40">{lead.status}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest theme-bg theme-text-muted border-theme">{lead.callStatus}</span>
                        </td>
                        <td className="px-8 py-6">
                           {lead.lTag ? (
                             <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/40">{lead.lTag}</span>
                           ) : (
                             <span className="text-[9px] font-black text-slate-300 uppercase italic">Untagged</span>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black theme-text-muted uppercase flex items-center gap-1.5">{lead.marketingEmailStatus}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] border border-primary/10">{owner?.name.charAt(0) || '?'}</div>
                              <span className="text-[10px] font-black theme-text-main uppercase tracking-tight">{owner?.name.split(' ')[0] || 'Unassigned'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2">
                              {canUpdate && (
                                <button onClick={(e) => openEditModal(lead, e)} className="p-2 text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">✎</button>
                              )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="theme-surface rounded-[2.5rem] shadow-2xl w-full max-w-4xl p-10 my-8 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8 border-b border-theme pb-6">
                <h3 className="text-2xl font-black theme-text-main uppercase tracking-tight">{editingLead ? 'Update Lead node' : 'Provision Lead node'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-600 font-black">✕</button>
             </div>
             
             <form onSubmit={handleLeadSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Full Name / Identity</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 theme-bg rounded-2xl border border-theme outline-none font-bold theme-text-main" placeholder="E.g. Elon Musk" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Email Endpoint</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3.5 theme-bg rounded-2xl border border-theme outline-none font-bold theme-text-main" placeholder="name@domain.com" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Direct Phone Node</label>
                      <input value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full px-5 py-3.5 theme-bg rounded-2xl border border-theme outline-none font-bold theme-text-main" placeholder="+1 555-000-0000" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div>
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Pipeline status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as LeadStatus})} className="w-full px-4 py-3 theme-bg border border-theme rounded-xl outline-none font-bold theme-text-main">
                         {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Call Interaction</label>
                      <select value={formData.callStatus} onChange={e => setFormData({...formData, callStatus: e.target.value as CallStatus})} className="w-full px-4 py-3 theme-bg border border-theme rounded-xl outline-none font-bold theme-text-main">
                         {Object.values(CallStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">L Tag (Strategic Tag)</label>
                      <input value={formData.lTag} onChange={e => setFormData({...formData, lTag: e.target.value})} className="w-full px-5 py-3.5 theme-bg border border-theme outline-none font-black text-amber-600 uppercase" placeholder="LEGENDARY, COLD, VVIP" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Portfolio Brand</label>
                      <select value={formData.brandId} onChange={e => setFormData({...formData, brandId: e.target.value})} className="w-full px-4 py-3 theme-bg border border-theme rounded-xl outline-none font-bold theme-text-main">
                         {availableBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black theme-text-muted uppercase mb-2 tracking-widest">Engagement Context (Inquiry)</label>
                   <textarea required value={formData.inquiry} onChange={e => setFormData({...formData, inquiry: e.target.value})} className="w-full px-5 py-4 theme-bg rounded-2xl border border-theme outline-none font-medium theme-text-main h-32 resize-none" placeholder="Provide raw inquiry text or historical context..." />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 theme-bg rounded-2xl font-black uppercase text-[11px] tracking-widest theme-text-muted">Abort Changes</button>
                   <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">Commit Asset Node</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;

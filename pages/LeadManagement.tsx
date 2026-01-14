
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
  const [basePrice, setBasePrice] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [conversionComments, setConversionComments] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [contractFileName, setContractFileName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCallStatus, setFilterCallStatus] = useState<string>('all');
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

  const availableBrands = useMemo(() => {
    if (isSuperAdmin) return editingLead ? brands.filter(b => b.tenantId === editingLead.tenantId) : brands;
    return brands.filter(b => b.tenantId === currentUser?.tenantId);
  }, [brands, currentUser, isSuperAdmin, editingLead]);

  const remainingBalance = useMemo(() => Math.max(0, basePrice - amountPaid), [basePrice, amountPaid]);

  const processedLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesScope = isSuperAdmin || (lead.tenantId === currentUser?.tenantId);
      if (!matchesScope) return false;
      
      // Basic role-based filtering: Users only see their assigned leads unless they have TL/Admin rights
      const canSeeAll = isAdmin || permissions.includes('leads:assign_team');
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
  }, [leads, filterStatus, filterCallStatus, searchQuery, isAdmin, isSuperAdmin, permissions, currentUser, isConnectionsView]);

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
    if (!lead || !packageTitle || basePrice <= 0) {
      alert("Please fill in the package title and base price.");
      return;
    }
    
    const saleRecord: SaleRecord = {
      packageTitle,
      basePrice,
      amountPaid,
      remainingBalance,
      invoiceFile: invoiceFileName,
      contractFile: contractFileName,
      convertedDate: new Date().toISOString()
    };

    const newComments = [...lead.comments];
    const newUpsellComments = [...lead.upsellComments];
    
    if (conversionComments.trim()) {
      const handoverComment = {
        id: `c-conv-note-${Date.now()}`,
        text: `FRONT HANDOVER NOTE: ${conversionComments}`,
        authorName: currentUser.name,
        timestamp: new Date().toISOString()
      };
      newComments.push(handoverComment);
      newUpsellComments.push(handoverComment);
    }

    onUpdateLead({
      ...lead,
      isClient: true,
      isConnection: true,
      status: LeadStatus.CONVERTED,
      timestamp: new Date().toISOString(),
      saleRecord,
      comments: newComments,
      upsellComments: newUpsellComments,
      lastUpdatedBy: currentUser.name
    });
    
    setShowClientForm(false);
    setPackageTitle('');
    setBasePrice(0);
    setAmountPaid(0);
    setConversionComments('');
    setInvoiceFileName('');
    setContractFileName('');
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
          <div className="bg-emerald-50 border border-emerald-200 p-12 rounded-[3.5rem] animate-in slide-in-from-bottom-6 duration-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => setShowClientForm(false)} className="text-emerald-300 hover:text-emerald-600 font-black">✕ CANCEL</button>
            </div>
            <h4 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter mb-10 flex items-center gap-4">
              <span className="text-4xl">💎</span> Deploy Premium Sale Package
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
               <div className="col-span-1 md:col-span-2 lg:col-span-1">
                  <label className="block text-[11px] font-black text-emerald-700 uppercase mb-3">Target Package Name</label>
                  <input type="text" value={packageTitle} onChange={e => setPackageTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-none shadow-inner bg-white" placeholder="E.g. Full CRM Enterprise Suite" />
               </div>
               <div>
                  <label className="block text-[11px] font-black text-emerald-700 uppercase mb-3">Base Price ($)</label>
                  <input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className="w-full px-6 py-4 rounded-2xl border-none shadow-inner bg-white font-black text-emerald-600" />
               </div>
               <div>
                  <label className="block text-[11px] font-black text-emerald-700 uppercase mb-3">Initial Payment ($)</label>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-full px-6 py-4 rounded-2xl border-none shadow-inner bg-white font-black text-blue-600" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
               <div className="bg-white p-6 rounded-3xl shadow-inner flex flex-col items-center justify-center border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Calculated Balance</p>
                  <p className={`text-3xl font-black ${remainingBalance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    ${remainingBalance.toLocaleString()}
                  </p>
               </div>
               <div className="space-y-4">
                  <label className="block text-[11px] font-black text-emerald-700 uppercase">Evidence (Invoice)</label>
                  <div className="relative group cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setInvoiceFileName(e.target.files?.[0]?.name || '')} />
                    <div className="w-full px-6 py-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-center gap-3 group-hover:bg-emerald-100 transition-all">
                      <span className="text-xl">📄</span>
                      <span className="text-[11px] font-black text-emerald-600 truncate">{invoiceFileName || 'Upload Invoice'}</span>
                    </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="block text-[11px] font-black text-emerald-700 uppercase">Agreement (Optional Contract)</label>
                  <div className="relative group cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setContractFileName(e.target.files?.[0]?.name || '')} />
                    <div className="w-full px-6 py-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-center gap-3 group-hover:bg-emerald-100 transition-all">
                      <span className="text-xl">🖋️</span>
                      <span className="text-[11px] font-black text-emerald-600 truncate">{contractFileName || 'Upload Contract'}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="mb-10">
               <label className="block text-[11px] font-black text-emerald-700 uppercase mb-3">Operations Handover Comments</label>
               <textarea value={conversionComments} onChange={e => setConversionComments(e.target.value)} className="w-full px-6 py-5 rounded-[2rem] border-none shadow-inner bg-white h-32 resize-none" placeholder="Provide any critical deal context for the delivery team..." />
            </div>

            <div className="flex justify-center">
              <button onClick={handleFinalConversion} className="bg-emerald-600 text-white px-16 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                 DEPLOY ASSET & FINALIZE SALE <span className="text-2xl">💰</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12">
                <div className="flex items-center gap-5 flex-wrap mb-10">
                   <h3 className="text-5xl font-black text-slate-800 uppercase tracking-tighter leading-none">{lead.name}</h3>
                   <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-5 py-2 rounded-full border border-indigo-100 uppercase tracking-widest">{brand?.name}</span>
                   {lead.lTag && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-amber-200 uppercase tracking-widest">{lead.lTag}</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Direct Contact Node</p>
                      <p className="font-black text-slate-800 text-lg">{lead.email}</p>
                      <p className="font-bold text-slate-500 mt-1">{lead.number || 'No Phone Node'}</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Inquiry</p>
                      <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">"{lead.inquiry}"</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pipeline State</p>
                     <p className="font-bold text-slate-800">{lead.status}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Call Node</p>
                     <p className="font-bold text-slate-800">{lead.callStatus}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Strategic Owner</p>
                     <p className="font-bold text-slate-800">{assignedUser?.name || 'Unassigned'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Latest Sync</p>
                     <p className="text-[10px] font-bold text-slate-500">{new Date(lead.timestamp).toLocaleString()}</p>
                   </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12">
               <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> n8n Marketing Intelligence
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Email Status</p>
                     <p className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{lead.marketingEmailStatus}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Followup Status</p>
                     <p className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{lead.followupStatus}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 col-span-1 lg:col-span-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Marketing Sent From</p>
                     <p className="font-black text-primary lowercase tracking-tight text-[11px] truncate">{lead.sentFrom || 'awaiting_first_drip@sofverse.com'}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[700px]">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Operation Audit Trail</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                 {lead.comments.slice().reverse().map(c => (
                   <div key={c.id} className={`p-5 rounded-2xl border ${c.text.startsWith('FRONT HANDOVER') ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase text-slate-800">{c.authorName}</span>
                        <span className="text-[8px] text-slate-400 font-bold">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className={`text-sm font-medium leading-relaxed ${c.text.startsWith('FRONT HANDOVER') ? 'text-emerald-900' : 'text-slate-600'}`}>{c.text}</p>
                   </div>
                 ))}
              </div>
              <div className="p-8 border-t border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); if(!newComment.trim()) return; onUpdateLead({...lead, comments: [...lead.comments, {id: Date.now().toString(), text: newComment, authorName: currentUser.name, timestamp: new Date().toISOString()}]}); setNewComment(''); }} className="flex gap-3">
                   <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Append operational note..." className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium" />
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
               <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">{isConnectionsView ? 'Warm Engagement Portfolio' : 'Lead Acquisition Pipeline'}</h3>
               <p className="text-slate-500 font-medium mt-2">Managing {processedLeads.length} prioritized nodes</p>
             </div>
             
             <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2.2rem] border border-slate-200 shadow-sm w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64 min-w-[200px]">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                   <input 
                      type="text" 
                      placeholder="Search identity, email, tag..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[11px] font-bold" 
                   />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-600">
                   <option value="all">Pipeline: All</option>
                   {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterCallStatus} onChange={e => setFilterCallStatus(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-600">
                   <option value="all">Call: All</option>
                   {Object.values(CallStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {canCreate && (
                  <button onClick={() => openEditModal()} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all flex items-center gap-3 active:scale-95">
                      Provision Lead
                  </button>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <th className="px-8 py-6">Entity / Contact Hub</th>
                    <th className="px-8 py-6">Lead Status</th>
                    <th className="px-8 py-6">Call Node</th>
                    <th className="px-8 py-6">Lead Tag</th>
                    <th className="px-8 py-6">Automation Feed</th>
                    <th className="px-8 py-6">Ownership</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {processedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">No assets found in current filtered scope</td>
                    </tr>
                  ) : processedLeads.map(lead => {
                    const brand = brands.find(b => b.id === lead.brandId);
                    const owner = users.find(u => u.id === lead.assignedTo);

                    return (
                      <tr key={lead.id} onClick={() => setViewingLeadId(lead.id)} className="hover:bg-slate-50/80 cursor-pointer transition-all group">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-800 uppercase tracking-tight group-hover:text-primary transition-colors">{lead.name}</span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{lead.email}</span>
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{brand?.name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-blue-50 text-blue-600 border-blue-100">{lead.status}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-slate-50 text-slate-500 border-slate-100">{lead.callStatus}</span>
                        </td>
                        <td className="px-8 py-6">
                           {lead.lTag ? (
                             <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-amber-50 text-amber-600 border-amber-100">{lead.lTag}</span>
                           ) : (
                             <span className="text-[9px] font-black text-slate-300 uppercase italic">Untagged</span>
                           )}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                 <span className={`w-1.5 h-1.5 rounded-full ${lead.marketingEmailStatus === 'Sent' ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                                 {lead.marketingEmailStatus}
                              </span>
                              <span className="text-[8px] text-primary font-bold lowercase truncate max-w-[120px]">{lead.sentFrom || 'N/A'}</span>
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl p-10 my-8 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lead Node Configuration</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-600 font-black">✕</button>
             </div>
             
             <form onSubmit={handleLeadSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Full Name / Identity</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-none outline-none font-bold" placeholder="E.g. Elon Musk" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Email Endpoint</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-none outline-none font-bold" placeholder="name@domain.com" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Direct Phone Node</label>
                      <input value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-none outline-none font-bold" placeholder="+1 555-000-0000" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Pipeline status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as LeadStatus})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                         {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Call Interaction</label>
                      <select value={formData.callStatus} onChange={e => setFormData({...formData, callStatus: e.target.value as CallStatus})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                         {Object.values(CallStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">L Tag (Strategic Tag)</label>
                      <input value={formData.lTag} onChange={e => setFormData({...formData, lTag: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-black text-amber-600 uppercase" placeholder="LEGENDARY, COLD, VVIP" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Portfolio Brand</label>
                      <select value={formData.brandId} onChange={e => setFormData({...formData, brandId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                         {availableBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                   <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Marketing & Automation Node Sync</h5>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                         <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Sent From Campaign</label>
                         <input value={formData.sentFrom} onChange={e => setFormData({...formData, sentFrom: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-[11px] font-bold" placeholder="E.g. Outreach-Alpha" />
                      </div>
                      <div>
                         <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Email Engagement</label>
                         <input value={formData.marketingEmailStatus} onChange={e => setFormData({...formData, marketingEmailStatus: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-[11px] font-bold" placeholder="E.g. Clicked" />
                      </div>
                      <div>
                         <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Followup Cycle</label>
                         <input value={formData.followupStatus} onChange={e => setFormData({...formData, followupStatus: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-[11px] font-bold" placeholder="E.g. Drip active" />
                      </div>
                      <div>
                         <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Cycle Count</label>
                         <input type="number" value={formData.followupCount} onChange={e => setFormData({...formData, followupCount: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-[11px] font-bold" />
                      </div>
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Engagement Context (Inquiry)</label>
                   <textarea required value={formData.inquiry} onChange={e => setFormData({...formData, inquiry: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none outline-none font-medium h-32 resize-none" placeholder="Provide raw inquiry text or historical context..." />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-500">Abort Changes</button>
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

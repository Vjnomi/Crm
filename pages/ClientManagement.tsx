
import React, { useState, useMemo } from 'react';
import { Lead, User, UserRole, Role, Brand, LeadComment, SaleItem } from '../types';

interface ClientManagementProps {
  leads: Lead[];
  users: User[];
  brands: Brand[];
  roles: Role[];
  currentUser: User;
  onUpdateLead: (lead: Lead) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({
  leads, users, brands, roles, currentUser, onUpdateLead
}) => {
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBalance, setFilterBalance] = useState<'all' | 'due' | 'cleared'>('all');

  const [activeTab, setActiveTab] = useState<'finance' | 'strategy'>('finance');
  const [saleType, setSaleType] = useState<'New Sale' | 'Remaining Payment'>('New Sale');
  const [saleAmount, setSaleAmount] = useState(0);
  const [strategyNote, setStrategyNote] = useState('');
  const [quickLogText, setQuickLogText] = useState('');

  const currentUserRole = roles.find(r => r.id === currentUser?.customRoleId);
  const permissions = currentUserRole?.permissions || [];
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.COMPANY_ADMIN;
  const isBUH = currentUserRole?.name.toLowerCase().includes('buh') || currentUserRole?.name.toLowerCase().includes('business unit head');
  
  const canAssignPM = permissions.includes('projects:assign_pm') || isAdmin;

  const filteredClients = useMemo(() => {
    let clients = leads.filter(l => {
      if (!l.isClient) return false;
      const matchesTenant = l.tenantId === currentUser?.tenantId || isAdmin;
      if (!matchesTenant) return false;
      
      // Upsellers only see their assigned clients
      const isUpseller = currentUserRole?.name.toLowerCase().includes('upseller');
      if (isUpseller && !isAdmin && !isBUH && l.upsellAssignedTo !== currentUser?.id) return false;
      
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      clients = clients.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) ||
        (c.saleRecord?.packageTitle || '').toLowerCase().includes(q)
      );
    }

    if (filterBalance === 'due') {
      clients = clients.filter(c => (c.saleRecord?.remainingBalance || 0) > 0);
    } else if (filterBalance === 'cleared') {
      clients = clients.filter(c => (c.saleRecord?.remainingBalance || 0) === 0);
    }

    return clients.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leads, isAdmin, isBUH, currentUser, searchQuery, filterBalance, currentUserRole]);

  const availablePMs = useMemo(() => users.filter(u => u.tenantId === currentUser?.tenantId && roles.find(r => r.id === u.customRoleId)?.name.toLowerCase().includes('pm')), [users, currentUser, roles]);

  const handleDownload = (fileName: string) => {
    alert(`Initiating secure download of: ${fileName}`);
  };

  const handleRecordTransaction = () => {
    const client = leads.find(l => l.id === viewingClientId);
    if (!client || !client.saleRecord || saleAmount <= 0) return;
    const newRecord = { ...client.saleRecord };
    
    if (saleType === 'Remaining Payment') { 
      newRecord.amountPaid += saleAmount;
      newRecord.remainingBalance = Math.max(0, newRecord.basePrice - newRecord.amountPaid); 
    } else { 
      newRecord.basePrice += saleAmount; 
      newRecord.remainingBalance = Math.max(0, newRecord.basePrice - newRecord.amountPaid); 
    }

    onUpdateLead({ 
      ...client, 
      saleRecord: newRecord, 
      upsellComments: [...(client.upsellComments || []), { 
        id: `trans-${Date.now()}`, 
        text: `💰 FINANCIAL UPDATE: ${saleType} of $${saleAmount.toLocaleString()} processed.`, 
        authorName: currentUser.name, 
        timestamp: new Date().toISOString() 
      }],
      lastUpdatedBy: currentUser.name,
      timestamp: new Date().toISOString()
    });
    setSaleAmount(0);
  };

  const handlePostStrategyLog = (text: string, isQuick: boolean = false) => {
    const client = leads.find(l => l.id === viewingClientId);
    if (!client || !text.trim()) return;

    onUpdateLead({
      ...client,
      upsellComments: [...(client.upsellComments || []), {
        id: `strat-${Date.now()}`,
        text: `${isQuick ? '📝 QUICK LOG' : '📝 STRATEGY NOTE'}: ${text}`,
        authorName: currentUser.name,
        timestamp: new Date().toISOString()
      }],
      lastUpdatedBy: currentUser.name,
      timestamp: new Date().toISOString()
    });
    if (isQuick) setQuickLogText('');
    else setStrategyNote('');
  };

  const renderClientDetailed = () => {
    const client = leads.find(l => l.id === viewingClientId);
    if (!client) return null;
    const brand = brands.find(b => b.id === client.brandId);
    const frontLogs = client.comments.filter(c => c.text.includes('FRONT HANDOVER NOTE') || c.text.includes('Lead manually provisioned'));
    const upsellLogs = client.upsellComments || [];
    const combinedLogs = [...frontLogs, ...upsellLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-500 max-w-7xl mx-auto pb-20">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button onClick={() => setViewingClientId(null)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 shadow-sm transition-all">← Back to Portfolio</button>
          <div className="flex gap-4">
             {canAssignPM && (
               <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-slate-400">Delivery Lead (PM):</span>
                  <select value={client.projectManagerAssignedTo || ''} onChange={(e) => onUpdateLead({...client, projectManagerAssignedTo: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-1.5 font-bold text-[11px] outline-none">
                     <option value="">-- Unassigned --</option>
                     {availablePMs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
               </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-10">
           <div className="col-span-12 lg:col-span-8 space-y-10">
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="bg-emerald-600 p-12 text-white flex justify-between items-end">
                    <div className="max-w-[70%]">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Portfolio Asset</p>
                       <h3 className="text-5xl font-black uppercase tracking-tighter mb-4 truncate">{client.name}</h3>
                       <div className="flex items-center gap-4">
                          <span className="bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md">Partner Identity</span>
                          <span className="text-white/80 font-bold uppercase text-[10px] tracking-widest">{brand?.name}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Base Contract</p>
                       <p className="text-4xl font-black tracking-tight">${client.saleRecord?.basePrice.toLocaleString()}</p>
                    </div>
                 </div>
                 
                 <div className="p-12 border-b border-slate-50">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-blue-500"></span> Conversion Dossier
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Package</p>
                          <p className="font-black text-slate-800 text-lg mb-1">{client.saleRecord?.packageTitle || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-400">Converted on {new Date(client.saleRecord?.convertedDate || '').toLocaleDateString()}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                             <p className="text-[9px] font-black text-blue-500 uppercase mb-2">Total Paid</p>
                             <p className="text-xl font-black text-blue-700">${client.saleRecord?.amountPaid.toLocaleString()}</p>
                          </div>
                          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                             <p className="text-[9px] font-black text-amber-500 uppercase mb-2">Balance Due</p>
                             <p className="text-xl font-black text-amber-700">${client.saleRecord?.remainingBalance.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal & Financial Nodes</h5>
                       <div className="flex flex-wrap gap-4">
                          <div className={`flex-1 min-w-[240px] p-6 rounded-3xl border-2 border-dashed flex items-center gap-4 transition-all ${client.saleRecord?.invoiceFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50 opacity-40'}`}>
                             <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">📄</div>
                             <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Invoice</p>
                                <p className="text-[11px] font-black text-slate-800 truncate">{client.saleRecord?.invoiceFile || 'MISSING'}</p>
                             </div>
                             {client.saleRecord?.invoiceFile && (
                               <button onClick={() => handleDownload(client.saleRecord?.invoiceFile!)} className="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                 📥
                               </button>
                             )}
                          </div>
                          <div className={`flex-1 min-w-[240px] p-6 rounded-3xl border-2 border-dashed flex items-center gap-4 transition-all ${client.saleRecord?.contractFile ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-slate-50 opacity-40'}`}>
                             <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">🖋️</div>
                             <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Contract</p>
                                <p className="text-[11px] font-black text-slate-800 truncate">{client.saleRecord?.contractFile || 'OPTIONAL'}</p>
                             </div>
                             {client.saleRecord?.contractFile && (
                               <button onClick={() => handleDownload(client.saleRecord?.contractFile!)} className="w-10 h-10 rounded-xl bg-white border border-indigo-100 text-indigo-500 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                                 📥
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact Profile</p>
                       <p className="font-black text-slate-800 text-lg mb-1">{client.email}</p>
                       <p className="font-bold text-slate-500">{client.number || 'No Phone Node Registered'}</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Conversion Context</p>
                       <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">"{client.inquiry}"</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12">
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Account Stewardship
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Email status</p>
                       <p className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{client.marketingEmailStatus}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Followup Cadence</p>
                       <p className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{client.followupStatus}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Sent From Hub</p>
                       <p className="font-black text-emerald-600 lowercase tracking-tight text-[11px] truncate">{client.sentFrom || 'account-ops@sofverse.com'}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                 <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-8">Strategic Engagement Hub</h5>
                 
                 <div className="flex gap-2 bg-slate-800 p-1.5 rounded-2xl mb-8">
                    <button onClick={() => setActiveTab('finance')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'finance' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Finance</button>
                    <button onClick={() => setActiveTab('strategy')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'strategy' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Strategy</button>
                 </div>

                 {activeTab === 'finance' ? (
                   <div className="space-y-6 animate-in fade-in duration-300">
                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Amount ($)</label>
                         <input type="number" value={saleAmount} onChange={e => setSaleAmount(Number(e.target.value))} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-emerald-400 text-2xl outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => { setSaleType('New Sale'); handleRecordTransaction(); }} className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">New Sale</button>
                         <button onClick={() => { setSaleType('Remaining Payment'); handleRecordTransaction(); }} className="py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Payment</button>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6 animate-in fade-in duration-300">
                      <textarea value={strategyNote} onChange={e => setStrategyNote(e.target.value)} placeholder="Log a non-financial update..." className="w-full bg-slate-800 border-none rounded-3xl p-6 font-medium text-slate-200 text-sm outline-none h-32 resize-none" />
                      <button onClick={() => handlePostStrategyLog(strategyNote)} className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Post Strategy Note</button>
                   </div>
                 )}
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[700px]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Customer Success Audit Trail</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                   {combinedLogs.length > 0 ? combinedLogs.map(c => {
                     const isHandover = c.text.includes('FRONT HANDOVER NOTE');
                     const isFinancial = c.text.includes('💰');
                     const isStrategic = c.text.includes('📝');
                     
                     return (
                       <div key={c.id} className={`p-5 rounded-2xl border transition-all ${
                         isHandover ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 
                         isFinancial ? 'bg-blue-50/50 border-blue-100' :
                         isStrategic ? 'bg-indigo-50/50 border-indigo-100' :
                         'bg-slate-50 border-slate-100'
                       }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[9px] font-black uppercase ${isHandover ? 'text-emerald-700' : 'text-slate-800'}`}>{c.authorName}</span>
                            <span className="text-[8px] text-slate-400 font-bold">{new Date(c.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className={`text-sm font-medium leading-relaxed ${isHandover ? 'text-emerald-900' : 'text-slate-600'}`}>{c.text}</p>
                       </div>
                     );
                   }) : (
                     <p className="text-center py-20 text-[10px] font-black text-slate-300 uppercase tracking-widest">No audit nodes provisioned</p>
                   )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                  <form onSubmit={(e) => { e.preventDefault(); handlePostStrategyLog(quickLogText, true); }} className="flex gap-2">
                    <input 
                      type="text" 
                      value={quickLogText} 
                      onChange={e => setQuickLogText(e.target.value)} 
                      placeholder="Add quick success log..." 
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={!quickLogText.trim()}
                      className="bg-emerald-600 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      Post
                    </button>
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
      {viewingClientId ? renderClientDetailed() : (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div>
                 <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Corporate Portfolio</h3>
                 <p className="text-slate-500 font-medium mt-2">Overseeing {filteredClients.length} post-closure assets</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2.2rem] border border-slate-200 shadow-sm w-full lg:w-auto">
                 <div className="relative flex-1 lg:w-64 min-w-[200px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search identity, email, package..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[11px] font-bold" 
                    />
                 </div>
                 <select value={filterBalance} onChange={e => setFilterBalance(e.target.value as any)} className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <option value="all">Balance: All</option>
                    <option value="due">Balance: Outstanding</option>
                    <option value="cleared">Balance: Cleared</option>
                 </select>
              </div>
           </div>

           <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                       <th className="px-8 py-6">Partner Identity / Contact</th>
                       <th className="px-8 py-6">Unit Status</th>
                       <th className="px-8 py-6">Closing Context</th>
                       <th className="px-8 py-6">LTV Performance</th>
                       <th className="px-8 py-6">Automation Hub</th>
                       <th className="px-8 py-6">Ownership Node</th>
                       <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">No portfolio assets identified in current scope</td>
                      </tr>
                    ) : filteredClients.map(client => {
                       const brand = brands.find(b => b.id === client.brandId);
                       const upseller = users.find(u => u.id === client.upsellAssignedTo);
                       const pm = users.find(u => u.id === client.projectManagerAssignedTo);

                       return (
                          <tr key={client.id} onClick={() => setViewingClientId(client.id)} className="hover:bg-slate-50/80 cursor-pointer transition-all group">
                             <td className="px-8 py-6">
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{client.name}</span>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{client.email}</span>
                                   <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{brand?.name}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">CLIENT</span>
                             </td>
                             <td className="px-8 py-6 max-w-xs">
                                <p className="text-xs text-slate-500 font-medium italic line-clamp-1 leading-relaxed">"{client.inquiry}"</p>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black text-slate-800">${client.saleRecord?.basePrice.toLocaleString()}</span>
                                   <span className={`text-[9px] font-black ${(client.saleRecord?.remainingBalance || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>${client.saleRecord?.remainingBalance.toLocaleString()} Due</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col gap-1">
                                   <span className="text-[9px] font-black text-slate-400 uppercase">{client.marketingEmailStatus}</span>
                                   <span className="text-[8px] text-emerald-600 font-bold lowercase truncate max-w-[120px]">{client.sentFrom || 'account-ops@sofverse.com'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col gap-1">
                                   <span className="text-[9px] font-black text-emerald-600 uppercase">G: {upseller?.name.split(' ')[0] || 'Unassigned'}</span>
                                   <span className="text-[9px] font-black text-blue-600 uppercase">D: {pm?.name.split(' ')[0] || 'Unassigned'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button className="text-[9px] font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">Config</button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;

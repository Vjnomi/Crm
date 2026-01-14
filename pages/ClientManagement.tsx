
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

  const [saleType, setSaleType] = useState<'New Sale' | 'Remaining Payment'>('New Sale');
  const [saleNote, setSaleNote] = useState('');
  const [saleAmount, setSaleAmount] = useState(0);

  const currentUserRole = roles.find(r => r.id === currentUser?.customRoleId);
  const permissions = currentUserRole?.permissions || [];
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.COMPANY_ADMIN;
  const isBUH = currentUserRole?.name.toLowerCase().includes('buh') || currentUserRole?.name.toLowerCase().includes('business unit head');
  
  const canAssignBUH = permissions.includes('clients:assign_buh') || isAdmin;
  const canUpsell = permissions.includes('clients:upsell') || isAdmin;
  const canAssignPM = permissions.includes('projects:assign_pm') || isAdmin;

  const filteredClients = useMemo(() => {
    let clients = leads.filter(l => {
      if (!l.isClient) return false;
      const matchesTenant = l.tenantId === currentUser?.tenantId || isAdmin;
      if (!matchesTenant) return false;
      if (isAdmin || isBUH) return true;
      if (currentUserRole?.name.toLowerCase().includes('upseller') && l.upsellAssignedTo !== currentUser?.id) return false;
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      clients = clients.filter(c => c.name.toLowerCase().includes(q) || (c.saleRecord?.packageTitle || '').toLowerCase().includes(q));
    }

    if (filterBalance === 'due') {
      clients = clients.filter(c => (c.saleRecord?.remainingBalance || 0) > 0);
    } else if (filterBalance === 'cleared') {
      clients = clients.filter(c => (c.saleRecord?.remainingBalance || 0) === 0);
    }

    return clients.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leads, isAdmin, isBUH, currentUser, searchQuery, filterBalance, currentUserRole]);

  const availableUpsellers = useMemo(() => users.filter(u => u.tenantId === currentUser?.tenantId && roles.find(r => r.id === u.customRoleId)?.name.toLowerCase().includes('upseller')), [users, currentUser, roles]);
  const availablePMs = useMemo(() => users.filter(u => u.tenantId === currentUser?.tenantId && roles.find(r => r.id === u.customRoleId)?.name.toLowerCase().includes('pm')), [users, currentUser, roles]);

  const handleRecordTransaction = () => {
    const client = leads.find(l => l.id === viewingClientId);
    if (!client || !client.saleRecord || saleAmount <= 0) return;
    const newRecord = { ...client.saleRecord };
    if (saleType === 'Remaining Payment') { newRecord.remainingBalance = Math.max(0, newRecord.remainingBalance - saleAmount); }
    else { newRecord.totalAmount += saleAmount; newRecord.items.push({ id: `i-${Date.now()}`, name: saleNote || 'Strategic Upsell', amount: saleAmount }); }
    onUpdateLead({ ...client, saleRecord: newRecord, upsellComments: [...(client.upsellComments || []), { id: `trans-${Date.now()}`, text: `Transaction: ${saleType} recorded for $${saleAmount.toLocaleString()}.`, authorName: currentUser.name, timestamp: new Date().toISOString() }] });
    setSaleNote(''); setSaleAmount(0);
  };

  const renderClientDetailed = () => {
    const client = leads.find(l => l.id === viewingClientId);
    if (!client) return null;
    const currentUpseller = users.find(u => u.id === client.upsellAssignedTo);
    const currentPM = users.find(u => u.id === client.projectManagerAssignedTo);

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
                 <div className="bg-emerald-600 p-12 text-white">
                    <h3 className="text-5xl font-black uppercase tracking-tighter mb-4">{client.name}</h3>
                    <div className="flex items-center gap-4">
                       <span className="bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md">Active Corporate Partner</span>
                    </div>
                 </div>
                 <div className="p-12 grid grid-cols-3 gap-8">
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">LTV Revenue</p>
                       <p className="text-3xl font-black text-emerald-600">${client.saleRecord?.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-inner text-center">
                       <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">Balance Node</p>
                       <p className="text-3xl font-black text-amber-600">${client.saleRecord?.remainingBalance.toLocaleString()}</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Onboarding Node</p>
                       <p className="text-[11px] font-black uppercase text-slate-800">{new Date(client.saleRecord?.convertedDate || '').toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12">
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10">Account Growth Intel</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Email status</p>
                       <p className="font-bold text-slate-800 uppercase tracking-tight">{client.marketingEmailStatus}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Automated followup</p>
                       <p className="font-bold text-slate-800 uppercase tracking-tight">{client.followupStatus}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="col-span-12 lg:col-span-4">
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl h-fit">
                 <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-12">Portfolio Console</h5>
                 <div className="space-y-8">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase mb-4">Transaction Hub ($)</label>
                       <input type="number" value={saleAmount} onChange={e => setSaleAmount(Number(e.target.value))} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-5 font-black text-emerald-400 text-2xl outline-none" />
                    </div>
                    <button onClick={handleRecordTransaction} className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">Commit Update</button>
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
                 <input type="text" placeholder="Filter identities..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-[11px] font-bold" />
              </div>
           </div>

           <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                       <th className="px-8 py-6">Partner Identity / Brand</th>
                       <th className="px-8 py-6">Unit Status</th>
                       <th className="px-8 py-6">Call Node</th>
                       <th className="px-8 py-6">Closing Inquiry</th>
                       <th className="px-8 py-6">LTV Performance</th>
                       <th className="px-8 py-6">Growth Intelligence</th>
                       <th className="px-8 py-6">Ownership Hub</th>
                       <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredClients.map(client => {
                       const brand = brands.find(b => b.id === client.brandId);
                       const upseller = users.find(u => u.id === client.upsellAssignedTo);
                       const pm = users.find(u => u.id === client.projectManagerAssignedTo);
                       const latestAudit = client.upsellComments?.[client.upsellComments.length - 1];

                       return (
                          <tr key={client.id} onClick={() => setViewingClientId(client.id)} className="hover:bg-slate-50/80 cursor-pointer transition-all group">
                             <td className="px-8 py-6">
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{client.name}</span>
                                   <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{brand?.name}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">CLIENT</span>
                             </td>
                             <td className="px-8 py-6">
                                <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest bg-slate-50 text-slate-500 border-slate-100">{client.callStatus}</span>
                             </td>
                             <td className="px-8 py-6 max-w-xs">
                                <p className="text-xs text-slate-500 font-medium italic line-clamp-1 leading-relaxed">"{client.inquiry}"</p>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black text-slate-800">${client.saleRecord?.totalAmount.toLocaleString()}</span>
                                   <span className={`text-[9px] font-black ${(client.saleRecord?.remainingBalance || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>${client.saleRecord?.remainingBalance.toLocaleString()} Due</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col gap-1">
                                   <span className="text-[9px] font-black text-slate-400 uppercase">{client.marketingEmailStatus}</span>
                                   <span className="text-[8px] text-slate-400 font-bold">{client.followupStatus}</span>
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

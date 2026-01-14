
import React, { useState, useMemo } from 'react';
import { Lead, CallStatus, User, Brand, UserRole } from '../types';

interface CallManagementProps {
  leads: Lead[];
  users: User[];
  brands: Brand[];
  currentUser: User;
  onUpdateLead: (lead: Lead) => void;
}

const CallManagement: React.FC<CallManagementProps> = ({ leads, users, brands, currentUser, onUpdateLead }) => {
  const [filterCallStatus, setFilterCallStatus] = useState<string>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const myLeads = useMemo(() => {
    if (!currentUser) return [];
    
    return leads.filter(l => 
      (currentUser?.role === UserRole.SUPER_ADMIN || l.tenantId === currentUser?.tenantId) &&
      (currentUser?.role !== UserRole.USER || l.assignedTo === currentUser?.id)
    );
  }, [leads, currentUser]);

  const filteredLeads = useMemo(() => {
    if (filterCallStatus === 'all') return myLeads;
    return myLeads.filter(l => l.callStatus === filterCallStatus);
  }, [myLeads, filterCallStatus]);

  const selectedLead = myLeads.find(l => l.id === selectedLeadId);

  const updateCallStatus = (lead: Lead, newStatus: CallStatus) => {
    onUpdateLead({
      ...lead,
      callStatus: newStatus,
      lastUpdatedBy: currentUser?.name || 'System',
      comments: [
        ...(lead.comments || []),
        {
          id: `c-call-${Date.now()}`,
          text: `Call Status updated to: ${newStatus}`,
          authorName: currentUser?.name || 'System',
          timestamp: new Date().toISOString()
        }
      ]
    });
  };

  return (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 h-[calc(100vh-12rem)] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Dialer Queue</h3>
            <select 
              value={filterCallStatus}
              onChange={(e) => setFilterCallStatus(e.target.value)}
              className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
            >
              <option value="all">All Logs</option>
              {Object.values(CallStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredLeads.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                  selectedLeadId === lead.id 
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' 
                    : 'bg-white border-slate-100 hover:border-violet-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                   selectedLeadId === lead.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                }`}>
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate uppercase tracking-tight">{lead.name}</p>
                  <p className={`text-[10px] font-medium truncate ${selectedLeadId === lead.id ? 'text-violet-100' : 'text-slate-400'}`}>
                    {lead.number || 'No Phone'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${lead.callStatus === CallStatus.PENDING ? 'bg-slate-300' : 'bg-emerald-400'}`}></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
        {selectedLead ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h4 className="text-3xl font-black uppercase tracking-tight">{selectedLead.name}</h4>
                <p className="text-violet-400 text-xs font-black uppercase tracking-widest mt-2">{selectedLead.number || 'No contact number available'}</p>
              </div>
              <div className="flex gap-4">
                <a href={`tel:${selectedLead.number}`} className="bg-violet-600 hover:bg-violet-700 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl shadow-violet-900/50 transition-all active:scale-95">
                  📞
                </a>
              </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Call Interaction</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(CallStatus).map(status => (
                      <button
                        key={status}
                        onClick={() => updateCallStatus(selectedLead, status)}
                        className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedLead.callStatus === status 
                            ? 'bg-violet-50 border-violet-600 text-violet-700' 
                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-400'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 h-fit">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Asset Briefing</h5>
                   <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Inquiry Context</p>
                        <p className="text-sm font-medium text-slate-700 italic">"{selectedLead.inquiry}"</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Email Endpoint</p>
                        <p className="text-sm font-bold text-slate-800">{selectedLead.email}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-12">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Interaction Log History</h5>
                 <div className="space-y-4">
                    {(selectedLead.comments || []).slice(-3).reverse().map(comment => (
                      <div key={comment.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{comment.authorName}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">{comment.text}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-slate-400">
             <div className="text-6xl mb-6 grayscale opacity-30">📞</div>
             <p className="font-black uppercase text-xs tracking-widest">Initialize a lead from the queue to start dialing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallManagement;

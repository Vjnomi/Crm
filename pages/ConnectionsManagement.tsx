
import React from 'react';
import LeadManagement from './LeadManagement.tsx';
import { Lead, Brand, User, Tenant, Role } from '../types';

interface ConnectionsManagementProps {
  leads: Lead[];
  brands: Brand[];
  users: User[];
  tenants: Tenant[];
  roles: Role[];
  currentUser: User;
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  // Added missing onUpdateMultipleLeads property
  onUpdateMultipleLeads?: (leads: Lead[]) => void;
}

const ConnectionsManagement: React.FC<ConnectionsManagementProps> = (props) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex items-center gap-6 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-200 flex-shrink-0">🤝</div>
        <div>
          <h4 className="text-amber-900 font-black uppercase text-xs tracking-widest mb-1">Warm Milestone Hub</h4>
          <p className="text-amber-800 text-sm font-medium leading-relaxed max-w-2xl">
            This module isolates prospects that have reached a verified engagement threshold. Focus your high-intensity communication efforts here to drive final conversions.
          </p>
        </div>
      </div>
      
      <LeadManagement 
        {...props} 
        isConnectionsView={true} 
      />
    </div>
  );
};

export default ConnectionsManagement;

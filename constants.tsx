
import { Permission, UserRole, Tenant, Role, User, Brand, Lead, LeadStatus, CallStatus, Project } from './types';

export const SYSTEM_PERMISSIONS: Permission[] = [
  { id: 'nav:dashboard', name: 'Show Dashboard Tab', category: 'Navigation', description: 'Visibility of dashboard' },
  { id: 'nav:companies', name: 'Show Companies Tab', category: 'Navigation', description: 'Visibility of company management' },
  { id: 'nav:users', name: 'Show Users Tab', category: 'Navigation', description: 'Visibility of user directory' },
  { id: 'nav:roles', name: 'Show Roles Tab', category: 'Navigation', description: 'Visibility of roles & permissions' },
  { id: 'nav:brands', name: 'Show Brands Tab', category: 'Navigation', description: 'Visibility of brands' },
  { id: 'nav:leads', name: 'Show Leads Tab', category: 'Navigation', description: 'Visibility of leads' },
  { id: 'nav:connections', name: 'Show Connections Tab', category: 'Navigation', description: 'Visibility of warm connections' },
  { id: 'nav:clients', name: 'Show Clients Tab', category: 'Navigation', description: 'Visibility of the Client/Upsell module' },
  { id: 'nav:projects', name: 'Show Projects Tab', category: 'Navigation', description: 'Access to operations Kanban' },
  { id: 'nav:settings', name: 'Show Settings Tab', category: 'Navigation', description: 'Visibility of settings' },
  { id: 'leads:read', name: 'View Leads', category: 'CRM', description: 'Access leads' },
  { id: 'leads:create', name: 'Create Leads', category: 'CRM', description: 'Add leads' },
  { id: 'leads:update', name: 'Update Leads', category: 'CRM', description: 'Modify lead info' },
  { id: 'leads:assign', name: 'Assign Leads (Broad)', category: 'CRM', description: 'Assign to anyone' },
  { id: 'leads:assign_team', name: 'Assign Leads (Team)', category: 'CRM', description: 'TL assignment rights' },
  { id: 'leads:convert_client', name: 'Convert to Client', category: 'CRM', description: 'Permission to fill package form' },
  { id: 'clients:read', name: 'View Clients', category: 'CRM', description: 'Access client list' },
  { id: 'clients:upsell', name: 'Upsell Management', category: 'CRM', description: 'Can add upsell logs' },
  { id: 'clients:assign_buh', name: 'BUH Assignment Rights', category: 'CRM', description: 'Assign clients to upsellers' },
  { id: 'projects:manage', name: 'Manage Projects', category: 'Operations', description: 'Full drag/drop/edit control on Kanban' },
  { id: 'projects:assign_pm', name: 'Assign Project Manager', category: 'Operations', description: 'Right to link PM to project' },
];

export const INITIAL_TENANTS: Tenant[] = [
  { id: 't1', name: 'Sofverse Corp', domain: 'sofverse.com', status: 'Active', createdAt: '2023-01-01' },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'b1', name: 'Sofverse Pro', tenantId: 't1', status: 'Active', description: 'Enterprise CRM Solutions' },
  { id: 'b2', name: 'Sofverse Lite', tenantId: 't1', status: 'Active', description: 'SMB Sales Tools' },
];

export const INITIAL_ROLES: Role[] = [
  { id: 'r-super-admin', name: 'Super Admin', description: 'Global master control', tenantId: null, permissions: SYSTEM_PERMISSIONS.map(p => p.id) },
  { id: 'r-acme-admin', name: 'Company Admin', description: 'Full tenant control. Manages TLs and BUHs.', tenantId: 't1', permissions: SYSTEM_PERMISSIONS.filter(p => !p.id.includes('tenants')).map(p => p.id) },
  { 
    id: 'r-acme-tl', 
    name: 'Front Seller Team Lead (TL)', 
    description: 'Manages incoming leads and distributes to Front Sellers.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:brands', 'nav:leads', 'nav:connections', 'nav:clients', 'leads:read', 'leads:create', 'leads:update', 'leads:assign_team', 'leads:convert_client', 'clients:read', 'brands:read'] 
  },
  { 
    id: 'r-acme-seller', 
    name: 'Simple Front Seller', 
    description: 'Direct sales agent. Responsible for closing leads.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:brands', 'nav:leads', 'nav:connections', 'nav:clients', 'leads:read', 'leads:create', 'leads:update', 'leads:convert_client', 'clients:read', 'brands:read'] 
  },
  { 
    id: 'r-acme-buh', 
    name: 'Business Unit Head (BUH)', 
    description: 'Strategic head of the Client/Upsell unit. Assigns accounts to Upsellers.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:clients', 'nav:projects', 'clients:read', 'clients:upsell', 'clients:assign_buh', 'projects:manage', 'projects:assign_pm', 'brands:read'] 
  },
  { 
    id: 'r-acme-upseller', 
    name: 'Simple Upseller', 
    description: 'Account manager focused on growth and retention.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:clients', 'nav:projects', 'clients:read', 'clients:upsell', 'projects:manage', 'projects:assign_pm', 'brands:read'] 
  },
  { 
    id: 'r-acme-pm', 
    name: 'Project Manager (PM)', 
    description: 'Operational delivery specialist. No access to financial or phone data.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:projects', 'projects:manage', 'brands:read'] 
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Alex Super', email: 'alex@sofverse.com', role: UserRole.SUPER_ADMIN, tenantId: null, status: 'Active', customRoleId: 'r-super-admin', assignedBrands: [] },
  { id: 'u2', name: 'Sarah Admin', email: 'sarah@sofverse.com', role: UserRole.COMPANY_ADMIN, tenantId: 't1', status: 'Active', customRoleId: 'r-acme-admin', assignedBrands: ['b1', 'b2'] },
  { id: 'u3', name: 'Tom TL', email: 'tom@sofverse.com', role: UserRole.USER, tenantId: 't1', status: 'Active', customRoleId: 'r-acme-tl', assignedBrands: ['b1'] },
  { id: 'u4', name: 'Sam Seller', email: 'sam@sofverse.com', role: UserRole.USER, tenantId: 't1', status: 'Active', customRoleId: 'r-acme-seller', assignedBrands: ['b1'] },
  { id: 'u5', name: 'Brenda BUH', email: 'brenda@sofverse.com', role: UserRole.USER, tenantId: 't1', status: 'Active', customRoleId: 'r-acme-buh', assignedBrands: ['b1', 'b2'] },
  { id: 'u6', name: 'Uri Upseller', email: 'uri@sofverse.com', role: UserRole.USER, tenantId: 't1', status: 'Active', customRoleId: 'r-acme-upseller', assignedBrands: ['b2'] },
  { id: 'u7', name: 'Peter PM', email: 'peter@sofverse.com', role: UserRole.USER, tenantId: 't1', status: 'Active', customRoleId: 'r-acme-pm', assignedBrands: ['b1', 'b2'] },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'l-001',
    brandId: 'b1',
    tenantId: 't1',
    name: 'Steve Jobs',
    number: '+1 555-APPLE-00',
    email: 'steve@apple.com',
    inquiry: 'Requesting enterprise CRM integration for international design hubs.',
    status: LeadStatus.NEW,
    callStatus: CallStatus.PENDING,
    lTag: 'Legendary',
    marketingEmailStatus: 'Sent',
    followupStatus: 'First Outreach',
    sentFrom: 'Organic Search',
    timestamp: new Date().toISOString(),
    followupCount: 0,
    assignedTo: 'u3',
    lastUpdatedBy: 'Sarah Admin',
    createdAt: '2024-03-24',
    isConnection: false,
    isClient: false,
    comments: [{ id: 'c1', text: 'Lead ingested. High priority asset.', authorName: 'Sarah Admin', timestamp: '2024-03-24T10:00:00Z' }],
    upsellComments: []
  },
  {
    id: 'c-001',
    brandId: 'b1',
    tenantId: 't1',
    name: 'Jeff Bezos',
    number: '+1 555-AMZN-99',
    email: 'jeff@amazon.com',
    inquiry: 'Implementing logistics tracking for Blue Origin ground crews.',
    status: LeadStatus.CONVERTED,
    callStatus: CallStatus.COMPLETED,
    lTag: 'Strategic',
    marketingEmailStatus: 'Opened',
    followupStatus: 'Drip Completed',
    sentFrom: 'Direct Referral',
    timestamp: new Date().toISOString(),
    followupCount: 5,
    assignedTo: 'u4',
    upsellAssignedTo: 'u6',
    projectManagerAssignedTo: 'u7',
    lastUpdatedBy: 'Sam Seller',
    createdAt: '2024-01-15',
    isConnection: true,
    isClient: true,
    comments: [{ id: 'c4', text: 'Deal closed at 500k.', authorName: 'Sam Seller', timestamp: '2024-02-01T16:00:00Z' }],
    upsellComments: [{ id: 'uc1', text: 'Account handed over.', authorName: 'Brenda BUH', timestamp: '2024-02-02T10:00:00Z' }],
    saleRecord: {
      packageTitle: 'Aerospace Ground Control Suite',
      totalAmount: 500000,
      items: [{ id: 'i1', name: 'Real-time Telemetry Node', amount: 300000 }, { id: 'i2', name: 'Field Hardware Kit x500', amount: 200000 }],
      remainingBalance: 0,
      convertedDate: '2024-02-01T16:00:00Z'
    }
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p-001',
    clientId: 'c-001',
    tenantId: 't1',
    status: 'Active',
    lastUpdated: new Date().toISOString(),
    columns: [
      { id: 'col-1', title: 'Onboarding', cards: [{ id: 'task-1', title: 'Security Briefing', description: 'Review security protocols for orbital data.', priority: 'High', assignedTo: 'u7', createdAt: new Date().toISOString(), comments: [], files: [] }] },
      { id: 'col-2', title: 'Execution', cards: [{ id: 'task-2', title: 'Hardware Config', description: 'Setup 500 ground kits.', priority: 'Medium', assignedTo: 'u7', createdAt: new Date().toISOString(), comments: [], files: [] }] },
      { id: 'col-3', title: 'Final Review', cards: [] }
    ]
  }
];


import { Permission, UserRole, Tenant, Role, User, Brand, Lead, LeadStatus, CallStatus, Project } from './types';

export const SYSTEM_PERMISSIONS: Permission[] = [
  // Navigation
  { id: 'nav:dashboard', name: 'Dashboard Access', category: 'Navigation', description: 'Grants access to the main dashboard and overview statistics.' },
  { id: 'nav:companies', name: 'Companies Module', category: 'Navigation', description: 'Access to the global company/tenant management list.' },
  { id: 'nav:users', name: 'User Directory', category: 'Navigation', description: 'Access to the user and personnel management directory.' },
  { id: 'nav:roles', name: 'Roles & Rights', category: 'Navigation', description: 'Access to the roles and permission configuration panel.' },
  { id: 'nav:brands', name: 'Brands Portfolio', category: 'Navigation', description: 'Access to the brand asset management module.' },
  { id: 'nav:leads', name: 'Leads Pipeline', category: 'Navigation', description: 'Access to the primary lead acquisition pipeline.' },
  { id: 'nav:connections', name: 'Warm Connections', category: 'Navigation', description: 'Access to the high-intent engagement module.' },
  { id: 'nav:clients', name: 'Corporate Portfolio', category: 'Navigation', description: 'Access to post-closure client management.' },
  { id: 'nav:projects', name: 'Operations Kanban', category: 'Navigation', description: 'Access to the delivery and project management board.' },
  { id: 'nav:settings', name: 'Company Settings', category: 'Navigation', description: 'Access to white-labeling and company configurations.' },

  // Lead Management
  { id: 'leads:read', name: 'View Lead Data', category: 'CRM', description: 'View existing leads in the database.' },
  { id: 'leads:create', name: 'Provision New Leads', category: 'CRM', description: 'Ability to manually add new leads to the system.' },
  { id: 'leads:update', name: 'Modify Lead Nodes', category: 'CRM', description: 'Update contact info, status, and engagement context.' },
  { id: 'leads:delete', name: 'Terminate Lead Nodes', category: 'CRM', description: 'Permanently remove leads from the system.' },
  { id: 'leads:assign_team', name: 'Distribute Leads (TL)', category: 'CRM', description: 'Assign leads to specific sellers within the tenant.' },
  { id: 'leads:convert_client', name: 'Authorize Conversion', category: 'CRM', description: 'Permission to promote a lead to a paying client.' },

  // Client & Upsell Management
  { id: 'clients:read', name: 'View Portfolio Assets', category: 'CRM', description: 'View the post-sale client database.' },
  { id: 'clients:upsell', name: 'Post Success Logs', category: 'CRM', description: 'Ability to add strategy and interaction notes to clients.' },
  { id: 'clients:finance', name: 'Update Financial Records', category: 'CRM', description: 'Add new sales or record payments against balances.' },
  { id: 'clients:assign_buh', name: 'Account Assignment (BUH)', category: 'CRM', description: 'Assign account owners to specific clients.' },
  { id: 'clients:delete', name: 'Archive Portfolio Assets', category: 'CRM', description: 'Remove clients from the active portfolio.' },

  // Project Management
  { id: 'projects:manage', name: 'Full Kanban Control', category: 'Operations', description: 'Create, edit, and move tasks across the delivery board.' },
  { id: 'projects:assign_pm', name: 'Provision Project Leads', category: 'Operations', description: 'Assign Delivery Leads (PMs) to specific projects.' },
  { id: 'projects:stages', name: 'Configure Board Stages', category: 'Operations', description: 'Add or remove columns from the Kanban board.' },
  { id: 'projects:archive', name: 'Archive Projects', category: 'Operations', description: 'Close and archive completed delivery projects.' },

  // Brand Management
  { id: 'brands:manage', name: 'Asset Lifecycle Control', category: 'Brands', description: 'Add, edit, or suspend proprietary brand assets.' },
  { id: 'brands:read', name: 'View Brand Registry', category: 'Brands', description: 'Visibility of active brands within the assigned scope.' },
  
  // Company Administration
  { id: 'settings:white_label', name: 'Global White-Labeling', category: 'Company', description: 'Configure app names, colors, and branding overrides.' },
];

export const INITIAL_TENANTS: Tenant[] = [
  { id: 't1', name: 'Sofverse Corp', domain: 'sofverse.com', status: 'Active', createdAt: '2023-01-01' },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'b1', name: 'Sofverse Pro', tenantId: 't1', status: 'Active', description: 'Enterprise CRM Solutions' },
  { id: 'b2', name: 'Sofverse Lite', tenantId: 't1', status: 'Active', description: 'SMB Sales Tools' },
];

export const INITIAL_ROLES: Role[] = [
  { id: 'r-super-admin', name: 'Super Admin', description: 'Global master control with full system override capability.', tenantId: null, permissions: SYSTEM_PERMISSIONS.map(p => p.id) },
  { id: 'r-acme-admin', name: 'Company Admin', description: 'Full tenant authority. Oversees TLs, BUHs, and all CRM pipelines.', tenantId: 't1', permissions: SYSTEM_PERMISSIONS.filter(p => !p.id.includes('companies')).map(p => p.id) },
  { 
    id: 'r-acme-tl', 
    name: 'Front Team Lead', 
    description: 'Directs the front seller unit and manages lead distribution.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:brands', 'nav:leads', 'nav:connections', 'nav:clients', 'leads:read', 'leads:create', 'leads:update', 'leads:assign_team', 'leads:convert_client', 'clients:read', 'brands:read'] 
  },
  { 
    id: 'r-acme-seller', 
    name: 'Front Seller', 
    description: 'Responsible for closing leads and initiating client handovers.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:brands', 'nav:leads', 'nav:connections', 'leads:read', 'leads:create', 'leads:update', 'leads:convert_client', 'brands:read'] 
  },
  { 
    id: 'r-acme-buh', 
    name: 'Business Unit Head', 
    description: 'Strategic head of the success unit. Manages upsells and delivery assignments.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:clients', 'nav:projects', 'clients:read', 'clients:upsell', 'clients:finance', 'clients:assign_buh', 'projects:manage', 'projects:assign_pm', 'projects:stages', 'brands:read'] 
  },
  { 
    id: 'r-acme-upseller', 
    name: 'Account Growth Specialist', 
    description: 'Dedicated to client retention, success metrics, and LTV growth.', 
    tenantId: 't1', 
    permissions: ['nav:dashboard', 'nav:clients', 'nav:projects', 'clients:read', 'clients:upsell', 'clients:finance', 'projects:manage', 'brands:read'] 
  },
  { 
    id: 'r-acme-pm', 
    name: 'Delivery Specialist', 
    description: 'Technical lead for Kanban execution. No access to sensitive financial data.', 
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
    sentFrom: 'outreach@sofverse-marketing.com',
    timestamp: new Date().toISOString(),
    followupCount: 0,
    assignedTo: 'u3',
    lastUpdatedBy: 'Sarah Admin',
    createdAt: '2024-03-24',
    isConnection: false,
    isClient: false,
    comments: [{ id: 'c1', text: 'Lead manually provisioned.', authorName: 'Sarah Admin', timestamp: '2024-03-24T10:00:00Z' }],
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
    sentFrom: 'strategic-ops@sofverse.com',
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
    upsellComments: [{ id: `uc-conv-${Date.now()}`, text: 'Initial conversion from Front Sales.', authorName: 'Sam Seller', timestamp: '2024-02-01T16:00:00Z' }],
    saleRecord: {
      packageTitle: 'Aerospace Ground Control Suite',
      basePrice: 500000,
      amountPaid: 350000,
      remainingBalance: 150000,
      invoiceFile: 'INV-2024-AMZN.pdf',
      contractFile: 'MSA-BLUE-ORIGIN.pdf',
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

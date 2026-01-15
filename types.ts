
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  USER = 'USER'
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  INTERESTED = 'Interested',
  NOT_INTERESTED = 'Not Interested',
  CONVERTED = 'Converted'
}

export enum CallStatus {
  PENDING = 'Pending',
  RINGING = 'Ringing',
  ANSWERED = 'Answered',
  BUSY = 'Busy',
  NO_ANSWER = 'No Answer',
  FAILED = 'Failed',
  COMPLETED = 'Completed',
  VOICEMAIL = 'Voicemail',
  DECLINED = 'Declined',
  NOT_INTERESTED = 'Not Interested'
}

export interface Permission {
  id: string;
  name: string;
  category: 'System' | 'CRM' | 'Company' | 'Reports' | 'Navigation' | 'Brands' | 'Operations';
  description: string;
}

export interface AppTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgApp: string;
  bgSurface: string;
  textMain: string;
  textMuted: string;
  border: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  customAppName?: string;
  navigationOrder?: string[];
  theme?: Partial<AppTheme>;
  isDarkMode?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  tenantId: string;
  status: 'Active' | 'Inactive';
  description?: string;
}

export interface LeadComment {
  id: string;
  text: string;
  authorName: string;
  timestamp: string;
}

export interface SaleRecord {
  packageTitle: string;
  basePrice: number;
  amountPaid: number;
  remainingBalance: number;
  invoiceFile?: string;
  contractFile?: string;
  convertedDate?: string;
}

export interface Lead {
  id: string;
  brandId: string;
  tenantId: string;
  name: string;
  number?: string;
  email: string;
  inquiry: string;
  status: LeadStatus;
  callStatus: CallStatus;
  lTag: string;
  marketingEmailStatus: string; 
  followupStatus: string;       
  sentFrom: string;             
  timestamp: string;            
  followupCount: number;
  assignedTo: string | null;
  upsellAssignedTo?: string | null;
  projectManagerAssignedTo?: string | null;
  lastUpdatedBy: string;
  createdAt: string;
  comments: LeadComment[];
  upsellComments: LeadComment[];
  isConnection: boolean;
  isClient: boolean;
  saleRecord?: SaleRecord;
}

export interface Project {
  id: string;
  clientId: string;
  tenantId: string;
  columns: KanbanColumn[];
  status: 'Active' | 'Paused' | 'Archived';
  lastUpdated: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: TaskCard[];
}

export interface TaskCard {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string | null;
  comments: LeadComment[];
  files: { name: string; size: string; type: string }[];
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string | null;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  customRoleId?: string;
  tenantId: string | null;
  status: 'Active' | 'Inactive';
  avatar?: string;
  assignedBrands: string[];
}

export interface AppSettings {
  globalAppName: string;
  globalNavigationOrder: string[];
  globalTheme: AppTheme;
  isDarkMode: boolean;
}

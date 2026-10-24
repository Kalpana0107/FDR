// FDR Guard — Shared TypeScript Types

export type UserRole = 'college_user' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  institution_id: number | null;
  institution_name?: string;
  created_at: string;
}

export type FDRStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'returned'
  | 'verified'
  | 'rejected';

export interface FDRListItem {
  id: number;
  application_id: string;
  institution_id: number;
  institution_name?: string;
  fdr_number: string;
  bank_name: string;
  amount: string;
  currency: string;
  issue_date: string;
  maturity_date: string;
  purpose: string;
  status: FDRStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Document {
  id: number;
  fdr_record_id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  uploaded_at: string;
}

export interface StatusHistoryItem {
  id: number;
  from_status: FDRStatus | null;
  to_status: FDRStatus;
  remark: string | null;
  actor_id: number;
  actor_name: string | null;
  created_at: string;
}

export interface FDRDetail extends FDRListItem {
  branch_name: string | null;
  remarks: string | null;
  admin_remark: string | null;
  submitted_by_id: number;
  submitted_by_name: string | null;
  documents: Document[];
  status_history: StatusHistoryItem[];
}

export interface FDRCreatePayload {
  fdr_number: string;
  bank_name: string;
  branch_name?: string;
  amount: string;
  currency: string;
  issue_date: string;
  maturity_date: string;
  purpose: string;
  remarks?: string;
}

export interface CollegeDashboardStats {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  returned: number;
  verified: number;
  rejected: number;
}

export interface AdminDashboardStats {
  total_submitted: number;
  awaiting_review: number;
  under_review: number;
  verified: number;
  returned: number;
  rejected: number;
}

export interface PaginatedFDRList {
  items: FDRListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Institution {
  id: number;
  name: string;
  code: string;
}

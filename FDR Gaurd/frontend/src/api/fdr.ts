import apiClient from './client';
import type {
  User, CollegeDashboardStats, AdminDashboardStats,
  Document, StatusHistoryItem, Institution, FDRStatus, FDRListItem, FDRDetail, FDRCreatePayload, PaginatedFDRList
} from '../types';

// ─── Auth ───────────────────────────────────────
export const login = async (email: string, password: string): Promise<{ access_token: string }> => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

// ─── College Stats ───────────────────────────────
export const getCollegeStats = async (): Promise<CollegeDashboardStats> => {
  const res = await apiClient.get('/fdr/stats/college');
  return res.data;
};

// ─── Admin Stats ─────────────────────────────────
export const getAdminStats = async (): Promise<AdminDashboardStats> => {
  const res = await apiClient.get('/fdr/stats/admin');
  return res.data;
};

// ─── FDR CRUD ────────────────────────────────────
export const createFDR = async (payload: FDRCreatePayload): Promise<FDRDetail> => {
  const res = await apiClient.post('/fdr/', payload);
  return res.data;
};

export const updateFDR = async (id: number, payload: Partial<FDRCreatePayload>): Promise<FDRDetail> => {
  const res = await apiClient.patch(`/fdr/${id}`, payload);
  return res.data;
};

export const getFDR = async (id: number): Promise<FDRDetail> => {
  const res = await apiClient.get(`/fdr/${id}`);
  return res.data;
};

export const submitFDR = async (id: number): Promise<FDRDetail> => {
  const res = await apiClient.post(`/fdr/${id}/submit`);
  return res.data;
};

export const listFDRs = async (params: Record<string, unknown> = {}): Promise<PaginatedFDRList> => {
  const res = await apiClient.get('/fdr/', { params });
  return res.data;
};

// ─── Admin Status Update ─────────────────────────
export const updateFDRStatus = async (
  id: number,
  new_status: FDRStatus,
  remark?: string
): Promise<FDRDetail> => {
  const res = await apiClient.post(`/fdr/${id}/status`, { new_status, remark });
  return res.data;
};

// ─── Documents ───────────────────────────────────
export const uploadDocument = async (
  fdrId: number,
  file: File,
  documentType: string = 'fdr_document'
): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  const res = await apiClient.post(`/fdr/${fdrId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getDocumentDownloadUrl = (fdrId: number, docId: number): string => {
  const token = localStorage.getItem('fdr_token');
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  return `${base}/fdr/${fdrId}/documents/${docId}/download`;
};

export const downloadDocument = async (fdrId: number, docId: number, filename: string) => {
  const res = await apiClient.get(`/fdr/${fdrId}/documents/${docId}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Status History ───────────────────────────────
export const getFDRHistory = async (id: number): Promise<StatusHistoryItem[]> => {
  const res = await apiClient.get(`/fdr/${id}/history`);
  return res.data;
};

// ─── Institutions ─────────────────────────────────
export const getInstitutions = async (): Promise<Institution[]> => {
  const res = await apiClient.get('/institutions/');
  return res.data;
};

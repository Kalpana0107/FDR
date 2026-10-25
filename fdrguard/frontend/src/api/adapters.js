// Adapter utilities – convert backend snake_case responses to UI camelCase shapes

/**
 * Convert a User object returned by the backend into the shape the UI expects.
 * Backend returns: { id, email, full_name, role, is_active, created_at, ... }
 */
export function adaptUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

/**
 * Convert a list response (items + pagination) into UI shape.
 */
export function adaptFdrList(resp) {
  return {
    items: (resp.items || []).map(adaptFdrDetail),
    total: resp.total,
    page: resp.page,
    pageSize: resp.page_size,
    pages: resp.pages,
  };
}

/**
 * Convert a single FDR record to UI shape.
 */
export function adaptFdrDetail(rec) {
  const statusMap = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    VERIFIED: 'Verified',
    ACTIVE: 'Active',
    MATURING: 'Maturing',
    RETURNED: 'Returned',
    REJECTED: 'Rejected',
    RENEWED: 'Renewed',
    RELEASE_IN_PROGRESS: 'Release in Progress',
    RELEASED: 'Released',
    WITHDRAWN: 'Withdrawn',
  };
  return {
    id: rec.id,
    applicationId: rec.application_id,
    institutionId: rec.institution_id,
    institutionName: rec.institution_name,
    fdrNumber: rec.fdr_number,
    bankName: rec.bank_name,
    branchName: rec.branch_name,
    amount: rec.amount,
    currency: rec.currency,
    issueDate: rec.issue_date,
    maturityDate: rec.maturity_date,
    purpose: rec.purpose,
    remarks: rec.remarks,
    status: statusMap[rec.status] || rec.status,
    submittedAt: rec.submitted_at,
    createdAt: rec.created_at,
    updatedAt: rec.updated_at,
    documents: (rec.documents || []).map(adaptDocument),
    statusHistory: (rec.status_history || []).map(adaptHistoryItem),
  };
}

function adaptDocument(doc) {
  return {
    id: doc.id,
    originalFilename: doc.original_filename,
    mimeType: doc.mime_type,
    fileSize: doc.file_size,
    uploadedAt: doc.created_at,
    documentType: doc.document_type,
  };
}

function adaptHistoryItem(item) {
  return {
    id: item.id,
    actorId: item.actor_id,
    fromStatus: item.from_status,
    toStatus: item.to_status,
    remark: item.remark,
    createdAt: item.created_at,
  };
}

/**
 * Dashboard stats adapter – keep camelCase keys; fill missing new fields with 0.
 */
export function adaptDashboardStats(raw) {
  return {
    total: raw.total,
    draft: raw.draft,
    submitted: raw.submitted,
    underReview: raw.under_review,
    returned: raw.returned,
    verified: raw.verified,
    rejected: raw.rejected,
    active: raw.active ?? 0,
    maturing: raw.maturing ?? 0,
    released: raw.released ?? 0,
    withdrawn: raw.withdrawn ?? 0,
  };
}

import React from 'react';
import type { FDRStatus } from '../types';

const STATUS_CONFIG: Record<FDRStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'badge-draft' },
  submitted: { label: 'Submitted', className: 'badge-submitted' },
  under_review: { label: 'Under Review', className: 'badge-under-review' },
  returned: { label: 'Returned', className: 'badge-returned' },
  verified: { label: 'Verified', className: 'badge-verified' },
  rejected: { label: 'Rejected', className: 'badge-rejected' },
};

interface StatusBadgeProps {
  status: FDRStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-draft' };
  return (
    <span className={`status-badge ${config.className} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;

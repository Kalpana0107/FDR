// The ONLY way to render an FDR / verification status in the UI.
// Class names are written out in full so Tailwind can detect them.
const STYLES = {
  Verified: 'bg-ok-50 text-ok-700 ring-ok-200',
  Active: 'bg-ok-50 text-ok-700 ring-ok-200',
  Pending: 'bg-warn-50 text-warn-700 ring-warn-200',
  'Verification Pending': 'bg-warn-50 text-warn-700 ring-warn-200',
  Maturing: 'bg-warn-50 text-warn-700 ring-warn-200',
  Returned: 'bg-ret-50 text-ret-700 ring-ret-200',
  Rejected: 'bg-bad-50 text-bad-700 ring-bad-200',
  Failed: 'bg-bad-50 text-bad-700 ring-bad-200',
  'Under Review': 'bg-info-50 text-info-700 ring-info-200',
  Submitted: 'bg-info-50 text-info-700 ring-info-200',
  Renewed: 'bg-renew-50 text-renew-700 ring-renew-200',
  Released: 'bg-done-50 text-done-700 ring-done-200',
  Withdrawn: 'bg-done-50 text-done-700 ring-done-200',
  'Release in Progress': 'bg-info-50 text-info-700 ring-info-200',
}

export const ALL_STATUSES = Object.keys(STYLES)

export default function StatusBadge({ status }) {
  const style = STYLES[status] ?? STYLES.Released
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  )
}

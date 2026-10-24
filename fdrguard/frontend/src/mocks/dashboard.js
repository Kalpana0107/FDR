// Shape matches GET /api/dashboard/summary in docs/API_CONTRACT.md.
export const dashboardSummary = {
  totals: {
    fdr_count: 100,
    total_amount: 182500000, // INR 18.25 Cr
    renewals_counted_once: true,
    active_escrows: 48,
    compliance_health_score: 94.6,
  },
  verification_amounts: {
    verified: 150000000,
    pending: 22500000,
    failed: 10000000,
  },
  by_status: {
    Submitted: 6,
    'Under Review': 9,
    Verified: 12,
    Active: 48,
    Maturing: 10,
    Renewed: 8,
    Released: 5,
    Returned: 2,
  },
  upcoming_maturities: [
    { fdr_id: 'fdr_003', fdr_number: 'FDR-2024-000087', institution_name: 'Sample Institute of Technology, Pune', amount: 1000000, maturity_date: '2026-11-20', days_left: 27 },
    { fdr_id: 'fdr_001', fdr_number: 'FDR-2025-000101', institution_name: 'Sample Institute of Technology, Pune', amount: 1500000, maturity_date: '2026-04-01', days_left: 159 },
    { fdr_id: 'fdr_002', fdr_number: 'FDR-2025-000102', institution_name: 'Demo College of Engineering, Nagpur', amount: 2000000, maturity_date: '2026-12-15', days_left: 417 },
  ],
  monthly_trend: [
    { month: 'Nov 2026', maturingAmount: 1000000, newDeposits: 3500000, renewals: 1500000 },
    { month: 'Dec 2026', maturingAmount: 2500000, newDeposits: 5000000, renewals: 2000000 },
    { month: 'Jan 2027', maturingAmount: 4000000, newDeposits: 4500000, renewals: 3000000 },
    { month: 'Feb 2027', maturingAmount: 1500000, newDeposits: 2000000, renewals: 1000000 },
    { month: 'Mar 2027', maturingAmount: 8500000, newDeposits: 9000000, renewals: 4500000 },
    { month: 'Apr 2027', maturingAmount: 12000000, newDeposits: 14000000, renewals: 8000000 },
  ],
  institution_health: [
    { id: 'inst_01', name: 'Sample Institute of Technology, Pune', totalFDRs: 3, totalAmount: 4000000, score: 98, status: 'Healthy', flaggedIssues: 0 },
    { id: 'inst_02', name: 'Demo College of Engineering, Nagpur', totalFDRs: 1, totalAmount: 2000000, score: 85, status: 'Review Needed', flaggedIssues: 1 },
    { id: 'inst_03', name: 'Model Polytechnic, Nashik', totalFDRs: 1, totalAmount: 500000, score: 62, status: 'Deficient', flaggedIssues: 2 },
    { id: 'inst_04', name: 'Vidya Vikas Institute of Technology, Mumbai', totalFDRs: 2, totalAmount: 6000000, score: 100, status: 'Healthy', flaggedIssues: 0 },
    { id: 'inst_05', name: 'Apex Academy of Pharmacy, Kolhapur', totalFDRs: 1, totalAmount: 1500000, score: 95, status: 'Healthy', flaggedIssues: 0 },
  ],
}

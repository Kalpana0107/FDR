// Cross-college duplicate detection mock data
export const duplicateMatches = [
  {
    id: 'dup_01',
    duplicate_type: 'Exact FDR Number Reuse',
    severity: 'High',
    flagged_fdr_number: 'FDR-2025-000102',
    institution_a: {
      id: 'inst_02',
      name: 'Demo College of Engineering, Nagpur',
      amount: 2000000,
      bank: 'Sample Bank of India',
      status: 'Under Review',
    },
    institution_b: {
      id: 'inst_09',
      name: 'Sahyadri Polytechnic, Amravati',
      amount: 2000000,
      bank: 'Sample Bank of India',
      status: 'Submitted',
    },
    similarity_score: 98,
    detection_reason: 'Identical certificate number submitted by two independent technical institutes under separate application IDs.',
    suggested_action: 'Hold both applications; request physical verified bank attestation from regional bank nodal officer.',
  },
  {
    id: 'dup_02',
    duplicate_type: 'Account Number & Amount Collision',
    severity: 'Medium',
    flagged_fdr_number: 'FDR-2024-000087 / FDR-2024-000091',
    institution_a: {
      id: 'inst_01',
      name: 'Sample Institute of Technology, Pune',
      amount: 1000000,
      bank: 'Example Co-operative Bank',
      status: 'Maturing',
    },
    institution_b: {
      id: 'inst_14',
      name: 'Marathwada Engineering Institute, Nanded',
      amount: 1000000,
      bank: 'Example Co-operative Bank',
      status: 'Under Review',
    },
    similarity_score: 84,
    detection_reason: 'Different certificate serial numbers referencing same underlying bank account ledger 11290391200.',
    suggested_action: 'Verify whether college trust has multiple wings sharing a single parent deposit ledger.',
  },
]

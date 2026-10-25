// Mock-first API layer.
// VITE_USE_MOCK=true  -> every call is answered from src/mocks/*.js
// VITE_USE_MOCK=false -> every call goes to the real backend via /api (proxied to :8000)
import { fdrs } from '../mocks/fdrs.js'
import { dashboardSummary } from '../mocks/dashboard.js'
import { users } from '../mocks/auth.js'
import { duplicateMatches } from '../mocks/duplicates.js'
import { releaseRequests } from '../mocks/releases.js'
import { auditChain } from '../mocks/audit.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE = import.meta.env.VITE_API_BASE || '/api'

// Endpoints already implemented by the backend
const REAL_ENDPOINTS = new Set([
  // 'GET /health',
])

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

// Local mutable state references for demo persistence during session
let fdrStore = [...fdrs]
let releaseStore = [...releaseRequests]
let auditStore = [...auditChain]

const mockHandlers = {
  'GET /health': () => ({ status: 'ok', service: 'fdrguard-mock', version: 'mock' }),

  'POST /auth/login': (body) => {
    const user = users.find((u) => u.email === body?.email)
    if (!user) throw new Error('Invalid credentials')
    return { access_token: 'mock-token', user }
  },

  'GET /auth/users': () => users,

  'GET /fdrs': (params, query) => {
    let items = [...fdrStore]
    if (query?.status && query.status !== 'All') {
      items = items.filter((f) => f.status === query.status)
    }
    if (query?.institution_id) {
      items = items.filter((f) => f.institution_id === query.institution_id)
    }
    if (query?.q) {
      const q = query.q.toLowerCase()
      items = items.filter(
        (f) =>
          f.fdr_number.toLowerCase().includes(q) ||
          f.institution_name.toLowerCase().includes(q) ||
          f.bank.toLowerCase().includes(q),
      )
    }
    return { items, total: items.length }
  },

  'POST /fdrs': (body) => {
    const newId = `fdr_${String(fdrStore.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    const newFdr = {
      id: newId,
      fdr_number: body.fdr_number || `FDR-2025-${Math.floor(100000 + Math.random() * 900000)}`,
      institution_id: body.institution_id || 'inst_01',
      institution_name: body.institution_name || 'Sample Institute of Technology, Pune',
      bank: body.bank || 'Sample Bank of India',
      branch: body.branch || 'Pune Camp Branch',
      account_number: body.account_number || '39019283719',
      ifsc_code: body.ifsc_code || 'SBIN0001092',
      amount: Number(body.amount) || 1500000,
      roi: Number(body.roi) || 7.25,
      tenure_months: Number(body.tenure_months) || 12,
      start_date: body.start_date || now.split('T')[0],
      maturity_date: body.maturity_date || '2026-10-24',
      maturity_amount: Number(body.amount ? body.amount * 1.0725 : 1608750),
      status: 'Submitted',
      parent_fdr_id: body.parent_fdr_id || null,
      joint_holder: body.joint_holder || 'Regional Officer, AICTE Western Region',
      aicte_lien_endorsed: Boolean(body.aicte_lien_endorsed ?? true),
      verification: {
        state: 'Pending',
        simulated: true,
        verified_at: null,
        verified_by: null,
        cbs_match: false,
        bank_ref: null,
      },
      ocr_data: {
        confidence: 0.96,
        extracted_fdr_number: body.fdr_number,
        extracted_amount: Number(body.amount),
        extracted_bank: body.bank,
        extracted_maturity: body.maturity_date,
        lien_clause_detected: Boolean(body.aicte_lien_endorsed),
      },
      bank_comparison: {
        submitted: {
          fdr_number: body.fdr_number,
          amount: Number(body.amount),
          bank: body.bank,
          maturity_date: body.maturity_date,
          lien_marked: body.aicte_lien_endorsed ? 'Yes' : 'No',
        },
        cbs_live: {
          fdr_number: body.fdr_number,
          amount: Number(body.amount),
          bank: body.bank,
          maturity_date: body.maturity_date,
          lien_marked: 'Awaiting Bank CBS Inquiry',
          account_status: 'Unverified',
        },
        match_status: 'Pending Verification',
        discrepancies: [],
      },
      documents: [
        {
          id: `doc_${Date.now()}`,
          name: body.fileName || 'FDR_Certificate_Upload.pdf',
          type: 'PDF',
          size: '1.6 MB',
          uploaded_at: now,
        },
      ],
      remarks: [
        {
          id: `rem_${Date.now()}`,
          author: 'College Accountant',
          role: 'College',
          text: body.remarks || 'Initial FDR deposit submission with AICTE joint endorsement.',
          timestamp: now,
        },
      ],
      history: [
        { step: 1, action: 'Deposit Created & Uploaded', actor: 'College', status: 'Submitted', timestamp: now },
      ],
      versions: [
        { version: 1, timestamp: now, label: 'Initial Submission', status: 'Submitted', amount: Number(body.amount) || 1500000, notes: 'Created via portal upload.' },
      ],
    }

    fdrStore = [newFdr, ...fdrStore]

    // Also add to audit chain
    const prevBlock = auditStore[auditStore.length - 1]
    const newBlock = {
      block_index: auditStore.length,
      timestamp: now,
      event_type: 'FDR_SUBMISSION',
      actor: newFdr.institution_name,
      entity_id: newFdr.fdr_number,
      details: `Security deposit submitted: INR ${newFdr.amount.toLocaleString('en-IN')}`,
      prev_hash: prevBlock ? prevBlock.block_hash : '00000000000000000000000000000000',
      block_hash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('') + '9f82bc71',
      signature: 'SIMULATED_ECDSA:PORTAL_SUBMISSION_KEY',
      tamper_flag: false,
    }
    auditStore = [...auditStore, newBlock]

    return newFdr
  },

  'GET /fdrs/:id': (_body, params) => {
    const item = fdrStore.find((f) => f.id === params.id)
    if (!item) throw new Error('FDR not found')
    return item
  },

  'POST /fdrs/:id/transition': (body, params) => {
    const item = fdrStore.find((f) => f.id === params.id)
    if (!item) throw new Error('FDR not found')
    const now = new Date().toISOString()
    item.status = body.to_status

    if (body.remark) {
      item.remarks.push({
        id: `rem_${Date.now()}`,
        author: body.author || 'AICTE Officer',
        role: body.role || 'AICTE Officer',
        text: body.remark,
        timestamp: now,
      })
    }

    item.history.push({
      step: item.history.length + 1,
      action: `Status transitioned to ${body.to_status}`,
      actor: body.author || 'AICTE Officer',
      status: body.to_status,
      timestamp: now,
    })

    item.versions.push({
      version: item.versions.length + 1,
      timestamp: now,
      label: `State change: ${body.to_status}`,
      status: body.to_status,
      amount: item.amount,
      notes: body.remark || `Status changed to ${body.to_status}`,
    })

    return item
  },

  'POST /fdrs/:id/verify': (_body, params) => {
    const item = fdrStore.find((f) => f.id === params.id)
    if (!item) throw new Error('FDR not found')
    const now = new Date().toISOString()

    // If lien not endorsed or test failure
    if (!item.aicte_lien_endorsed) {
      item.verification = {
        state: 'Failed',
        simulated: true,
        verified_at: now,
        verified_by: 'Bank CBS Live (Simulated)',
        cbs_match: false,
        bank_ref: null,
      }
      item.status = 'Returned'
      item.bank_comparison.match_status = 'Mismatch - Lien Missing'
    } else {
      item.verification = {
        state: 'Verified',
        simulated: true,
        verified_at: now,
        verified_by: 'Bank CBS Gateway (Simulated)',
        cbs_match: true,
        bank_ref: `CBS-${item.bank.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      }
      item.status = 'Active'
      item.bank_comparison.match_status = 'Full Match'
      item.bank_comparison.cbs_live = {
        fdr_number: item.fdr_number,
        amount: item.amount,
        bank: `${item.bank} (CBS Verified)`,
        maturity_date: item.maturity_date,
        lien_marked: 'Yes (AICTE Lien Active)',
        account_status: 'Earmarked in CBS',
      }
    }

    item.history.push({
      step: item.history.length + 1,
      action: `Simulated Bank Verification: ${item.verification.state}`,
      actor: 'Bank CBS Integration (Simulated)',
      status: item.status,
      timestamp: now,
    })

    item.versions.push({
      version: item.versions.length + 1,
      timestamp: now,
      label: 'Bank Verification Ingested',
      status: item.status,
      amount: item.amount,
      notes: `Bank check completed. Status: ${item.verification.state}.`,
    })

    return item
  },

  'POST /fdrs/:id/resubmit': (body, params) => {
    const item = fdrStore.find((f) => f.id === params.id)
    if (!item) throw new Error('FDR not found')
    const now = new Date().toISOString()

    if (body.fdr_number) item.fdr_number = body.fdr_number
    if (body.bank) item.bank = body.bank
    if (body.branch) item.branch = body.branch
    if (body.amount) item.amount = Number(body.amount)
    if (body.maturity_date) item.maturity_date = body.maturity_date
    if (body.aicte_lien_endorsed !== undefined) {
      item.aicte_lien_endorsed = Boolean(body.aicte_lien_endorsed)
    }

    item.status = 'Submitted'
    item.verification = {
      state: 'Pending',
      simulated: true,
      verified_at: null,
      verified_by: null,
      cbs_match: false,
      bank_ref: null,
    }

    if (item.bank_comparison) {
      item.bank_comparison.submitted = {
        fdr_number: item.fdr_number,
        amount: item.amount,
        bank: item.bank,
        maturity_date: item.maturity_date,
        lien_marked: item.aicte_lien_endorsed ? 'Yes (AICTE Joint Endorsed)' : 'No',
      }
      item.bank_comparison.match_status = 'Pending Verification'
      item.bank_comparison.discrepancies = []
    }

    if (body.fileName) {
      item.documents.push({
        id: `doc_${Date.now()}`,
        name: body.fileName,
        type: 'PDF',
        size: '1.9 MB',
        uploaded_at: now,
      })
    }

    item.remarks.push({
      id: `rem_${Date.now()}`,
      author: body.author || 'College Accountant',
      role: 'College',
      text: body.remark || 'Rectified deposit documentation and endorsed AICTE lien. Resubmitted.',
      timestamp: now,
    })

    item.history.push({
      step: item.history.length + 1,
      action: 'Deposit Rectified & Resubmitted',
      actor: body.author || 'College Accountant',
      status: 'Submitted',
      timestamp: now,
    })

    item.versions.push({
      version: item.versions.length + 1,
      timestamp: now,
      label: 'Rectified Resubmission',
      status: 'Submitted',
      amount: item.amount,
      notes: body.remark || 'Corrected AICTE lien endorsement and updated certificate.',
    })

    // Audit chain block
    const prevBlock = auditStore[auditStore.length - 1]
    auditStore.push({
      block_index: auditStore.length,
      timestamp: now,
      event_type: 'FDR_RESUBMISSION',
      actor: item.institution_name,
      entity_id: item.fdr_number,
      details: `Rectified submission: INR ${item.amount.toLocaleString('en-IN')}`,
      prev_hash: prevBlock ? prevBlock.block_hash : '00000000000000000000000000000000',
      block_hash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('') + 'aa12c401',
      signature: 'SIMULATED_ECDSA:PORTAL_RESUBMIT_KEY',
      tamper_flag: false,
    })

    return item
  },

  'POST /fdrs/:id/renew': (body, params) => {
    const item = fdrStore.find((f) => f.id === params.id)
    if (!item) throw new Error('FDR not found')
    const now = new Date().toISOString()

    // Transition parent to Renewed
    item.status = 'Renewed'
    item.history.push({
      step: item.history.length + 1,
      action: 'Deposit Tenure Concluded & Renewed',
      actor: body.author || 'College Principal',
      status: 'Renewed',
      timestamp: now,
    })
    item.versions.push({
      version: item.versions.length + 1,
      timestamp: now,
      label: 'Renewed into Child Deposit',
      status: 'Renewed',
      amount: item.amount,
      notes: body.remark || 'Deposit rolled over into renewed certificate.',
    })

    // Create renewed child FDR
    const newId = `fdr_${String(fdrStore.length + 1).padStart(3, '0')}`
    const renewedFdr = {
      id: newId,
      fdr_number: body.new_fdr_number || `${item.fdr_number}-R1`,
      institution_id: item.institution_id,
      institution_name: item.institution_name,
      bank: item.bank,
      branch: item.branch,
      account_number: item.account_number,
      ifsc_code: item.ifsc_code,
      amount: Number(body.amount) || item.amount,
      roi: Number(body.roi) || item.roi || 7.25,
      tenure_months: Number(body.tenure_months) || 12,
      start_date: item.maturity_date || now.split('T')[0],
      maturity_date: body.maturity_date || '2027-10-25',
      maturity_amount: Number(body.amount ? body.amount * 1.075 : item.maturity_amount || 1600000),
      status: 'Active',
      parent_fdr_id: item.id,
      joint_holder: item.joint_holder || 'Regional Officer, AICTE Western Region',
      aicte_lien_endorsed: true,
      verification: {
        state: 'Verified',
        simulated: true,
        verified_at: now,
        verified_by: 'Bank CBS Renewal Gateway (Simulated)',
        cbs_match: true,
        bank_ref: `CBS-REN-${Math.floor(100000 + Math.random() * 900000)}`,
      },
      ocr_data: {
        confidence: 0.99,
        extracted_fdr_number: body.new_fdr_number || `${item.fdr_number}-R1`,
        extracted_amount: Number(body.amount) || item.amount,
        extracted_bank: item.bank,
        extracted_maturity: body.maturity_date || '2027-10-25',
        lien_clause_detected: true,
      },
      bank_comparison: {
        submitted: {
          fdr_number: body.new_fdr_number || `${item.fdr_number}-R1`,
          amount: Number(body.amount) || item.amount,
          bank: item.bank,
          maturity_date: body.maturity_date || '2027-10-25',
          lien_marked: 'Yes (AICTE Lien Active)',
        },
        cbs_live: {
          fdr_number: body.new_fdr_number || `${item.fdr_number}-R1`,
          amount: Number(body.amount) || item.amount,
          bank: `${item.bank} (CBS Verified)`,
          maturity_date: body.maturity_date || '2027-10-25',
          lien_marked: 'Yes (Renewed AICTE Lien)',
          account_status: 'Earmarked in CBS',
        },
        match_status: 'Full Match',
        discrepancies: [],
      },
      documents: [
        {
          id: `doc_${Date.now()}`,
          name: body.fileName || `Renewal_Receipt_${item.fdr_number}.pdf`,
          type: 'PDF',
          size: '1.7 MB',
          uploaded_at: now,
        },
      ],
      remarks: [
        {
          id: `rem_${Date.now()}`,
          author: body.author || 'College Accountant',
          role: 'College',
          text: body.remark || `Renewal deposit rolled over from parent ${item.fdr_number}.`,
          timestamp: now,
        },
      ],
      history: [
        { step: 1, action: `Renewal Created from ${item.fdr_number}`, actor: 'College', status: 'Submitted', timestamp: now },
        { step: 2, action: 'Auto-verified with Bank CBS Earmarking', actor: 'CBS Gateway (Simulated)', status: 'Active', timestamp: now },
      ],
      versions: [
        { version: 1, timestamp: now, label: 'Renewal Initialized & Verified', status: 'Active', amount: Number(body.amount) || item.amount, notes: `Rolled over from ${item.fdr_number}` },
      ],
    }

    fdrStore = [renewedFdr, ...fdrStore]

    // Audit record
    const prevBlock = auditStore[auditStore.length - 1]
    auditStore.push({
      block_index: auditStore.length,
      timestamp: now,
      event_type: 'FDR_RENEWAL',
      actor: item.institution_name,
      entity_id: renewedFdr.fdr_number,
      details: `FDR renewal rollover from ${item.fdr_number}: INR ${renewedFdr.amount.toLocaleString('en-IN')}`,
      prev_hash: prevBlock ? prevBlock.block_hash : '00000000000000000000000000000000',
      block_hash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('') + 'ef7810aa',
      signature: 'SIMULATED_ECDSA:PORTAL_RENEWAL_KEY',
      tamper_flag: false,
    })

    return { original: item, renewed: renewedFdr }
  },

  'GET /notifications': () => {
    const list = []
    fdrStore.forEach((f) => {
      if (f.status === 'Returned') {
        list.push({
          id: `notif_ret_${f.id}`,
          type: 'warning',
          title: 'Deposit Returned for Rectification',
          message: `${f.fdr_number} (${f.bank}) was returned. AICTE Lien clause endorsement missing.`,
          fdrId: f.id,
          fdrNumber: f.fdr_number,
          timestamp: f.history[f.history.length - 1]?.timestamp || new Date().toISOString(),
          read: false,
        })
      } else if (f.status === 'Maturing') {
        list.push({
          id: `notif_mat_${f.id}`,
          type: 'alert',
          title: 'Deposit Approaching Maturity',
          message: `${f.fdr_number} matures on ${f.maturity_date}. Action required: Submit Renewal.`,
          fdrId: f.id,
          fdrNumber: f.fdr_number,
          timestamp: f.history[f.history.length - 1]?.timestamp || new Date().toISOString(),
          read: false,
        })
      } else if (f.status === 'Released') {
        list.push({
          id: `notif_rel_${f.id}`,
          type: 'info',
          title: 'Security Deposit Released',
          message: `${f.fdr_number} release approved by Dual-Key Approver. QR receipt ready.`,
          fdrId: f.id,
          fdrNumber: f.fdr_number,
          timestamp: f.history[f.history.length - 1]?.timestamp || new Date().toISOString(),
          read: true,
        })
      } else if (f.status === 'Active') {
        list.push({
          id: `notif_act_${f.id}`,
          type: 'success',
          title: 'Lien Verified Active in CBS',
          message: `${f.fdr_number} live and earmarked with AICTE Western Region.`,
          fdrId: f.id,
          fdrNumber: f.fdr_number,
          timestamp: f.verification?.verified_at || new Date().toISOString(),
          read: true,
        })
      }
    })
    return list
  },

  'GET /dashboard/summary': () => dashboardSummary,

  'GET /duplicates': () => duplicateMatches,

  'GET /releases': () => releaseStore,

  'POST /releases': (body) => {
    const fdr = fdrStore.find((f) => f.id === body.fdr_id)
    const now = new Date().toISOString()
    const newRelease = {
      id: `rel_${String(releaseStore.length + 1).padStart(3, '0')}`,
      fdr_id: body.fdr_id,
      fdr_number: fdr ? fdr.fdr_number : body.fdr_number,
      institution_id: fdr ? fdr.institution_id : 'inst_01',
      institution_name: fdr ? fdr.institution_name : 'Sample Institute',
      bank: fdr ? fdr.bank : 'Sample Bank',
      amount: fdr ? fdr.amount : 1000000,
      status: 'Pending Review',
      reason: body.reason || 'Completion of course tenure / refund of security deposit',
      requested_by: body.requested_by || 'College Accountant',
      requested_at: now,
      reviewer_id: null,
      reviewer_name: null,
      reviewed_at: null,
      reviewer_notes: null,
      approver_id: null,
      approver_name: null,
      approved_at: null,
      approver_otp_verified: false,
      release_hash: null,
      receipt_issued: false,
    }
    releaseStore = [newRelease, ...releaseStore]
    if (fdr) {
      fdr.status = 'Release in Progress'
    }
    return newRelease
  },

  'POST /releases/:id/review': (body, params) => {
    const rel = releaseStore.find((r) => r.id === params.id)
    if (!rel) throw new Error('Release request not found')
    rel.status = 'Reviewed'
    rel.reviewer_id = body.reviewer_id || 'u_officer'
    rel.reviewer_name = body.reviewer_name || 'Anita Deshmukh (AICTE Officer)'
    rel.reviewed_at = new Date().toISOString()
    rel.reviewer_notes = body.notes || 'Compliance audit verified. Recommended for sign-off.'
    return rel
  },

  'POST /releases/:id/approve': (body, params) => {
    const rel = releaseStore.find((r) => r.id === params.id)
    if (!rel) throw new Error('Release request not found')
    if (rel.reviewer_id && rel.reviewer_id === body.approver_id) {
      throw new Error('Two-person rule violation: Approver cannot be the same person as Reviewer.')
    }
    const now = new Date().toISOString()
    rel.status = 'Approved'
    rel.approver_id = body.approver_id || 'u_approver'
    rel.approver_name = body.approver_name || 'Prof. K. Venkatesh (Approver)'
    rel.approved_at = now
    rel.approver_otp_verified = true
    rel.release_hash =
      body.release_hash ||
      '9e7b2f0a1c843e9d821045fbca3792ef' +
        Math.floor(10000000 + Math.random() * 90000000).toString(16)
    rel.receipt_issued = true

    // Update parent FDR status to Released
    const fdr = fdrStore.find((f) => f.id === rel.fdr_id)
    if (fdr) {
      fdr.status = 'Released'
      fdr.release_info = {
        release_id: rel.id,
        approved_at: now,
        release_hash: rel.release_hash,
      }
    }

    return rel
  },

  'GET /audit/verify': () => ({
    valid: true,
    length: auditStore.length,
    broken_at: null,
    chain_head: auditStore[auditStore.length - 1]?.block_hash,
    verified_at: new Date().toISOString(),
  }),

  'GET /audit/chain': () => auditStore,

  'GET /receipts/:hash': (_body, params) => {
    const rel = releaseStore.find((r) => r.release_hash === params.hash)
    if (rel) {
      const fdr = fdrStore.find((f) => f.id === rel.fdr_id)
      return {
        valid: true,
        release: rel,
        fdr: fdr || null,
        certificate_id: `AICTE-REL-CERT-${rel.id.toUpperCase()}`,
        issuer: 'All India Council for Technical Education (Western Regional Bureau)',
        issued_at: rel.approved_at,
        hash: rel.release_hash,
        verification_method: 'Cryptographic SHA-256 Multi-Signature (Simulated)',
      }
    }
    // Also support checking fdr_007 static release
    if (params.hash.includes('9e7b2f0a1c843e9d')) {
      return {
        valid: true,
        release: releaseStore[0],
        fdr: fdrStore.find((f) => f.id === 'fdr_007'),
        certificate_id: 'AICTE-REL-CERT-REL_001',
        issuer: 'All India Council for Technical Education (Western Regional Bureau)',
        issued_at: '2025-03-08T11:00:00Z',
        hash: params.hash,
        verification_method: 'Cryptographic SHA-256 Multi-Signature (Simulated)',
      }
    }
    throw new Error('Receipt hash not found or invalid signature')
  },
}

function matchMock(method, path) {
  const url = new URL(path, 'http://dummy.local')
  const pathname = url.pathname
  const query = Object.fromEntries(url.searchParams.entries())

  for (const key of Object.keys(mockHandlers)) {
    const [m, pattern] = key.split(' ')
    if (m !== method) continue
    const names = []
    const regex = new RegExp(
      '^' + pattern.replace(/:([a-z_]+)/g, (_, n) => (names.push(n), '([^/]+)')) + '$',
    )
    const hit = pathname.match(regex)
    if (hit) {
      const params = Object.fromEntries(names.map((n, i) => [n, hit[i + 1]]))
      return { handler: mockHandlers[key], params, query }
    }
  }
  return null
}

export async function request(method, path, body) {
  const useMock = USE_MOCK && !REAL_ENDPOINTS.has(`${method} ${path.split('?')[0]}`)
  if (useMock) {
    await delay()
    const found = matchMock(method, path)
    if (!found) throw new Error(`No mock for ${method} ${path}`)
    return found.handler(body, found.params, found.query)
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  health: () => request('GET', '/health'),

  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  getUsers: () => request('GET', '/auth/users'),

  // FDRs
  listFdrs: (query = {}) => {
    const sp = new URLSearchParams()
    if (query.status) sp.set('status', query.status)
    if (query.institution_id) sp.set('institution_id', query.institution_id)
    if (query.q) sp.set('q', query.q)
    const qs = sp.toString() ? `?${sp.toString()}` : ''
    return request('GET', `/fdrs${qs}`)
  },
  getFdr: (id) => request('GET', `/fdrs/${id}`),
  createFdr: (data) => request('POST', '/fdrs', data),
  transitionFdr: (id, to_status, remark, author, role) =>
    request('POST', `/fdrs/${id}/transition`, { to_status, remark, author, role }),
  verifyBank: (id) => request('POST', `/fdrs/${id}/verify`),

  // Dashboard
  dashboardSummary: () => request('GET', '/dashboard/summary'),

  // Duplicates
  listDuplicates: () => request('GET', '/duplicates'),

  // Releases
  listReleases: () => request('GET', '/releases'),
  createRelease: (data) => request('POST', '/releases', data),
  reviewRelease: (id, notes, reviewer_id, reviewer_name) =>
    request('POST', `/releases/${id}/review`, { notes, reviewer_id, reviewer_name }),
  approveRelease: (id, approver_id, approver_name, otp) =>
    request('POST', `/releases/${id}/approve`, { approver_id, approver_name, otp }),

  // Audit
  verifyAudit: () => request('GET', '/audit/verify'),
  getAuditChain: () => request('GET', '/audit/chain'),

  // Receipts
  getReceipt: (hash) => request('GET', `/receipts/${hash}`),

  // Resubmit & Renew
  resubmitFdr: (id, data) => request('POST', `/fdrs/${id}/resubmit`, data),
  renewFdr: (id, data) => request('POST', `/fdrs/${id}/renew`, data),

  // Notifications
  getNotifications: () => request('GET', '/notifications'),
}

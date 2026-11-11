const BASE_URL = '/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Map a single medical term to a standard concept.
 * Backend endpoint: POST /api/mapping/map
 * @param {Object} req - { clinical_text, target_terminology, clinical_notes }
 */
export async function mapTerminology(req) {
  // Map fields if caller used 'term' or 'clinical_text'
  const payload = {
    clinical_text: req.clinical_text || req.term,
    target_terminology: req.target_terminology || req.terminology || 'All',
    clinical_notes: req.clinical_notes || null,
  };
  return request('/mapping/map', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Batch map multiple terms.
 * Backend endpoint: POST /api/mapping/batch
 * @param {string[]} terms
 * @param {string} target_terminology
 */
export async function mapBatch(terms, target_terminology = 'All') {
  return request('/mapping/batch', {
    method: 'POST',
    body: JSON.stringify({ terms, target_terminology }),
  });
}

/**
 * Get mapping history with optional filtering.
 * Backend endpoint: GET /api/mapping/history
 * @param {Object} params - { limit, offset, search, terminology, confidence, status }
 */
export async function getHistory(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  const qs = query.toString();
  return request(`/mapping/history${qs ? `?${qs}` : ''}`);
}

/**
 * Get a single mapping by ID.
 * Backend endpoint: GET /api/mapping/{id}
 * @param {string} id
 */
export async function getMappingById(id) {
  return request(`/mapping/${id}`);
}

/**
 * Submit a human review decision for a mapping.
 * Backend endpoint: POST /api/mapping/{id}/review
 * @param {string} id
 * @param {Object} req - { action: 'accept'|'reject'|'switch_candidate', reviewer_comments }
 */
export async function reviewMapping(id, req) {
  const payload = {
    action: req.action || (req.status === 'accepted' ? 'accept' : req.status === 'rejected' ? 'reject' : req.status),
    selected_candidate_id: req.selected_candidate_id || null,
    reviewer_comments: req.reviewer_comments || req.reviewer_notes || null,
    reviewer_id: req.reviewer_id || 'Clinical Staff',
  };
  return request(`/mapping/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get analytics overview data for the dashboard.
 * Backend endpoint: GET /api/analytics/overview
 */
export async function getAnalyticsOverview() {
  return request('/analytics/overview');
}

/**
 * Run the evaluation benchmark.
 * Backend endpoint: GET /api/analytics/evaluation
 */
export async function runEvaluation() {
  return request('/analytics/evaluation');
}

/**
 * Export the mapping history as a CSV file.
 * Backend endpoint: GET /api/mapping/export
 */
export async function exportHistoryCSV() {
  const url = `${BASE_URL}/mapping/export`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'medical_terminology_mappings.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

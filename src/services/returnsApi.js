const API_BASE = 'http://localhost:3003';

export async function fetchReturns(search) {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/api/returns${params}`);
  if (!res.ok) throw new Error('Failed to fetch returns');
  return res.json();
}

export async function fetchReturn(id) {
  const res = await fetch(`${API_BASE}/api/returns/${id}`);
  if (!res.ok) throw new Error('Return not found');
  return res.json();
}

export async function createReturn(data) {
  const res = await fetch(`${API_BASE}/api/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create return');
  return res.json();
}

export async function updateReturn(id, data) {
  const res = await fetch(`${API_BASE}/api/returns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update return');
  return res.json();
}

export async function deleteReturn(id) {
  const res = await fetch(`${API_BASE}/api/returns/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete return');
  return res.json();
}

export async function bulkDeleteReturns(ids) {
  const res = await fetch(`${API_BASE}/api/returns/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  });
  if (!res.ok) throw new Error('Failed to delete returns');
  return res.json();
}

export async function uploadReturnFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/returns/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export function getDownloadUrl(id) {
  return `${API_BASE}/api/returns/${id}/download`;
}

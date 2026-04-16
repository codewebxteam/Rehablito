import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Server-side fetch utility that reads auth token from cookies
 * and uses native fetch with Next.js caching (revalidate).
 */
export async function serverFetch<T = any>(
  path: string,
  options?: { revalidate?: number; tags?: string[] }
): Promise<{ success: boolean; data: T; [key: string]: any }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('rehablito_token')?.value;

  if (!token) {
    return { success: false, data: {} as T, message: 'Not authenticated' };
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: options?.revalidate ?? 60,
        tags: options?.tags,
      },
    });

    if (!res.ok) {
      return { success: false, data: {} as T, message: `API error: ${res.status}` };
    }

    return await res.json();
  } catch (error) {
    console.error(`Server fetch error for ${path}:`, error);
    return { success: false, data: {} as T, message: 'Server fetch failed' };
  }
}

/**
 * Pre-fetch dashboard data (combined endpoint, revalidate every 60s)
 */
export async function fetchDashboardData() {
  return serverFetch('/admin/dashboard', { revalidate: 60, tags: ['dashboard'] });
}

/**
 * Pre-fetch patients list (paginated, revalidate every 30s)
 */
export async function fetchPatients(page = 1, limit = 20) {
  return serverFetch(`/admin/patients?page=${page}&limit=${limit}`, { revalidate: 30, tags: ['patients'] });
}

/**
 * Pre-fetch staff list (paginated, revalidate every 30s) 
 */
export async function fetchStaff(page = 1, limit = 20) {
  return serverFetch(`/admin/staff?page=${page}&limit=${limit}`, { revalidate: 30, tags: ['staff'] });
}

/**
 * Pre-fetch leads list (paginated, revalidate every 30s)
 */
export async function fetchLeads(page = 1, limit = 20) {
  return serverFetch(`/admin/leads?page=${page}&limit=${limit}`, { revalidate: 30, tags: ['leads'] });
}

/**
 * Pre-fetch branches list
 */
export async function fetchBranches() {
  return serverFetch('/admin/branches', { revalidate: 120, tags: ['branches'] });
}

/**
 * Pre-fetch attendance data
 */
export async function fetchAttendance() {
  return serverFetch('/admin/attendance', { revalidate: 30, tags: ['attendance'] });
}

/**
 * Pre-fetch fees list
 */
export async function fetchFees(page = 1, limit = 20) {
  return serverFetch(`/admin/fees?page=${page}&limit=${limit}`, { revalidate: 30, tags: ['fees'] });
}

/**
 * Pre-fetch fee summary
 */
export async function fetchFeeSummary() {
  return serverFetch('/admin/fees/summary', { revalidate: 60, tags: ['fee-summary'] });
}

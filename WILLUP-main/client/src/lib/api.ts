import { supabase } from './supabaseClient';
import { USE_MOCK_BACKEND } from './mockConfig';
import { mockWorkflows, mockTickets, mockAuditLogs, classifyMessage, generateMockTicket, getMockRoles, searchMockUsers, addMockRoleMember, removeMockRoleMember } from './mockService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || process.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Base fetch wrapper that automatically attaches the active Supabase JWT session token.
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText || 'An unexpected API error occurred' };
    }
    const error = new Error(errorData.error || errorData.message || `API error (${response.status})`);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  return response.json();
}

export const api = {
  // Chat & Ingestion AI Agent Endpoints
  chat: {
    sendMessage: async (data: { message: string; history?: any[]; isFollowUp?: boolean }) => {
      if (USE_MOCK_BACKEND) {
        await delay(1500);
        if (data.isFollowUp) {
          return { reply: "I've noted that. Is there anything else you'd like to add?", isFollowUp: true };
        }
        const domain = classifyMessage(data.message);
        const ticket = generateMockTicket(data.message, domain);
        const replies: any = {
          HOSTEL_MAINTENANCE: "Got it — this looks like a Hostel/Maintenance issue. I've routed it to your Caretaker.",
          CERTIFICATE: "Understood — this is a Certificate request. I've sent it to the Academic Section.",
          LABORATORY: "Sure — a Laboratory request. I've forwarded it to the Lab In-Charge.",
          GRIEVANCE: "I've recorded your grievance. It has been routed to the Student Counselor."
        };
        return { ticket, reply: replies[domain] };
      }
      return fetchWithAuth('/chat/message', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },

  // Tickets & Workflow Endpoints
  tickets: {
    getMine: async () => {
      if (USE_MOCK_BACKEND) return { tickets: mockTickets };
      return fetchWithAuth('/tickets?filter=mine');
    },
    getPending: async () => {
      if (USE_MOCK_BACKEND) return { tickets: mockTickets.filter(t => t.status === 'ACTIVE') };
      return fetchWithAuth('/tickets?filter=pending');
    },
    getResolved: async () => {
      if (USE_MOCK_BACKEND) return { tickets: mockTickets.filter(t => t.status === 'RESOLVED' || t.status === 'REJECTED') };
      return fetchWithAuth('/tickets?filter=resolved');
    },
    getById: async (id: string) => {
      if (USE_MOCK_BACKEND) return { ticket: mockTickets.find(t => t.id === id) };
      return fetchWithAuth(`/tickets/${id}`);
    },
    getCollectiveGroups: () => fetchWithAuth('/tickets/collective-groups'),
    getCollectiveGroup: (id: string) => fetchWithAuth(`/tickets/collective-groups/${id}`),

    
    uploadDocument: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      return fetchWithAuth(`/tickets/${id}/documents`, {
        method: 'POST',
        body: formData,
      });
    },

    approve: async (id: string, data: { stageId?: string; comment?: string } = {}) => {
      if (USE_MOCK_BACKEND) {
        const ticket = mockTickets.find(t => t.id === id);
        if (ticket) {
          const wf = mockWorkflows.find(w => w.domain === ticket.domain);
          if (wf) {
            const stageIndex = wf.stages.findIndex(s => s.id === ticket.currentStageId);
            if (stageIndex >= 0 && stageIndex < wf.stages.length - 1) {
              ticket.currentStageId = wf.stages[stageIndex + 1].id;
              mockAuditLogs.push({ id: `al-mock-${Date.now()}`, ticketId: ticket.id, action: 'APPROVED', stageId: wf.stages[stageIndex].id, description: 'Approved by you', timestamp: new Date().toISOString() });
            } else {
              ticket.status = 'RESOLVED';
              ticket.currentStageId = null;
              ticket.outcome = 'Approved';
              ticket.resolvedAt = new Date().toISOString();
              mockAuditLogs.push({ id: `al-mock-${Date.now()}`, ticketId: ticket.id, action: 'APPROVED', stageId: wf.stages[stageIndex]?.id, description: 'Approved by you', timestamp: new Date().toISOString() });
              mockAuditLogs.push({ id: `al-mock-${Date.now()}-2`, ticketId: ticket.id, action: 'RESOLVED', description: 'Ticket resolved', timestamp: new Date().toISOString() });
            }
            const event = new CustomEvent(`ticket-update-${ticket.id}`, { detail: { eventType: 'UPDATE', table: 'Ticket', new: { ...ticket } } });
            window.dispatchEvent(event);
          }
        }
        return { message: 'Approved mock ticket' };
      }
      return fetchWithAuth(`/tickets/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    reject: async (id: string, data: { stageId?: string; comment?: string } = {}) => {
      if (USE_MOCK_BACKEND) {
        const ticket = mockTickets.find(t => t.id === id);
        if (ticket) {
          ticket.status = 'REJECTED';
          ticket.currentStageId = null;
          ticket.outcome = 'Rejected';
          ticket.resolvedAt = new Date().toISOString();
          mockAuditLogs.push({ id: `al-mock-${Date.now()}`, ticketId: ticket.id, action: 'REJECTED', description: data.comment || 'Rejected by you', timestamp: new Date().toISOString() });
          const event = new CustomEvent(`ticket-update-${ticket.id}`, { detail: { eventType: 'UPDATE', table: 'Ticket', new: { ...ticket } } });
          window.dispatchEvent(event);
        }
        return { message: 'Rejected mock ticket' };
      }
      return fetchWithAuth(`/tickets/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Audit Log Endpoints
  audit: {
    getByTicketId: async (ticketId: string) => {
      if (USE_MOCK_BACKEND) return { logs: mockAuditLogs.filter(l => l.ticketId === ticketId) };
      return fetchWithAuth(`/audit/${ticketId}`);
    },
  },


  // Admin Configuration & Governance Endpoints
  admin: {
    getDashboard: () => fetchWithAuth('/admin/dashboard'),
    getRoles: async () => {
      if (USE_MOCK_BACKEND) return { roles: getMockRoles() };
      return fetchWithAuth('/admin/roles');
    },
    searchUsers: async (query: string) => {
      if (USE_MOCK_BACKEND) return { users: searchMockUsers(query) };
      return fetchWithAuth(`/admin/users/search?q=${encodeURIComponent(query)}`);
    },
    
    addRoleMember: async (roleId: string, username: string) => {
      if (USE_MOCK_BACKEND) return addMockRoleMember(roleId, username);
      return fetchWithAuth(`/admin/roles/${roleId}/members`, {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
    },

    removeRoleMember: async (roleId: string, userId: string) => {
      if (USE_MOCK_BACKEND) return removeMockRoleMember(roleId, userId);
      return fetchWithAuth(`/admin/roles/${roleId}/members/${userId}`, {
        method: 'DELETE',
      });
    },

    getSeverityRules: () => fetchWithAuth('/admin/severity-rules'),
    createSeverityRule: (data: {
      domain: string;
      keyword: string;
      severity?: string;
      tier?: string;
      escalationCadenceMinutes?: number;
    }) =>
      fetchWithAuth('/admin/severity-rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteSeverityRule: (id: string) =>
      fetchWithAuth(`/admin/severity-rules/${id}`, {
        method: 'DELETE',
      }),

    updateRole: (id: string, data: { escalationMinutes?: number; order?: number; name?: string }) =>
      fetchWithAuth(`/admin/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getCollectiveGroups: () => fetchWithAuth('/admin/collective-groups'),
    getWorkflows: () => fetchWithAuth('/admin/workflows'),
    getAuditLogs: () => fetchWithAuth('/admin/audit'),
    dispatchCollectiveGroup: (id: string) =>
      fetchWithAuth(`/admin/collective-groups/${id}/dispatch`, {
        method: 'POST',
      }),
  },


  // Knowledge Base & RAG Endpoints
  knowledge: {
    getDocuments: () => fetchWithAuth('/knowledge/documents'),
    search: (data: { query: string; domain?: string }) =>
      fetchWithAuth('/knowledge/search', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ingest: (data: {
      title: string;
      content: string;
      domain: string;
      category: string;
      tags?: string[];
    }) =>
      fetchWithAuth('/knowledge/ingest', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // User Profile & Roles Endpoints
  users: {
    getMe: async () => {
      if (USE_MOCK_BACKEND) {
        const isAdmin = localStorage.getItem('mock_admin_mode') === 'true';
        return {
          id: isAdmin ? 'mock-admin-1' : 'mock-student-1',
          email: isAdmin ? 'admin@demo.com' : 'student@demo.com',
          roles: isAdmin ? [
            { id: 'role-admin', name: 'System Admin', domain: 'ALL', order: 0 },
            { id: 'role-caretaker', name: 'Hostel Caretaker', domain: 'HOSTEL_MAINTENANCE', order: 1 },
            { id: 'role-lab', name: 'Lab In-Charge', domain: 'LABORATORY', order: 1 },
          ] : []
        };
      }
      return fetchWithAuth('/users/me');
    },
  },

  // Public/Student Workflow Definitions
  workflows: {
    getAll: async () => {
      if (USE_MOCK_BACKEND) return { workflows: mockWorkflows };
      return fetchWithAuth('/workflows');
    },
  },
};

export default api;

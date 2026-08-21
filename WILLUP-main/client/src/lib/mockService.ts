export const mockWorkflows = [
  {
    domain: 'HOSTEL_MAINTENANCE',
    stages: [
      { id: 'hm_s1', name: 'Caretaker Review', order: 1, roleName: 'Hostel Caretaker' },
      { id: 'hm_s2', name: 'Warden Approval', order: 2, roleName: 'Hostel Warden' },
      { id: 'hm_s3', name: 'Maintenance Dispatch', order: 3, roleName: 'Estate Office' },
    ]
  },
  {
    domain: 'CERTIFICATE',
    stages: [
      { id: 'cert_s1', name: 'Academic Review', order: 1, roleName: 'Academic Section' },
      { id: 'cert_s2', name: 'Dean Approval', order: 2, roleName: 'Dean of Student Affairs' },
    ]
  },
  {
    domain: 'LABORATORY',
    stages: [
      { id: 'lab_s1', name: 'Lab In-Charge Approval', order: 1, roleName: 'Lab In-Charge' },
      { id: 'lab_s2', name: 'HOD Approval', order: 2, roleName: 'Head of Department' },
    ]
  },
  {
    domain: 'GRIEVANCE',
    stages: [
      { id: 'g_s1', name: 'Initial Screening', order: 1, roleName: 'Student Counselor' },
      { id: 'g_s2', name: 'Committee Review', order: 2, roleName: 'Grievance Redressal Committee' },
    ]
  }
];

export const mockTickets: any[] = [
  {
    id: 'mock-ticket-pending-1',
    domain: 'HOSTEL_MAINTENANCE',
    scope: 'Electrical',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    extractedData: { issue: 'Fan not working', room: '204', timing: 'night' },
    currentStageId: 'hm_s1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    studentId: 'student-123',
  },
  {
    id: 'mock-ticket-pending-2',
    domain: 'CERTIFICATE',
    scope: 'Bonafide',
    severity: 'LOW',
    status: 'ACTIVE',
    extractedData: { purpose: 'Internship', semester: '6th' },
    currentStageId: 'cert_s2',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    studentId: 'student-124',
  },
  {
    id: 'mock-ticket-resolved-1',
    domain: 'LABORATORY',
    scope: 'Booking',
    severity: 'LOW',
    status: 'RESOLVED',
    extractedData: { lab: 'Physics 101', date: '2026-10-15', slot: '10:00 AM - 12:00 PM' },
    currentStageId: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000).toISOString(),
    studentId: 'student-123',
    outcome: 'Approved',
  },
];

export const mockAuditLogs: any[] = [
  { id: 'al-1', ticketId: 'mock-ticket-resolved-1', action: 'CLASSIFIED', description: 'Ticket created and classified', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'al-2', ticketId: 'mock-ticket-resolved-1', action: 'APPROVED', stageId: 'lab_s1', description: 'Approved by Lab In-Charge', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  { id: 'al-3', ticketId: 'mock-ticket-resolved-1', action: 'APPROVED', stageId: 'lab_s2', description: 'Approved by HOD', timestamp: new Date(Date.now() - 86400000 * 1.1).toISOString() },
  { id: 'al-4', ticketId: 'mock-ticket-resolved-1', action: 'RESOLVED', description: 'Ticket resolved', timestamp: new Date(Date.now() - 86400000).toISOString() },
];

let autoAdvanceInterval: any = null;

const emitCdcEvent = (ticketId: string, newRecord: any, oldRecord?: any, table: string = 'Ticket') => {
  const event = new CustomEvent('mock-cdc-event', {
    detail: {
      eventType: 'UPDATE',
      table,
      new: newRecord,
      old: oldRecord || newRecord,
    }
  });
  window.dispatchEvent(event);

  if (table === 'AuditLog') {
    const alEvent = new CustomEvent(`audit-logs-ticket-${ticketId}`, {
      detail: {
        eventType: 'INSERT',
        table: 'AuditLog',
        new: newRecord,
      }
    });
    window.dispatchEvent(alEvent);
  } else {
    const tEvent = new CustomEvent(`ticket-update-${ticketId}`, {
      detail: {
        eventType: 'UPDATE',
        table: 'Ticket',
        new: newRecord,
      }
    });
    window.dispatchEvent(tEvent);
  }
};

export const startAutoAdvance = () => {
  if (autoAdvanceInterval) return;
  autoAdvanceInterval = setInterval(() => {
    // Pick an active ticket and advance it
    const activeTicket = mockTickets.find(t => t.status === 'ACTIVE' && t.id.startsWith('mock-ticket-auto'));
    if (activeTicket) {
      const wf = mockWorkflows.find(w => w.domain === activeTicket.domain);
      if (wf) {
        const stageIndex = wf.stages.findIndex(s => s.id === activeTicket.currentStageId);
        const oldRecord = { ...activeTicket };
        if (stageIndex >= 0 && stageIndex < wf.stages.length - 1) {
          activeTicket.currentStageId = wf.stages[stageIndex + 1].id;
          
          const newLog = {
            id: `al-auto-${Date.now()}`,
            ticketId: activeTicket.id,
            action: 'APPROVED',
            stageId: wf.stages[stageIndex].id,
            description: `Approved by ${wf.stages[stageIndex].roleName}`,
            timestamp: new Date().toISOString()
          };
          mockAuditLogs.push(newLog);
          
          emitCdcEvent(activeTicket.id, activeTicket, oldRecord, 'Ticket');
          emitCdcEvent(activeTicket.id, newLog, null, 'AuditLog');
        } else if (stageIndex === wf.stages.length - 1) {
          activeTicket.status = 'RESOLVED';
          activeTicket.currentStageId = null;
          activeTicket.outcome = 'Approved';
          activeTicket.resolvedAt = new Date().toISOString();

          const newLog1 = {
            id: `al-auto-${Date.now()}-1`,
            ticketId: activeTicket.id,
            action: 'APPROVED',
            stageId: wf.stages[stageIndex].id,
            description: `Approved by ${wf.stages[stageIndex].roleName}`,
            timestamp: new Date().toISOString()
          };
          const newLog2 = {
            id: `al-auto-${Date.now()}-2`,
            ticketId: activeTicket.id,
            action: 'RESOLVED',
            description: `Ticket resolved`,
            timestamp: new Date().toISOString()
          };
          mockAuditLogs.push(newLog1, newLog2);
          
          emitCdcEvent(activeTicket.id, activeTicket, oldRecord, 'Ticket');
          emitCdcEvent(activeTicket.id, newLog1, null, 'AuditLog');
          setTimeout(() => emitCdcEvent(activeTicket.id, newLog2, null, 'AuditLog'), 500);
        }
      }
    }
  }, 9000);
};

export const classifyMessage = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('fan') || lower.includes('room') || lower.includes('leak') || lower.includes('electrical') || lower.includes('maintain') || lower.includes('noise')) {
    return 'HOSTEL_MAINTENANCE';
  }
  if (lower.includes('certificate') || lower.includes('bonafide') || lower.includes('transcript')) {
    return 'CERTIFICATE';
  }
  if (lower.includes('lab') || lower.includes('booking') || lower.includes('slot')) {
    return 'LABORATORY';
  }
  if (lower.includes('harass') || lower.includes('complaint') || lower.includes('unfair') || lower.includes('grievance')) {
    return 'GRIEVANCE';
  }
  return 'HOSTEL_MAINTENANCE';
};

export const generateMockTicket = (text: string, domain: string) => {
  const wf = mockWorkflows.find(w => w.domain === domain)!;
  const ticketId = `mock-ticket-auto-${Date.now()}`;
  const newTicket = {
    id: ticketId,
    domain,
    scope: 'General',
    severity: 'LOW',
    status: 'ACTIVE',
    extractedData: { summary: text.substring(0, 50) + '...' },
    currentStageId: wf.stages[0].id,
    createdAt: new Date().toISOString(),
    studentId: 'student-123',
  };
  mockTickets.push(newTicket);
  
  const initialLog = {
    id: `al-init-${Date.now()}`,
    ticketId: ticketId,
    action: 'CLASSIFIED',
    description: `System classified request as ${domain} and routed to ${wf.stages[0].roleName}`,
    timestamp: new Date().toISOString()
  };
  mockAuditLogs.push(initialLog);

  // Auto start advancing if we create an auto ticket
  startAutoAdvance();
  
  return newTicket;
};

export const mockSearchUsers = [
  { id: 'mu-1', username: 'swift-falcon-2291', displayName: 'Dr. A. Sharma' },
  { id: 'mu-2', username: 'bold-tiger-9932', displayName: 'Prof. R. Kumar' },
  { id: 'mu-3', username: 'clever-fox-1123', displayName: 'S. Patel' },
  { id: 'mu-4', username: 'brave-lion-4456', displayName: 'M. Singh' },
  { id: 'mu-5', username: 'calm-owl-7789', displayName: 'Dr. V. Gupta' },
  { id: 'mu-6', username: 'wise-bear-3344', displayName: 'K. Desai' },
  { id: 'mu-7', username: 'fast-cheetah-5567', displayName: 'N. Reddy' },
  { id: 'mu-8', username: 'proud-eagle-8890', displayName: 'Dr. P. Joshi' },
  { id: 'mu-9', username: 'quiet-wolf-1122', displayName: 'T. Menon' },
  { id: 'mu-10', username: 'smart-dolphin-3345', displayName: 'R. Iyer' },
  { id: 'mu-11', username: 'strong-horse-6678', displayName: 'Warden Biswas' },
  { id: 'mu-12', username: 'gentle-deer-9901', displayName: 'Caretaker Manoj' },
  { id: 'mu-13', username: 'happy-dog-2234', displayName: 'Dean S. Verma' },
  { id: 'mu-14', username: 'loyal-hound-5567', displayName: 'HOD A. Nair' },
  { id: 'mu-15', username: 'fierce-shark-8890', displayName: 'Supt. D. Rao' }
];

export let mockAdminRoles = [
  {
    id: 'mr-lab-1', name: 'Faculty/Advisor', domain: 'LABORATORY', order: 0, escalationMinutes: 60,
    assignments: [
      { id: 'ma-1', userId: 'mu-1', roleId: 'mr-lab-1', user: mockSearchUsers[0] },
      { id: 'ma-2', userId: 'mu-2', roleId: 'mr-lab-1', user: mockSearchUsers[1] }
    ]
  },
  {
    id: 'mr-lab-2', name: 'Lab Assistant', domain: 'LABORATORY', order: 1, escalationMinutes: 60,
    assignments: [
      { id: 'ma-3', userId: 'mu-3', roleId: 'mr-lab-2', user: mockSearchUsers[2] }
    ]
  },
  {
    id: 'mr-lab-3', name: 'Lab In-charge', domain: 'LABORATORY', order: 2, escalationMinutes: 60,
    assignments: [
      { id: 'ma-4', userId: 'mu-4', roleId: 'mr-lab-3', user: mockSearchUsers[3] }
    ]
  },
  {
    id: 'mr-cert-1', name: 'Faculty/Advisor', domain: 'CERTIFICATE', order: 0, escalationMinutes: 60,
    assignments: [
      { id: 'ma-5', userId: 'mu-5', roleId: 'mr-cert-1', user: mockSearchUsers[4] }
    ]
  },
  {
    id: 'mr-cert-2', name: 'HOD', domain: 'CERTIFICATE', order: 1, escalationMinutes: 60,
    assignments: [
      { id: 'ma-6', userId: 'mu-14', roleId: 'mr-cert-2', user: mockSearchUsers[13] }
    ]
  },
  {
    id: 'mr-cert-3', name: 'Student Section', domain: 'CERTIFICATE', order: 2, escalationMinutes: 60,
    assignments: [
      { id: 'ma-7', userId: 'mu-6', roleId: 'mr-cert-3', user: mockSearchUsers[5] },
      { id: 'ma-8', userId: 'mu-7', roleId: 'mr-cert-3', user: mockSearchUsers[6] }
    ]
  },
  {
    id: 'mr-cert-4', name: 'Dean', domain: 'CERTIFICATE', order: 3, escalationMinutes: 60,
    assignments: [
      { id: 'ma-9', userId: 'mu-13', roleId: 'mr-cert-4', user: mockSearchUsers[12] }
    ]
  },
  {
    id: 'mr-hm-1', name: 'Caretaker', domain: 'HOSTEL_MAINTENANCE', order: 0, escalationMinutes: 60,
    assignments: [
      { id: 'ma-10', userId: 'mu-12', roleId: 'mr-hm-1', user: mockSearchUsers[11] }
    ]
  },
  {
    id: 'mr-hm-2', name: 'Warden', domain: 'HOSTEL_MAINTENANCE', order: 1, escalationMinutes: 60,
    assignments: [
      { id: 'ma-11', userId: 'mu-11', roleId: 'mr-hm-2', user: mockSearchUsers[10] }
    ]
  },
  {
    id: 'mr-hm-3', name: 'Superintendent', domain: 'HOSTEL_MAINTENANCE', order: 2, escalationMinutes: 60,
    assignments: [
      { id: 'ma-12', userId: 'mu-15', roleId: 'mr-hm-3', user: mockSearchUsers[14] }
    ]
  },
  {
    id: 'mr-gr-1', name: 'Faculty/Advisor', domain: 'GRIEVANCE', order: 0, escalationMinutes: 60,
    assignments: [
      { id: 'ma-13', userId: 'mu-8', roleId: 'mr-gr-1', user: mockSearchUsers[7] }
    ]
  },
  {
    id: 'mr-gr-2', name: 'HOD', domain: 'GRIEVANCE', order: 1, escalationMinutes: 60,
    assignments: [
      { id: 'ma-14', userId: 'mu-14', roleId: 'mr-gr-2', user: mockSearchUsers[13] }
    ]
  },
  {
    id: 'mr-gr-3', name: 'Committee', domain: 'GRIEVANCE', order: 2, escalationMinutes: 60,
    assignments: [
      { id: 'ma-15', userId: 'mu-9', roleId: 'mr-gr-3', user: mockSearchUsers[8] },
      { id: 'ma-16', userId: 'mu-10', roleId: 'mr-gr-3', user: mockSearchUsers[9] }
    ]
  },
  {
    id: 'mr-gr-4', name: 'Dean', domain: 'GRIEVANCE', order: 3, escalationMinutes: 60,
    assignments: [
      { id: 'ma-17', userId: 'mu-13', roleId: 'mr-gr-4', user: mockSearchUsers[12] }
    ]
  }
];

export const getMockRoles = () => {
  return [...mockAdminRoles];
};

export const searchMockUsers = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockSearchUsers.filter(u => 
    u.username.toLowerCase().includes(lowerQuery) || 
    u.displayName.toLowerCase().includes(lowerQuery)
  );
};

export const addMockRoleMember = (roleId: string, username: string) => {
  const user = mockSearchUsers.find(u => u.username === username);
  if (!user) throw new Error("User not found");
  
  const roleIndex = mockAdminRoles.findIndex(r => r.id === roleId);
  if (roleIndex === -1) throw new Error("Role not found");
  
  // check if already added
  if (mockAdminRoles[roleIndex].assignments.some(a => a.userId === user.id)) {
    throw new Error("User already assigned to this role");
  }

  const newAssignment = {
    id: `ma-auto-${Date.now()}`,
    userId: user.id,
    roleId,
    user: { ...user }
  };
  
  mockAdminRoles[roleIndex].assignments.push(newAssignment);
  return { success: true };
};

export const removeMockRoleMember = (roleId: string, userId: string) => {
  const roleIndex = mockAdminRoles.findIndex(r => r.id === roleId);
  if (roleIndex === -1) throw new Error("Role not found");
  
  mockAdminRoles[roleIndex].assignments = mockAdminRoles[roleIndex].assignments.filter(a => a.userId !== userId);
  return { success: true };
};

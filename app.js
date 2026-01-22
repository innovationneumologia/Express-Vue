// app.js - COMPLETE BACKEND
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// Enable CORS for all origins during development
app.use(cors());
app.use(express.json());

// Use YOUR Supabase credentials
const SUPABASE_URL = 'https://vssmguzuvekkecbmwcjw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXb-vXw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Permission System - Copied from your Vue code
const PermissionSystem = {
  resources: {
    medical_staff: { name: 'Medical Staff', actions: ['create', 'read', 'update', 'delete', 'export'] },
    training_units: { name: 'Training Units', actions: ['create', 'read', 'update', 'delete', 'assign'] },
    resident_rotations: { name: 'Resident Rotations', actions: ['create', 'read', 'update', 'delete', 'extend'] },
    placements: { name: 'Placements', actions: ['create', 'read', 'update', 'delete', 'drag_drop'] },
    daily_operations: { name: 'Daily Operations', actions: ['read', 'update', 'alert'] },
    oncall_schedule: { name: 'On-call Schedule', actions: ['create', 'read', 'update', 'delete', 'override'] },
    leave_requests: { name: 'Leave Requests', actions: ['create', 'read', 'update', 'approve', 'reject'] },
    announcements: { name: 'Announcements', actions: ['create', 'read', 'update', 'delete', 'publish'] },
    audit: { name: 'Audit Logs', actions: ['read', 'export', 'clear'] },
    system: { name: 'System Settings', actions: ['read', 'update', 'admin'] }
  },

  roles: {
    system_admin: {
      name: 'System Administrator',
      level: 'full',
      permissions: {
        medical_staff: { create: true, read: true, update: true, delete: true, export: true },
        training_units: { create: true, read: true, update: true, delete: true, assign: true },
        resident_rotations: { create: true, read: true, update: true, delete: true, extend: true },
        placements: { create: true, read: true, update: true, delete: true, drag_drop: true },
        daily_operations: { read: true, update: true, alert: true },
        oncall_schedule: { create: true, read: true, update: true, delete: true, override: true },
        leave_requests: { create: true, read: true, update: true, approve: true, reject: true },
        announcements: { create: true, read: true, update: true, delete: true, publish: true },
        audit: { read: true, export: true, clear: true },
        system: { read: true, update: true, admin: true }
      }
    },
    department_head: {
      name: 'Head of Department',
      level: 'full',
      permissions: {
        medical_staff: { create: true, read: true, update: true, delete: false, export: true },
        training_units: { create: true, read: true, update: true, delete: false, assign: true },
        resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
        placements: { create: true, read: true, update: true, delete: false, drag_drop: true },
        daily_operations: { read: true, update: true, alert: true },
        oncall_schedule: { create: true, read: true, update: true, delete: false, override: true },
        leave_requests: { create: true, read: true, update: true, approve: true, reject: true },
        announcements: { create: true, read: true, update: true, delete: true, publish: true },
        audit: { read: true, export: true, clear: false },
        system: { read: true, update: false, admin: false }
      }
    },
    resident_manager: {
      name: 'Resident Manager',
      level: 'write',
      permissions: {
        medical_staff: { create: true, read: true, update: true, delete: false, export: false },
        training_units: { create: true, read: true, update: true, delete: false, assign: true },
        resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
        placements: { create: true, read: true, update: true, delete: false, drag_drop: true },
        daily_operations: { read: true, update: true, alert: false },
        oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
        leave_requests: { create: true, read: true, update: false, approve: false, reject: false },
        announcements: { create: false, read: true, update: false, delete: false, publish: false },
        audit: { read: false, export: false, clear: false },
        system: { read: false, update: false, admin: false }
      }
    },
    attending_physician: {
      name: 'Attending Physician',
      level: 'limited',
      permissions: {
        medical_staff: { create: false, read: true, update: false, delete: false, export: false },
        training_units: { create: false, read: true, update: false, delete: false, assign: false },
        resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
        placements: { create: false, read: true, update: false, delete: false, drag_drop: false },
        daily_operations: { read: true, update: false, alert: false },
        oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
        leave_requests: { create: true, read: true, update: false, approve: false, reject: false },
        announcements: { create: false, read: true, update: false, delete: false, publish: false },
        audit: { read: false, export: false, clear: false },
        system: { read: false, update: false, admin: false }
      }
    },
    viewing_doctor: {
      name: 'Viewing Doctor',
      level: 'read',
      permissions: {
        medical_staff: { create: false, read: true, update: false, delete: false, export: false },
        training_units: { create: false, read: true, update: false, delete: false, assign: false },
        resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
        placements: { create: false, read: true, update: false, delete: false, drag_drop: false },
        daily_operations: { read: true, update: false, alert: false },
        oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
        leave_requests: { create: false, read: true, update: false, approve: false, reject: false },
        announcements: { create: false, read: true, update: false, delete: false, publish: false },
        audit: { read: false, export: false, clear: false },
        system: { read: false, update: false, admin: false }
      }
    }
  },

  hasPermission(userRole, resource, action) {
    const role = this.roles[userRole];
    if (!role || !role.permissions[resource]) return false;
    return role.permissions[resource][action] === true;
  }
};

// Helper function to get initials
const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Helper to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Audit logging
const logAudit = async (action, details, resource, userId = null, userName = null) => {
  const logEntry = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    user_id: userId,
    user_name: userName,
    action,
    details,
    resource,
    ip_address: 'backend'
  };
  
  try {
    await supabase.from('audit_logs').insert([logEntry]);
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
};

// 1. AUTHENTICATION ENDPOINTS
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, user_role } = req.body;
    
    // Simple authentication for demo
    const mockUsers = {
      'admin@hospital.org': { role: 'system_admin', name: 'System Administrator', password: 'password123' },
      'head@hospital.org': { role: 'department_head', name: 'Department Head', password: 'password123' },
      'manager@hospital.org': { role: 'resident_manager', name: 'Resident Manager', password: 'password123' },
      'doctor@hospital.org': { role: 'viewing_doctor', name: 'Viewing Doctor', password: 'password123' }
    };
    
    const user = mockUsers[email];
    
    if (!user || password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const userData = {
      id: generateUUID(),
      email: email,
      full_name: user.name,
      user_role: user.role,
      account_status: 'active'
    };
    
    // Log audit
    await logAudit('LOGIN_SUCCESS', `User logged in as ${user.role}`, 'auth', userData.id, user.name);
    
    res.json({
      success: true,
      user: userData,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. MEDICAL STAFF ENDPOINTS
app.get('/api/medical-staff', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('medical_staff')
      .select('*')
      .order('full_name');
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching medical staff:', error);
    res.status(500).json({ error: 'Failed to fetch medical staff' });
  }
});

app.post('/api/medical-staff', async (req, res) => {
  try {
    const staffData = req.body;
    
    // Validate required fields
    if (!staffData.full_name || !staffData.staff_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate staff ID if not provided
    if (!staffData.staff_id) {
      staffData.staff_id = `MD-${Date.now().toString().slice(-6)}`;
    }
    
    staffData.created_at = new Date().toISOString();
    staffData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('medical_staff')
      .insert([staffData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('STAFF_CREATE', `Added: ${staffData.full_name}`, 'medical_staff', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating medical staff:', error);
    res.status(500).json({ error: 'Failed to create medical staff' });
  }
});

app.put('/api/medical-staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('medical_staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('STAFF_UPDATE', `Updated: ${data.full_name}`, 'medical_staff', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating medical staff:', error);
    res.status(500).json({ error: 'Failed to update medical staff' });
  }
});

app.delete('/api/medical-staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: staff } = await supabase
      .from('medical_staff')
      .select('full_name')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('medical_staff')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Log audit
    await logAudit('STAFF_DELETE', `Deleted: ${staff?.full_name || id}`, 'medical_staff', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, message: 'Medical staff deleted' });
  } catch (error) {
    console.error('Error deleting medical staff:', error);
    res.status(500).json({ error: 'Failed to delete medical staff' });
  }
});

// 3. TRAINING UNITS ENDPOINTS
app.get('/api/training-units', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_units')
      .select('*')
      .order('unit_name');
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching training units:', error);
    res.status(500).json({ error: 'Failed to fetch training units' });
  }
});

app.post('/api/training-units', async (req, res) => {
  try {
    const unitData = req.body;
    
    if (!unitData.unit_name) {
      return res.status(400).json({ error: 'Unit name is required' });
    }
    
    unitData.created_at = new Date().toISOString();
    unitData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('training_units')
      .insert([unitData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('UNIT_CREATE', `Added unit: ${unitData.unit_name}`, 'training_units', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating training unit:', error);
    res.status(500).json({ error: 'Failed to create training unit' });
  }
});

// 4. ON-CALL SCHEDULE ENDPOINTS
app.get('/api/oncall-schedule', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('oncall_schedule')
      .select('*')
      .order('duty_date', { ascending: true });
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching on-call schedule:', error);
    res.status(500).json({ error: 'Failed to fetch on-call schedule' });
  }
});

app.post('/api/oncall-schedule', async (req, res) => {
  try {
    const scheduleData = req.body;
    
    if (!scheduleData.duty_date || !scheduleData.primary_physician_id) {
      return res.status(400).json({ error: 'Date and primary physician are required' });
    }
    
    scheduleData.created_at = new Date().toISOString();
    scheduleData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('oncall_schedule')
      .insert([scheduleData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('ONCALL_CREATE', `Scheduled on-call for ${scheduleData.duty_date}`, 'oncall_schedule', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating on-call schedule:', error);
    res.status(500).json({ error: 'Failed to create on-call schedule' });
  }
});

// 5. LEAVE REQUESTS ENDPOINTS
app.get('/api/leave-requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const leaveData = req.body;
    
    // Generate request ID
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3,'0');
    
    const leaveRequest = {
      request_id: `LEAVE-${dateStr}-${random}`,
      staff_member_id: leaveData.staff_member_id,
      leave_category: leaveData.leave_type,
      leave_start_date: leaveData.start_date,
      leave_end_date: leaveData.end_date,
      total_days: leaveData.duration,
      leave_reason: leaveData.reason,
      approval_status: 'pending',
      coverage_required: true,
      coverage_assigned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([leaveRequest])
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('LEAVE_CREATE', `Submitted leave request ${leaveRequest.request_id}`, 'leave_requests', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

app.put('/api/leave-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        approval_status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('LEAVE_APPROVE', `Approved leave request ${data.request_id}`, 'leave_requests', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

// 6. ANNOUNCEMENTS ENDPOINTS
app.get('/api/announcements', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('department_announcements')
      .select('*')
      .lte('publish_start_date', today)
      .or(`publish_end_date.is.null,publish_end_date.gte.${today}`)
      .order('priority_level', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const announcement = req.body;
    
    if (!announcement.announcement_title || !announcement.announcement_content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    announcement.created_at = new Date().toISOString();
    announcement.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('department_announcements')
      .insert([announcement])
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('ANNOUNCEMENT_CREATE', `Published: ${announcement.announcement_title}`, 'announcements', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// 7. RESIDENT ROTATIONS ENDPOINTS
app.get('/api/resident-rotations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_rotations')
      .select('*')
      .order('rotation_start_date', { ascending: false });
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching rotations:', error);
    res.status(500).json({ error: 'Failed to fetch rotations' });
  }
});

app.post('/api/resident-rotations', async (req, res) => {
  try {
    const rotation = req.body;
    
    // Generate rotation ID if not provided
    if (!rotation.rotation_id) {
      const date = new Date();
      rotation.rotation_id = `ROT-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    }
    
    rotation.created_at = new Date().toISOString();
    rotation.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('resident_rotations')
      .insert([rotation])
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await logAudit('ROTATION_CREATE', `Created rotation: ${rotation.rotation_id}`, 'resident_rotations', req.user?.id, req.user?.full_name);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating rotation:', error);
    res.status(500).json({ error: 'Failed to create rotation' });
  }
});

// 8. AUDIT LOGS ENDPOINTS
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// 9. DAILY ASSIGNMENTS ENDPOINTS
app.get('/api/daily-assignments', async (req, res) => {
  try {
    const { date } = req.query;
    const filterDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_assignments')
      .select('*')
      .eq('assignment_date', filterDate)
      .order('start_time');
    
    if (error) throw error;
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching daily assignments:', error);
    res.status(500).json({ error: 'Failed to fetch daily assignments' });
  }
});

// 10. STATISTICS ENDPOINT
app.get('/api/stats', async (req, res) => {
  try {
    // Get medical staff count
    const { data: staffData } = await supabase
      .from('medical_staff')
      .select('id, staff_type, employment_status');
    
    // Get training units count
    const { data: unitData } = await supabase
      .from('training_units')
      .select('id, unit_status');
    
    // Get pending leave requests
    const { data: leaveData } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('approval_status', 'pending');
    
    // Calculate stats
    const stats = {
      totalStaff: staffData?.length || 0,
      activeResidents: staffData?.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active').length || 0,
      attendings: staffData?.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active').length || 0,
      activeUnits: unitData?.filter(u => u.unit_status === 'active').length || 0,
      pendingApprovals: leaveData?.length || 0
    };
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 11. PERMISSION ENDPOINTS
app.get('/api/permissions', async (req, res) => {
  try {
    res.json({
      resources: PermissionSystem.resources,
      roles: PermissionSystem.roles
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// 12. SYSTEM HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('medical_staff')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: {
        medical_staff: 'available',
        training_units: 'available',
        oncall_schedule: 'available',
        leave_requests: 'available',
        announcements: 'available',
        resident_rotations: 'available',
        audit_logs: 'available'
      }
    });
  } catch (error) {
    res.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Supabase connected to: ${SUPABASE_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👤 Test login: admin@hospital.org / password123`);
  console.log(`👥 Available endpoints:`);
  console.log(`   POST /api/login`);
  console.log(`   GET  /api/medical-staff`);
  console.log(`   GET  /api/training-units`);
  console.log(`   GET  /api/oncall-schedule`);
  console.log(`   GET  /api/leave-requests`);
  console.log(`   GET  /api/announcements`);
  console.log(`   GET  /api/resident-rotations`);
  console.log(`   GET  /api/audit-logs`);
  console.log(`   GET  /api/daily-assignments`);
  console.log(`   GET  /api/stats`);
  console.log(`   GET  /api/permissions`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();

// ============ CONFIGURATION ============
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'neumocare-secret-key-change-in-production';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vssmguzuvekkecbmwcjw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU5Mjg1MiwiZXhwIjoyMDg0MTY4ODUyfQ.NjDl_sPWJ-8plBrhkB8qXfQFc4_kFwTv78w3GfHXJYw';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============ MIDDLEWARE ============
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://*.github.io', 'https://*.railway.app'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ AUTHENTICATION & PERMISSION MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Permission system matching frontend
const PERMISSION_SYSTEM = {
  system_admin: {
    medical_staff: ['create', 'read', 'update', 'delete'],
    training_units: ['create', 'read', 'update', 'delete', 'assign'],
    resident_rotations: ['create', 'read', 'update', 'delete', 'extend'],
    oncall_schedule: ['create', 'read', 'update', 'delete'],
    staff_absence: ['create', 'read', 'update', 'delete'],
    communications: ['create', 'read', 'update', 'delete'],
    audit: ['read'],
    system: ['read', 'update'],
    permissions: ['manage'],
    placements: ['create']
  },
  department_head: {
    medical_staff: ['create', 'read', 'update'],
    training_units: ['create', 'read', 'update', 'assign'],
    resident_rotations: ['create', 'read', 'update', 'extend'],
    oncall_schedule: ['create', 'read', 'update'],
    staff_absence: ['create', 'read', 'update', 'delete'],
    communications: ['create', 'read', 'update', 'delete'],
    audit: ['read'],
    system: ['read'],
    placements: ['create']
  },
  resident_manager: {
    medical_staff: ['create', 'read', 'update'],
    training_units: ['create', 'read', 'update', 'assign'],
    resident_rotations: ['create', 'read', 'update', 'extend'],
    oncall_schedule: ['read'],
    staff_absence: ['create', 'read'],
    communications: ['read'],
    placements: ['create']
  },
  attending_physician: {
    medical_staff: ['read'],
    training_units: ['read'],
    resident_rotations: ['read'],
    oncall_schedule: ['read'],
    staff_absence: ['create', 'read']
  },
  viewing_doctor: {
    medical_staff: ['read'],
    training_units: ['read'],
    resident_rotations: ['read'],
    oncall_schedule: ['read'],
    staff_absence: ['read']
  }
};

const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'viewing_doctor';
    
    if (userRole === 'system_admin') return next();
    
    const permissions = PERMISSION_SYSTEM[userRole] || PERMISSION_SYSTEM.viewing_doctor;
    
    if (!permissions[resource] || !permissions[resource].includes(action)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `${resource}.${action}`,
        userRole
      });
    }
    
    next();
  };
};

// ============ AUDIT LOGGING ============
const logAudit = async (user, action, resource, details) => {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: user?.id,
      user_name: user?.full_name || 'System',
      user_role: user?.role || 'system',
      action: action,
      resource: resource,
      details: JSON.stringify(details || {}),
      ip_address: '127.0.0.1',
      user_agent: 'API Server',
      created_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'NeumoCare API'
  });
});

// ============ AUTHENTICATION ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Demo authentication - in production, use proper auth
    if (email === 'admin@neumocare.org' && password === 'password123') {
      // Check if user exists in database
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();
      
      let user;
      
      if (existingUser) {
        user = existingUser;
      } else {
        // Create demo user if doesn't exist
        const { data: newUser } = await supabase
          .from('app_users')
          .insert([{
            email: email,
            full_name: 'System Administrator',
            user_role: 'system_admin',
            department: 'Administration',
            account_status: 'active',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        user = newUser;
      }
      
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.user_role,
          name: user.full_name 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      await logAudit(user, 'LOGIN', 'auth', { email });
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_role: user.user_role,
          department: user.department
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials. Use admin@neumocare.org / password123' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  await logAudit(req.user, 'LOGOUT', 'auth', {});
  res.json({ success: true });
});

// ============ MEDICAL STAFF ROUTES ============
app.get('/api/medical-staff', authenticateToken, checkPermission('medical_staff', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('medical_staff')
      .select('*')
      .order('full_name');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching medical staff:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/medical-staff/:id', authenticateToken, checkPermission('medical_staff', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('medical_staff')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Staff not found' });
  }
});

app.post('/api/medical-staff', authenticateToken, checkPermission('medical_staff', 'create'), async (req, res) => {
  try {
    const staffData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('medical_staff')
      .insert([staffData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'medical_staff', { 
      staff_id: data.id, 
      name: data.full_name 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/medical-staff/:id', authenticateToken, checkPermission('medical_staff', 'update'), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('medical_staff')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'medical_staff', { 
      staff_id: data.id, 
      name: data.full_name 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/medical-staff/:id', authenticateToken, checkPermission('medical_staff', 'delete'), async (req, res) => {
  try {
    // Get staff info for audit log
    const { data: staff } = await supabase
      .from('medical_staff')
      .select('id, full_name')
      .eq('id', req.params.id)
      .single();
    
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    
    const { error } = await supabase
      .from('medical_staff')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    await logAudit(req.user, 'DELETE', 'medical_staff', { 
      staff_id: staff.id, 
      name: staff.full_name 
    });
    
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ DEPARTMENT ROUTES ============
app.get('/api/departments', authenticateToken, checkPermission('system', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/departments', authenticateToken, checkPermission('system', 'update'), async (req, res) => {
  try {
    const deptData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('departments')
      .insert([deptData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'departments', { 
      department_id: data.id, 
      name: data.name 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/departments/:id', authenticateToken, checkPermission('system', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'departments', { 
      department_id: data.id, 
      name: data.name 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/departments/:id', authenticateToken, checkPermission('system', 'update'), async (req, res) => {
  try {
    const { data: dept } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', req.params.id)
      .single();
    
    if (!dept) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    await logAudit(req.user, 'DELETE', 'departments', { 
      department_id: dept.id, 
      name: dept.name 
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ TRAINING UNITS ROUTES ============
app.get('/api/training-units', authenticateToken, checkPermission('training_units', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_units')
      .select('*')
      .order('unit_name');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/training-units', authenticateToken, checkPermission('training_units', 'create'), async (req, res) => {
  try {
    const unitData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('training_units')
      .insert([unitData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'training_units', { 
      unit_id: data.id, 
      name: data.unit_name 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/training-units/:id', authenticateToken, checkPermission('training_units', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_units')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'training_units', { 
      unit_id: data.id, 
      name: data.unit_name 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ RESIDENT ROTATIONS ROUTES ============
app.get('/api/rotations', authenticateToken, checkPermission('resident_rotations', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_rotations')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/rotations', authenticateToken, checkPermission('resident_rotations', 'create'), async (req, res) => {
  try {
    const rotationData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('resident_rotations')
      .insert([rotationData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'resident_rotations', { 
      rotation_id: data.id, 
      resident_id: data.resident_id 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/rotations/:id', authenticateToken, checkPermission('resident_rotations', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_rotations')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'resident_rotations', { 
      rotation_id: data.id 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/rotations/:id', authenticateToken, checkPermission('resident_rotations', 'delete'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('resident_rotations')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    await logAudit(req.user, 'DELETE', 'resident_rotations', { 
      rotation_id: req.params.id 
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ON-CALL SCHEDULE ROUTES ============
app.get('/api/oncall', authenticateToken, checkPermission('oncall_schedule', 'read'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('oncall_schedule')
      .select('*')
      .gte('duty_date', today)
      .order('duty_date')
      .limit(7);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/oncall', authenticateToken, checkPermission('oncall_schedule', 'create'), async (req, res) => {
  try {
    const scheduleData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scheduled_by: req.user.id
    };
    
    const { data, error } = await supabase
      .from('oncall_schedule')
      .insert([scheduleData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'oncall_schedule', { 
      schedule_id: data.id, 
      date: data.duty_date 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/oncall/:id', authenticateToken, checkPermission('oncall_schedule', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('oncall_schedule')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'oncall_schedule', { 
      schedule_id: data.id 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/oncall/:id', authenticateToken, checkPermission('oncall_schedule', 'delete'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('oncall_schedule')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    await logAudit(req.user, 'DELETE', 'oncall_schedule', { 
      schedule_id: req.params.id 
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ STAFF ABSENCE ROUTES ============
app.get('/api/absences', authenticateToken, checkPermission('staff_absence', 'read'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .gte('leave_end_date', today)
      .order('leave_start_date');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/absences', authenticateToken, checkPermission('staff_absence', 'create'), async (req, res) => {
  try {
    const absenceData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      requested_by: req.user.id
    };
    
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([absenceData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'staff_absence', { 
      absence_id: data.id, 
      staff_id: data.staff_member_id 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/absences/:id', authenticateToken, checkPermission('staff_absence', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'staff_absence', { 
      absence_id: data.id 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/absences/:id/approve', authenticateToken, checkPermission('staff_absence', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ 
        approval_status: 'approved',
        approved_by: req.user.id,
        updated_at: new Date().toISOString() 
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'APPROVE', 'staff_absence', { 
      absence_id: data.id 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/absences/:id', authenticateToken, checkPermission('staff_absence', 'delete'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    await logAudit(req.user, 'DELETE', 'staff_absence', { 
      absence_id: req.params.id 
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANNOUNCEMENTS ROUTES ============
app.get('/api/announcements', authenticateToken, checkPermission('communications', 'read'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('department_announcements')
      .select('*')
      .lte('publish_start_date', today)
      .or(`publish_end_date.gte.${today},publish_end_date.is.null`)
      .order('publish_start_date', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/announcements', authenticateToken, checkPermission('communications', 'create'), async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      created_by: req.user.id,
      created_by_name: req.user.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('department_announcements')
      .insert([announcementData])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'CREATE', 'announcements', { 
      announcement_id: data.id, 
      title: data.announcement_title 
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SYSTEM SETTINGS ROUTES ============
app.get('/api/settings', authenticateToken, checkPermission('system', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Return default settings if none exist
    const defaultSettings = {
      hospital_name: 'NeumoCare Hospital',
      max_residents_per_unit: 10,
      default_rotation_duration: 12,
      enable_audit_logging: true,
      require_mfa: false,
      maintenance_mode: false,
      notifications_enabled: true,
      absence_notifications: true,
      announcement_notifications: true
    };
    
    res.json({ 
      success: true, 
      data: data || defaultSettings 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/settings', authenticateToken, checkPermission('system', 'update'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    await logAudit(req.user, 'UPDATE', 'system_settings', {});
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ AUDIT LOGS ROUTES ============
app.get('/api/audit-logs', authenticateToken, checkPermission('audit', 'read'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ STATISTICS ROUTES ============
app.get('/api/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get counts in parallel
    const [
      activeStaff,
      activeResidents,
      todayOnCall,
      activeAbsences,
      totalAnnouncements,
      pendingAbsences
    ] = await Promise.all([
      supabase.from('medical_staff').select('id', { count: 'exact', head: true }).eq('employment_status', 'active'),
      supabase.from('medical_staff').select('id', { count: 'exact', head: true }).eq('staff_type', 'medical_resident').eq('employment_status', 'active'),
      supabase.from('oncall_schedule').select('id', { count: 'exact', head: true }).eq('duty_date', today),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).lte('leave_start_date', today).gte('leave_end_date', today).eq('approval_status', 'approved'),
      supabase.from('department_announcements').select('id', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending')
    ]);
    
    res.json({
      success: true,
      data: {
        totalStaff: activeStaff.count || 0,
        activeResidents: activeResidents.count || 0,
        todayOnCall: todayOnCall.count || 0,
        activeAbsences: activeAbsences.count || 0,
        totalAnnouncements: totalAnnouncements.count || 0,
        pendingRequests: pendingAbsences.count || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ BULK OPERATIONS ============
app.post('/api/bulk/assign-residents', authenticateToken, checkPermission('training_units', 'assign'), async (req, res) => {
  try {
    const { resident_ids, training_unit_id, start_date, duration_weeks, supervisor_id } = req.body;
    
    if (!resident_ids || !Array.isArray(resident_ids) || resident_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No residents selected' });
    }
    
    const endDate = new Date(start_date);
    endDate.setDate(endDate.getDate() + (duration_weeks * 7));
    
    const rotations = resident_ids.map(residentId => ({
      resident_id: residentId,
      training_unit_id,
      start_date,
      end_date: endDate.toISOString().split('T')[0],
      supervisor_id: supervisor_id || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('resident_rotations')
      .insert(rotations)
      .select();
    
    if (error) throw error;
    
    await logAudit(req.user, 'BULK_CREATE', 'resident_rotations', {
      count: rotations.length,
      unit_id: training_unit_id
    });
    
    res.json({ 
      success: true, 
      data,
      message: `Successfully assigned ${rotations.length} residents` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ERROR HANDLING MIDDLEWARE ============
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║    NeumoCare Hospital Management System API           ║
║    Server running on port ${PORT}                          ║
║    Environment: ${process.env.NODE_ENV || 'development'}                     ║
║    Supabase URL: ${SUPABASE_URL.substring(0, 30)}... ║
╚═══════════════════════════════════════════════════════╝
  `);
});

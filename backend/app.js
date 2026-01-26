// backend/app.js - PURE BACKEND API SERVER ONLY
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ SUPABASE CLIENT ============
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vssmguzuvekkecbmwcjw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXv-vXw';
const JWT_SECRET = process.env.JWT_SECRET || 'neumocare-hospital-secret-key-2024';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// ============ TABLE NAMES ============
const TABLES = {
    USERS: 'app_users',
    MEDICAL_STAFF: 'medical_staff',
    DEPARTMENTS: 'departments',
    CLINICAL_UNITS: 'clinical_units',
    TRAINING_UNITS: 'training_units',
    RESIDENT_ROTATIONS: 'resident_rotations',
    STAFF_ABSENCES: 'leave_requests',
    ONCALL_SCHEDULE: 'oncall_schedule',
    ANNOUNCEMENTS: 'department_announcements',
    AUDIT_LOGS: 'audit_logs',
    SYSTEM_SETTINGS: 'system_settings',
    SYSTEM_ROLES: 'system_roles'
};

// ============ MIDDLEWARE ============
app.use(helmet({
    contentSecurityPolicy: false // Will be set properly for production
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
});
app.use('/api/', apiLimiter);

// ============ AUTHENTICATION MIDDLEWARE ============
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication token required' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify user exists
        const { data: user, error } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// ============ AUDIT LOGGING ============
const logAuditEvent = async (userId, action, resource, details = {}) => {
    try {
        const auditLog = {
            user_id: userId,
            action: action,
            details: JSON.stringify(details),
            resource: resource,
            ip_address: '127.0.0.1',
            user_agent: 'API',
            created_at: new Date().toISOString()
        };

        await supabase
            .from(TABLES.AUDIT_LOGS)
            .insert([auditLog]);
    } catch (error) {
        console.error('Audit logging error:', error);
    }
};

// ============ API ROUTES ============

// 1. AUTHENTICATION
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Demo login
        if (email === 'admin@neumocare.org' && password === 'password123') {
            const { data: user, error } = await supabase
                .from(TABLES.USERS)
                .select('*')
                .eq('email', email)
                .single();

            let userData;
            if (error || !user) {
                // Create demo user
                userData = {
                    id: 'usr_' + Date.now(),
                    email: email,
                    full_name: 'System Administrator',
                    user_role: 'system_admin',
                    department: 'Administration',
                    account_status: 'active',
                    created_at: new Date().toISOString()
                };

                await supabase
                    .from(TABLES.USERS)
                    .insert([userData]);
            } else {
                userData = user;
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: userData.id, 
                    email: userData.email, 
                    role: userData.user_role,
                    name: userData.full_name 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            await logAuditEvent(userData.id, 'LOGIN', 'auth', { email });

            res.json({
                success: true,
                token,
                user: {
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    user_role: userData.user_role,
                    department: userData.department
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// 2. MEDICAL STAFF
app.get('/api/medical-staff', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .select('*')
            .order('full_name');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff' });
    }
});

app.post('/api/medical-staff', authenticate, async (req, res) => {
    try {
        const staffData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .insert([staffData])
            .select()
            .single();

        if (error) throw error;

        await logAuditEvent(req.user.id, 'CREATE', 'medical_staff', { id: data.id });
        
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create staff' });
    }
});

app.put('/api/medical-staff/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const staffData = { 
            ...req.body,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .update(staffData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await logAuditEvent(req.user.id, 'UPDATE', 'medical_staff', { id });
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update staff' });
    }
});

app.delete('/api/medical-staff/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'medical_staff', { id });
        
        res.json({ success: true, message: 'Staff deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete staff' });
    }
});

// 3. DEPARTMENTS
app.get('/api/departments', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.DEPARTMENTS)
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch departments' });
    }
});

app.post('/api/departments', authenticate, async (req, res) => {
    try {
        const deptData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.DEPARTMENTS)
            .insert([deptData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'departments', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create department' });
    }
});

// 4. TRAINING UNITS
app.get('/api/training-units', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .select('*')
            .order('unit_name');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training units' });
    }
});

app.post('/api/training-units', authenticate, async (req, res) => {
    try {
        const unitData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .insert([unitData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'training_units', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create training unit' });
    }
});

// 5. RESIDENT ROTATIONS
app.get('/api/rotations', authenticate, async (req, res) => {
    try {
        const { status, resident_id } = req.query;
        let query = supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .select('*')
            .order('start_date', { ascending: false });

        if (status) query = query.eq('status', status);
        if (resident_id) query = query.eq('resident_id', resident_id);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rotations' });
    }
});

app.post('/api/rotations', authenticate, async (req, res) => {
    try {
        const rotationData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .insert([rotationData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'resident_rotations', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create rotation' });
    }
});

// 6. ON-CALL SCHEDULE
app.get('/api/on-call', authenticate, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = supabase
            .from(TABLES.ONCALL_SCHEDULE)
            .select('*')
            .order('duty_date');

        if (start_date) query = query.gte('duty_date', start_date);
        if (end_date) query = query.lte('duty_date', end_date);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
    }
});

app.post('/api/on-call', authenticate, async (req, res) => {
    try {
        const scheduleData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.ONCALL_SCHEDULE)
            .insert([scheduleData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'oncall_schedule', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create schedule' });
    }
});

// 7. STAFF ABSENCES
app.get('/api/absences', authenticate, async (req, res) => {
    try {
        const { status, staff_id } = req.query;
        let query = supabase
            .from(TABLES.STAFF_ABSENCES)
            .select('*')
            .order('leave_start_date', { ascending: false });

        if (status) query = query.eq('approval_status', status);
        if (staff_id) query = query.eq('staff_member_id', staff_id);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch absences' });
    }
});

app.post('/api/absences', authenticate, async (req, res) => {
    try {
        const absenceData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.STAFF_ABSENCES)
            .insert([absenceData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'staff_absence', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create absence' });
    }
});

// 8. ANNOUNCEMENTS
app.get('/api/announcements', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from(TABLES.ANNOUNCEMENTS)
            .select('*')
            .lte('publish_start_date', today)
            .or(`publish_end_date.gte.${today},publish_end_date.is.null`)
            .order('publish_start_date', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
});

app.post('/api/announcements', authenticate, async (req, res) => {
    try {
        const announcementData = { 
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.ANNOUNCEMENTS)
            .insert([announcementData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'announcements', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create announcement' });
    }
});

// 9. SYSTEM SETTINGS
app.get('/api/settings', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.SYSTEM_SETTINGS)
            .select('*')
            .limit(1)
            .single();

        if (error) {
            // Default settings
            const defaultSettings = {
                hospital_name: 'NeumoCare Hospital',
                max_residents_per_unit: 10,
                default_rotation_duration: 12,
                enable_audit_logging: true,
                require_mfa: false,
                maintenance_mode: false,
                notifications_enabled: true
            };
            return res.json({ success: true, data: defaultSettings });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

app.put('/api/settings', authenticate, async (req, res) => {
    try {
        const settingsData = { 
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Check if exists
        const { data: existing } = await supabase
            .from(TABLES.SYSTEM_SETTINGS)
            .select('id')
            .limit(1)
            .single();

        let result;
        if (existing) {
            // Update
            const { data, error } = await supabase
                .from(TABLES.SYSTEM_SETTINGS)
                .update(settingsData)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Create
            settingsData.created_at = new Date().toISOString();
            const { data, error } = await supabase
                .from(TABLES.SYSTEM_SETTINGS)
                .insert([settingsData])
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        await logAuditEvent(req.user.id, 'UPDATE', 'system_settings', { id: result.id });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// 10. STATISTICS
app.get('/api/stats', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Parallel queries for performance
        const [
            staffCount,
            residentCount,
            todayOnCall,
            activeAbsences,
            activeRotations,
            pendingAbsences
        ] = await Promise.all([
            supabase
                .from(TABLES.MEDICAL_STAFF)
                .select('*', { count: 'exact', head: true })
                .eq('employment_status', 'active'),
            supabase
                .from(TABLES.MEDICAL_STAFF)
                .select('*', { count: 'exact', head: true })
                .eq('staff_type', 'medical_resident')
                .eq('employment_status', 'active'),
            supabase
                .from(TABLES.ONCALL_SCHEDULE)
                .select('*', { count: 'exact', head: true })
                .eq('duty_date', today),
            supabase
                .from(TABLES.STAFF_ABSENCES)
                .select('*', { count: 'exact', head: true })
                .lte('leave_start_date', today)
                .gte('leave_end_date', today)
                .eq('approval_status', 'approved'),
            supabase
                .from(TABLES.RESIDENT_ROTATIONS)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active'),
            supabase
                .from(TABLES.STAFF_ABSENCES)
                .select('*', { count: 'exact', head: true })
                .eq('approval_status', 'pending')
        ]);

        const stats = {
            total_staff: staffCount.count || 0,
            active_residents: residentCount.count || 0,
            today_on_call: todayOnCall.count || 0,
            active_absences: activeAbsences.count || 0,
            active_rotations: activeRotations.count || 0,
            pending_requests: pendingAbsences.count || 0,
            timestamp: new Date().toISOString()
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

// 11. AUDIT LOGS
app.get('/api/audit-logs', authenticate, async (req, res) => {
    try {
        const { start_date, end_date, action, user_id } = req.query;
        let query = supabase
            .from(TABLES.AUDIT_LOGS)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);
        if (action) query = query.eq('action', action);
        if (user_id) query = query.eq('user_id', user_id);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
});

// 12. HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        const { error } = await supabase
            .from(TABLES.USERS)
            .select('count')
            .limit(1);

        res.json({
            status: error ? 'degraded' : 'healthy',
            service: 'NeumoCare Hospital API',
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            database: error ? 'disconnected' : 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            message: 'Service unavailable',
            timestamp: new Date().toISOString()
        });
    }
});

// ============ ERROR HANDLING ============
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║      NeumoCare Hospital Management System API v2.0       ║
║                   Server is running!                     ║
╠══════════════════════════════════════════════════════════╣
║ Port: ${PORT.toString().padEnd(48)}║
║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(42)}║
║ Health Check: http://localhost:${PORT}/api/health${' '.repeat(20)}║
║ API Base: http://localhost:${PORT}/api${' '.repeat(28)}║
║ Supabase: ${SUPABASE_URL.split('//')[1].padEnd(44)}║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

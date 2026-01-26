// backend/app.js - COMPLETE REST API BACKEND
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
    SYSTEM_ROLES: 'system_roles',
    DOCUMENTS: 'rotation_documents',
    EVALUATIONS: 'evaluations',
    COMPETENCIES: 'competencies',
    MILESTONES: 'rotation_milestones',
    NOTIFICATIONS: 'notifications',
    PATIENTS: 'patients',
    APPOINTMENTS: 'appointments'
};



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

// ============ PERMISSION MIDDLEWARE ============
const PermissionSystem = {
    roles: {
        system_admin: {
            name: 'System Administrator',
            permissions: {
                medical_staff: { create: true, read: true, update: true, delete: true },
                training_units: { create: true, read: true, update: true, delete: true, assign: true },
                resident_rotations: { create: true, read: true, update: true, delete: true, extend: true },
                oncall_schedule: { create: true, read: true, update: true, delete: true },
                staff_absence: { create: true, read: true, update: true, delete: true },
                communications: { create: true, read: true, update: true, delete: true },
                audit: { read: true },
                system: { read: true, update: true },
                permissions: { manage: true },
                placements: { create: true }
            }
        },
        department_head: {
            name: 'Head of Department',
            permissions: {
                medical_staff: { create: true, read: true, update: true, delete: false },
                training_units: { create: true, read: true, update: true, delete: false, assign: true },
                resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
                oncall_schedule: { create: true, read: true, update: true, delete: false },
                staff_absence: { create: true, read: true, update: true, delete: true },
                communications: { create: true, read: true, update: true, delete: true },
                audit: { read: true },
                system: { read: true, update: false },
                permissions: { manage: false },
                placements: { create: true }
            }
        },
        resident_manager: {
            name: 'Resident Manager',
            permissions: {
                medical_staff: { create: true, read: true, update: true, delete: false },
                training_units: { create: true, read: true, update: true, delete: false, assign: true },
                resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
                oncall_schedule: { create: false, read: true, update: false, delete: false },
                staff_absence: { create: true, read: true, update: false, delete: false },
                communications: { create: false, read: true, update: false, delete: false },
                audit: { read: false },
                system: { read: false, update: false },
                permissions: { manage: false },
                placements: { create: true }
            }
        },
        attending_physician: {
            name: 'Attending Physician',
            permissions: {
                medical_staff: { create: false, read: true, update: false, delete: false },
                training_units: { create: false, read: true, update: false, delete: false, assign: false },
                resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
                oncall_schedule: { create: false, read: true, update: false, delete: false },
                staff_absence: { create: true, read: true, update: false, delete: false },
                communications: { create: false, read: true, update: false, delete: false },
                audit: { read: false },
                system: { read: false, update: false },
                permissions: { manage: false },
                placements: { create: false }
            }
        },
        viewing_doctor: {
            name: 'Viewing Doctor',
            permissions: {
                medical_staff: { create: false, read: true, update: false, delete: false },
                training_units: { create: false, read: true, update: false, delete: false, assign: false },
                resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
                oncall_schedule: { create: false, read: true, update: false, delete: false },
                staff_absence: { create: false, read: true, update: false, delete: false },
                communications: { create: false, read: true, update: false, delete: false },
                audit: { read: false },
                system: { read: false, update: false },
                permissions: { manage: false },
                placements: { create: false }
            }
        }
    },

    hasPermission(userRole, resource, action) {
        const role = this.roles[userRole];
        if (!role || !role.permissions[resource]) return false;
        return role.permissions[resource][action] === true;
    }
};

const authorize = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.user_role === 'system_admin') {
            return next();
        }

        if (!PermissionSystem.hasPermission(req.user.user_role, resource, action)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
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

// ============ VALIDATION FUNCTIONS ============
const Validators = {
    required: (value, field) => {
        if (!value || value.toString().trim() === '') {
            throw new Error(`${field} is required`);
        }
    },
    
    email: (value, field) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error(`${field} must be a valid email address`);
        }
    },
    
    date: (value, field) => {
        if (value && isNaN(new Date(value).getTime())) {
            throw new Error(`${field} must be a valid date`);
        }
    },
    
    validate: (data, rules) => {
        const errors = [];
        for (const [field, rule] of Object.entries(rules)) {
            try {
                if (Array.isArray(rule)) {
                    rule.forEach(r => {
                        if (typeof r === 'function') r(data[field], field);
                    });
                } else if (typeof rule === 'function') {
                    rule(data[field], field);
                }
            } catch (error) {
                errors.push(error.message);
            }
        }
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        return true;
    }
};

// ============ API ROUTES ============

// 1. HEALTH CHECK
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
            database: error ? 'disconnected' : 'connected',
            tables: Object.keys(TABLES)
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            message: 'Service unavailable',
            timestamp: new Date().toISOString()
        });
    }
});

// 2. AUTHENTICATION
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        Validators.required(email, 'Email');
        Validators.required(password, 'Password');
        Validators.email(email, 'Email');

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

app.post('/api/auth/logout', authenticate, async (req, res) => {
    try {
        await logAuditEvent(req.user.id, 'LOGOUT', 'auth', {});
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
});

// 3. MEDICAL STAFF MANAGEMENT
app.get('/api/medical-staff', authenticate, authorize('medical_staff', 'read'), async (req, res) => {
    try {
        const { staff_type, employment_status, department_id } = req.query;
        
        let query = supabase
            .from(TABLES.MEDICAL_STAFF)
            .select('*')
            .order('full_name');

        if (staff_type) query = query.eq('staff_type', staff_type);
        if (employment_status) query = query.eq('employment_status', employment_status);
        if (department_id) query = query.eq('department_id', department_id);

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch medical staff' });
    }
});

app.get('/api/medical-staff/:id', authenticate, authorize('medical_staff', 'read'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Medical staff not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch medical staff' });
    }
});

app.post('/api/medical-staff', authenticate, authorize('medical_staff', 'create'), async (req, res) => {
    try {
        const staffData = req.body;
        
        // Validation
        Validators.validate(staffData, {
            full_name: [Validators.required],
            professional_email: [Validators.required, Validators.email],
            staff_type: [Validators.required]
        });

        const staffWithTimestamps = { 
            ...staffData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .insert([staffWithTimestamps])
            .select()
            .single();

        if (error) throw error;

        await logAuditEvent(req.user.id, 'CREATE', 'medical_staff', { id: data.id });
        
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create medical staff' });
    }
});

app.put('/api/medical-staff/:id', authenticate, authorize('medical_staff', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const staffData = req.body;

        const staffWithTimestamps = { 
            ...staffData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .update(staffWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Medical staff not found' });
        }

        await logAuditEvent(req.user.id, 'UPDATE', 'medical_staff', { id });
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update medical staff' });
    }
});

app.delete('/api/medical-staff/:id', authenticate, authorize('medical_staff', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'medical_staff', { id });
        
        res.json({ success: true, message: 'Medical staff deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete medical staff' });
    }
});

// 4. DEPARTMENT MANAGEMENT
app.get('/api/departments', authenticate, authorize('system', 'read'), async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = supabase
            .from(TABLES.DEPARTMENTS)
            .select('*')
            .order('name');

        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch departments' });
    }
});

app.get('/api/departments/:id', authenticate, authorize('system', 'read'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from(TABLES.DEPARTMENTS)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch department' });
    }
});

app.post('/api/departments', authenticate, authorize('system', 'update'), async (req, res) => {
    try {
        const deptData = req.body;
        
        Validators.validate(deptData, {
            name: [Validators.required],
            code: [Validators.required]
        });

        const deptWithTimestamps = { 
            ...deptData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.DEPARTMENTS)
            .insert([deptWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'departments', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create department' });
    }
});

app.put('/api/departments/:id', authenticate, authorize('system', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const deptData = req.body;

        const deptWithTimestamps = { 
            ...deptData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.DEPARTMENTS)
            .update(deptWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'departments', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update department' });
    }
});

app.delete('/api/departments/:id', authenticate, authorize('system', 'update'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.DEPARTMENTS)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'departments', { id });
        res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete department' });
    }
});

// 5. CLINICAL UNITS MANAGEMENT
app.get('/api/clinical-units', authenticate, authorize('system', 'read'), async (req, res) => {
    try {
        const { department_id, unit_type, status } = req.query;
        
        let query = supabase
            .from(TABLES.CLINICAL_UNITS)
            .select('*')
            .order('name');

        if (department_id) query = query.eq('department_id', department_id);
        if (unit_type) query = query.eq('unit_type', unit_type);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch clinical units' });
    }
});

app.post('/api/clinical-units', authenticate, authorize('system', 'update'), async (req, res) => {
    try {
        const unitData = req.body;
        
        Validators.validate(unitData, {
            name: [Validators.required],
            department_id: [Validators.required]
        });

        const unitWithTimestamps = { 
            ...unitData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.CLINICAL_UNITS)
            .insert([unitWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'clinical_units', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create clinical unit' });
    }
});

app.put('/api/clinical-units/:id', authenticate, authorize('system', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const unitData = req.body;

        const unitWithTimestamps = { 
            ...unitData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.CLINICAL_UNITS)
            .update(unitWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Clinical unit not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'clinical_units', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update clinical unit' });
    }
});

// 6. TRAINING UNITS MANAGEMENT
app.get('/api/training-units', authenticate, authorize('training_units', 'read'), async (req, res) => {
    try {
        const { department_id, status } = req.query;
        
        let query = supabase
            .from(TABLES.TRAINING_UNITS)
            .select('*')
            .order('unit_name');

        if (department_id) query = query.eq('department_id', department_id);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training units' });
    }
});

app.get('/api/training-units/:id', authenticate, authorize('training_units', 'read'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Training unit not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training unit' });
    }
});

app.post('/api/training-units', authenticate, authorize('training_units', 'create'), async (req, res) => {
    try {
        const unitData = req.body;
        
        Validators.validate(unitData, {
            unit_name: [Validators.required],
            unit_code: [Validators.required],
            department_id: [Validators.required]
        });

        const unitWithTimestamps = { 
            ...unitData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .insert([unitWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'training_units', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create training unit' });
    }
});

app.put('/api/training-units/:id', authenticate, authorize('training_units', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const unitData = req.body;

        const unitWithTimestamps = { 
            ...unitData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .update(unitWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Training unit not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'training_units', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update training unit' });
    }
});

app.delete('/api/training-units/:id', authenticate, authorize('training_units', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'training_units', { id });
        res.json({ success: true, message: 'Training unit deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete training unit' });
    }
});

// 7. RESIDENT ROTATIONS MANAGEMENT
app.get('/api/resident-rotations', authenticate, authorize('resident_rotations', 'read'), async (req, res) => {
    try {
        const { status, resident_id, training_unit_id, supervisor_id, start_date, end_date } = req.query;
        
        let query = supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .select('*')
            .order('start_date', { ascending: false });

        if (status) query = query.eq('status', status);
        if (resident_id) query = query.eq('resident_id', resident_id);
        if (training_unit_id) query = query.eq('training_unit_id', training_unit_id);
        if (supervisor_id) query = query.eq('supervisor_id', supervisor_id);
        if (start_date) query = query.gte('start_date', start_date);
        if (end_date) query = query.lte('end_date', end_date);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rotations' });
    }
});

app.post('/api/resident-rotations', authenticate, authorize('resident_rotations', 'create'), async (req, res) => {
    try {
        const rotationData = req.body;
        
        Validators.validate(rotationData, {
            resident_id: [Validators.required],
            training_unit_id: [Validators.required],
            start_date: [Validators.required, Validators.date],
            end_date: [Validators.required, Validators.date]
        });

        // Validate date logic
        if (new Date(rotationData.end_date) <= new Date(rotationData.start_date)) {
            throw new Error('End date must be after start date');
        }

        const rotationWithTimestamps = { 
            ...rotationData,
            rotation_id: `ROT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .insert([rotationWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'resident_rotations', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create rotation' });
    }
});

app.post('/api/resident-rotations/bulk', authenticate, authorize('resident_rotations', 'create'), async (req, res) => {
    try {
        const { rotations } = req.body;
        
        if (!Array.isArray(rotations) || rotations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rotations array is required'
            });
        }

        // Validate each rotation
        rotations.forEach((rotation, index) => {
            try {
                Validators.validate(rotation, {
                    resident_id: [Validators.required],
                    training_unit_id: [Validators.required],
                    start_date: [Validators.required, Validators.date],
                    end_date: [Validators.required, Validators.date]
                });

                if (new Date(rotation.end_date) <= new Date(rotation.start_date)) {
                    throw new Error(`Rotation ${index}: End date must be after start date`);
                }
            } catch (error) {
                throw new Error(`Rotation ${index}: ${error.message}`);
            }
        });

        const rotationsWithTimestamps = rotations.map(rotation => ({
            ...rotation,
            rotation_id: `ROT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .insert(rotationsWithTimestamps)
            .select();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'BULK_CREATE', 'resident_rotations', { count: rotations.length });
        res.status(201).json({ success: true, data, count: rotations.length });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create bulk rotations' });
    }
});

app.put('/api/resident-rotations/:id', authenticate, authorize('resident_rotations', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const rotationData = req.body;

        // If dates are being updated, validate them
        if (rotationData.start_date && rotationData.end_date) {
            if (new Date(rotationData.end_date) <= new Date(rotationData.start_date)) {
                throw new Error('End date must be after start date');
            }
        }

        const rotationWithTimestamps = { 
            ...rotationData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .update(rotationWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Rotation not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'resident_rotations', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update rotation' });
    }
});

app.delete('/api/resident-rotations/:id', authenticate, authorize('resident_rotations', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'resident_rotations', { id });
        res.json({ success: true, message: 'Rotation deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete rotation' });
    }
});

// 8. ON-CALL SCHEDULE MANAGEMENT
app.get('/api/oncall-schedule', authenticate, authorize('oncall_schedule', 'read'), async (req, res) => {
    try {
        const { start_date, end_date, status, primary_physician_id } = req.query;
        
        let query = supabase
            .from(TABLES.ONCALL_SCHEDULE)
            .select('*')
            .order('duty_date');

        if (start_date) query = query.gte('duty_date', start_date);
        if (end_date) query = query.lte('duty_date', end_date);
        if (status) query = query.eq('status', status);
        if (primary_physician_id) query = query.eq('primary_physician_id', primary_physician_id);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch on-call schedule' });
    }
});

app.post('/api/oncall-schedule', authenticate, authorize('oncall_schedule', 'create'), async (req, res) => {
    try {
        const scheduleData = req.body;
        
        Validators.validate(scheduleData, {
            duty_date: [Validators.required, Validators.date],
            primary_physician_id: [Validators.required]
        });

        const scheduleWithTimestamps = { 
            ...scheduleData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            scheduled_by: req.user.id
        };

        const { data, error } = await supabase
            .from(TABLES.ONCALL_SCHEDULE)
            .insert([scheduleWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'oncall_schedule', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create on-call schedule' });
    }
});

app.put('/api/oncall-schedule/:id', authenticate, authorize('oncall_schedule', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const scheduleData = req.body;

        const scheduleWithTimestamps = { 
            ...scheduleData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.ONCALL_SCHEDULE)
            .update(scheduleWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'On-call schedule not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'oncall_schedule', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update on-call schedule' });
    }
});

app.delete('/api/oncall-schedule/:id', authenticate, authorize('oncall_schedule', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.ONCALL_SCHEDULE)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'oncall_schedule', { id });
        res.json({ success: true, message: 'On-call schedule deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete on-call schedule' });
    }
});

// 9. STAFF ABSENCES MANAGEMENT
app.get('/api/staff-absences', authenticate, authorize('staff_absence', 'read'), async (req, res) => {
    try {
        const { status, staff_member_id, start_date, end_date } = req.query;
        
        let query = supabase
            .from(TABLES.STAFF_ABSENCES)
            .select('*')
            .order('leave_start_date', { ascending: false });

        if (status) query = query.eq('approval_status', status);
        if (staff_member_id) query = query.eq('staff_member_id', staff_member_id);
        if (start_date) query = query.gte('leave_start_date', start_date);
        if (end_date) query = query.lte('leave_end_date', end_date);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch absences' });
    }
});

app.post('/api/staff-absences', authenticate, authorize('staff_absence', 'create'), async (req, res) => {
    try {
        const absenceData = req.body;
        
        Validators.validate(absenceData, {
            staff_member_id: [Validators.required],
            leave_category: [Validators.required],
            leave_start_date: [Validators.required, Validators.date],
            leave_end_date: [Validators.required, Validators.date]
        });

        // Validate date logic
        if (new Date(absenceData.leave_end_date) <= new Date(absenceData.leave_start_date)) {
            throw new Error('End date must be after start date');
        }

        const absenceWithTimestamps = { 
            ...absenceData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            submitted_by: req.user.id
        };

        const { data, error } = await supabase
            .from(TABLES.STAFF_ABSENCES)
            .insert([absenceWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'staff_absence', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create absence' });
    }
});

app.put('/api/staff-absences/:id', authenticate, authorize('staff_absence', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const absenceData = req.body;

        // If dates are being updated, validate them
        if (absenceData.leave_start_date && absenceData.leave_end_date) {
            if (new Date(absenceData.leave_end_date) <= new Date(absenceData.leave_start_date)) {
                throw new Error('End date must be after start date');
            }
        }

        const absenceWithTimestamps = { 
            ...absenceData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.STAFF_ABSENCES)
            .update(absenceWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Absence not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'staff_absence', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update absence' });
    }
});

app.delete('/api/staff-absences/:id', authenticate, authorize('staff_absence', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.STAFF_ABSENCES)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'staff_absence', { id });
        res.json({ success: true, message: 'Absence deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete absence' });
    }
});

// 10. ANNOUNCEMENTS MANAGEMENT
app.get('/api/announcements', authenticate, authorize('communications', 'read'), async (req, res) => {
    try {
        const { active_only = 'true', priority_level } = req.query;
        
        let query = supabase
            .from(TABLES.ANNOUNCEMENTS)
            .select('*')
            .order('publish_start_date', { ascending: false });

        if (active_only === 'true') {
            const today = new Date().toISOString().split('T')[0];
            query = query
                .lte('publish_start_date', today)
                .or(`publish_end_date.gte.${today},publish_end_date.is.null`);
        }

        if (priority_level) query = query.eq('priority_level', priority_level);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
});

app.post('/api/announcements', authenticate, authorize('communications', 'create'), async (req, res) => {
    try {
        const announcementData = req.body;
        
        Validators.validate(announcementData, {
            announcement_title: [Validators.required],
            announcement_content: [Validators.required],
            publish_start_date: [Validators.required, Validators.date]
        });

        const announcementWithTimestamps = { 
            ...announcementData,
            announcement_id: `ANN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_by: req.user.id,
            created_by_name: req.user.full_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.ANNOUNCEMENTS)
            .insert([announcementWithTimestamps])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'CREATE', 'announcements', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create announcement' });
    }
});

app.put('/api/announcements/:id', authenticate, authorize('communications', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const announcementData = req.body;

        const announcementWithTimestamps = { 
            ...announcementData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.ANNOUNCEMENTS)
            .update(announcementWithTimestamps)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        
        await logAuditEvent(req.user.id, 'UPDATE', 'announcements', { id });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update announcement' });
    }
});

app.delete('/api/announcements/:id', authenticate, authorize('communications', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from(TABLES.ANNOUNCEMENTS)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAuditEvent(req.user.id, 'DELETE', 'announcements', { id });
        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete announcement' });
    }
});

// 11. SYSTEM SETTINGS
app.get('/api/system-settings', authenticate, authorize('system', 'read'), async (req, res) => {
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

app.put('/api/system-settings', authenticate, authorize('system', 'update'), async (req, res) => {
    try {
        const settingsData = req.body;

        const settingsWithTimestamps = { 
            ...settingsData,
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
                .update(settingsWithTimestamps)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Create
            settingsWithTimestamps.created_at = new Date().toISOString();
            const { data, error } = await supabase
                .from(TABLES.SYSTEM_SETTINGS)
                .insert([settingsWithTimestamps])
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

// 12. AUDIT LOGS
app.get('/api/audit-logs', authenticate, authorize('audit', 'read'), async (req, res) => {
    try {
        const { start_date, end_date, action, user_id, resource } = req.query;
        
        let query = supabase
            .from(TABLES.AUDIT_LOGS)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);
        if (action) query = query.eq('action', action);
        if (user_id) query = query.eq('user_id', user_id);
        if (resource) query = query.eq('resource', resource);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
});

// 13. SYSTEM ROLES (PERMISSIONS)
app.get('/api/system-roles', authenticate, authorize('permissions', 'manage'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.SYSTEM_ROLES)
            .select('*');

        if (error) throw error;
        
        // If no roles in DB, return default roles
        if (!data || data.length === 0) {
            const defaultRoles = Object.entries(PermissionSystem.roles).map(([key, value]) => ({
                role_key: key,
                role_name: value.name,
                permissions: value.permissions,
                created_at: new Date().toISOString()
            }));
            return res.json({ success: true, data: defaultRoles });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch system roles' });
    }
});

app.put('/api/system-roles/:role_key', authenticate, authorize('permissions', 'manage'), async (req, res) => {
    try {
        const { role_key } = req.params;
        const { permissions } = req.body;

        if (!permissions) {
            return res.status(400).json({ success: false, message: 'Permissions are required' });
        }

        const roleData = {
            role_key,
            role_name: PermissionSystem.roles[role_key]?.name || role_key,
            permissions,
            updated_at: new Date().toISOString()
        };

        // Check if role exists
        const { data: existing } = await supabase
            .from(TABLES.SYSTEM_ROLES)
            .select('id')
            .eq('role_key', role_key)
            .single();

        let result;
        if (existing) {
            // Update
            const { data, error } = await supabase
                .from(TABLES.SYSTEM_ROLES)
                .update(roleData)
                .eq('role_key', role_key)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Create
            roleData.created_at = new Date().toISOString();
            const { data, error } = await supabase
                .from(TABLES.SYSTEM_ROLES)
                .insert([roleData])
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        await logAuditEvent(req.user.id, 'UPDATE_ROLE', 'system_roles', { role_key });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update role permissions' });
    }
});

// 14. USERS MANAGEMENT
app.get('/api/users', authenticate, authorize('system', 'read'), async (req, res) => {
    try {
        const { role, status } = req.query;
        
        let query = supabase
            .from(TABLES.USERS)
            .select('*')
            .order('full_name');

        if (role) query = query.eq('user_role', role);
        if (status) query = query.eq('account_status', status);

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

app.put('/api/users/:id/role', authenticate, authorize('permissions', 'manage'), async (req, res) => {
    try {
        const { id } = req.params;
        const { user_role } = req.body;

        if (!user_role) {
            return res.status(400).json({ success: false, message: 'User role is required' });
        }

        // Validate role exists
        if (!PermissionSystem.roles[user_role]) {
            return res.status(400).json({ success: false, message: 'Invalid user role' });
        }

        const { data, error } = await supabase
            .from(TABLES.USERS)
            .update({ 
                user_role,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await logAuditEvent(req.user.id, 'UPDATE_USER_ROLE', 'users', { user_id: id, new_role: user_role });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
});

// 15. STATISTICS & DASHBOARD
app.get('/api/stats/dashboard', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Parallel queries for performance
        const [
            staffCount,
            residentCount,
            todayOnCall,
            activeAbsences,
            activeRotations,
            pendingAbsences,
            upcomingRotations,
            recentAnnouncements
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
                .eq('approval_status', 'pending'),
            supabase
                .from(TABLES.RESIDENT_ROTATIONS)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'upcoming'),
            supabase
                .from(TABLES.ANNOUNCEMENTS)
                .select('*', { count: 'exact', head: true })
                .eq('priority_level', 'high')
                .is('publish_end_date', null)
        ]);

        const stats = {
            total_staff: staffCount.count || 0,
            active_residents: residentCount.count || 0,
            today_on_call: todayOnCall.count || 0,
            active_absences: activeAbsences.count || 0,
            active_rotations: activeRotations.count || 0,
            pending_requests: pendingAbsences.count || 0,
            upcoming_rotations: upcomingRotations.count || 0,
            high_priority_announcements: recentAnnouncements.count || 0,
            timestamp: new Date().toISOString()
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

// 16. SEARCH ENDPOINT
app.get('/api/search', authenticate, async (req, res) => {
    try {
        const { q: query, type = 'all', limit = 20 } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query must be at least 2 characters' 
            });
        }

        const searchTerm = `%${query}%`;
        let results = [];

        if (type === 'all' || type === 'medical_staff') {
            const { data: staffResults } = await supabase
                .from(TABLES.MEDICAL_STAFF)
                .select('id, full_name, staff_type, professional_email, staff_id')
                .or(`full_name.ilike.${searchTerm},professional_email.ilike.${searchTerm},staff_id.ilike.${searchTerm}`)
                .limit(limit);
            
            if (staffResults) {
                results.push(...staffResults.map(r => ({ 
                    ...r, 
                    type: 'medical_staff',
                    display: `${r.full_name} (${r.staff_type})`
                })));
            }
        }

        if (type === 'all' || type === 'departments') {
            const { data: deptResults } = await supabase
                .from(TABLES.DEPARTMENTS)
                .select('id, name, code')
                .or(`name.ilike.${searchTerm},code.ilike.${searchTerm}`)
                .limit(limit);
            
            if (deptResults) {
                results.push(...deptResults.map(r => ({ 
                    ...r, 
                    type: 'department',
                    display: `${r.name} (${r.code})`
                })));
            }
        }

        if (type === 'all' || type === 'training_units') {
            const { data: unitResults } = await supabase
                .from(TABLES.TRAINING_UNITS)
                .select('id, unit_name, unit_code')
                .or(`unit_name.ilike.${searchTerm},unit_code.ilike.${searchTerm}`)
                .limit(limit);
            
            if (unitResults) {
                results.push(...unitResults.map(r => ({ 
                    ...r, 
                    type: 'training_unit',
                    display: `${r.unit_name} (${r.unit_code})`
                })));
            }
        }

        res.json({ 
            success: true, 
            data: results,
            count: results.length 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to search' });
    }
});

// 17. EXPORT ENDPOINTS
app.get('/api/export/:resource', authenticate, authorize('system', 'read'), async (req, res) => {
    try {
        const { resource } = req.params;
        const { format = 'json', start_date, end_date } = req.query;

        if (!TABLES[resource.toUpperCase()]) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        let query = supabase
            .from(TABLES[resource.toUpperCase()])
            .select('*');

        if (start_date) {
            const dateField = resource === 'audit_logs' ? 'created_at' : 'created_at';
            query = query.gte(dateField, start_date);
        }
        if (end_date) {
            const dateField = resource === 'audit_logs' ? 'created_at' : 'created_at';
            query = query.lte(dateField, end_date);
        }

        const { data, error } = await query;

        if (error) throw error;

        await logAuditEvent(req.user.id, 'EXPORT', resource, { format, count: data?.length || 0 });

        if (format === 'csv') {
            // Convert to CSV
            if (!data || data.length === 0) {
                return res.status(404).json({ success: false, message: 'No data to export' });
            }
            
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
                ).join(',')
            ).join('\n');
            
            const csv = `${headers}\n${rows}`;
            
            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename=${resource}_${new Date().toISOString().split('T')[0]}.csv`);
            return res.send(csv);
        }

        // Default to JSON
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to export data' });
    }
});

// 18. QUICK OPERATIONS
app.post('/api/quick/placement', authenticate, authorize('placements', 'create'), async (req, res) => {
    try {
        const { resident_id, training_unit_id, start_date, duration_weeks = 4, supervisor_id, notes } = req.body;
        
        Validators.validate({ resident_id, training_unit_id, start_date }, {
            resident_id: [Validators.required],
            training_unit_id: [Validators.required],
            start_date: [Validators.required, Validators.date]
        });

        const endDate = new Date(start_date);
        endDate.setDate(endDate.getDate() + (duration_weeks * 7));

        const rotationData = {
            rotation_id: `ROT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            resident_id,
            training_unit_id,
            start_date,
            end_date: endDate.toISOString().split('T')[0],
            supervisor_id,
            status: 'active',
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .insert([rotationData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'QUICK_PLACEMENT', 'resident_rotations', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create quick placement' });
    }
});

app.post('/api/quick/absence', authenticate, authorize('staff_absence', 'create'), async (req, res) => {
    try {
        const { staff_member_id, leave_category, start_date, end_date, notes } = req.body;
        
        Validators.validate({ staff_member_id, leave_category, start_date, end_date }, {
            staff_member_id: [Validators.required],
            leave_category: [Validators.required],
            start_date: [Validators.required, Validators.date],
            end_date: [Validators.required, Validators.date]
        });

        if (new Date(end_date) <= new Date(start_date)) {
            throw new Error('End date must be after start date');
        }

        const absenceData = {
            staff_member_id,
            leave_category,
            leave_start_date: start_date,
            leave_end_date: end_date,
            approval_status: 'pending',
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            submitted_by: req.user.id
        };

        const { data, error } = await supabase
            .from(TABLES.STAFF_ABSENCES)
            .insert([absenceData])
            .select()
            .single();

        if (error) throw error;
        
        await logAuditEvent(req.user.id, 'QUICK_ABSENCE', 'staff_absence', { id: data.id });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create quick absence' });
    }
});

// 19. REPORTS
app.get('/api/reports/rotations-summary', authenticate, authorize('resident_rotations', 'read'), async (req, res) => {
    try {
        const { start_date, end_date, department_id } = req.query;
        
        // Get rotations with related data
        let query = supabase
            .from(TABLES.RESIDENT_ROTATIONS)
            .select(`
                *,
                resident:medical_staff!resident_id(full_name, training_level, department),
                unit:training_units!training_unit_id(unit_name, department_id),
                supervisor:medical_staff!supervisor_id(full_name)
            `)
            .order('start_date', { ascending: false });

        if (start_date) query = query.gte('start_date', start_date);
        if (end_date) query = query.lte('end_date', end_date);

        const { data, error } = await query;

        if (error) throw error;

        // Filter by department if specified
        let filteredData = data;
        if (department_id) {
            filteredData = data.filter(rotation => 
                rotation.unit?.department_id === department_id
            );
        }

        // Generate summary
        const summary = {
            total: filteredData.length,
            by_status: filteredData.reduce((acc, rotation) => {
                acc[rotation.status] = (acc[rotation.status] || 0) + 1;
                return acc;
            }, {}),
            by_unit: filteredData.reduce((acc, rotation) => {
                const unitName = rotation.unit?.unit_name || 'Unknown';
                acc[unitName] = (acc[unitName] || 0) + 1;
                return acc;
            }, {}),
            by_department: filteredData.reduce((acc, rotation) => {
                const dept = rotation.resident?.department || 'Unknown';
                acc[dept] = (acc[dept] || 0) + 1;
                return acc;
            }, {}),
            rotations: filteredData
        };

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate rotation report' });
    }
});

app.get('/api/reports/staff-utilization', authenticate, authorize('medical_staff', 'read'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const startDate = start_date || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];

        // Get staff with their rotations and absences
        const { data: staff, error: staffError } = await supabase
            .from(TABLES.MEDICAL_STAFF)
            .select(`
                *,
                rotations:resident_rotations!resident_id(*),
                absences:staff_absences!staff_member_id(*)
            `)
            .eq('employment_status', 'active');

        if (staffError) throw staffError;

        const utilization = staff.map(employee => {
            const rotationsInPeriod = employee.rotations?.filter(r => 
                r.start_date >= startDate && r.start_date <= endDate
            ) || [];
            
            const absencesInPeriod = employee.absences?.filter(a => 
                a.leave_start_date >= startDate && a.leave_end_date <= endDate &&
                a.approval_status === 'approved'
            ) || [];
            
            const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
            const absenceDays = absencesInPeriod.reduce((total, absence) => {
                const start = new Date(absence.leave_start_date);
                const end = new Date(absence.leave_end_date);
                return total + ((end - start) / (1000 * 60 * 60 * 24)) + 1;
            }, 0);
            
            const utilizationRate = ((totalDays - absenceDays) / totalDays) * 100;

            return {
                staff_id: employee.id,
                full_name: employee.full_name,
                staff_type: employee.staff_type,
                department: employee.department,
                total_rotations: rotationsInPeriod.length,
                total_absence_days: absenceDays,
                total_days_in_period: totalDays,
                utilization_rate: Math.round(utilizationRate * 100) / 100,
                status: utilizationRate > 90 ? 'High' : utilizationRate > 70 ? 'Medium' : 'Low'
            };
        });

        res.json({ success: true, data: utilization });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate staff utilization report' });
    }
});

// 20. MISCELLANEOUS ENDPOINTS
app.get('/api/available/physicians', authenticate, async (req, res) => {
    try {
        const { date, exclude_absences = 'true' } = req.query;
        
        let query = supabase
            .from(TABLES.MEDICAL_STAFF)
            .select('*')
            .eq('employment_status', 'active')
            .in('staff_type', ['attending_physician', 'fellow'])
            .order('full_name');

        const { data: physicians, error } = await query;

        if (error) throw error;

        // Filter out physicians who are absent on the given date
        let availablePhysicians = physicians;
        if (exclude_absences === 'true' && date) {
            const { data: absences } = await supabase
                .from(TABLES.STAFF_ABSENCES)
                .select('staff_member_id')
                .lte('leave_start_date', date)
                .gte('leave_end_date', date)
                .eq('approval_status', 'approved');

            if (absences) {
                const absentIds = absences.map(a => a.staff_member_id);
                availablePhysicians = physicians.filter(p => !absentIds.includes(p.id));
            }
        }

        res.json({ success: true, data: availablePhysicians });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch available physicians' });
    }
});

app.get('/api/available/residents', authenticate, async (req, res) => {
    try {
        const { date } = req.query;
        
        let query = supabase
            .from(TABLES.MEDICAL_STAFF)
            .select('*')
            .eq('employment_status', 'active')
            .eq('staff_type', 'medical_resident')
            .order('full_name');

        const { data: residents, error } = await query;

        if (error) throw error;

        // Filter out residents who are already assigned on the given date
        let availableResidents = residents;
        if (date) {
            const { data: existingRotations } = await supabase
                .from(TABLES.RESIDENT_ROTATIONS)
                .select('resident_id')
                .lte('start_date', date)
                .gte('end_date', date)
                .eq('status', 'active');

            if (existingRotations) {
                const assignedIds = existingRotations.map(r => r.resident_id);
                availableResidents = residents.filter(r => !assignedIds.includes(r.id));
            }
        }

        res.json({ success: true, data: availableResidents });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch available residents' });
    }
});

app.get('/api/capacity/units', authenticate, async (req, res) => {
    try {
        const { data: units, error } = await supabase
            .from(TABLES.TRAINING_UNITS)
            .select(`
                *,
                rotations:resident_rotations!training_unit_id(count),
                department:departments!department_id(name)
            `)
            .eq('status', 'active');

        if (error) throw error;

        const capacity = units.map(unit => ({
            unit_id: unit.id,
            unit_name: unit.unit_name,
            unit_code: unit.unit_code,
            department: unit.department?.name || 'Unknown',
            max_capacity: unit.max_capacity || 10,
            current_count: unit.rotations?.[0]?.count || 0,
            available_spots: (unit.max_capacity || 10) - (unit.rotations?.[0]?.count || 0),
            utilization_rate: ((unit.rotations?.[0]?.count || 0) / (unit.max_capacity || 10)) * 100,
            status: (unit.rotations?.[0]?.count || 0) >= (unit.max_capacity || 10) ? 'Full' : 
                   ((unit.rotations?.[0]?.count || 0) >= (unit.max_capacity || 10) * 0.8) ? 'High' : 'Available'
        }));

        res.json({ success: true, data: capacity });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unit capacity' });
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
╔═══════════════════════════════════════════════════════════════════════════════════════════╗
║                         NeumoCare Hospital Management System API v2.0                     ║
║                                      Server is running!                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════════════╣
║ Port: ${PORT.toString().padEnd(72)}║
║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(66)}║
║ Health Check: http://localhost:${PORT}/api/health${' '.repeat(44)}║
║ API Base: http://localhost:${PORT}/api${' '.repeat(52)}║
║ Supabase: ${SUPABASE_URL.split('//')[1].padEnd(68)}║
╠═══════════════════════════════════════════════════════════════════════════════════════════╣
║                                 AVAILABLE ENDPOINTS                                      ║
╠═══════════════════════════════════════════════════════════════════════════════════════════╣
║ 🔐 AUTH:       POST /api/auth/login                                                      ║
║                POST /api/auth/logout                                                     ║
║ 👥 STAFF:      GET  /api/medical-staff                                                   ║
║                POST /api/medical-staff                                                   ║
║                PUT  /api/medical-staff/:id                                               ║
║ 🏥 DEPARTMENTS:GET  /api/departments                                                     ║
║                POST /api/departments                                                     ║
║ 🏢 UNITS:      GET  /api/clinical-units                                                  ║
║                GET  /api/training-units                                                  ║
🛠️ ROTATIONS:  GET  /api/resident-rotations                                              ║
║                POST /api/resident-rotations                                              ║
║                POST /api/resident-rotations/bulk                                         ║
║ 📞 ON-CALL:    GET  /api/oncall-schedule                                                 ║
║ 🏖️ ABSENCES:   GET  /api/staff-absences                                                  ║
║ 📢 ANNOUNCEMENTS:GET /api/announcements                                                  ║
║ ⚙️ SETTINGS:   GET  /api/system-settings                                                 ║
║ 📊 STATS:      GET  /api/stats/dashboard                                                 ║
║ 📋 AUDIT:      GET  /api/audit-logs                                                      ║
║ 🔑 ROLES:      GET  /api/system-roles                                                    ║
║ 👤 USERS:      GET  /api/users                                                           ║
║ 🔍 SEARCH:     GET  /api/search                                                          ║
║ 📤 EXPORT:     GET  /api/export/:resource                                                ║
║ ⚡ QUICK:       POST /api/quick/placement                                                 ║
║ 📈 REPORTS:    GET  /api/reports/rotations-summary                                       ║
║ 💪 CAPACITY:   GET  /api/capacity/units                                                  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

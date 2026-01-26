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

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
    'https://innovationneumologia.github.io',
    'https://innovationneumologia.github.io/',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5500'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
};

// ============ MIDDLEWARE ============
app.use(helmet({
    contentSecurityPolicy: false
}));

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

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

// 1. HEALTH CHECK - Allow without authentication
app.get('/api/health', async (req, res) => {
    try {
        // Add CORS headers explicitly
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        
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
            tables: Object.keys(TABLES),
            cors: 'enabled'
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

// ... [Rest of your API routes remain the same as before]

// For the remaining routes, keep them exactly as you have them in your original code
// The key change is the CORS configuration at the top

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
    
    // Ensure CORS headers are present even on errors
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
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
║ Health Check: https://neumocare.up.railway.app/api/health${' '.repeat(26)}║
║ Frontend: https://innovationneumologia.github.io${' '.repeat(42)}║
║ CORS: Enabled for GitHub Pages${' '.repeat(55)}║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

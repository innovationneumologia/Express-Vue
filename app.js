// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM ============
// PRODUCTION SYSTEM - COMPLETE IMPLEMENTATION WITH DATABASE MAPPING
// VERSION 3.0 - FULLY SYNCHRONIZED WITH SUPABASE STRUCTURE
// =======================================================

// Wait for page to fully load
window.addEventListener('load', async function() {
    console.log('Page fully loaded, initializing NeumoCare Hospital Management System v3.0...');
    
    try {
        // ============ ERROR BOUNDARY: CHECK VUE AVAILABILITY ============
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js failed to load. Please refresh the page.');
        }
        
        console.log('Vue.js loaded successfully:', Vue.version);
        
        // Get Vue functions
        const { createApp, ref, reactive, computed, onMounted, watch } = Vue;
        
        // ============ SUPABASE CLIENT SETUP WITH ERROR HANDLING ============
        const SUPABASE_URL = 'https://vssmguzuvekkecbmwcjw.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXb-vXw';
        
        let supabaseClient;
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
            
            // Test connection
            const { error } = await supabaseClient.from('app_users').select('count').limit(1);
            if (error) {
                console.warn('Supabase connection test warning:', error.message);
            } else {
                console.log('Database connection successful');
            }
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
        
        // ============ DATABASE TABLE NAMES ============
        const TABLE_NAMES = {
            USERS: 'app_users',
            MEDICAL_STAFF: 'medical_staff',
            DEPARTMENTS: 'departments',
            CLINICAL_UNITS: 'clinical_units',
            TRAINING_UNITS: 'training_units',
            RESIDENT_ROTATIONS: 'resident_rotations',
            STAFF_ABSENCES: 'leave_requests',           // CORRECTED: Using leave_requests table
            ONCALL_SCHEDULE: 'oncall_schedule',
            ANNOUNCEMENTS: 'department_announcements',  // CORRECTED: Different table name
            DAILY_ASSIGNMENTS: 'daily_assignments',
            AUDIT_LOGS: 'audit_logs',
            SYSTEM_AUDIT_LOG: 'system_audit_log',
            SYSTEM_SETTINGS: 'system_settings',
            NOTIFICATIONS: 'notifications',
            SYSTEM_ROLES: 'system_roles',
            SYSTEM_PERMISSIONS: 'system_permissions'
        };
        
        // ============ FIELD MAPPING FUNCTIONS ============
        const FieldMappers = {
            // Map frontend field names to database field names
            medicalStaff: {
                toDB: (frontendData) => ({
                    full_name: frontendData.full_name,
                    professional_email: frontendData.professional_email,
                    staff_type: frontendData.staff_type,
                    staff_id: frontendData.staff_id || `MD-${Date.now()}`,
                    resident_category: frontendData.resident_category,
                    training_year: frontendData.training_level ? parseInt(frontendData.training_level.replace('pgy', '')) : null,
                    employment_status: frontendData.employment_status,
                    department_id: frontendData.department_id,
                    specialization: frontendData.specialization,
                    years_experience: frontendData.years_experience,
                    biography: frontendData.biography,
                    date_of_birth: frontendData.date_of_birth,
                    mobile_phone: frontendData.mobile_phone,
                    office_phone: frontendData.office_phone,
                    medical_license: frontendData.medical_license
                }),
                fromDB: (dbData) => ({
                    id: dbData.id,
                    full_name: dbData.full_name,
                    professional_email: dbData.professional_email,
                    staff_type: dbData.staff_type,
                    staff_id: dbData.staff_id,
                    resident_category: dbData.resident_category,
                    training_level: dbData.training_year ? `pgy${dbData.training_year}` : null,
                    employment_status: dbData.employment_status,
                    department_id: dbData.department_id,
                    specialization: dbData.specialization,
                    years_experience: dbData.years_experience,
                    biography: dbData.biography,
                    date_of_birth: dbData.date_of_birth,
                    mobile_phone: dbData.mobile_phone,
                    office_phone: dbData.office_phone,
                    medical_license: dbData.medical_license,
                    created_at: dbData.created_at,
                    updated_at: dbData.updated_at
                })
            },
            
            trainingUnits: {
                toDB: (frontendData) => ({
                    unit_code: frontendData.unit_code || `TU-${Date.now()}`,
                    unit_name: frontendData.unit_name,
                    department_name: frontendData.department_name || 'Unknown',
                    maximum_residents: frontendData.max_capacity,
                    department_id: frontendData.department_id,
                    supervisor_id: frontendData.supervisor_id,
                    max_capacity: frontendData.max_capacity,
                    status: frontendData.status,
                    description: frontendData.description
                }),
                fromDB: (dbData) => ({
                    id: dbData.id,
                    unit_name: dbData.unit_name,
                    unit_code: dbData.unit_code,
                    department_id: dbData.department_id,
                    department_name: dbData.department_name,
                    supervisor_id: dbData.supervisor_id,
                    max_capacity: dbData.maximum_residents || dbData.max_capacity,
                    status: dbData.unit_status || dbData.status,
                    description: dbData.unit_description || dbData.description,
                    current_residents: dbData.current_residents || 0,
                    created_at: dbData.created_at,
                    updated_at: dbData.updated_at
                })
            },
            
            onCallSchedule: {
                toDB: (frontendData) => ({
                    schedule_id: `ONCALL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    duty_date: frontendData.duty_date,
                    shift_type: frontendData.shift_type,
                    primary_physician_id: frontendData.primary_physician_id,
                    backup_physician_id: frontendData.backup_physician_id || null,
                    start_time: frontendData.start_time || '08:00',
                    end_time: frontendData.end_time || '17:00',
                    coverage_notes: frontendData.coverage_notes || '',
                    created_by: frontendData.created_by
                }),
                fromDB: (dbData) => ({
                    id: dbData.id,
                    duty_date: dbData.duty_date,
                    shift_type: dbData.shift_type,
                    primary_physician_id: dbData.primary_physician_id,
                    backup_physician_id: dbData.backup_physician_id,
                    start_time: dbData.start_time,
                    end_time: dbData.end_time,
                    coverage_notes: dbData.coverage_notes,
                    created_by: dbData.created_by,
                    created_at: dbData.created_at,
                    updated_at: dbData.updated_at
                })
            },
            
            staffAbsences: {
                toDB: (frontendData) => ({
                    request_id: `LEAVE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    staff_member_id: frontendData.staff_member_id,
                    leave_category: frontendData.absence_reason,
                    leave_start_date: frontendData.start_date,
                    leave_end_date: frontendData.end_date,
                    leave_reason: frontendData.notes || '',
                    coverage_notes: frontendData.coverage_instructions || '',
                    approval_status: frontendData.status || 'pending_review'
                }),
                fromDB: (dbData) => ({
                    id: dbData.id,
                    staff_member_id: dbData.staff_member_id,
                    absence_reason: dbData.leave_category,
                    start_date: dbData.leave_start_date,
                    end_date: dbData.leave_end_date,
                    notes: dbData.leave_reason,
                    coverage_instructions: dbData.coverage_notes,
                    status: dbData.approval_status,
                    replacement_staff_id: null, // Not in your table structure
                    created_at: dbData.created_at,
                    updated_at: dbData.updated_at
                })
            },
            
            residentRotations: {
                toDB: (frontendData) => ({
                    rotation_id: frontendData.rotation_id || `ROT-${Date.now()}`,
                    resident_id: frontendData.resident_id,
                    training_unit_id: frontendData.training_unit_id,
                    supervising_attending_id: frontendData.supervisor_id,
                    start_date: frontendData.start_date,
                    end_date: frontendData.end_date,
                    rotation_status: frontendData.status,
                    clinical_notes: frontendData.notes || '',
                    supervisor_evaluation: frontendData.goals || ''
                }),
                fromDB: (dbData) => ({
                    id: dbData.id,
                    resident_id: dbData.resident_id,
                    training_unit_id: dbData.training_unit_id,
                    supervisor_id: dbData.supervising_attending_id,
                    start_date: dbData.start_date,
                    end_date: dbData.end_date,
                    status: dbData.rotation_status,
                    goals: dbData.supervisor_evaluation,
                    notes: dbData.clinical_notes,
                    rotation_id: dbData.rotation_id,
                    created_at: dbData.created_at,
                    updated_at: dbData.updated_at
                })
            }
        };
        
        // ============ VALIDATION FUNCTIONS ============
        const Validators = {
            required: (value, field) => {
                if (!value || value.toString().trim() === '') {
                    throw new Error(`${field} is required`);
                }
                return true;
            },
            
            email: (value, field) => {
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    throw new Error(`${field} must be a valid email address`);
                }
                return true;
            },
            
            date: (value, field) => {
                if (value && isNaN(new Date(value).getTime())) {
                    throw new Error(`${field} must be a valid date`);
                }
                return true;
            },
            
            futureDate: (value, field) => {
                if (value && new Date(value) < new Date()) {
                    throw new Error(`${field} must be a future date`);
                }
                return true;
            },
            
            minValue: (value, field, min) => {
                if (value && Number(value) < min) {
                    throw new Error(`${field} must be at least ${min}`);
                }
                return true;
            },
            
            maxValue: (value, field, max) => {
                if (value && Number(value) > max) {
                    throw new Error(`${field} must not exceed ${max}`);
                }
                return true;
            },
            
            phone: (value, field) => {
                if (value && !/^[\d\s\-\+\(\)]{10,20}$/.test(value)) {
                    throw new Error(`${field} must be a valid phone number`);
                }
                return true;
            },
            
            validateForm: (form, rules) => {
                const errors = [];
                for (const [field, rule] of Object.entries(rules)) {
                    try {
                        if (Array.isArray(rule)) {
                            rule.forEach(r => {
                                if (typeof r === 'function') r(form[field], field);
                            });
                        } else if (typeof rule === 'function') {
                            rule(form[field], field);
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
        
        // ============ AUDIT LOGGING SYSTEM ============
        async function logAuditEvent(action, resource, details = {}, userId = null) {
            try {
                const auditLog = {
                    user_id: userId,
                    user_name: 'System',
                    user_role: 'system',
                    action: action,
                    details: JSON.stringify(details),
                    resource: resource,
                    ip_address: '127.0.0.1',
                    user_agent: navigator.userAgent,
                    created_at: new Date().toISOString()
                };
                
                await supabaseClient.from(TABLE_NAMES.AUDIT_LOGS).insert([auditLog]);
            } catch (error) {
                console.error('Audit logging error:', error);
            }
        }
        
        // ============ PERMISSION SYSTEM ============
        const PermissionSystem = {
            resources: {
                medical_staff: { name: 'Medical Staff', actions: ['create', 'read', 'update', 'delete'] },
                training_units: { name: 'Training Units', actions: ['create', 'read', 'update', 'delete', 'assign'] },
                resident_rotations: { name: 'Resident Rotations', actions: ['create', 'read', 'update', 'delete', 'extend'] },
                oncall_schedule: { name: 'On-call Schedule', actions: ['create', 'read', 'update', 'delete'] },
                staff_absence: { name: 'Staff Absence', actions: ['create', 'read', 'update', 'delete'] },
                communications: { name: 'Communications', actions: ['create', 'read', 'update', 'delete'] },
                audit: { name: 'Audit Logs', actions: ['read'] },
                system: { name: 'System Settings', actions: ['read', 'update'] },
                permissions: { name: 'Permissions', actions: ['manage'] },
                placements: { name: 'Placements', actions: ['create'] }
            },

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
        
        // ============ UTILITY FUNCTIONS ============
        const Utils = {
            formatDate: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } catch {
                    return '';
                }
            },
            
            formatDateTime: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch {
                    return '';
                }
            },
            
            formatTimeAgo: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
                    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
                    return Utils.formatDate(dateString);
                } catch {
                    return '';
                }
            },
            
            getInitials: (name) => {
                if (!name) return '??';
                return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            },
            
            generateId: (prefix = 'ID') => {
                return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
            }
        };
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                try {
                    // ============ REACTIVE STATE ============
                    const currentUser = ref(null);
                    const loginForm = reactive({ 
                        email: 'admin@neumocare.org', 
                        password: 'password123', 
                        remember_me: false 
                    });
                    
                    const loading = ref(false);
                    const saving = ref(false);
                    
                    const currentView = ref('login');
                    const sidebarCollapsed = ref(false);
                    const mobileMenuOpen = ref(false);
                    const userMenuOpen = ref(false);
                    const statsSidebarOpen = ref(false);
                    const searchQuery = ref('');
                    const searchScope = ref('All');
                    const searchFilter = ref('all');
                    
                    // ============ FILTER STATES ============
                    const staffFilter = reactive({
                        staff_type: '',
                        employment_status: ''
                    });
                    
                    const rotationFilter = reactive({
                        resident_id: '',
                        status: ''
                    });
                    
                    const absenceFilter = reactive({
                        staff_id: '',
                        status: '',
                        start_date: ''
                    });
                    
                    const auditFilters = reactive({
                        dateRange: '',
                        actionType: '',
                        userId: ''
                    });
                    
                    // ============ MODAL STATES ============
                    const confirmationModal = reactive({
                        show: false,
                        title: '',
                        message: '',
                        icon: 'fa-question-circle',
                        confirmButtonText: 'Confirm',
                        confirmButtonClass: 'btn-primary',
                        onConfirm: null,
                        onCancel: null
                    });
                    
                    const staffDetailsModal = reactive({
                        show: false,
                        staff: null,
                        activeTab: 'personal',
                        stats: {
                            completedRotations: 0,
                            oncallShifts: 0,
                            absenceDays: 0,
                            supervisionCount: 0
                        },
                        currentRotation: '',
                        nextOncall: '',
                        activityHistory: []
                    });
                    
                    const medicalStaffModal = reactive({
                        show: false,
                        mode: 'add',
                        activeTab: 'basic',
                        form: {
                            full_name: '',
                            staff_type: 'medical_resident',
                            staff_id: '',
                            employment_status: 'active',
                            professional_email: '',
                            department_id: '',
                            resident_category: '',
                            training_level: '',
                            specialization: '',
                            years_experience: '',
                            biography: '',
                            office_phone: '',
                            mobile_phone: '',
                            medical_license: '',
                            date_of_birth: ''
                        }
                    });
                    
                    const departmentModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            name: '',
                            code: '',
                            status: 'active',
                            description: '',
                            head_of_department_id: ''
                        }
                    });
                    
                    const clinicalUnitModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            name: '',
                            code: '',
                            department_id: '',
                            unit_type: 'clinical',
                            status: 'active',
                            description: '',
                            supervisor_id: ''
                        }
                    });
                    
                    // IMPORTANT: Training Unit modal matches your database structure
                    const trainingUnitModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            unit_name: '',        // Maps to unit_name in DB
                            unit_code: '',        // Maps to unit_code in DB
                            department_id: '',
                            department_name: '',   // Also needed for DB
                            supervisor_id: '',
                            max_capacity: 10,     // Maps to maximum_residents in DB
                            status: 'active',
                            description: ''
                        }
                    });
                    
                    const rotationModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            resident_id: '',
                            training_unit_id: '',
                            start_date: '',
                            end_date: '',
                            supervisor_id: '',
                            status: 'active',
                            goals: '',
                            notes: ''
                        }
                    });
                    
                    // IMPORTANT: On-call modal matches your database structure
                    const onCallModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            duty_date: new Date().toISOString().split('T')[0],
                            shift_type: 'primary_call',
                            start_time: '08:00',
                            end_time: '17:00',
                            primary_physician_id: '',
                            backup_physician_id: '',
                            coverage_notes: ''
                        }
                    });
                    
                    // IMPORTANT: Absence modal matches your database structure
                    const absenceModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            staff_member_id: '',
                            absence_reason: '',
                            start_date: '',
                            end_date: '',
                            notes: '',
                            replacement_staff_id: '', // Not in your DB, but kept for UI
                            coverage_instructions: ''
                        }
                    });
                    
                    const communicationsModal = reactive({
                        show: false,
                        activeTab: 'announcement',
                        form: {
                            announcement_title: '',
                            announcement_content: '',
                            publish_start_date: '',
                            publish_end_date: '',
                            priority_level: 'medium',
                            target_audience: 'all'
                        },
                        capacity: {
                            er: { current: 0, max: 20, notes: '' },
                            icu: { current: 0, max: 10, notes: '' },
                            overall_notes: ''
                        },
                        quickUpdate: {
                            message: '',
                            priority: 'info',
                            expires: '24',
                            tags: ''
                        }
                    });
                    
                    const quickPlacementModal = reactive({
                        show: false,
                        resident_id: '',
                        training_unit_id: '',
                        start_date: '',
                        duration: 4,
                        supervisor_id: '',
                        notes: ''
                    });
                    
                    const bulkAssignModal = reactive({
                        show: false,
                        selectedResidents: [],
                        training_unit_id: '',
                        start_date: '',
                        duration: 4,
                        supervisor_id: ''
                    });
                    
                    const roleModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            name: '',
                            description: '',
                            permissions: []
                        }
                    });
                    
                    const userProfileModal = reactive({
                        show: false,
                        form: {
                            full_name: '',
                            email: '',
                            phone: '',
                            department_id: '',
                            notifications_enabled: true,
                            absence_notifications: true,
                            announcement_notifications: true
                        }
                    });
                    
                    const systemSettingsModal = reactive({
                        show: false,
                        settings: {
                            hospital_name: 'NeumoCare Hospital',
                            default_department_id: '',
                            max_residents_per_unit: 10,
                            default_rotation_duration: 12,
                            enable_audit_logging: true,
                            require_mfa: false,
                            maintenance_mode: false,
                            notifications_enabled: true,
                            absence_notifications: true,
                            announcement_notifications: true
                        }
                    });
                    
                    const absenceDetailsModal = reactive({
                        show: false,
                        absence: null,
                        activeTab: 'details'
                    });
                    
                    const importExportModal = reactive({
                        show: false,
                        mode: 'import',
                        selectedTable: '',
                        selectedFile: null,
                        exportFormat: 'csv',
                        overwriteExisting: false,
                        skipInvalidRows: true,
                        includeMetadata: true,
                        dateRange: { start: '', end: '' },
                        fieldMapping: []
                    });
                    
                    const rotationDetailsModal = reactive({
                        show: false,
                        rotation: null,
                        activeTab: 'details',
                        milestones: [],
                        competencies: [],
                        documents: [],
                        activity: []
                    });
                    
                    const dashboardCustomizeModal = reactive({
                        show: false,
                        availableWidgets: [
                            { id: 'stats', title: 'Statistics', description: 'Key performance indicators', icon: 'fas fa-chart-line', visible: true },
                            { id: 'oncall', title: 'On-call Schedule', description: 'Today\'s on-call physicians', icon: 'fas fa-phone-alt', visible: true },
                            { id: 'announcements', title: 'Announcements', description: 'Recent department announcements', icon: 'fas fa-bullhorn', visible: true },
                            { id: 'capacity', title: 'Capacity', description: 'Department capacity status', icon: 'fas fa-bed', visible: true },
                            { id: 'alerts', title: 'Alerts', description: 'System alerts and notifications', icon: 'fas fa-exclamation-triangle', visible: true }
                        ],
                        appearance: {
                            cardDensity: 'normal',
                            colorTheme: 'medical',
                            fontSize: 'medium',
                            animationSpeed: 'normal'
                        },
                        notifications: {
                            showAlerts: true,
                            showNotifications: true,
                            autoRefresh: true,
                            refreshInterval: 60
                        }
                    });
                    
                    const advancedSearchModal = reactive({
                        show: false,
                        activeTab: 'medical_staff',
                        filters: {
                            medical_staff: {
                                name: '',
                                staff_type: [],
                                department_id: '',
                                employment_status: '',
                                join_date_start: '',
                                join_date_end: '',
                                training_level: ''
                            },
                            rotations: {
                                resident_name: '',
                                training_unit_id: '',
                                status: '',
                                supervisor_id: '',
                                date_start: '',
                                date_end: '',
                                min_duration: ''
                            }
                        },
                        sort: {
                            medical_staff: {
                                field: 'full_name',
                                order: 'asc'
                            }
                        },
                        display: {
                            medical_staff: {
                                resultsPerPage: 25,
                                showInactive: false
                            }
                        }
                    });
                    
                    // ============ DATA STORES ============
                    const medicalStaff = ref([]);
                    const departments = ref([]);
                    const clinicalUnits = ref([]);
                    const trainingUnits = ref([]);
                    const residentRotations = ref([]);
                    const staffAbsences = ref([]);
                    const onCallSchedule = ref([]);
                    const recentAnnouncements = ref([]);
                    const users = ref([]);
                    const userRoles = ref([]);
                    const auditLogs = ref([]);
                    const systemSettings = ref({});
                    
                    // ============ UI STATE ============
                    const toasts = ref([]);
                    const activeAlerts = ref([]);
                    const staffSearch = ref('');
                    const unreadNotifications = ref(0);
                    
                    // ============ LOADING STATES ============
                    const loadingStats = ref(false);
                    const loadingStaff = ref(false);
                    const loadingDepartments = ref(false);
                    const loadingTrainingUnits = ref(false);
                    const loadingRotations = ref(false);
                    const loadingAbsences = ref(false);
                    const loadingSchedule = ref(false);
                    const loadingAnnouncements = ref(false);
                    const loadingAuditLogs = ref(false);
                    
                    // ============ TOAST SYSTEM ============
                    const showToast = (title, message, type = 'info', duration = 5000) => {
                        const icons = {
                            info: 'fas fa-info-circle', 
                            success: 'fas fa-check-circle',
                            error: 'fas fa-exclamation-circle', 
                            warning: 'fas fa-exclamation-triangle'
                        };
                        const toast = {
                            id: Date.now(),
                            title,
                            message,
                            type,
                            icon: icons[type],
                            duration
                        };
                        toasts.value.push(toast);
                        setTimeout(() => removeToast(toast.id), duration);
                    };

                    const removeToast = (id) => {
                        const index = toasts.value.findIndex(t => t.id === id);
                        if (index > -1) toasts.value.splice(index, 1);
                    };
                    
                    // ============ ALERT SYSTEM ============
                    const dismissAlert = (alertId) => {
                        const index = activeAlerts.value.findIndex(alert => alert.id === alertId);
                        if (index > -1) activeAlerts.value.splice(index, 1);
                    };
                    
                    // ============ CONFIRMATION MODAL ============
                    const showConfirmation = (options) => {
                        Object.assign(confirmationModal, {
                            show: true,
                            title: options.title || 'Confirm Action',
                            message: options.message || 'Are you sure you want to proceed?',
                            icon: options.icon || 'fa-question-circle',
                            confirmButtonText: options.confirmButtonText || 'Confirm',
                            confirmButtonClass: options.confirmButtonClass || 'btn-primary',
                            onConfirm: options.onConfirm || null,
                            onCancel: options.onCancel || null
                        });
                    };

                    const confirmAction = async () => {
                        try {
                            if (confirmationModal.onConfirm) {
                                await confirmationModal.onConfirm();
                            }
                            confirmationModal.show = false;
                        } catch (error) {
                            console.error('Confirmation action error:', error);
                            showToast('Error', error.message, 'error');
                        }
                    };

                    const cancelConfirmation = () => {
                        try {
                            if (confirmationModal.onCancel) {
                                confirmationModal.onCancel();
                            }
                            confirmationModal.show = false;
                        } catch (error) {
                            console.error('Cancel confirmation error:', error);
                        }
                    };
                    
                    // ============ FORMATTING FUNCTIONS ============
                    const formatStaffType = (type) => {
                        const types = { 
                            medical_resident: 'Medical Resident', 
                            attending_physician: 'Attending Physician',
                            fellow: 'Fellow', 
                            nurse_practitioner: 'Nurse Practitioner' 
                        }; 
                        return types[type] || type;
                    };
                    
                    const getUserRoleDisplay = (role) => {
                        const roleNames = {
                            'system_admin': 'System Administrator',
                            'department_head': 'Head of Department',
                            'resident_manager': 'Resident Manager',
                            'attending_physician': 'Attending Physician',
                            'viewing_doctor': 'Viewing Doctor'
                        };
                        return roleNames[role] || role || 'Unknown Role';
                    };
                    
                    const formatEmploymentStatus = (status) => {
                        const statuses = { active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' };
                        return statuses[status] || status;
                    };
                    
                    const getStaffTypeClass = (type) => {
                        const classes = {
                            medical_resident: 'badge-primary',
                            attending_physician: 'badge-success',
                            fellow: 'badge-info',
                            nurse_practitioner: 'badge-warning'
                        };
                        return classes[type] || 'badge-secondary';
                    };
                    
                    const formatTrainingLevel = (level) => {
                        const levels = {
                            pgy1: 'PGY-1',
                            pgy2: 'PGY-2',
                            pgy3: 'PGY-3',
                            pgy4: 'PGY-4',
                            other: 'Other'
                        };
                        return levels[level] || level;
                    };
                    
                    const formatRotationStatus = (status) => {
                        const statuses = {
                            active: 'Active',
                            upcoming: 'Upcoming',
                            completed: 'Completed',
                            cancelled: 'Cancelled'
                        };
                        return statuses[status] || status;
                    };
                    
                    const getRotationStatusClass = (status) => {
                        const classes = {
                            active: 'status-available',
                            upcoming: 'status-oncall',
                            completed: 'status-busy',
                            cancelled: 'status-critical'
                        };
                        return classes[status] || 'badge-secondary';
                    };
                    
                    const formatAbsenceReason = (reason) => {
                        const reasons = {
                            vacation: 'Vacation',
                            sick_leave: 'Sick Leave',
                            conference: 'Conference/Education',
                            personal: 'Personal',
                            maternity_paternity: 'Maternity/Paternity',
                            administrative: 'Administrative Duty',
                            other: 'Other'
                        };
                        return reasons[reason] || reason;
                    };
                    
                    const formatAbsenceStatus = (status) => {
                        const statuses = {
                            pending: 'Pending',
                            approved: 'Approved',
                            rejected: 'Rejected',
                            completed: 'Completed'
                        };
                        return statuses[status] || status;
                    };
                    
                    const getAbsenceStatusClass = (status) => {
                        const classes = {
                            pending: 'status-busy',
                            approved: 'status-available',
                            rejected: 'status-critical',
                            completed: 'status-oncall'
                        };
                        return classes[status] || 'badge-secondary';
                    };
                    
                    const calculateAbsenceDuration = (startDate, endDate) => {
                        try {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            const diffTime = Math.abs(end - start);
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        } catch {
                            return 0;
                        }
                    };
                    
                    const formatTimeRange = (startTime, endTime) => {
                        if (!startTime || !endTime) return '';
                        return `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`;
                    };
                    
                    const formatAuditAction = (action) => {
                        const actions = {
                            create: 'Created',
                            update: 'Updated',
                            delete: 'Deleted',
                            login: 'Logged in',
                            logout: 'Logged out'
                        };
                        return actions[action] || action;
                    };
                    
                    // ============ PERMISSION FUNCTIONS ============
                    const hasPermission = (resource, action) => {
                        if (!currentUser.value) return false;
                        if (currentUser.value.user_role === 'system_admin') return true;
                        return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action);
                    };
                    
                    // ============ DATA RELATIONSHIP FUNCTIONS ============
                    const getDepartmentName = (departmentId) => {
                        if (!departmentId) return 'Unassigned';
                        const department = departments.value.find(d => d.id === departmentId);
                        return department ? department.name : `Department ${departmentId?.substring(0, 8) || 'Unknown'}`;
                    };
                    
                    const getStaffName = (staffId) => {
                        if (!staffId) return 'Unknown';
                        const staff = medicalStaff.value.find(s => s.id === staffId);
                        return staff ? staff.full_name : `Staff ${staffId?.substring(0, 8) || 'Unknown'}`;
                    };
                    
                    // IMPORTANT: Training unit name getter matches your DB structure
                    const getTrainingUnitName = (unitId) => {
                        if (!unitId) return 'Unknown Unit';
                        const unit = trainingUnits.value.find(u => u.id === unitId);
                        return unit ? unit.unit_name : `Unit ${unitId?.substring(0, 8) || 'Unknown'}`;
                    };
                    
                    const getSupervisorName = (supervisorId) => {
                        if (!supervisorId) return 'Not assigned';
                        return getStaffName(supervisorId);
                    };
                    
                    const getResidentName = (residentId) => {
                        return getStaffName(residentId);
                    };
                    
                    const getDepartmentUnits = (departmentId) => {
                        return clinicalUnits.value.filter(unit => unit.department_id === departmentId);
                    };
                    
                    const getUnitResidents = (unitId) => {
                        const rotations = residentRotations.value.filter(rotation => 
                            rotation.training_unit_id === unitId && 
                            rotation.status === 'active'
                        );
                        return rotations.map(rotation => {
                            const resident = medicalStaff.value.find(s => s.id === rotation.resident_id);
                            return resident ? {
                                id: resident.id,
                                full_name: resident.full_name,
                                training_level: resident.training_level
                            } : null;
                        }).filter(r => r !== null);
                    };
                    
                    const getUserName = (userId) => {
                        if (!userId) return 'System';
                        const user = users.value.find(u => u.id === userId);
                        return user ? user.full_name : `User ${userId.substring(0, 8)}`;
                    };
                    
                    // ============ DATA LOADING FUNCTIONS (UPDATED FOR YOUR DB) ============
                    const loadMedicalStaff = async () => {
                        loadingStaff.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.MEDICAL_STAFF)
                                .select('*')
                                .order('full_name');
                            
                            if (error) throw error;
                            
                            // Map database fields to frontend format
                            medicalStaff.value = (data || []).map(staff => 
                                FieldMappers.medicalStaff.fromDB(staff)
                            );
                            
                            console.log('Loaded medical staff:', medicalStaff.value.length, 'records');
                            
                        } catch (error) {
                            console.error('Error loading medical staff:', error);
                            showToast('Error', 'Failed to load medical staff', 'error');
                            medicalStaff.value = [];
                        } finally {
                            loadingStaff.value = false;
                        }
                    };
                    
                    const loadDepartments = async () => {
                        loadingDepartments.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.DEPARTMENTS)
                                .select('*')
                                .order('name');
                            
                            if (error) throw error;
                            departments.value = data || [];
                            console.log('Loaded departments:', departments.value.length, 'records');
                        } catch (error) {
                            console.error('Error loading departments:', error);
                            departments.value = [];
                        } finally {
                            loadingDepartments.value = false;
                        }
                    };
                    
                    const loadClinicalUnits = async () => {
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.CLINICAL_UNITS)
                                .select('*')
                                .order('name');
                            
                            if (error) throw error;
                            clinicalUnits.value = data || [];
                        } catch (error) {
                            console.error('Error loading clinical units:', error);
                            clinicalUnits.value = [];
                        }
                    };
                    
                    // IMPORTANT: Training units loader matches your DB structure
                    const loadTrainingUnits = async () => {
                        loadingTrainingUnits.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.TRAINING_UNITS)
                                .select('*')
                                .order('unit_name');
                            
                            if (error) throw error;
                            
                            // Map database fields to frontend format
                            trainingUnits.value = (data || []).map(unit => 
                                FieldMappers.trainingUnits.fromDB(unit)
                            );
                            
                            console.log('Loaded training units:', trainingUnits.value.length, 'records');
                            
                        } catch (error) {
                            console.error('Error loading training units:', error);
                            trainingUnits.value = [];
                        } finally {
                            loadingTrainingUnits.value = false;
                        }
                    };
                    
                    // IMPORTANT: Resident rotations loader matches your DB structure
                    const loadResidentRotations = async () => {
                        loadingRotations.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                .select('*')
                                .order('start_date', { ascending: false });
                            
                            if (error) throw error;
                            
                            // Map database fields to frontend format
                            residentRotations.value = (data || []).map(rotation => 
                                FieldMappers.residentRotations.fromDB(rotation)
                            );
                            
                            console.log('Loaded resident rotations:', residentRotations.value.length, 'records');
                            
                        } catch (error) {
                            console.error('Error loading resident rotations:', error);
                            residentRotations.value = [];
                        } finally {
                            loadingRotations.value = false;
                        }
                    };
                    
                    // IMPORTANT: Staff absences loader matches your DB structure
                    const loadStaffAbsences = async () => {
                        loadingAbsences.value = true;
                        try {
                            const today = new Date().toISOString().split('T')[0];
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.STAFF_ABSENCES)
                                .select('*')
                                .gte('leave_end_date', today)
                                .order('leave_start_date');
                            
                            if (error) throw error;
                            
                            // Map database fields to frontend format
                            staffAbsences.value = (data || []).map(absence => 
                                FieldMappers.staffAbsences.fromDB(absence)
                            );
                            
                            console.log('Loaded staff absences:', staffAbsences.value.length, 'records');
                            
                        } catch (error) {
                            console.error('Error loading staff absences:', error);
                            staffAbsences.value = [];
                        } finally {
                            loadingAbsences.value = false;
                        }
                    };
                    
                    // IMPORTANT: On-call schedule loader matches your DB structure
                    const loadOnCallSchedule = async () => {
                        loadingSchedule.value = true;
                        try {
                            const today = new Date().toISOString().split('T')[0];
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                .select('*')
                                .gte('duty_date', today)
                                .order('duty_date')
                                .limit(7);
                            
                            if (error) throw error;
                            
                            // Map database fields to frontend format
                            onCallSchedule.value = (data || []).map(schedule => 
                                FieldMappers.onCallSchedule.fromDB(schedule)
                            );
                            
                            console.log('Loaded on-call schedule:', onCallSchedule.value.length, 'records');
                            
                        } catch (error) {
                            console.error('Error loading on-call schedule:', error);
                            onCallSchedule.value = [];
                        } finally {
                            loadingSchedule.value = false;
                        }
                    };
                    
                    const loadAnnouncements = async () => {
                        loadingAnnouncements.value = true;
                        try {
                            const today = new Date().toISOString().split('T')[0];
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.ANNOUNCEMENTS)
                                .select('*')
                                .lte('publish_start_date', today)
                                .or(`publish_end_date.gte.${today},publish_end_date.is.null`)
                                .order('publish_start_date', { ascending: false })
                                .limit(5);
                            
                            if (error) throw error;
                            recentAnnouncements.value = data || [];
                        } catch (error) {
                            console.error('Error loading announcements:', error);
                            recentAnnouncements.value = [];
                        } finally {
                            loadingAnnouncements.value = false;
                        }
                    };
                    
                    const loadUsers = async () => {
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.USERS)
                                .select('*')
                                .order('full_name');
                            
                            if (error) throw error;
                            users.value = data || [];
                        } catch (error) {
                            console.error('Error loading users:', error);
                            users.value = [];
                        }
                    };
                    
                    const loadUserRoles = async () => {
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.SYSTEM_ROLES)
                                .select('*');
                            
                            if (error) throw error;
                            userRoles.value = data || [];
                        } catch (error) {
                            console.error('Error loading user roles:', error);
                            userRoles.value = [];
                        }
                    };
                    
                    const loadAuditLogs = async () => {
                        loadingAuditLogs.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.AUDIT_LOGS)
                                .select('*')
                                .order('created_at', { ascending: false })
                                .limit(100);
                            
                            if (error) throw error;
                            auditLogs.value = data || [];
                        } catch (error) {
                            console.error('Error loading audit logs:', error);
                            auditLogs.value = [];
                        } finally {
                            loadingAuditLogs.value = false;
                        }
                    };
                    
                    const loadSystemSettings = async () => {
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.SYSTEM_SETTINGS)
                                .select('*')
                                .limit(1)
                                .single();
                            
                            if (error) {
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
                                const { data: newSettings } = await supabaseClient
                                    .from(TABLE_NAMES.SYSTEM_SETTINGS)
                                    .insert([defaultSettings])
                                    .select()
                                    .single();
                                systemSettings.value = newSettings || defaultSettings;
                            } else {
                                systemSettings.value = data;
                            }
                        } catch (error) {
                            console.error('Error loading system settings:', error);
                            systemSettings.value = {};
                        }
                    };
                    
                    const loadInitialData = async () => {
                        loading.value = true;
                        try {
                            await Promise.all([
                                loadMedicalStaff(),
                                loadDepartments(),
                                loadClinicalUnits(),
                                loadTrainingUnits(),
                                loadResidentRotations(),
                                loadStaffAbsences(),
                                loadOnCallSchedule(),
                                loadAnnouncements(),
                                loadUsers(),
                                loadUserRoles(),
                                loadSystemSettings()
                            ]);
                            showToast('System Ready', 'All data loaded successfully', 'success');
                            await logAuditEvent('SYSTEM_START', 'system', { user: currentUser.value?.email });
                        } catch (error) {
                            console.error('Error loading initial data:', error);
                            showToast('Data Load Error', 'Failed to load system data', 'error');
                        } finally {
                            loading.value = false;
                        }
                    };
                    
                    // ============ MODAL RESET FUNCTIONS ============
                    const resetMedicalStaffModal = () => {
                        medicalStaffModal.form = {
                            full_name: '',
                            staff_type: 'medical_resident',
                            staff_id: '',
                            employment_status: 'active',
                            professional_email: '',
                            department_id: '',
                            resident_category: '',
                            training_level: '',
                            specialization: '',
                            years_experience: '',
                            biography: '',
                            office_phone: '',
                            mobile_phone: '',
                            medical_license: '',
                            date_of_birth: ''
                        };
                    };
                    
                    const resetDepartmentModal = () => {
                        departmentModal.form = {
                            name: '',
                            code: '',
                            status: 'active',
                            description: '',
                            head_of_department_id: ''
                        };
                    };
                    
                    const resetClinicalUnitModal = () => {
                        clinicalUnitModal.form = {
                            name: '',
                            code: '',
                            department_id: '',
                            unit_type: 'clinical',
                            status: 'active',
                            description: '',
                            supervisor_id: ''
                        };
                    };
                    
                    // IMPORTANT: Training unit reset matches your DB structure
                    const resetTrainingUnitModal = () => {
                        trainingUnitModal.form = {
                            unit_name: '',
                            unit_code: '',
                            department_id: '',
                            department_name: '',
                            supervisor_id: '',
                            max_capacity: 10,
                            status: 'active',
                            description: ''
                        };
                    };
                    
                    const resetRotationModal = () => {
                        rotationModal.form = {
                            resident_id: '',
                            training_unit_id: '',
                            start_date: '',
                            end_date: '',
                            supervisor_id: '',
                            status: 'active',
                            goals: '',
                            notes: ''
                        };
                    };
                    
                    // IMPORTANT: On-call modal reset matches your DB structure
                    const resetOnCallModal = () => {
                        onCallModal.form = {
                            duty_date: new Date().toISOString().split('T')[0],
                            shift_type: 'primary_call',
                            start_time: '08:00',
                            end_time: '17:00',
                            primary_physician_id: '',
                            backup_physician_id: '',
                            coverage_notes: ''
                        };
                    };
                    
                    // IMPORTANT: Absence modal reset matches your DB structure
                    const resetAbsenceModal = () => {
                        absenceModal.form = {
                            staff_member_id: '',
                            absence_reason: '',
                            start_date: '',
                            end_date: '',
                            notes: '',
                            replacement_staff_id: '',
                            coverage_instructions: ''
                        };
                    };
                    
                    // ============ DATA SAVE FUNCTIONS (UPDATED FOR YOUR DB) ============
                    const saveMedicalStaff = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('medical_staff', medicalStaffModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            // Map to database structure
                            const dbFormData = FieldMappers.medicalStaff.toDB(medicalStaffModal.form);
                            
                            let result;
                            if (medicalStaffModal.mode === 'add') {
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.MEDICAL_STAFF)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.medicalStaff.fromDB(data);
                                medicalStaff.value.unshift(result);
                                showToast('Success', 'Medical staff added successfully', 'success');
                                await logAuditEvent('CREATE', 'medical_staff', { staff_id: result.id, name: result.full_name });
                            } else {
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.id = medicalStaffModal.form.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.MEDICAL_STAFF)
                                    .update(dbFormData)
                                    .eq('id', dbFormData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.medicalStaff.fromDB(data);
                                const index = medicalStaff.value.findIndex(s => s.id === result.id);
                                if (index !== -1) medicalStaff.value[index] = result;
                                showToast('Success', 'Medical staff updated successfully', 'success');
                                await logAuditEvent('UPDATE', 'medical_staff', { staff_id: result.id, name: result.full_name });
                            }
                            
                            medicalStaffModal.show = false;
                            resetMedicalStaffModal();
                            return result;
                        } catch (error) {
                            console.error('Error saving medical staff:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    const saveDepartment = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('system', 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const formData = { ...departmentModal.form };
                            let result;
                            
                            if (departmentModal.mode === 'add') {
                                formData.created_at = new Date().toISOString();
                                formData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.DEPARTMENTS)
                                    .insert([formData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = data;
                                departments.value.unshift(result);
                                showToast('Success', 'Department added successfully', 'success');
                            } else {
                                formData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.DEPARTMENTS)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = data;
                                const index = departments.value.findIndex(d => d.id === result.id);
                                if (index !== -1) departments.value[index] = result;
                                showToast('Success', 'Department updated successfully', 'success');
                            }
                            
                            departmentModal.show = false;
                            resetDepartmentModal();
                            return result;
                        } catch (error) {
                            console.error('Error saving department:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    // IMPORTANT: Training unit save matches your DB structure
                    const saveTrainingUnit = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('training_units', trainingUnitModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            // Get department name if not provided
                            if (!trainingUnitModal.form.department_name && trainingUnitModal.form.department_id) {
                                const department = departments.value.find(d => d.id === trainingUnitModal.form.department_id);
                                if (department) {
                                    trainingUnitModal.form.department_name = department.name;
                                }
                            }
                            
                            // Map to database structure
                            const dbFormData = FieldMappers.trainingUnits.toDB(trainingUnitModal.form);
                            
                            let result;
                            if (trainingUnitModal.mode === 'add') {
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.TRAINING_UNITS)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.trainingUnits.fromDB(data);
                                trainingUnits.value.unshift(result);
                                showToast('Success', 'Training unit added successfully', 'success');
                            } else {
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.id = trainingUnitModal.form.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.TRAINING_UNITS)
                                    .update(dbFormData)
                                    .eq('id', dbFormData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.trainingUnits.fromDB(data);
                                const index = trainingUnits.value.findIndex(u => u.id === result.id);
                                if (index !== -1) trainingUnits.value[index] = result;
                                showToast('Success', 'Training unit updated successfully', 'success');
                            }
                            
                            trainingUnitModal.show = false;
                            resetTrainingUnitModal();
                            return result;
                        } catch (error) {
                            console.error('Error saving training unit:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    // IMPORTANT: Rotation save matches your DB structure
                    const saveRotation = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('resident_rotations', rotationModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const startDate = new Date(rotationModal.form.start_date);
                            const endDate = new Date(rotationModal.form.end_date);
                            if (endDate <= startDate) {
                                throw new Error('End date must be after start date');
                            }
                            
                            // Map to database structure
                            const dbFormData = FieldMappers.residentRotations.toDB(rotationModal.form);
                            
                            let result;
                            if (rotationModal.mode === 'add') {
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.residentRotations.fromDB(data);
                                residentRotations.value.unshift(result);
                                showToast('Success', 'Rotation added successfully', 'success');
                            } else {
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.id = rotationModal.form.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                    .update(dbFormData)
                                    .eq('id', dbFormData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.residentRotations.fromDB(data);
                                const index = residentRotations.value.findIndex(r => r.id === result.id);
                                if (index !== -1) residentRotations.value[index] = result;
                                showToast('Success', 'Rotation updated successfully', 'success');
                            }
                            
                            rotationModal.show = false;
                            resetRotationModal();
                            return result;
                        } catch (error) {
                            console.error('Error saving rotation:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    // IMPORTANT: On-call save matches your DB structure
                    const saveOnCall = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('oncall_schedule', onCallModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const formData = { ...onCallModal.form };
                            
                            // Ensure required fields
                            if (!formData.duty_date) {
                                throw new Error('Duty date is required');
                            }
                            if (!formData.primary_physician_id) {
                                throw new Error('Primary physician is required');
                            }
                            
                            // Map to database structure
                            const dbFormData = FieldMappers.onCallSchedule.toDB(formData);
                            dbFormData.created_by = currentUser.value?.id;
                            
                            let result;
                            if (onCallModal.mode === 'add') {
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.onCallSchedule.fromDB(data);
                                onCallSchedule.value.unshift(result);
                                showToast('Success', 'On-call schedule added successfully', 'success');
                                await logAuditEvent('CREATE', 'oncall_schedule', { schedule_id: result.id });
                            } else {
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.id = formData.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                    .update(dbFormData)
                                    .eq('id', dbFormData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.onCallSchedule.fromDB(data);
                                const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                                if (index !== -1) onCallSchedule.value[index] = result;
                                showToast('Success', 'On-call schedule updated successfully', 'success');
                                await logAuditEvent('UPDATE', 'oncall_schedule', { schedule_id: result.id });
                            }
                            
                            onCallModal.show = false;
                            resetOnCallModal();
                            await loadOnCallSchedule(); // Refresh the list
                            return result;
                        } catch (error) {
                            console.error('Error saving on-call schedule:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    // IMPORTANT: Absence save matches your DB structure
                    const saveAbsence = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('staff_absence', absenceModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const startDate = new Date(absenceModal.form.start_date);
                            const endDate = new Date(absenceModal.form.end_date);
                            if (endDate <= startDate) {
                                throw new Error('End date must be after start date');
                            }
                            
                            // Calculate total days
                            const totalDays = calculateAbsenceDuration(startDate, endDate);
                            
                            // Map to database structure
                            const dbFormData = FieldMappers.staffAbsences.toDB(absenceModal.form);
                            dbFormData.total_days = totalDays;
                            
                            let result;
                            if (absenceModal.mode === 'add') {
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.STAFF_ABSENCES)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.staffAbsences.fromDB(data);
                                staffAbsences.value.unshift(result);
                                showToast('Success', 'Absence request submitted successfully', 'success');
                            } else {
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.id = absenceModal.form.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.STAFF_ABSENCES)
                                    .update(dbFormData)
                                    .eq('id', dbFormData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.staffAbsences.fromDB(data);
                                const index = staffAbsences.value.findIndex(a => a.id === result.id);
                                if (index !== -1) staffAbsences.value[index] = result;
                                showToast('Success', 'Absence request updated successfully', 'success');
                            }
                            
                            absenceModal.show = false;
                            resetAbsenceModal();
                            return result;
                        } catch (error) {
                            console.error('Error saving absence:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    // ============ DELETE FUNCTIONS ============
                    const deleteMedicalStaff = (staff) => {
                        showConfirmation({
                            title: 'Delete Medical Staff',
                            message: `Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`,
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => {
                                try {
                                    if (!hasPermission('medical_staff', 'delete')) {
                                        throw new Error('Insufficient permissions');
                                    }
                                    const { error } = await supabaseClient
                                        .from(TABLE_NAMES.MEDICAL_STAFF)
                                        .delete()
                                        .eq('id', staff.id);
                                    if (error) throw error;
                                    const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                    if (index !== -1) medicalStaff.value.splice(index, 1);
                                    showToast('Deleted', `${staff.full_name} has been removed`, 'success');
                                    await logAuditEvent('DELETE', 'medical_staff', { staff_id: staff.id, name: staff.full_name });
                                } catch (error) {
                                    console.error('Error deleting medical staff:', error);
                                    showToast('Error', error.message, 'error');
                                }
                            }
                        });
                    };
                    
                    // IMPORTANT: On-call delete function
                    const deleteOnCallSchedule = (scheduleId) => {
                        showConfirmation({
                            title: 'Delete On-call Schedule',
                            message: 'Are you sure you want to delete this on-call schedule?',
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => {
                                try {
                                    if (!hasPermission('oncall_schedule', 'delete')) {
                                        throw new Error('Insufficient permissions');
                                    }
                                    const { error } = await supabaseClient
                                        .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                        .delete()
                                        .eq('id', scheduleId);
                                    if (error) throw error;
                                    const index = onCallSchedule.value.findIndex(s => s.id === scheduleId);
                                    if (index !== -1) onCallSchedule.value.splice(index, 1);
                                    showToast('Deleted', 'On-call schedule has been removed', 'success');
                                    await logAuditEvent('DELETE', 'oncall_schedule', { schedule_id: scheduleId });
                                } catch (error) {
                                    console.error('Error deleting on-call schedule:', error);
                                    showToast('Error', error.message, 'error');
                                }
                            }
                        });
                    };
                    
                    // ============ UI FUNCTIONS ============
                    const switchView = (view) => {
                        if (!currentUser.value) return;
                        currentView.value = view;
                        mobileMenuOpen.value = false;
                        switch (view) {
                            case 'medical_staff':
                                loadMedicalStaff();
                                break;
                            case 'department_management':
                                loadDepartments();
                                loadClinicalUnits();
                                break;
                            case 'training_units':
                                loadTrainingUnits();
                                break;
                            case 'resident_rotations':
                                loadResidentRotations();
                                break;
                            case 'staff_absence':
                                loadStaffAbsences();
                                break;
                            case 'oncall_schedule':
                                loadOnCallSchedule();
                                break;
                            case 'communications':
                                loadAnnouncements();
                                break;
                            case 'audit_logs':
                                loadAuditLogs();
                                break;
                            case 'permission_manager':
                                loadUserRoles();
                                loadUsers();
                                break;
                            case 'system_settings':
                                loadSystemSettings();
                                break;
                            case 'daily_operations':
                                loadAnnouncements();
                                loadOnCallSchedule();
                                break;
                        }
                    };
                    
                    const getCurrentTitle = () => {
                        const titles = {
                            daily_operations: 'Daily Operations',
                            medical_staff: 'Medical Staff',
                            resident_rotations: 'Resident Rotations',
                            oncall_schedule: 'On-call Schedule',
                            staff_absence: 'Staff Absence',
                            training_units: 'Training Units',
                            department_management: 'Department Management',
                            communications: 'Communications',
                            audit_logs: 'Audit Logs',
                            permission_manager: 'Permission Manager',
                            system_settings: 'System Settings'
                        };
                        return titles[currentView.value] || 'NeumoCare';
                    };
                    
                    const getCurrentSubtitle = () => {
                        const subtitles = {
                            daily_operations: 'Dashboard Overview',
                            medical_staff: 'Manage Medical Staff',
                            resident_rotations: 'Resident Rotation Management',
                            oncall_schedule: 'On-call Scheduling',
                            staff_absence: 'Staff Absence Tracking',
                            training_units: 'Training Units Management',
                            department_management: 'Department Structure',
                            communications: 'Department Communications',
                            audit_logs: 'System Audit Trail',
                            permission_manager: 'User Permissions Management',
                            system_settings: 'System Configuration'
                        };
                        return subtitles[currentView.value] || '';
                    };
                    
                    const getSearchPlaceholder = () => {
                        const placeholders = {
                            medical_staff: 'Search medical staff...',
                            resident_rotations: 'Search rotations...',
                            training_units: 'Search training units...',
                            communications: 'Search announcements...'
                        };
                        return placeholders[currentView.value] || 'Search...';
                    };
                    
                    // ============ MODAL FUNCTIONS ============
                    const showAddMedicalStaffModal = () => {
                        if (!hasPermission('medical_staff', 'create')) {
                            showToast('Permission Denied', 'You need create permission to add medical staff', 'error');
                            return;
                        }
                        medicalStaffModal.mode = 'add';
                        medicalStaffModal.show = true;
                        medicalStaffModal.activeTab = 'basic';
                        resetMedicalStaffModal();
                    };
                    
                    const editMedicalStaff = (staff) => {
                        if (!hasPermission('medical_staff', 'update')) {
                            showToast('Permission Denied', 'You need update permission to edit medical staff', 'error');
                            return;
                        }
                        medicalStaffModal.mode = 'edit';
                        medicalStaffModal.show = true;
                        medicalStaffModal.activeTab = 'basic';
                        medicalStaffModal.form = { ...staff };
                    };
                    
                    const showAddDepartmentModal = () => {
                        if (!hasPermission('system', 'update')) {
                            showToast('Permission Denied', 'You need permission to manage departments', 'error');
                            return;
                        }
                        departmentModal.mode = 'add';
                        departmentModal.show = true;
                        resetDepartmentModal();
                    };
                    
                    const editDepartment = (department) => {
                        if (!hasPermission('system', 'update')) {
                            showToast('Permission Denied', 'You need permission to edit departments', 'error');
                            return;
                        }
                        departmentModal.mode = 'edit';
                        departmentModal.show = true;
                        departmentModal.form = { ...department };
                    };
                    
                    const showAddClinicalUnitModal = () => {
                        if (!hasPermission('system', 'update')) {
                            showToast('Permission Denied', 'You need permission to add clinical units', 'error');
                            return;
                        }
                        clinicalUnitModal.mode = 'add';
                        clinicalUnitModal.show = true;
                        resetClinicalUnitModal();
                    };
                    
                    const editClinicalUnit = (unit) => {
                        if (!hasPermission('system', 'update')) {
                            showToast('Permission Denied', 'You need permission to edit clinical units', 'error');
                            return;
                        }
                        clinicalUnitModal.mode = 'edit';
                        clinicalUnitModal.show = true;
                        clinicalUnitModal.form = { ...unit };
                    };
                    
                    // IMPORTANT: Training unit modal functions
                    const showAddTrainingUnitModal = () => {
                        if (!hasPermission('training_units', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        trainingUnitModal.mode = 'add';
                        trainingUnitModal.show = true;
                        resetTrainingUnitModal();
                    };
                    
                    const editTrainingUnit = (unit) => {
                        if (!hasPermission('training_units', 'update')) {
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        trainingUnitModal.mode = 'edit';
                        trainingUnitModal.show = true;
                        trainingUnitModal.form = { ...unit };
                    };
                    
                    const showAddRotationModal = () => {
                        if (!hasPermission('resident_rotations', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        rotationModal.mode = 'add';
                        rotationModal.show = true;
                        resetRotationModal();
                    };
                    
                    const editRotation = (rotation) => {
                        if (!hasPermission('resident_rotations', 'update')) {
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        rotationModal.mode = 'edit';
                        rotationModal.show = true;
                        rotationModal.form = { ...rotation };
                    };
                    
                    // IMPORTANT: On-call modal functions
                    const showAddOnCallModal = () => {
                        console.log('showAddOnCallModal called');
                        
                        if (!hasPermission('oncall_schedule', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        
                        onCallModal.mode = 'add';
                        onCallModal.show = true;
                        
                        // Set defaults
                        onCallModal.form.duty_date = new Date().toISOString().split('T')[0];
                        onCallModal.form.start_time = '08:00';
                        onCallModal.form.end_time = '17:00';
                        
                        console.log('Modal state:', onCallModal);
                        console.log('Available physicians count:', availablePhysicians.value.length);
                    };
                    
                    const editOnCallSchedule = (schedule) => {
                        if (!hasPermission('oncall_schedule', 'update')) {
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        onCallModal.mode = 'edit';
                        onCallModal.show = true;
                        onCallModal.form = { ...schedule };
                    };
                    
                    // IMPORTANT: Absence modal functions
                    const showAddAbsenceModal = () => {
                        if (!hasPermission('staff_absence', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        absenceModal.mode = 'add';
                        absenceModal.show = true;
                        absenceModal.form.start_date = new Date().toISOString().split('T')[0];
                        absenceModal.form.end_date = new Date().toISOString().split('T')[0];
                    };
                    
                    const editAbsence = (absence) => {
                        if (!hasPermission('staff_absence', 'update')) {
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        absenceModal.mode = 'edit';
                        absenceModal.show = true;
                        absenceModal.form = {
                            ...absence,
                            id: absence.id
                        };
                    };
                    
                    // ============ COMPUTED PROPERTIES ============
                    const filteredMedicalStaff = computed(() => {
                        let filtered = medicalStaff.value;
                        if (staffSearch.value) {
                            const search = staffSearch.value.toLowerCase();
                            filtered = filtered.filter(s => 
                                s.full_name.toLowerCase().includes(search) ||
                                (s.staff_id && s.staff_id.toLowerCase().includes(search)) ||
                                (s.professional_email && s.professional_email.toLowerCase().includes(search))
                            );
                        }
                        if (staffFilter.staff_type) {
                            filtered = filtered.filter(s => s.staff_type === staffFilter.staff_type);
                        }
                        if (staffFilter.employment_status) {
                            filtered = filtered.filter(s => s.employment_status === staffFilter.employment_status);
                        }
                        return filtered;
                    });
                    
                    const filteredRotations = computed(() => {
                        let filtered = residentRotations.value;
                        if (rotationFilter.resident_id) {
                            filtered = filtered.filter(r => r.resident_id === rotationFilter.resident_id);
                        }
                        if (rotationFilter.status) {
                            filtered = filtered.filter(r => r.status === rotationFilter.status);
                        }
                        return filtered;
                    });
                    
                    const todaysOnCall = computed(() => {
                        const today = new Date().toISOString().split('T')[0];
                        return onCallSchedule.value
                            .filter(schedule => schedule.duty_date === today)
                            .map(schedule => ({
                                ...schedule,
                                physician_name: getStaffName(schedule.primary_physician_id),
                                role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                                contact_number: 'Ext. 5555'
                            }));
                    });
                    
                    // IMPORTANT: Available physicians computed property
                    const availablePhysicians = computed(() => {
                        const physicians = medicalStaff.value.filter(staff => 
                            (['attending_physician', 'fellow'].includes(staff.staff_type) && 
                            staff.employment_status === 'active')
                        );
                        
                        console.log('availablePhysicians computed:', physicians.length, 'physicians found');
                        return physicians;
                    });
                    
                    const availableResidents = computed(() => {
                        return medicalStaff.value.filter(staff => 
                            staff.staff_type === 'medical_resident' && 
                            staff.employment_status === 'active'
                        );
                    });
                    
                    const availableTrainingUnits = computed(() => {
                        return trainingUnits.value.filter(unit => unit.status === 'active');
                    });
                    
                    const stats = computed(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const activeStaff = medicalStaff.value.filter(s => s.employment_status === 'active').length;
                        const residentsCount = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active').length;
                        const todayOnCall = onCallSchedule.value.filter(s => s.duty_date === today).length;
                        const activeAbsences = staffAbsences.value.filter(a => 
                            a.start_date <= today && a.end_date >= today && a.status === 'approved'
                        ).length;
                        return {
                            totalStaff: activeStaff,
                            activePatients: 0,
                            todayAppointments: 0,
                            pendingAlerts: activeAlerts.value.length,
                            activeResidents: residentsCount,
                            todayOnCall: todayOnCall,
                            activeAbsences: activeAbsences
                        };
                    });
                    
                    // ============ AUTHENTICATION ============
                    const handleLogin = async () => {
                        loading.value = true;
                        try {
                            const email = loginForm.email.trim().toLowerCase();
                            const password = loginForm.password;
                            
                            if (email === 'admin@neumocare.org' && password === 'password123') {
                                const { data: users, error } = await supabaseClient
                                    .from(TABLE_NAMES.USERS)
                                    .select('*')
                                    .eq('email', email)
                                    .limit(1);
                                
                                if (error) {
                                    console.warn('Could not fetch user from database:', error);
                                    currentUser.value = {
                                        id: Utils.generateId('USR'),
                                        email: email,
                                        full_name: 'System Administrator',
                                        user_role: 'system_admin',
                                        department: 'Administration',
                                        account_status: 'active'
                                    };
                                } else if (users && users.length > 0) {
                                    currentUser.value = users[0];
                                } else {
                                    currentUser.value = {
                                        id: Utils.generateId('USR'),
                                        email: email,
                                        full_name: 'System Administrator',
                                        user_role: 'system_admin',
                                        department: 'Administration',
                                        account_status: 'active'
                                    };
                                }
                                
                                showToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
                                await logAuditEvent('LOGIN', 'auth', { email: email, user_id: currentUser.value.id });
                                await loadInitialData();
                                currentView.value = 'daily_operations';
                            } else {
                                throw new Error('Invalid credentials. Use admin@neumocare.org / password123');
                            }
                        } catch (error) {
                            console.error('Login error:', error);
                            showToast('Login Failed', error.message, 'error');
                        } finally {
                            loading.value = false;
                            loginForm.password = '';
                        }
                    };
                    
                    const handleLogout = () => {
                        showConfirmation({
                            title: 'Logout',
                            message: 'Are you sure you want to logout?',
                            icon: 'fa-sign-out-alt',
                            confirmButtonText: 'Logout',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => {
                                await logAuditEvent('LOGOUT', 'auth', { user_id: currentUser.value.id });
                                currentUser.value = null;
                                currentView.value = 'login';
                                userMenuOpen.value = false;
                                showToast('Logged Out', 'You have been successfully logged out', 'info');
                            }
                        });
                    };
                    
                    // ============ EVENT HANDLERS ============
                    const toggleStatsSidebar = () => {
                        statsSidebarOpen.value = !statsSidebarOpen.value;
                    };
                    
                    const toggleUserMenu = () => {
                        userMenuOpen.value = !userMenuOpen.value;
                    };
                    
                    const toggleActionMenu = (event) => {
                        event.stopPropagation();
                        const dropdown = event.target.closest('.action-dropdown');
                        if (dropdown) {
                            const menu = dropdown.querySelector('.action-menu');
                            if (menu) {
                                menu.classList.toggle('show');
                            }
                        }
                    };
                    
                    // ============ LIFECYCLE HOOKS ============
                    onMounted(() => {
                        console.log('App mounted successfully');
                        document.addEventListener('click', function(event) {
                            if (!event.target.closest('.action-dropdown')) {
                                document.querySelectorAll('.action-menu.show').forEach(menu => {
                                    menu.classList.remove('show');
                                });
                            }
                            if (!event.target.closest('.user-menu')) {
                                userMenuOpen.value = false;
                            }
                        });
                    });
                    
                    // ============ RETURN STATEMENT ============
                    return {
                        // State Variables
                        currentUser,
                        loginForm,
                        loading,
                        saving,
                        currentView,
                        sidebarCollapsed,
                        mobileMenuOpen,
                        userMenuOpen,
                        statsSidebarOpen,
                        searchQuery,
                        searchScope,
                        searchFilter,
                        staffSearch,
                        
                        // Modal States
                        confirmationModal,
                        staffDetailsModal,
                        medicalStaffModal,
                        departmentModal,
                        clinicalUnitModal,
                        trainingUnitModal,
                        rotationModal,
                        onCallModal,
                        absenceModal,
                        communicationsModal,
                        quickPlacementModal,
                        bulkAssignModal,
                        roleModal,
                        userProfileModal,
                        systemSettingsModal,
                        absenceDetailsModal,
                        importExportModal,
                        rotationDetailsModal,
                        dashboardCustomizeModal,
                        advancedSearchModal,
                        getUserRoleDisplay,
                        
                        // Data Stores
                        medicalStaff,
                        departments,
                        clinicalUnits,
                        trainingUnits,
                        residentRotations,
                        staffAbsences,
                        onCallSchedule,
                        recentAnnouncements,
                        users,
                        userRoles,
                        auditLogs,
                        systemSettings,
                        
                        // UI State
                        toasts,
                        activeAlerts,
                        unreadNotifications,
                        
                        // Filters
                        staffFilter,
                        rotationFilter,
                        absenceFilter,
                        auditFilters,
                        
                        // Loading States
                        loadingStats,
                        loadingStaff,
                        loadingDepartments,
                        loadingTrainingUnits,
                        loadingRotations,
                        loadingAbsences,
                        loadingSchedule,
                        loadingAnnouncements,
                        loadingAuditLogs,
                        
                        // Computed Properties
                        stats,
                        todaysOnCall,
                        filteredMedicalStaff,
                        filteredRotations,
                        availablePhysicians,
                        availableResidents,
                        availableTrainingUnits,
                        
                        // Core Functions
                        hasPermission,
                        
                        // Utility Functions
                        getInitials: Utils.getInitials,
                        formatDate: Utils.formatDate,
                        formatDateTime: Utils.formatDateTime,
                        formatTimeAgo: Utils.formatTimeAgo,
                        formatStaffType,
                        getStaffTypeClass,
                        formatEmploymentStatus,
                        formatTrainingLevel,
                        getDepartmentName,
                        getStaffName,
                        getTrainingUnitName,
                        getSupervisorName,
                        getResidentName,
                        formatRotationStatus,
                        getRotationStatusClass,
                        formatAbsenceReason,
                        formatAbsenceStatus,
                        getAbsenceStatusClass,
                        calculateAbsenceDuration,
                        formatTimeRange,
                        formatAuditAction,
                        getDepartmentUnits,
                        getUnitResidents,
                        getUserName,
                        
                        // Navigation Functions
                        switchView,
                        getCurrentTitle,
                        getCurrentSubtitle,
                        getSearchPlaceholder,
                        
                        // Modal Functions
                        showConfirmation,
                        confirmAction,
                        cancelConfirmation,
                        showAddMedicalStaffModal,
                        editMedicalStaff,
                        saveMedicalStaff,
                        deleteMedicalStaff,
                        showAddDepartmentModal,
                        editDepartment,
                        saveDepartment,
                        showAddClinicalUnitModal,
                        editClinicalUnit,
                        showAddTrainingUnitModal,
                        editTrainingUnit,
                        saveTrainingUnit,
                        showAddRotationModal,
                        editRotation,
                        saveRotation,
                        showAddOnCallModal,
                        editOnCallSchedule,
                        saveOnCall,
                        deleteOnCallSchedule,
                        showAddAbsenceModal,
                        editAbsence,
                        saveAbsence,
                        showAddOnCallModal,
                        
                        // UI Functions
                        removeToast,
                        showToast,
                        dismissAlert,
                        toggleStatsSidebar,
                        toggleUserMenu,
                        toggleActionMenu,
                        
                        // Authentication Functions
                        handleLogin,
                        handleLogout
                    };
                    
                } catch (error) {
                    console.error('Vue component setup failed:', error);
                    return {
                        currentView: 'error',
                        showToast: (title, message) => console.error(title, message),
                        handleLogin: () => console.log('System error - cannot login')
                    };
                }
            },
            
            errorCaptured(err, instance, info) {
                console.error('Vue error captured:', err, info);
                this.showToast?.('System Error', 'An error occurred. Please refresh the page.', 'error');
                return false;
            }
        });

        // ============ MOUNT THE APP ============
        app.mount('#app');
        console.log('Vue app mounted successfully');
        
    } catch (error) {
        console.error('FATAL ERROR: Application failed to initialize:', error);
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">System Error</h2>
                <p style="margin: 20px 0; color: #666;">${error.message}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});

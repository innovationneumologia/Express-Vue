// ============ COMPLETE INTEGRATED BACKEND LOGIC ============
// This combines your frontend Vue app with your actual Supabase database schema

// Wait for page to fully load
window.addEventListener('load', async function() {
    console.log('Page fully loaded, initializing NeumoCare Hospital Management System v2.0...');
    
    try {
        // ============ ERROR BOUNDARY: CHECK VUE AVAILABILITY ============
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js failed to load. Please refresh the page.');
        }
        
        console.log('Vue.js loaded successfully:', Vue.version);
        
        // Get Vue functions
        const { createApp, ref, reactive, computed, onMounted, watch } = Vue;
        
        // ============ SUPABASE CLIENT SETUP ============
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
        
        // ============ DATABASE TABLE NAMES (YOUR ACTUAL SCHEMA) ============
        const TABLE_NAMES = {
            USERS: 'app_users',
            MEDICAL_STAFF: 'medical_staff',
            DEPARTMENTS: 'departments',
            CLINICAL_UNITS: 'clinical_units',
            TRAINING_UNITS: 'training_units',
            RESIDENT_ROTATIONS: 'resident_rotations',
            STAFF_ABSENCES: 'leave_requests',           // Your actual table name
            ONCALL_SCHEDULE: 'oncall_schedule',
            ANNOUNCEMENTS: 'department_announcements',  // Your actual table name
            DAILY_ASSIGNMENTS: 'daily_assignments',
            AUDIT_LOGS: 'audit_logs',
            SYSTEM_SETTINGS: 'system_settings',
            SYSTEM_ROLES: 'system_roles',
            SYSTEM_PERMISSIONS: 'system_permissions',
            NOTIFICATIONS: 'notifications'
        };
        
        // ============ FIELD MAPPING SYSTEM ============
        const FieldMappers = {
            // Helper function to calculate absence duration
            calculateDuration: (startDate, endDate) => {
                try {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end - start);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                } catch {
                    return 0;
                }
            },
            
            // Training Units
            mapTrainingUnit: (dbUnit) => {
                return {
                    id: dbUnit.id,
                    unit_name: dbUnit.unit_name,
                    unit_code: dbUnit.unit_code,
                    department_id: dbUnit.department_id,
                    supervisor_id: dbUnit.supervisor_id,
                    max_capacity: dbUnit.maximum_residents || dbUnit.max_capacity || 10,
                    status: dbUnit.unit_status || dbUnit.status || 'active',
                    description: dbUnit.unit_description,
                    name: dbUnit.unit_name,
                    code: dbUnit.unit_code,
                    department_name: dbUnit.department_name,
                    location_building: dbUnit.location_building,
                    location_floor: dbUnit.location_floor,
                    default_supervisor_id: dbUnit.default_supervisor_id,
                    specialty: dbUnit.specialty,
                    current_residents: dbUnit.current_residents || 0,
                    created_at: dbUnit.created_at,
                    updated_at: dbUnit.updated_at
                };
            },
            
            mapTrainingUnitToDb: (frontendUnit) => {
                return {
                    unit_name: frontendUnit.unit_name || frontendUnit.name,
                    unit_code: frontendUnit.unit_code || frontendUnit.code,
                    department_id: frontendUnit.department_id,
                    supervisor_id: frontendUnit.supervisor_id,
                    maximum_residents: frontendUnit.max_capacity,
                    unit_status: frontendUnit.status || 'active',
                    unit_description: frontendUnit.description,
                    department_name: frontendUnit.department_name || '',
                    location_building: frontendUnit.location_building,
                    location_floor: frontendUnit.location_floor,
                    default_supervisor_id: frontendUnit.default_supervisor_id,
                    specialty: frontendUnit.specialty,
                    current_residents: frontendUnit.current_residents || 0
                };
            },
            
            // Medical Staff
            mapMedicalStaff: (dbStaff) => {
                // Convert training_year to training_level format
                let trainingLevel = '';
                if (dbStaff.training_year) {
                    trainingLevel = `PGY-${dbStaff.training_year}`;
                } else if (dbStaff.training_level) {
                    trainingLevel = dbStaff.training_level;
                }
                
                return {
                    id: dbStaff.id,
                    full_name: dbStaff.full_name,
                    staff_type: dbStaff.staff_type,
                    staff_id: dbStaff.staff_id,
                    employment_status: dbStaff.employment_status || 'active',
                    professional_email: dbStaff.professional_email,
                    department_id: dbStaff.department_id,
                    resident_category: dbStaff.resident_category,
                    training_level: trainingLevel,
                    specialization: dbStaff.specialization,
                    years_experience: dbStaff.years_experience,
                    biography: dbStaff.biography,
                    office_phone: dbStaff.work_phone,
                    mobile_phone: dbStaff.mobile_phone,
                    medical_license: dbStaff.medical_license,
                    date_of_birth: dbStaff.date_of_birth,
                    training_year: dbStaff.training_year,
                    primary_clinic: dbStaff.primary_clinic,
                    can_supervise_residents: dbStaff.can_supervise_residents,
                    special_notes: dbStaff.special_notes,
                    resident_type: dbStaff.resident_type,
                    home_department: dbStaff.home_department,
                    external_institution: dbStaff.external_institution,
                    created_at: dbStaff.created_at,
                    updated_at: dbStaff.updated_at
                };
            },
            
            mapMedicalStaffToDb: (frontendStaff) => {
                // Extract PGY number from training_level
                let trainingYear = null;
                if (frontendStaff.training_level && frontendStaff.training_level.includes('PGY-')) {
                    trainingYear = parseInt(frontendStaff.training_level.replace('PGY-', ''));
                }
                
                return {
                    full_name: frontendStaff.full_name,
                    professional_email: frontendStaff.professional_email,
                    staff_type: frontendStaff.staff_type,
                    staff_id: frontendStaff.staff_id,
                    resident_category: frontendStaff.resident_category,
                    training_year: trainingYear,
                    employment_status: frontendStaff.employment_status,
                    department_id: frontendStaff.department_id,
                    specialization: frontendStaff.specialization,
                    years_experience: frontendStaff.years_experience,
                    biography: frontendStaff.biography,
                    work_phone: frontendStaff.office_phone,
                    mobile_phone: frontendStaff.mobile_phone,
                    medical_license: frontendStaff.medical_license,
                    date_of_birth: frontendStaff.date_of_birth
                };
            },
            
            // Resident Rotations
            mapResidentRotation: (dbRotation) => {
                return {
                    id: dbRotation.id,
                    rotation_id: dbRotation.rotation_id,
                    resident_id: dbRotation.resident_id,
                    training_unit_id: dbRotation.training_unit_id,
                    supervisor_id: dbRotation.supervising_attending_id,
                    start_date: dbRotation.start_date,
                    end_date: dbRotation.end_date,
                    status: dbRotation.rotation_status,
                    goals: dbRotation.goals,
                    notes: dbRotation.notes || dbRotation.clinical_notes,
                    rotation_category: dbRotation.rotation_category,
                    supervisor_evaluation: dbRotation.supervisor_evaluation,
                    created_at: dbRotation.created_at,
                    updated_at: dbRotation.updated_at
                };
            },
            
            mapResidentRotationToDb: (frontendRotation) => {
                return {
                    rotation_id: frontendRotation.rotation_id || Utils.generateId('ROT'),
                    resident_id: frontendRotation.resident_id,
                    training_unit_id: frontendRotation.training_unit_id,
                    supervising_attending_id: frontendRotation.supervisor_id,
                    start_date: frontendRotation.start_date,
                    end_date: frontendRotation.end_date,
                    rotation_status: frontendRotation.status || 'active',
                    goals: frontendRotation.goals,
                    clinical_notes: frontendRotation.notes,
                    rotation_category: frontendRotation.rotation_category || 'clinical_rotation'
                };
            },
            
            // Staff Absences (Leave Requests)
            mapStaffAbsence: (dbAbsence) => {
                return {
                    id: dbAbsence.id,
                    request_id: dbAbsence.request_id,
                    staff_member_id: dbAbsence.staff_member_id,
                    absence_reason: dbAbsence.leave_category,
                    start_date: dbAbsence.leave_start_date,
                    end_date: dbAbsence.leave_end_date,
                    total_days: dbAbsence.total_days,
                    notes: dbAbsence.leave_reason || dbAbsence.coverage_notes,
                    status: dbAbsence.approval_status,
                    coverage_required: dbAbsence.coverage_required,
                    coverage_assigned: dbAbsence.coverage_assigned,
                    coverage_notes: dbAbsence.coverage_notes,
                    reviewed_by: dbAbsence.reviewed_by,
                    reviewed_at: dbAbsence.reviewed_at,
                    review_notes: dbAbsence.review_notes,
                    leave_type: dbAbsence.leave_type,
                    staff_name: dbAbsence.staff_name,
                    staff_id: dbAbsence.staff_id,
                    created_at: dbAbsence.created_at,
                    updated_at: dbAbsence.updated_at
                };
            },
            
            mapStaffAbsenceToDb: (frontendAbsence) => {
                return {
                    request_id: frontendAbsence.request_id || Utils.generateId('ABS'),
                    staff_member_id: frontendAbsence.staff_member_id,
                    leave_category: frontendAbsence.absence_reason,
                    leave_start_date: frontendAbsence.start_date,
                    leave_end_date: frontendAbsence.end_date,
                    total_days: FieldMappers.calculateDuration(frontendAbsence.start_date, frontendAbsence.end_date),
                    leave_reason: frontendAbsence.notes,
                    coverage_required: true,
                    coverage_assigned: !!frontendAbsence.replacement_staff_id,
                    coverage_notes: frontendAbsence.coverage_instructions || frontendAbsence.notes,
                    approval_status: frontendAbsence.status || 'pending_review'
                };
            },
            
            // Announcements
            mapAnnouncement: (dbAnnouncement) => {
                return {
                    id: dbAnnouncement.id,
                    announcement_id: dbAnnouncement.announcement_id,
                    announcement_title: dbAnnouncement.announcement_title,
                    announcement_content: dbAnnouncement.announcement_content,
                    priority_level: dbAnnouncement.priority_level,
                    publish_start_date: dbAnnouncement.publish_start_date,
                    publish_end_date: dbAnnouncement.publish_end_date,
                    target_audience: dbAnnouncement.target_audience || 'all',
                    created_by: dbAnnouncement.created_by,
                    created_by_name: dbAnnouncement.created_by_name,
                    announcement_type: dbAnnouncement.announcement_type,
                    visible_to_roles: dbAnnouncement.visible_to_roles,
                    created_at: dbAnnouncement.created_at,
                    updated_at: dbAnnouncement.updated_at
                };
            },
            
            mapAnnouncementToDb: (frontendAnnouncement) => {
                return {
                    announcement_id: frontendAnnouncement.announcement_id || Utils.generateId('ANN'),
                    announcement_title: frontendAnnouncement.announcement_title,
                    announcement_content: frontendAnnouncement.announcement_content,
                    priority_level: frontendAnnouncement.priority_level,
                    publish_start_date: frontendAnnouncement.publish_start_date,
                    publish_end_date: frontendAnnouncement.publish_end_date,
                    target_audience: frontendAnnouncement.target_audience,
                    announcement_type: 'department',
                    visible_to_roles: ['viewing_doctor']
                };
            },
            
            // On-call Schedule
            mapOnCallSchedule: (dbSchedule) => {
                return {
                    id: dbSchedule.id,
                    schedule_id: dbSchedule.schedule_id,
                    duty_date: dbSchedule.duty_date,
                    shift_type: dbSchedule.shift_type,
                    primary_physician_id: dbSchedule.primary_physician_id,
                    backup_physician_id: dbSchedule.backup_physician_id,
                    start_time: dbSchedule.start_time,
                    end_time: dbSchedule.end_time,
                    coverage_notes: dbSchedule.coverage_notes,
                    created_by: dbSchedule.created_by,
                    status: dbSchedule.status || 'scheduled',
                    created_at: dbSchedule.created_at,
                    updated_at: dbSchedule.updated_at
                };
            },
            
            mapOnCallScheduleToDb: (frontendSchedule) => {
                return {
                    schedule_id: frontendSchedule.schedule_id || Utils.generateId('ONCALL'),
                    duty_date: frontendSchedule.duty_date,
                    shift_type: frontendSchedule.shift_type,
                    primary_physician_id: frontendSchedule.primary_physician_id,
                    backup_physician_id: frontendSchedule.backup_physician_id,
                    start_time: frontendSchedule.start_time,
                    end_time: frontendSchedule.end_time,
                    coverage_notes: frontendSchedule.coverage_notes,
                    status: frontendSchedule.status || 'scheduled'
                };
            },
            
            // Users
            mapUser: (dbUser) => {
                return {
                    id: dbUser.id,
                    email: dbUser.email,
                    full_name: dbUser.full_name,
                    user_role: dbUser.user_role,
                    department: dbUser.department,
                    department_id: dbUser.department_id,
                    user_id: dbUser.user_id,
                    clinic_unit: dbUser.clinic_unit,
                    phone_number: dbUser.phone_number,
                    avatar_url: dbUser.avatar_url,
                    account_status: dbUser.account_status,
                    notifications_enabled: dbUser.notifications_enabled,
                    absence_notifications: dbUser.absence_notifications,
                    announcement_notifications: dbUser.announcement_notifications,
                    created_at: dbUser.created_at,
                    updated_at: dbUser.updated_at
                };
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
                    user_id: userId || currentUser?.value?.id,
                    user_name: currentUser?.value?.full_name || 'System',
                    user_role: currentUser?.value?.user_role || 'system',
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
                    
                    // Filter states
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
                    
                    // Modal states
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
                    
                    const trainingUnitModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            unit_name: '',
                            unit_code: '',
                            department_id: '',
                            supervisor_id: '',
                            max_capacity: 10,
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
                            coverage_notes: '',
                            status: 'scheduled'
                        }
                    });
                    
                    const absenceModal = reactive({
                        show: false,
                        mode: 'add',
                        form: {
                            staff_member_id: '',
                            absence_reason: '',
                            start_date: '',
                            end_date: '',
                            notes: '',
                            replacement_staff_id: '',
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
                        }
                    });
                    
                    // Data stores
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
                    
                    // UI state
                    const toasts = ref([]);
                    const activeAlerts = ref([]);
                    const staffSearch = ref('');
                    const unreadNotifications = ref(0);
                    
                    // Loading states
                    const loadingStats = ref(false);
                    const loadingStaff = ref(false);
                    const loadingDepartments = ref(false);
                    const loadingTrainingUnits = ref(false);
                    const loadingRotations = ref(false);
                    const loadingAbsences = ref(false);
                    const loadingSchedule = ref(false);
                    const loadingAnnouncements = ref(false);
                    const loadingAuditLogs = ref(false);
                    
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
                    
                    // ============ HELPER FUNCTIONS ============
                    const hasPermission = (resource, action) => {
                        if (!currentUser.value) return false;
                        if (currentUser.value.user_role === 'system_admin') return true;
                        return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action);
                    };
                    
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
                    
                    // ============ DATA LOADING FUNCTIONS ============
                    const loadMedicalStaff = async () => {
                        loadingStaff.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.MEDICAL_STAFF)
                                .select('*')
                                .order('full_name');
                            if (error) throw error;
                            medicalStaff.value = data.map(staff => FieldMappers.mapMedicalStaff(staff));
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
                        } catch (error) {
                            console.error('Error loading departments:', error);
                            departments.value = [];
                        } finally {
                            loadingDepartments.value = false;
                        }
                    };
                    
                    const loadTrainingUnits = async () => {
                        loadingTrainingUnits.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.TRAINING_UNITS)
                                .select('*')
                                .order('unit_name');
                            if (error) throw error;
                            trainingUnits.value = data.map(unit => FieldMappers.mapTrainingUnit(unit));
                        } catch (error) {
                            console.error('Error loading training units:', error);
                            trainingUnits.value = [];
                        } finally {
                            loadingTrainingUnits.value = false;
                        }
                    };
                    
                    const loadResidentRotations = async () => {
                        loadingRotations.value = true;
                        try {
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                .select('*')
                                .order('start_date', { ascending: false });
                            if (error) throw error;
                            residentRotations.value = data.map(rotation => FieldMappers.mapResidentRotation(rotation));
                        } catch (error) {
                            console.error('Error loading resident rotations:', error);
                            residentRotations.value = [];
                        } finally {
                            loadingRotations.value = false;
                        }
                    };
                    
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
                            staffAbsences.value = data.map(absence => FieldMappers.mapStaffAbsence(absence));
                        } catch (error) {
                            console.error('Error loading staff absences:', error);
                            staffAbsences.value = [];
                        } finally {
                            loadingAbsences.value = false;
                        }
                    };
                    
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
                            onCallSchedule.value = data.map(schedule => FieldMappers.mapOnCallSchedule(schedule));
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
                            recentAnnouncements.value = data.map(announcement => FieldMappers.mapAnnouncement(announcement));
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
                            users.value = data.map(user => FieldMappers.mapUser(user));
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
                    
                    // ============ DATA SAVE FUNCTIONS ============
                    const saveMedicalStaff = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('medical_staff', medicalStaffModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            // Validate form
                            Validators.required(medicalStaffModal.form.full_name, 'Full name');
                            Validators.required(medicalStaffModal.form.staff_type, 'Staff type');
                            Validators.required(medicalStaffModal.form.employment_status, 'Employment status');
                            if (medicalStaffModal.form.professional_email) {
                                Validators.email(medicalStaffModal.form.professional_email, 'Email');
                            }
                            
                            const dbFormData = FieldMappers.mapMedicalStaffToDb(medicalStaffModal.form);
                            let result;
                            
                            if (medicalStaffModal.mode === 'add') {
                                dbFormData.staff_id = dbFormData.staff_id || Utils.generateId('MD');
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.MEDICAL_STAFF)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.mapMedicalStaff(data);
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
                                result = FieldMappers.mapMedicalStaff(data);
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
                    
                    const saveTrainingUnit = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('training_units', trainingUnitModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            Validators.required(trainingUnitModal.form.unit_name, 'Unit name');
                            Validators.required(trainingUnitModal.form.unit_code, 'Unit code');
                            Validators.required(trainingUnitModal.form.department_id, 'Department');
                            Validators.minValue(trainingUnitModal.form.max_capacity, 'Max capacity', 1);
                            
                            const dbFormData = FieldMappers.mapTrainingUnitToDb(trainingUnitModal.form);
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
                                result = FieldMappers.mapTrainingUnit(data);
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
                                result = FieldMappers.mapTrainingUnit(data);
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
                    
                    const saveRotation = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('resident_rotations', rotationModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            Validators.required(rotationModal.form.resident_id, 'Resident');
                            Validators.required(rotationModal.form.training_unit_id, 'Training unit');
                            Validators.required(rotationModal.form.start_date, 'Start date');
                            Validators.required(rotationModal.form.end_date, 'End date');
                            Validators.date(rotationModal.form.start_date, 'Start date');
                            Validators.date(rotationModal.form.end_date, 'End date');
                            
                            const startDate = new Date(rotationModal.form.start_date);
                            const endDate = new Date(rotationModal.form.end_date);
                            if (endDate <= startDate) {
                                throw new Error('End date must be after start date');
                            }
                            
                            const dbFormData = FieldMappers.mapResidentRotationToDb(rotationModal.form);
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
                                result = FieldMappers.mapResidentRotation(data);
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
                                result = FieldMappers.mapResidentRotation(data);
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
                    
                    const saveOnCall = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('oncall_schedule', onCallModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            Validators.required(onCallModal.form.duty_date, 'Duty date');
                            Validators.required(onCallModal.form.primary_physician_id, 'Primary physician');
                            Validators.date(onCallModal.form.duty_date, 'Duty date');
                            
                            const dbFormData = FieldMappers.mapOnCallScheduleToDb(onCallModal.form);
                            let result;
                            
                            if (onCallModal.mode === 'add') {
                                dbFormData.created_at = new Date().toISOString();
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.created_by = currentUser.value?.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                    .insert([dbFormData])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.mapOnCallSchedule(data);
                                onCallSchedule.value.unshift(result);
                                showToast('Success', 'On-call schedule added successfully', 'success');
                            } else {
                                dbFormData.updated_at = new Date().toISOString();
                                dbFormData.id = onCallModal.form.id;
                                
                                const { data, error } = await supabaseClient
                                    .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                    .update(dbFormData)
                                    .eq('id', dbFormData.id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                result = FieldMappers.mapOnCallSchedule(data);
                                const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                                if (index !== -1) onCallSchedule.value[index] = result;
                                showToast('Success', 'On-call schedule updated successfully', 'success');
                            }
                            
                            onCallModal.show = false;
                            resetOnCallModal();
                            return result;
                        } catch (error) {
                            console.error('Error saving on-call schedule:', error);
                            showToast('Error', error.message, 'error');
                            throw error;
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    const saveAbsence = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('staff_absence', absenceModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            Validators.required(absenceModal.form.staff_member_id, 'Staff member');
                            Validators.required(absenceModal.form.absence_reason, 'Absence reason');
                            Validators.required(absenceModal.form.start_date, 'Start date');
                            Validators.required(absenceModal.form.end_date, 'End date');
                            Validators.date(absenceModal.form.start_date, 'Start date');
                            Validators.date(absenceModal.form.end_date, 'End date');
                            
                            const startDate = new Date(absenceModal.form.start_date);
                            const endDate = new Date(absenceModal.form.end_date);
                            if (endDate <= startDate) {
                                throw new Error('End date must be after start date');
                            }
                            
                            const dbFormData = FieldMappers.mapStaffAbsenceToDb(absenceModal.form);
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
                                result = FieldMappers.mapStaffAbsence(data);
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
                                result = FieldMappers.mapStaffAbsence(data);
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
                    
                    const saveCommunication = async () => {
                        saving.value = true;
                        try {
                            if (!hasPermission('communications', 'create')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            Validators.required(communicationsModal.form.announcement_title, 'Title');
                            Validators.required(communicationsModal.form.announcement_content, 'Content');
                            Validators.required(communicationsModal.form.publish_start_date, 'Publish date');
                            Validators.date(communicationsModal.form.publish_start_date, 'Publish date');
                            
                            const dbFormData = FieldMappers.mapAnnouncementToDb(communicationsModal.form);
                            dbFormData.created_by = currentUser.value?.id;
                            dbFormData.created_by_name = currentUser.value?.full_name;
                            dbFormData.created_at = new Date().toISOString();
                            dbFormData.updated_at = new Date().toISOString();
                            
                            const { data, error } = await supabaseClient
                                .from(TABLE_NAMES.ANNOUNCEMENTS)
                                .insert([dbFormData])
                                .select()
                                .single();
                            
                            if (error) throw error;
                            
                            const result = FieldMappers.mapAnnouncement(data);
                            recentAnnouncements.value.unshift(result);
                            communicationsModal.show = false;
                            showToast('Success', 'Announcement posted successfully', 'success');
                            await logAuditEvent('CREATE', 'announcements', { announcement_id: data.id, title: data.announcement_title });
                            return result;
                        } catch (error) {
                            console.error('Error saving communication:', error);
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
                                } catch (error) {
                                    console.error('Error deleting on-call schedule:', error);
                                    showToast('Error', error.message, 'error');
                                }
                            }
                        });
                    };
                    
                    const deleteAbsence = (absenceId) => {
                        showConfirmation({
                            title: 'Delete Absence Record',
                            message: 'Are you sure you want to delete this absence record?',
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => {
                                try {
                                    if (!hasPermission('staff_absence', 'delete')) {
                                        throw new Error('Insufficient permissions');
                                    }
                                    const { error } = await supabaseClient
                                        .from(TABLE_NAMES.STAFF_ABSENCES)
                                        .delete()
                                        .eq('id', absenceId);
                                    if (error) throw error;
                                    const index = staffAbsences.value.findIndex(a => a.id === absenceId);
                                    if (index !== -1) staffAbsences.value.splice(index, 1);
                                    showToast('Deleted', 'Absence record has been removed', 'success');
                                } catch (error) {
                                    console.error('Error deleting absence record:', error);
                                    showToast('Error', error.message, 'error');
                                }
                            }
                        });
                    };
                    
                    // ============ RESET FUNCTIONS ============
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
                    
                    const resetTrainingUnitModal = () => {
                        trainingUnitModal.form = {
                            unit_name: '',
                            unit_code: '',
                            department_id: '',
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
                    
                    const resetOnCallModal = () => {
                        onCallModal.form = {
                            duty_date: new Date().toISOString().split('T')[0],
                            shift_type: 'primary_call',
                            start_time: '08:00',
                            end_time: '17:00',
                            primary_physician_id: '',
                            backup_physician_id: '',
                            coverage_notes: '',
                            status: 'scheduled'
                        };
                    };
                    
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
                    
                    const showAddOnCallModal = () => {
                        if (!hasPermission('oncall_schedule', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        onCallModal.mode = 'add';
                        onCallModal.show = true;
                        resetOnCallModal();
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
                            staff_member_id: absence.staff_member_id,
                            absence_reason: absence.absence_reason,
                            start_date: absence.start_date,
                            end_date: absence.end_date,
                            notes: absence.notes
                        };
                    };
                    
                    const showCommunicationsModal = () => {
                        if (!hasPermission('communications', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        communicationsModal.show = true;
                        communicationsModal.activeTab = 'announcement';
                        communicationsModal.form.publish_start_date = new Date().toISOString().split('T')[0];
                    };
                    
                    // ============ AUTHENTICATION ============
                    const handleLogin = async () => {
                        loading.value = true;
                        try {
                            const email = loginForm.email.trim().toLowerCase();
                            const password = loginForm.password;
                            Validators.required(email, 'Email');
                            Validators.required(password, 'Password');
                            Validators.email(email, 'Email');
                            
                            if (email === 'admin@neumocare.org' && password === 'password123') {
                                // Try to fetch user from database
                                const { data: users, error } = await supabaseClient
                                    .from(TABLE_NAMES.USERS)
                                    .select('*')
                                    .eq('email', email)
                                    .limit(1);
                                
                                if (error || !users || users.length === 0) {
                                    // Create demo admin user
                                    currentUser.value = {
                                        id: Utils.generateId('USR'),
                                        email: email,
                                        full_name: 'System Administrator',
                                        user_role: 'system_admin',
                                        department: 'Administration',
                                        account_status: 'active'
                                    };
                                } else {
                                    currentUser.value = FieldMappers.mapUser(users[0]);
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
                    
                    const filteredAbsences = computed(() => {
                        let filtered = staffAbsences.value;
                        if (absenceFilter.staff_id) {
                            filtered = filtered.filter(a => a.staff_member_id === absenceFilter.staff_id);
                        }
                        if (absenceFilter.status) {
                            filtered = filtered.filter(a => a.status === absenceFilter.status);
                        }
                        if (absenceFilter.start_date) {
                            filtered = filtered.filter(a => a.start_date >= absenceFilter.start_date);
                        }
                        return filtered;
                    });
                    
                    const residents = computed(() => {
                        return medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident');
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
                    
                    const todaysOnCall = computed(() => {
                        const today = new Date().toISOString().split('T')[0];
                        return onCallSchedule.value.filter(schedule => schedule.duty_date === today)
                            .map(schedule => ({
                                ...schedule,
                                physician_name: getStaffName(schedule.primary_physician_id),
                                role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                                contact_number: 'Ext. 5555'
                            }));
                    });
                    
                    const availableAttendings = computed(() => {
                        return medicalStaff.value.filter(staff => 
                            staff.staff_type === 'attending_physician' &&
                            staff.employment_status === 'active'
                        );
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
                    
                    const availableStaff = computed(() => {
                        return medicalStaff.value.filter(staff => staff.employment_status === 'active');
                    });
                    
                    // ============ UTILITY GETTER FUNCTIONS ============
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
                    
                    const getTrainingUnitName = (unitId) => {
                        if (!unitId) return 'Unknown Unit';
                        const unit = trainingUnits.value.find(u => u.id === unitId);
                        return unit ? unit.unit_name : `Unit ${unitId?.substring(0, 8) || 'Unknown'}`;
                    };
                    
                    const getSupervisorName = (supervisorId) => {
                        if (!supervisorId) return 'Not assigned';
                        return getStaffName(supervisorId);
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
                    
                    const formatEmploymentStatus = (status) => {
                        const statuses = { active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' };
                        return statuses[status] || status;
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
                        medicalStaffModal,
                        trainingUnitModal,
                        rotationModal,
                        onCallModal,
                        absenceModal,
                        communicationsModal,
                        
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
                        filteredMedicalStaff,
                        filteredRotations,
                        filteredAbsences,
                        todaysOnCall,
                        residents,
                        availableAttendings,
                        availableResidents,
                        availableTrainingUnits,
                        availableStaff,
                        
                        // Core Functions
                        hasPermission,
                        
                        // Utility Functions
                        getInitials: Utils.getInitials,
                        formatDate: Utils.formatDate,
                        formatDateTime: Utils.formatDateTime,
                        formatTimeAgo: Utils.formatTimeAgo,
                        formatStaffType,
                        formatEmploymentStatus,
                        formatTrainingLevel,
                        formatRotationStatus,
                        formatAbsenceReason,
                        formatAbsenceStatus,
                        calculateAbsenceDuration,
                        getDepartmentName,
                        getStaffName,
                        getTrainingUnitName,
                        getSupervisorName,
                        
                        // Navigation Functions
                        switchView,
                        getCurrentTitle,
                        
                        // Modal Functions
                        showConfirmation,
                        confirmAction,
                        cancelConfirmation,
                        showAddMedicalStaffModal,
                        editMedicalStaff,
                        saveMedicalStaff,
                        deleteMedicalStaff,
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
                        deleteAbsence,
                        showCommunicationsModal,
                        saveCommunication,
                        
                        // Reset Functions
                        resetMedicalStaffModal,
                        resetTrainingUnitModal,
                        resetRotationModal,
                        resetOnCallModal,
                        resetAbsenceModal,
                        
                        // Authentication Functions
                        handleLogin,
                        handleLogout,
                        
                        // UI Functions
                        removeToast,
                        showToast
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
        
        // ============ TEST DATABASE CONNECTION ============
        async function testAllTables() {
            console.log('Testing all database tables...');
            const tests = [
                { table: TABLE_NAMES.USERS, name: 'Users' },
                { table: TABLE_NAMES.MEDICAL_STAFF, name: 'Medical Staff' },
                { table: TABLE_NAMES.DEPARTMENTS, name: 'Departments' },
                { table: TABLE_NAMES.TRAINING_UNITS, name: 'Training Units' },
                { table: TABLE_NAMES.RESIDENT_ROTATIONS, name: 'Resident Rotations' },
                { table: TABLE_NAMES.STAFF_ABSENCES, name: 'Staff Absences' },
                { table: TABLE_NAMES.ONCALL_SCHEDULE, name: 'On-call Schedule' },
                { table: TABLE_NAMES.ANNOUNCEMENTS, name: 'Announcements' }
            ];
            
            for (const test of tests) {
                try {
                    const { data, error, count } = await supabaseClient
                        .from(test.table)
                        .select('*', { count: 'exact', head: true });
                    
                    if (error) {
                        console.warn(`❌ ${test.name}: ${error.message}`);
                    } else {
                        console.log(`✅ ${test.name}: Connected (${count || 0} records)`);
                    }
                } catch (err) {
                    console.warn(`❌ ${test.name}: ${err.message}`);
                }
            }
        }
        
        // Run test after a short delay
        setTimeout(testAllTables, 1000);
        
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

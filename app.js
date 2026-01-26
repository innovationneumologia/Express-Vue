// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM ============
// PRODUCTION SYSTEM - COMPLETE IMPLEMENTATION
// VERSION 2.0 - ENHANCED WITH ERROR HANDLING & VALIDATION
// =======================================================

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
            STAFF_ABSENCES: 'leave_requests',
            ONCALL_SCHEDULE: 'oncall_schedule',
            ANNOUNCEMENTS: 'department_announcements',
            AUDIT_LOGS: 'audit_logs',
            SYSTEM_SETTINGS: 'system_settings',
            SYSTEM_ROLES: 'system_roles'
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
        
        // ============ CREATE VUE APP WITH ERROR BOUNDARY ============
       // ============ CREATE VUE APP WITH ERROR BOUNDARY ============
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
            
            // Loading states
            const loading = ref(false);
            const saving = ref(false);
            
            // UI states
            const currentView = ref('login');
            const sidebarCollapsed = ref(false);
            const mobileMenuOpen = ref(false);
            const userMenuOpen = ref(false);
            const statsSidebarOpen = ref(false);
            const searchQuery = ref('');
            const searchScope = ref('All');
            const searchFilter = ref('all');
            
            // Filters
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
            
            // ============ MODAL STATES (ALL WITH show: false) ============
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
                    duty_date: '',
                    shift_type: 'backup_call',
                    start_time: '',
                    end_time: '',
                    primary_physician_id: '',
                    backup_physician_id: '',
                    coverage_notes: ''
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
            
            // Add these to your modal states section in app.js
            const absenceDetailsModal = reactive({
                show: false,
                absence: null,
                activeTab: 'details'
            });
            
            const importExportModal = reactive({
                show: false,
                mode: 'import', // 'import' or 'export'
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
            
            // ============ VALIDATION RULES ============
            const ValidationRules = {
                medicalStaff: {
                    full_name: [Validators.required],
                    professional_email: [Validators.required, Validators.email],
                    staff_type: [Validators.required],
                    employment_status: [Validators.required],
                    date_of_birth: [Validators.date],
                    mobile_phone: [Validators.phone],
                    years_experience: [(v) => Validators.minValue(v, 'Years of experience', 0)]
                },
                
                department: {
                    name: [Validators.required],
                    code: [Validators.required],
                    status: [Validators.required]
                },
                
                trainingUnit: {
                    unit_name: [Validators.required],
                    unit_code: [Validators.required],
                    department_id: [Validators.required],
                    max_capacity: [(v) => Validators.minValue(v, 'Max capacity', 1)]
                },
                
                rotation: {
                    resident_id: [Validators.required],
                    training_unit_id: [Validators.required],
                    start_date: [Validators.required, Validators.date],
                    end_date: [Validators.required, Validators.date]
                },
                
                absence: {
                    staff_member_id: [Validators.required],
                    absence_reason: [Validators.required],
                    start_date: [Validators.required, Validators.date],
                    end_date: [Validators.required, Validators.date]
                },
                
                announcement: {
                    announcement_title: [Validators.required],
                    announcement_content: [Validators.required],
                    publish_start_date: [Validators.required, Validators.date]
                }
            };
            
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
            // Add this function:
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
            // Add to your formatting functions
            const getAbsenceTimelineStatus = (absence) => {
                const today = new Date().toISOString().split('T')[0];
                const startDate = absence.start_date;
                const endDate = absence.end_date;
                
                if (today < startDate) {
                    return 'Starts ' + Utils.formatTimeAgo(startDate);
                } else if (today > endDate) {
                    return 'Ended ' + Utils.formatTimeAgo(endDate);
                } else {
                    const start = new Date(startDate);
                    const now = new Date(today);
                    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                    return `Day ${diffDays + 1} of absence`;
                }
            };

            const formatRotationType = (type) => {
                const types = {
                    'clinical': 'Clinical Rotation',
                    'research': 'Research Rotation',
                    'elective': 'Elective Rotation',
                    'required': 'Required Rotation'
                };
                return types[type] || type || 'Clinical Rotation';
            };

            const calculateRotationDuration = (startDate, endDate) => {
                try {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end - start);
                    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                    return diffWeeks + ' weeks';
                } catch {
                    return 'N/A';
                }
            };

            const getResidentTrainingLevel = (residentId) => {
                const resident = medicalStaff.value.find(s => s.id === residentId);
                return resident ? formatTrainingLevel(resident.training_level) : 'N/A';
            };

            const getRotationDepartment = (rotation) => {
                const unit = trainingUnits.value.find(u => u.id === rotation.training_unit_id);
                if (unit && unit.department_id) {
                    return getDepartmentName(unit.department_id);
                }
                return 'N/A';
            };

            const formatEvaluationStatus = (status) => {
                const statuses = {
                    'pending': 'Pending',
                    'in_progress': 'In Progress',
                    'completed': 'Completed',
                    'overdue': 'Overdue'
                };
                return statuses[status] || status || 'Not Started';
            };

            const getEvaluationStatusClass = (status) => {
                const classes = {
                    'pending': 'status-busy',
                    'in_progress': 'status-oncall',
                    'completed': 'status-available',
                    'overdue': 'status-critical'
                };
                return classes[status] || 'badge-secondary';
            };

            const formatFileSize = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            const formatDocumentType = (type) => {
                const types = {
                    'pdf': 'PDF',
                    'doc': 'Word Document',
                    'docx': 'Word Document',
                    'xls': 'Excel',
                    'xlsx': 'Excel',
                    'jpg': 'Image',
                    'png': 'Image',
                    'txt': 'Text File'
                };
                return types[type] || type || 'Document';
            };

            const getDocumentStatusClass = (status) => {
                const classes = {
                    'approved': 'status-available',
                    'pending_review': 'status-busy',
                    'rejected': 'status-critical',
                    'draft': 'status-oncall'
                };
                return classes[status] || 'badge-secondary';
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
            
            const formatResidentCategory = (category) => {
                const categories = {
                    department_internal: 'Department Internal',
                    rotating_other_dept: 'Rotating Other Dept',
                    external_institution: 'External Institution'
                };
                return categories[category] || category;
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
            
            // ============ DATA LOADING FUNCTIONS ============
            const loadMedicalStaff = async () => {
                loadingStaff.value = true;
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.MEDICAL_STAFF)
                        .select('*')
                        .order('full_name');
                    
                    if (error) throw error;
                    medicalStaff.value = data || [];
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
            
            const loadTrainingUnits = async () => {
                loadingTrainingUnits.value = true;
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.TRAINING_UNITS)
                        .select('*')
                        .order('unit_name');
                    
                    if (error) throw error;
                    trainingUnits.value = data || [];
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
                    residentRotations.value = data || [];
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
                    staffAbsences.value = data || [];
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
                    onCallSchedule.value = data || [];
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
                        // Create default settings if not exists
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
            
            // ============ DATA SAVE FUNCTIONS WITH VALIDATION ============
            const saveMedicalStaff = async () => {
                saving.value = true;
                try {
                    // Validate permissions
                    if (!hasPermission('medical_staff', medicalStaffModal.mode === 'add' ? 'create' : 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    // Validate form data
                    Validators.validateForm(medicalStaffModal.form, ValidationRules.medicalStaff);
                    
                    const formData = { ...medicalStaffModal.form };
                    
                    let result;
                    if (medicalStaffModal.mode === 'add') {
                        formData.staff_id = formData.staff_id || Utils.generateId('MD');
                        formData.created_at = new Date().toISOString();
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.MEDICAL_STAFF)
                            .insert([formData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        medicalStaff.value.unshift(result);
                        showToast('Success', 'Medical staff added successfully', 'success');
                        await logAuditEvent('CREATE', 'medical_staff', { staff_id: result.id, name: result.full_name });
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.MEDICAL_STAFF)
                            .update(formData)
                            .eq('id', formData.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
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
                    
                    Validators.validateForm(departmentModal.form, ValidationRules.department);
                    
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
                        await logAuditEvent('CREATE', 'departments', { department_id: result.id, name: result.name });
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
                        await logAuditEvent('UPDATE', 'departments', { department_id: result.id, name: result.name });
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
            
            const saveClinicalUnit = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('system', 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    const formData = { ...clinicalUnitModal.form };
                    
                    if (!formData.name?.trim()) {
                        throw new Error('Unit name is required');
                    }
                    
                    let result;
                    if (clinicalUnitModal.mode === 'add') {
                        formData.created_at = new Date().toISOString();
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.CLINICAL_UNITS)
                            .insert([formData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        clinicalUnits.value.unshift(result);
                        showToast('Success', 'Clinical unit added successfully', 'success');
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.CLINICAL_UNITS)
                            .update(formData)
                            .eq('id', formData.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        const index = clinicalUnits.value.findIndex(u => u.id === result.id);
                        if (index !== -1) clinicalUnits.value[index] = result;
                        
                        showToast('Success', 'Clinical unit updated successfully', 'success');
                    }
                    
                    clinicalUnitModal.show = false;
                    resetClinicalUnitModal();
                    return result;
                } catch (error) {
                    console.error('Error saving clinical unit:', error);
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
                    
                    Validators.validateForm(trainingUnitModal.form, ValidationRules.trainingUnit);
                    
                    const formData = { ...trainingUnitModal.form };
                    
                    let result;
                    if (trainingUnitModal.mode === 'add') {
                        formData.created_at = new Date().toISOString();
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.TRAINING_UNITS)
                            .insert([formData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        trainingUnits.value.unshift(result);
                        showToast('Success', 'Training unit added successfully', 'success');
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.TRAINING_UNITS)
                            .update(formData)
                            .eq('id', formData.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
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
                    
                    Validators.validateForm(rotationModal.form, ValidationRules.rotation);
                    
                    // Validate date logic
                    const startDate = new Date(rotationModal.form.start_date);
                    const endDate = new Date(rotationModal.form.end_date);
                    if (endDate <= startDate) {
                        throw new Error('End date must be after start date');
                    }
                    
                    const formData = { ...rotationModal.form };
                    
                    let result;
                    if (rotationModal.mode === 'add') {
                        formData.rotation_id = Utils.generateId('ROT');
                        formData.created_at = new Date().toISOString();
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                            .insert([formData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        residentRotations.value.unshift(result);
                        showToast('Success', 'Rotation added successfully', 'success');
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                            .update(formData)
                            .eq('id', formData.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
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
                    
                    const formData = { ...onCallModal.form };
                    
                    if (!formData.duty_date) {
                        throw new Error('Duty date is required');
                    }
                    
                    if (!formData.primary_physician_id) {
                        throw new Error('Primary physician is required');
                    }
                    
                    let result;
                    if (onCallModal.mode === 'add') {
                        formData.created_at = new Date().toISOString();
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.ONCALL_SCHEDULE)
                            .insert([formData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        onCallSchedule.value.unshift(result);
                        showToast('Success', 'On-call schedule added successfully', 'success');
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.ONCALL_SCHEDULE)
                            .update(formData)
                            .eq('id', formData.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
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
                    
                    Validators.validateForm(absenceModal.form, ValidationRules.absence);
                    
                    // Validate date logic
                    const startDate = new Date(absenceModal.form.start_date);
                    const endDate = new Date(absenceModal.form.end_date);
                    if (endDate <= startDate) {
                        throw new Error('End date must be after start date');
                    }
                    
                    const formData = { 
                        ...absenceModal.form,
                        leave_category: absenceModal.form.absence_reason,
                        leave_start_date: absenceModal.form.start_date,
                        leave_end_date: absenceModal.form.end_date
                    };
                    
                    let result;
                    if (absenceModal.mode === 'add') {
                        formData.created_at = new Date().toISOString();
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.STAFF_ABSENCES)
                            .insert([formData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        staffAbsences.value.unshift(result);
                        showToast('Success', 'Absence request submitted successfully', 'success');
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.STAFF_ABSENCES)
                            .update(formData)
                            .eq('id', formData.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
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
                    
                    Validators.validateForm(communicationsModal.form, ValidationRules.announcement);
                    
                    const announcementData = {
                        announcement_id: Utils.generateId('ANN'),
                        announcement_title: communicationsModal.form.announcement_title,
                        announcement_content: communicationsModal.form.announcement_content,
                        announcement_type: 'department',
                        priority_level: communicationsModal.form.priority_level,
                        visible_to_roles: ['viewing_doctor'],
                        publish_start_date: communicationsModal.form.publish_start_date,
                        publish_end_date: communicationsModal.form.publish_end_date || null,
                        created_by: currentUser.value?.id,
                        created_by_name: currentUser.value?.full_name,
                        target_audience: communicationsModal.form.target_audience,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.ANNOUNCEMENTS)
                        .insert([announcementData])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    recentAnnouncements.value.unshift(data);
                    communicationsModal.show = false;
                    showToast('Success', 'Announcement posted successfully', 'success');
                    await logAuditEvent('CREATE', 'announcements', { announcement_id: data.id, title: data.announcement_title });
                    
                    return data;
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
            
            const deleteDepartment = (departmentId) => {
                const department = departments.value.find(d => d.id === departmentId);
                if (!department) return;
                
                showConfirmation({
                    title: 'Delete Department',
                    message: `Are you sure you want to delete ${department.name}? This action cannot be undone.`,
                    icon: 'fa-trash',
                    confirmButtonText: 'Delete',
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            if (!hasPermission('system', 'update')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const { error } = await supabaseClient
                                .from(TABLE_NAMES.DEPARTMENTS)
                                .delete()
                                .eq('id', departmentId);
                            
                            if (error) throw error;
                            
                            const index = departments.value.findIndex(d => d.id === departmentId);
                            if (index !== -1) departments.value.splice(index, 1);
                            
                            showToast('Deleted', `${department.name} has been removed`, 'success');
                            await logAuditEvent('DELETE', 'departments', { department_id: departmentId, name: department.name });
                        } catch (error) {
                            console.error('Error deleting department:', error);
                            showToast('Error', error.message, 'error');
                        }
                    }
                });
            };
            
            // ============ HELPER FUNCTIONS ============
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
                    duty_date: '',
                    shift_type: 'backup_call',
                    start_time: '',
                    end_time: '',
                    primary_physician_id: '',
                    backup_physician_id: '',
                    coverage_notes: ''
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
                onCallModal.form.duty_date = new Date().toISOString().split('T')[0];
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
                    absence_reason: absence.leave_category,
                    start_date: absence.leave_start_date,
                    end_date: absence.leave_end_date,
                    replacement_staff_id: absence.replacement_staff_id || ''
                };
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
            
            const showQuickPlacementModal = () => {
                if (!hasPermission('placements', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                quickPlacementModal.show = true;
                quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
            };
            
            const showBulkAssignModal = () => {
                if (!hasPermission('training_units', 'assign')) {
                    showToast('Permission Denied', 'You need assign permission', 'error');
                    return;
                }
                
                bulkAssignModal.show = true;
                bulkAssignModal.start_date = new Date().toISOString().split('T')[0];
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
            
            const showAddRoleModal = () => {
                if (!hasPermission('permissions', 'manage')) {
                    showToast('Permission Denied', 'You need manage permission', 'error');
                    return;
                }
                
                roleModal.mode = 'add';
                roleModal.show = true;
                roleModal.form.name = '';
                roleModal.form.description = '';
                roleModal.form.permissions = [];
            };
            
            const showUserProfile = () => {
                userProfileModal.show = true;
                userProfileModal.form = {
                    full_name: currentUser.value?.full_name || '',
                    email: currentUser.value?.email || '',
                    phone: currentUser.value?.phone_number || '',
                    department_id: currentUser.value?.department_id || '',
                    notifications_enabled: currentUser.value?.notifications_enabled ?? true,
                    absence_notifications: currentUser.value?.absence_notifications ?? true,
                    announcement_notifications: currentUser.value?.announcement_notifications ?? true
                };
            };
            
            const showSystemSettingsModal = () => {
                if (!hasPermission('system', 'read')) {
                    showToast('Permission Denied', 'You need read permission', 'error');
                    return;
                }
                
                systemSettingsModal.show = true;
                systemSettingsModal.settings = { ...systemSettings.value };
            };
            
            const showPermissionManager = () => {
                if (!hasPermission('permissions', 'manage')) {
                    showToast('Permission Denied', 'You need manage permission', 'error');
                    return;
                }
                
                switchView('permission_manager');
            };
            
            // ============ VIEW FUNCTIONS ============
            const viewStaffDetails = (staff) => {
                staffDetailsModal.show = true;
                staffDetailsModal.staff = staff;
                staffDetailsModal.activeTab = 'personal';
                
                // Load staff statistics
                const rotations = residentRotations.value.filter(r => r.resident_id === staff.id);
                const oncallShifts = onCallSchedule.value.filter(s => s.primary_physician_id === staff.id).length;
                const absences = staffAbsences.value.filter(a => a.staff_member_id === staff.id);
                const supervisionCount = residentRotations.value.filter(r => r.supervisor_id === staff.id).length;
                
                staffDetailsModal.stats = {
                    completedRotations: rotations.filter(r => r.status === 'completed').length,
                    oncallShifts: oncallShifts,
                    absenceDays: absences.reduce((total, absence) => {
                        return total + calculateAbsenceDuration(absence.leave_start_date, absence.leave_end_date);
                    }, 0),
                    supervisionCount: supervisionCount
                };
                
                // Find current rotation
                const currentRotation = rotations.find(r => r.status === 'active');
                staffDetailsModal.currentRotation = currentRotation 
                    ? `${getTrainingUnitName(currentRotation.training_unit_id)} (${Utils.formatDate(currentRotation.start_date)} - ${Utils.formatDate(currentRotation.end_date)})`
                    : 'No active rotation';
                
                // Find next on-call
                const today = new Date().toISOString().split('T')[0];
                const nextOncall = onCallSchedule.value
                    .filter(s => s.primary_physician_id === staff.id && s.duty_date >= today)
                    .sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date))[0];
                
                staffDetailsModal.nextOncall = nextOncall
                    ? `${Utils.formatDate(nextOncall.duty_date)} (${nextOncall.shift_type})`
                    : 'No upcoming on-call';
            };
            
            const assignRotationToStaff = (staff) => {
                if (!hasPermission('resident_rotations', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                if (staff.staff_type !== 'medical_resident') {
                    showToast('Error', 'Only residents can be assigned rotations', 'error');
                    return;
                }
                
                rotationModal.mode = 'add';
                rotationModal.show = true;
                rotationModal.form.resident_id = staff.id;
                rotationModal.form.start_date = new Date().toISOString().split('T')[0];
                
                // Set end date 4 weeks from now
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 28);
                rotationModal.form.end_date = endDate.toISOString().split('T')[0];
            };
            
            const assignResidentToUnit = (unit) => {
                if (!hasPermission('training_units', 'assign')) {
                    showToast('Permission Denied', 'You need assign permission', 'error');
                    return;
                }
                
                quickPlacementModal.show = true;
                quickPlacementModal.training_unit_id = unit.id;
                quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
            };
            
            const removeResidentFromUnit = (residentId, unitId) => {
                showConfirmation({
                    title: 'Remove Resident',
                    message: 'Are you sure you want to remove this resident from the training unit?',
                    icon: 'fa-user-times',
                    confirmButtonText: 'Remove',
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            // Find and update the rotation
                            const rotation = residentRotations.value.find(r => 
                                r.resident_id === residentId && 
                                r.training_unit_id === unitId &&
                                r.status === 'active'
                            );
                            
                            if (rotation) {
                                const { error } = await supabaseClient
                                    .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                                    .eq('id', rotation.id);
                                
                                if (error) throw error;
                                
                                // Update local state
                                rotation.status = 'cancelled';
                                showToast('Success', 'Resident removed from training unit', 'success');
                            }
                        } catch (error) {
                            console.error('Error removing resident:', error);
                            showToast('Error', error.message, 'error');
                        }
                    }
                });
            };
            
            const assignCoverage = (absence) => {
                if (!hasPermission('staff_absence', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                absenceModal.mode = 'edit';
                absenceModal.show = true;
                absenceModal.form = { 
                    ...absence,
                    absence_reason: absence.leave_category,
                    start_date: absence.leave_start_date,
                    end_date: absence.leave_end_date
                };
            };
            
            const viewRotationDetails = (rotation) => {
                editRotation(rotation);
            };
            
            const viewDepartmentDetails = (department) => {
                editDepartment(department);
            };
            
            const viewAbsenceDetails = (absence) => {
                editAbsence(absence);
            };
            
            // ============ FILTER FUNCTIONS ============
            const applyStaffFilters = () => {
                showToast('Filters Applied', 'Medical staff filters have been applied', 'info');
            };
            
            const resetStaffFilters = () => {
                staffFilter.staff_type = '';
                staffFilter.employment_status = '';
                staffSearch.value = '';
                showToast('Filters Reset', 'All filters have been reset', 'info');
            };
            
            const applyRotationFilters = () => {
                showToast('Filters Applied', 'Rotation filters have been applied', 'info');
            };
            
            const resetRotationFilters = () => {
                rotationFilter.resident_id = '';
                rotationFilter.status = '';
                showToast('Filters Reset', 'Rotation filters have been reset', 'info');
            };
            
            const applyAbsenceFilters = () => {
                showToast('Filters Applied', 'Absence filters have been applied', 'info');
            };
            
            const resetAbsenceFilters = () => {
                absenceFilter.staff_id = '';
                absenceFilter.status = '';
                absenceFilter.start_date = '';
                showToast('Filters Reset', 'Absence filters have been reset', 'info');
            };
            
            const applyAuditFilters = () => {
                showToast('Filters Applied', 'Audit filters have been applied', 'info');
            };
            
            const resetAuditFilters = () => {
                auditFilters.dateRange = '';
                auditFilters.actionType = '';
                auditFilters.userId = '';
                showToast('Filters Reset', 'Audit filters have been reset', 'info');
            };
            
            // ============ SEARCH FUNCTIONS ============
            const handleSearch = () => {
                if (!searchQuery.value.trim()) return;
                
                const scope = searchScope.value.toLowerCase();
                const query = searchQuery.value.toLowerCase();
                
                let results = [];
                
                switch (scope) {
                    case 'all':
                        results.push(...medicalStaff.value.filter(s => 
                            s.full_name.toLowerCase().includes(query) ||
                            s.professional_email?.toLowerCase().includes(query) ||
                            s.staff_id?.toLowerCase().includes(query)
                        ));
                        results.push(...departments.value.filter(d => 
                            d.name.toLowerCase().includes(query) ||
                            d.code.toLowerCase().includes(query)
                        ));
                        results.push(...trainingUnits.value.filter(u => 
                            u.unit_name.toLowerCase().includes(query) ||
                            u.unit_code.toLowerCase().includes(query)
                        ));
                        break;
                        
                    case 'staff':
                        results = medicalStaff.value.filter(s => 
                            s.full_name.toLowerCase().includes(query) ||
                            s.professional_email?.toLowerCase().includes(query) ||
                            s.staff_id?.toLowerCase().includes(query)
                        );
                        break;
                        
                    case 'units':
                        results = trainingUnits.value.filter(u => 
                            u.unit_name.toLowerCase().includes(query) ||
                            u.unit_code.toLowerCase().includes(query)
                        );
                        break;
                }
                
                if (results.length > 0) {
                    showToast('Search Results', `Found ${results.length} result${results.length === 1 ? '' : 's'}`, 'info');
                } else {
                    showToast('Search', 'No results found', 'warning');
                }
            };
            
            const toggleSearchScope = () => {
                const scopes = ['All', 'Staff', 'Patients', 'Units'];
                const currentIndex = scopes.indexOf(searchScope.value);
                searchScope.value = scopes[(currentIndex + 1) % scopes.length];
            };
            
            const setSearchFilter = (filter) => {
                searchFilter.value = filter;
                searchScope.value = filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1);
            };
            
            // ============ AUTHENTICATION ============
            const handleLogin = async () => {
                loading.value = true;
                try {
                    const email = loginForm.email.trim().toLowerCase();
                    const password = loginForm.password;
                    
                    // Validate input
                    Validators.required(email, 'Email');
                    Validators.required(password, 'Password');
                    Validators.email(email, 'Email');
                    
                    // For demo purposes
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
                    filtered = filtered.filter(a => a.approval_status === absenceFilter.status);
                }
                
                if (absenceFilter.start_date) {
                    filtered = filtered.filter(a => a.leave_start_date >= absenceFilter.start_date);
                }
                
                return filtered;
            });
            
            const filteredAuditLogs = computed(() => {
                let filtered = auditLogs.value;
                
                if (auditFilters.dateRange) {
                    filtered = filtered.filter(log => {
                        const logDate = new Date(log.created_at).toISOString().split('T')[0];
                        return logDate === auditFilters.dateRange;
                    });
                }
                
                if (auditFilters.actionType) {
                    filtered = filtered.filter(log => log.action === auditFilters.actionType);
                }
                
                if (auditFilters.userId) {
                    filtered = filtered.filter(log => log.user_id === auditFilters.userId);
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
                    a.leave_start_date <= today && a.leave_end_date >= today && a.approval_status === 'approved'
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
            
            // Add to your return statement
            const showAbsenceDetails = (absence) => {
                absenceDetailsModal.show = true;
                absenceDetailsModal.absence = absence;
                absenceDetailsModal.activeTab = 'details';
            };

            const showImportExportModal = (mode) => {
                importExportModal.show = true;
                importExportModal.mode = mode;
            };

            const showRotationDetails = (rotation) => {
                rotationDetailsModal.show = true;
                rotationDetailsModal.rotation = rotation;
                rotationDetailsModal.activeTab = 'details';
                // You would load additional data here
            };

            const showDashboardCustomizeModal = () => {
                dashboardCustomizeModal.show = true;
            };

            const showAdvancedSearchModal = () => {
                advancedSearchModal.show = true;
            };
                    
            const currentCapacity = computed(() => ({
                er: { current: 12, max: 20, status: 'medium' },
                icu: { current: 6, max: 10, status: 'low' }
            }));
            
            const liveStats = computed(() => ({
                occupancy: Math.floor(Math.random() * 30) + 60,
                occupancyTrend: Math.floor(Math.random() * 10) - 5,
                onDutyStaff: medicalStaff.value.filter(s => s.employment_status === 'active').length,
                staffTrend: 0,
                pendingRequests: staffAbsences.value.filter(a => a.approval_status === 'pending').length,
                erCapacity: { current: 12, max: 20, status: 'medium' },
                icuCapacity: { current: 6, max: 10, status: 'low' }
            }));
            
            const availableAttendings = computed(() => {
                return medicalStaff.value.filter(staff => 
                    staff.staff_type === 'attending_physician' && 
                    staff.employment_status === 'active'
                );
            });
            
            const availableHeadsOfDepartment = computed(() => {
                return availableAttendings.value;
            });
            
            const availableSupervisors = computed(() => {
                return availableAttendings.value;
            });
            
            const availablePhysicians = computed(() => {
                return medicalStaff.value.filter(staff => 
                    ['attending_physician', 'fellow'].includes(staff.staff_type) &&
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
            
            const availableCoverageStaff = computed(() => {
                return availableStaff.value.filter(staff => 
                    staff.staff_type !== 'medical_resident'
                );
            });
            
            // ============ CAPACITY FUNCTIONS ============
            const getCapacityStatus = (capacity) => {
                const percentage = (capacity.current / capacity.max) * 100;
                if (percentage >= 90) return 'high';
                if (percentage >= 70) return 'medium';
                return 'low';
            };
            
            const updateCapacity = async () => {
                try {
                    showToast('Success', 'Capacity updated successfully', 'success');
                } catch (error) {
                    console.error('Error updating capacity:', error);
                    showToast('Error', 'Failed to update capacity', 'error');
                }
            };
            
            // ============ COMMUNICATION FUNCTIONS ============
            const getPriorityColor = (priority) => {
                const colors = {
                    low: 'info',
                    medium: 'warning',
                    high: 'danger',
                    urgent: 'danger'
                };
                return colors[priority] || 'info';
            };
            
            const getCommunicationIcon = (tab) => {
                const icons = {
                    announcement: 'fa-bullhorn',
                    capacity: 'fa-bed',
                    quick: 'fa-comment-medical'
                };
                return icons[tab] || 'fa-comment';
            };
            
            const getCommunicationButtonText = (tab) => {
                const texts = {
                    announcement: 'Post Announcement',
                    capacity: 'Update Capacity',
                    quick: 'Post Update'
                };
                return texts[tab] || 'Save';
            };
            
            const saveQuickPlacement = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('placements', 'create')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    const { resident_id, training_unit_id, start_date, duration, supervisor_id, notes } = quickPlacementModal;
                    
                    if (!resident_id) {
                        throw new Error('Resident is required');
                    }
                    
                    if (!training_unit_id) {
                        throw new Error('Training unit is required');
                    }
                    
                    if (!start_date) {
                        throw new Error('Start date is required');
                    }
                    
                    // Calculate end date
                    const endDate = new Date(start_date);
                    endDate.setDate(endDate.getDate() + (duration * 7));
                    
                    const rotationData = {
                        rotation_id: Utils.generateId('ROT'),
                        resident_id,
                        training_unit_id,
                        start_date,
                        end_date: endDate.toISOString().split('T')[0],
                        supervisor_id: supervisor_id || null,
                        status: 'active',
                        notes,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                        .insert([rotationData])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    residentRotations.value.unshift(data);
                    quickPlacementModal.show = false;
                    showToast('Success', 'Resident placed successfully', 'success');
                    await logAuditEvent('CREATE', 'resident_rotations', { rotation_id: data.id, resident_id: resident_id });
                } catch (error) {
                    console.error('Error saving quick placement:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };
            
            const saveBulkAssignment = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('training_units', 'assign')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    const { selectedResidents, training_unit_id, start_date, duration, supervisor_id } = bulkAssignModal;
                    
                    if (!selectedResidents || selectedResidents.length === 0) {
                        throw new Error('Select at least one resident');
                    }
                    
                    if (!training_unit_id) {
                        throw new Error('Training unit is required');
                    }
                    
                    if (!start_date) {
                        throw new Error('Start date is required');
                    }
                    
                    // Calculate end date
                    const endDate = new Date(start_date);
                    endDate.setDate(endDate.getDate() + (duration * 7));
                    
                    const rotations = selectedResidents.map(residentId => ({
                        rotation_id: Utils.generateId('ROT'),
                        resident_id: residentId,
                        training_unit_id,
                        start_date,
                        end_date: endDate.toISOString().split('T')[0],
                        supervisor_id: supervisor_id || null,
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));
                    
                    const { error } = await supabaseClient
                        .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                        .insert(rotations);
                    
                    if (error) throw error;
                    
                    // Reload rotations
                    await loadResidentRotations();
                    bulkAssignModal.show = false;
                    showToast('Success', `${rotations.length} resident${rotations.length === 1 ? '' : 's'} assigned successfully`, 'success');
                } catch (error) {
                    console.error('Error saving bulk assignment:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };
            
            // ============ PERMISSION MANAGER FUNCTIONS ============
            const editRole = (role) => {
                if (!hasPermission('permissions', 'manage')) {
                    showToast('Permission Denied', 'You need manage permission', 'error');
                    return;
                }
                
                roleModal.mode = 'edit';
                roleModal.show = true;
                roleModal.form = {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions || []
                };
            };
            
            const deleteRole = (roleId) => {
                const role = userRoles.value.find(r => r.id === roleId);
                if (!role) return;
                
                showConfirmation({
                    title: 'Delete Role',
                    message: `Are you sure you want to delete the ${role.name} role? This action cannot be undone.`,
                    icon: 'fa-trash',
                    confirmButtonText: 'Delete',
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            if (!hasPermission('permissions', 'manage')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const { error } = await supabaseClient
                                .from(TABLE_NAMES.SYSTEM_ROLES)
                                .delete()
                                .eq('id', roleId);
                            
                            if (error) throw error;
                            
                            const index = userRoles.value.findIndex(r => r.id === roleId);
                            if (index !== -1) userRoles.value.splice(index, 1);
                            
                            showToast('Deleted', `${role.name} role has been removed`, 'success');
                        } catch (error) {
                            console.error('Error deleting role:', error);
                            showToast('Error', error.message, 'error');
                        }
                    }
                });
            };
            
            const toggleRolePermission = (roleId, permissionId) => {
                showToast('Info', 'Permission toggled - changes not saved to database', 'info');
            };
            
            const editUserPermissions = (user) => {
                showToast('Info', 'Edit user permissions - functionality not implemented', 'info');
            };
            
            // ============ SYSTEM SETTINGS FUNCTIONS ============
            const saveSystemSettings = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('system', 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.SYSTEM_SETTINGS)
                        .upsert([systemSettings.value])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    systemSettings.value = data;
                    showToast('Success', 'System settings saved successfully', 'success');
                    await logAuditEvent('UPDATE', 'system_settings', { settings: data });
                } catch (error) {
                    console.error('Error saving system settings:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };
            
            // ============ USER PROFILE FUNCTIONS ============
            const saveUserProfile = async () => {
                saving.value = true;
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.USERS)
                        .update(userProfileModal.form)
                        .eq('id', currentUser.value.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    currentUser.value = data;
                    userProfileModal.show = false;
                    showToast('Success', 'Profile updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving user profile:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };
            
            // ============ AUDIT LOG FUNCTIONS ============
            const exportAuditLogs = () => {
                showToast('Info', 'Export functionality not implemented', 'info');
            };
            
            // ============ CALENDAR FUNCTIONS ============
            const showAbsenceCalendar = (view) => {
                showToast('Info', `Calendar view: ${view} - functionality not implemented`, 'info');
            };
            
            // ============ NOTIFICATION FUNCTIONS ============
            const showNotifications = () => {
                showToast('Info', 'Notifications panel not implemented', 'info');
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
                
                // Close dropdowns when clicking outside
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
                liveStats,
                currentCapacity,
                filteredMedicalStaff,
                filteredRotations,
                filteredAbsences,
                filteredAuditLogs,
                todaysOnCall,
                residents,
                availableAttendings,
                availableHeadsOfDepartment,
                availableSupervisors,
                availablePhysicians,
                availableResidents,
                availableTrainingUnits,
                availableStaff,
                availableCoverageStaff,
                
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
                formatResidentCategory,
                formatRotationStatus,
                getRotationStatusClass,
                formatAbsenceReason,
                formatAbsenceStatus,
                getAbsenceStatusClass,
                calculateAbsenceDuration,
                formatTimeRange,
                formatAuditAction,
                getDepartmentName,
                getStaffName,
                getTrainingUnitName,
                getSupervisorName,
                getResidentName,
                getDepartmentUnits,
                getUnitResidents,
                getUserName,
                getPriorityColor,
                getCapacityStatus,
                getCommunicationIcon,
                getCommunicationButtonText,
                getAbsenceTimelineStatus,
                formatRotationType,
                calculateRotationDuration,
                getResidentTrainingLevel,
                getRotationDepartment,
                formatEvaluationStatus,
                getEvaluationStatusClass,
                formatFileSize,
                formatDocumentType,
                getDocumentStatusClass,
                
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
                deleteDepartment,
                showAddClinicalUnitModal,
                editClinicalUnit,
                saveClinicalUnit,
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
                assignCoverage,
                deleteAbsence,
                saveAbsence,
                showQuickPlacementModal,
                saveQuickPlacement,
                showBulkAssignModal,
                saveBulkAssignment,
                showCommunicationsModal,
                saveCommunication,
                showAddRoleModal,
                editRole,
                deleteRole,
                toggleRolePermission,
                editUserPermissions,
                showUserProfile,
                saveUserProfile,
                showSystemSettingsModal,
                saveSystemSettings,
                showPermissionManager,
                showAbsenceDetails,
                showImportExportModal,
                showRotationDetails,
                showDashboardCustomizeModal,
                showAdvancedSearchModal,
                
                // View Functions
                viewStaffDetails,
                assignRotationToStaff,
                assignResidentToUnit,
                removeResidentFromUnit,
                viewRotationDetails,
                viewDepartmentDetails,
                viewAbsenceDetails,
                
                // Filter Functions
                applyStaffFilters,
                resetStaffFilters,
                applyRotationFilters,
                resetRotationFilters,
                applyAbsenceFilters,
                resetAbsenceFilters,
                applyAuditFilters,
                resetAuditFilters,
                
                // Search Functions
                handleSearch,
                toggleSearchScope,
                setSearchFilter,
                
                // Capacity Functions
                updateCapacity,
                
                // Audit Functions
                exportAuditLogs,
                
                // Calendar Functions
                showAbsenceCalendar,
                
                // Notification Functions
                showNotifications,
                
                // Authentication Functions
                handleLogin,
                handleLogout,
                
                // UI Functions
                removeToast,
                showToast,
                dismissAlert,
                toggleStatsSidebar,
                toggleUserMenu,
                toggleActionMenu
            };
            
        } catch (error) {
            console.error('Vue component setup failed:', error);
            // Fallback UI
            return {
                currentView: 'error',
                showToast: (title, message) => console.error(title, message),
                handleLogin: () => console.log('System error - cannot login')
            };
        }
    },
    
    // Template error handler
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
}); // <-- This closes window.addEventListener('load', async function() {

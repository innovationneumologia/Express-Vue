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
        const { createApp, ref, reactive, computed, onMounted } = Vue;
        
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
                                loadTrainingUnits(),
                                loadResidentRotations(),
                                loadStaffAbsences(),
                                loadOnCallSchedule(),
                                loadAnnouncements(),
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
                    
                    const showAddDepartmentModal = () => {
                        if (!hasPermission('system', 'update')) {
                            showToast('Permission Denied', 'You need permission to manage departments', 'error');
                            return;
                        }
                        
                        departmentModal.mode = 'add';
                        departmentModal.show = true;
                        resetDepartmentModal();
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
                    
                    const showAddRotationModal = () => {
                        if (!hasPermission('resident_rotations', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        
                        rotationModal.mode = 'add';
                        rotationModal.show = true;
                        resetRotationModal();
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
                    
                    const showCommunicationsModal = () => {
                        if (!hasPermission('communications', 'create')) {
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        
                        communicationsModal.show = true;
                        communicationsModal.activeTab = 'announcement';
                        communicationsModal.form.publish_start_date = new Date().toISOString().split('T')[0];
                    };
                    
                    // ============ VIEW FUNCTIONS ============
                    const viewStaffDetails = (staff) => {
                        staffDetailsModal.show = true;
                        staffDetailsModal.staff = staff;
                        staffDetailsModal.activeTab = 'personal';
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
                                currentUser.value = {
                                    id: Utils.generateId('USR'),
                                    email: email,
                                    full_name: 'System Administrator',
                                    user_role: 'system_admin',
                                    department: 'Administration',
                                    account_status: 'active'
                                };
                                
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
                    
                    const residents = computed(() => {
                        return medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident');
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
                    
                    const stats = computed(() => {
                        const activeStaff = medicalStaff.value.filter(s => s.employment_status === 'active').length;
                        const residentsCount = availableResidents.value.length;
                        const activeAbsences = staffAbsences.value.filter(a => a.approval_status === 'approved').length;
                        
                        return {
                            totalStaff: activeStaff,
                            activeResidents: residentsCount,
                            activeAbsences: activeAbsences
                        };
                    });
                    
                    // ============ LIFECYCLE HOOKS ============
                    onMounted(() => {
                        console.log('App mounted successfully');
                        
                        // Close dropdowns when clicking outside
                        document.addEventListener('click', function(event) {
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
                        
                        // Data Stores
                        medicalStaff,
                        departments,
                        trainingUnits,
                        residentRotations,
                        staffAbsences,
                        onCallSchedule,
                        recentAnnouncements,
                        systemSettings,
                        
                        // UI State
                        toasts,
                        activeAlerts,
                        unreadNotifications,
                        
                        // Filters
                        staffFilter,
                        
                        // Loading States
                        loadingStaff,
                        loadingDepartments,
                        loadingTrainingUnits,
                        loadingRotations,
                        loadingAbsences,
                        loadingSchedule,
                        loadingAnnouncements,
                        
                        // Computed Properties
                        stats,
                        filteredMedicalStaff,
                        residents,
                        availableAttendings,
                        availableResidents,
                        availableTrainingUnits,
                        
                        // Core Functions
                        hasPermission,
                        
                        // Utility Functions
                        getInitials: Utils.getInitials,
                        formatDate: Utils.formatDate,
                        formatDateTime: Utils.formatDateTime,
                        formatStaffType,
                        getStaffTypeClass,
                        formatEmploymentStatus,
                        formatTrainingLevel,
                        formatRotationStatus,
                        getRotationStatusClass,
                        formatAbsenceReason,
                        formatAbsenceStatus,
                        getAbsenceStatusClass,
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
                        showAddDepartmentModal,
                        saveDepartment,
                        showAddTrainingUnitModal,
                        saveTrainingUnit,
                        showAddRotationModal,
                        saveRotation,
                        showAddAbsenceModal,
                        saveAbsence,
                        showCommunicationsModal,
                        showUserProfile,
                        showSystemSettingsModal,
                        
                        // View Functions
                        viewStaffDetails,
                        
                        // Authentication Functions
                        handleLogin,
                        handleLogout,
                        
                        // UI Functions
                        removeToast,
                        showToast,
                        dismissAlert,
                        toggleUserMenu
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
});

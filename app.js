// ============ COMPLETE NEMO-CARE HOSPITAL MANAGEMENT SYSTEM ============
// Main Application Logic with Full Database Integration
// =======================================================

// Wait for page to fully load
window.addEventListener('load', async function() {
    console.log('Page fully loaded, initializing NeumoCare Hospital Management System...');
    
    // Check if Vue is available
    if (typeof Vue === 'undefined') {
        console.error('Vue.js is not available');
        document.body.innerHTML = '<div style="padding: 20px; color: red; text-align: center; margin-top: 50px;">' +
            '<h2>System Error</h2>' +
            '<p>Vue.js failed to load. Please refresh the page or check your internet connection.</p>' +
            '<button onclick="window.location.reload()" style="padding: 10px 20px; background: #0077be; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>' +
            '</div>';
        return;
    }
    
    console.log('Vue.js loaded successfully:', Vue.version);
    
    // Get Vue functions
    const { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    
    // ============ SUPABASE CLIENT SETUP ============
    const SUPABASE_URL = 'https://vssmguzuvekkecbmwcjw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXb-vXw';
    
    let supabaseClient;
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
        
        // Test connection to verify database is accessible
        const { data, error } = await supabaseClient.from('system_settings').select('count');
        if (error) {
            console.warn('Supabase connection test failed, may need to create tables:', error.message);
        } else {
            console.log('Database connection successful');
        }
    } catch (error) {
        console.error('CRITICAL ERROR: Failed to initialize Supabase:', error);
        showCriticalError('Database connection failed. Please check your internet connection and refresh the page.');
        return;
    }
    
    function showCriticalError(message) {
        document.body.innerHTML = `
            <div style="padding: 40px; color: #c62828; text-align: center; margin-top: 100px; font-family: 'Inter', sans-serif;">
                <h1 style="font-size: 32px; margin-bottom: 20px;">⚠️ System Unavailable</h1>
                <p style="font-size: 18px; margin-bottom: 30px; max-width: 600px; margin: 0 auto 30px; line-height: 1.6;">
                    ${message}
                </p>
                <button onclick="window.location.reload()" 
                        style="padding: 12px 24px; background: linear-gradient(135deg, #0077be, #005a9e); 
                               color: white; border: none; border-radius: 6px; cursor: pointer;
                               font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    🔄 Refresh & Retry
                </button>
                <p style="margin-top: 20px; color: #546e7a; font-size: 14px;">
                    If the problem persists, contact system administrator at admin@neumocare.org
                </p>
            </div>
        `;
    }
    
    // ============ DATABASE TABLE DEFINITIONS ============
    // These match your Supabase database structure
    const TABLE_NAMES = {
        USERS: 'users',
        MEDICAL_STAFF: 'medical_staff',
        DEPARTMENTS: 'departments',
        CLINICAL_UNITS: 'clinical_units',
        TRAINING_UNITS: 'training_units',
        RESIDENT_ROTATIONS: 'resident_rotations',
        STAFF_ABSENCES: 'staff_absences',
        ONCALL_SCHEDULE: 'oncall_schedule',
        ANNOUNCEMENTS: 'announcements',
        AUDIT_LOGS: 'audit_logs',
        SYSTEM_SETTINGS: 'system_settings',
        NOTIFICATIONS: 'notifications',
        PERMISSIONS: 'permissions',
        USER_ROLES: 'user_roles'
    };
    
    // ============ DATABASE INITIALIZATION ============
    async function initializeDatabase() {
        console.log('Initializing database...');
        
        try {
            // Check if tables exist, if not create them
            const { data: tables, error } = await supabaseClient
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');
            
            if (error) {
                console.log('Could not check existing tables, proceeding with data loading...');
            } else {
                console.log('Existing tables:', tables.map(t => t.table_name));
            }
            
            // Load initial data
            await loadInitialData();
            
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }
    
    // ============ AUDIT LOGGING SYSTEM ============
    async function logAuditEvent(action, resource, details = {}, userId = null) {
        try {
            const auditLog = {
                user_id: userId || (currentUser.value ? currentUser.value.id : null),
                user_name: currentUser.value ? currentUser.value.full_name : 'System',
                user_role: currentUser.value ? currentUser.value.user_role : 'system',
                action: action,
                resource: resource,
                details: JSON.stringify(details),
                ip_address: await getClientIP(),
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString()
            };
            
            const { error } = await supabaseClient
                .from(TABLE_NAMES.AUDIT_LOGS)
                .insert([auditLog]);
            
            if (error) {
                console.error('Failed to log audit event:', error);
            }
        } catch (error) {
            console.error('Audit logging error:', error);
        }
    }
    
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }
    
    // ============ ADVANCED PERMISSION SYSTEM ============
    const PermissionSystem = {
        resources: {
            medical_staff: { name: 'Medical Staff', actions: ['create', 'read', 'update', 'delete', 'export', 'import', 'notify', 'report'] },
            training_units: { name: 'Training Units', actions: ['create', 'read', 'update', 'delete', 'assign'] },
            resident_rotations: { name: 'Resident Rotations', actions: ['create', 'read', 'update', 'delete', 'extend'] },
            placements: { name: 'Placements', actions: ['create', 'read', 'update', 'delete', 'drag_drop'] },
            daily_operations: { name: 'Daily Operations', actions: ['read', 'update', 'alert'] },
            oncall_schedule: { name: 'On-call Schedule', actions: ['create', 'read', 'update', 'delete', 'override'] },
            staff_absence: { name: 'Staff Absence', actions: ['create', 'read', 'update', 'delete'] },
            communications: { name: 'Communications', actions: ['create', 'read', 'update', 'delete'] },
            audit: { name: 'Audit Logs', actions: ['read', 'export', 'clear'] },
            system: { name: 'System Settings', actions: ['read', 'update', 'admin', 'manage_departments'] },
            permissions: { name: 'Permissions', actions: ['read', 'manage'] }
        },

        roles: {
            system_admin: {
                name: 'System Administrator',
                level: 'full',
                permissions: {
                    medical_staff: { create: true, read: true, update: true, delete: true, export: true, import: true, notify: true, report: true },
                    training_units: { create: true, read: true, update: true, delete: true, assign: true },
                    resident_rotations: { create: true, read: true, update: true, delete: true, extend: true },
                    placements: { create: true, read: true, update: true, delete: true, drag_drop: true },
                    daily_operations: { read: true, update: true, alert: true },
                    oncall_schedule: { create: true, read: true, update: true, delete: true, override: true },
                    staff_absence: { create: true, read: true, update: true, delete: true },
                    communications: { create: true, read: true, update: true, delete: true },
                    audit: { read: true, export: true, clear: true },
                    system: { read: true, update: true, admin: true, manage_departments: true },
                    permissions: { read: true, manage: true }
                }
            },
            department_head: {
                name: 'Head of Department',
                level: 'full',
                permissions: {
                    medical_staff: { create: true, read: true, update: true, delete: false, export: true, import: false, notify: true, report: true },
                    training_units: { create: true, read: true, update: true, delete: false, assign: true },
                    resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
                    placements: { create: true, read: true, update: true, delete: false, drag_drop: true },
                    daily_operations: { read: true, update: true, alert: true },
                    oncall_schedule: { create: true, read: true, update: true, delete: false, override: true },
                    staff_absence: { create: true, read: true, update: true, delete: true },
                    communications: { create: true, read: true, update: true, delete: true },
                    audit: { read: true, export: true, clear: false },
                    system: { read: true, update: false, admin: false, manage_departments: true },
                    permissions: { read: false, manage: false }
                }
            },
            resident_manager: {
                name: 'Resident Manager',
                level: 'write',
                permissions: {
                    medical_staff: { create: true, read: true, update: true, delete: false, export: false, import: false, notify: false, report: false },
                    training_units: { create: true, read: true, update: true, delete: false, assign: true },
                    resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
                    placements: { create: true, read: true, update: true, delete: false, drag_drop: true },
                    daily_operations: { read: true, update: true, alert: false },
                    oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
                    staff_absence: { create: true, read: true, update: false, delete: false },
                    communications: { create: false, read: true, update: false, delete: false },
                    audit: { read: false, export: false, clear: false },
                    system: { read: false, update: false, admin: false, manage_departments: false },
                    permissions: { read: false, manage: false }
                }
            },
            attending_physician: {
                name: 'Attending Physician',
                level: 'limited',
                permissions: {
                    medical_staff: { create: false, read: true, update: false, delete: false, export: false, import: false, notify: false, report: false },
                    training_units: { create: false, read: true, update: false, delete: false, assign: false },
                    resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
                    placements: { create: false, read: true, update: false, delete: false, drag_drop: false },
                    daily_operations: { read: true, update: false, alert: false },
                    oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
                    staff_absence: { create: true, read: true, update: false, delete: false },
                    communications: { create: false, read: true, update: false, delete: false },
                    audit: { read: false, export: false, clear: false },
                    system: { read: false, update: false, admin: false, manage_departments: false },
                    permissions: { read: false, manage: false }
                }
            },
            viewing_doctor: {
                name: 'Viewing Doctor',
                level: 'read',
                permissions: {
                    medical_staff: { create: false, read: true, update: false, delete: false, export: false, import: false, notify: false, report: false },
                    training_units: { create: false, read: true, update: false, delete: false, assign: false },
                    resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
                    placements: { create: false, read: true, update: false, delete: false, drag_drop: false },
                    daily_operations: { read: true, update: false, alert: false },
                    oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
                    staff_absence: { create: false, read: true, update: false, delete: false },
                    communications: { create: false, read: true, update: false, delete: false },
                    audit: { read: false, export: false, clear: false },
                    system: { read: false, update: false, admin: false, manage_departments: false },
                    permissions: { read: false, manage: false }
                }
            }
        },

        hasPermission(userRole, resource, action) {
            const role = this.roles[userRole];
            if (!role || !role.permissions[resource]) return false;
            return role.permissions[resource][action] === true;
        },

        getPermissionLevel(userRole, resource) {
            const role = this.roles[userRole];
            if (!role || !role.permissions[resource]) return 'none';
            
            const permissions = role.permissions[resource];
            if (permissions.create && permissions.update && permissions.delete) return 'full';
            if (permissions.create || permissions.update) return 'write';
            if (permissions.read) return 'read';
            return 'none';
        },
        
        getRoleName(roleKey) {
            return this.roles[roleKey]?.name || roleKey;
        }
    };

    // ============ UTILITY FUNCTIONS ============
    const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const getLocalDateString = (date = new Date()) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };
    
    const getLocalDateTime = () => {
        const now = new Date();
        return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
    };
    
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    // ============ ERROR HANDLING ============
    const withErrorHandling = async (operation, context, fallback = null) => {
        try {
            const result = await operation();
            await logAuditEvent('SUCCESS', context, { operation: context });
            return result;
        } catch (error) {
            console.error(`Error in ${context}:`, error);
            await logAuditEvent('ERROR', context, { 
                operation: context, 
                error: error.message,
                stack: error.stack 
            });
            
            if (fallback !== null) return fallback;
            throw error;
        }
    };

    // ============ CREATE VUE APP ============
    const app = createApp({
        setup() {
            // ============ REACTIVE STATE VARIABLES ============
            const currentUser = ref(null);
            const loginForm = ref({ 
                email: 'admin@neumocare.org', 
                password: 'password123', 
                remember_me: false 
            });
            const loading = ref(false);
            const saving = ref(false);
            const savingPermissions = ref(false);
            const currentView = ref('login');
            const sidebarCollapsed = ref(false);
            const mobileMenuOpen = ref(false);
            const statsSidebarOpen = ref(false);
            const searchQuery = ref('');
            const searchScope = ref('global');
            const searchFilter = ref('all');
            const userMenuOpen = ref(false);
            
            // Confirmation Modal State
            const confirmationModal = ref({
                show: false,
                title: '',
                message: '',
                icon: 'fa-question-circle',
                confirmButtonText: 'Confirm',
                confirmButtonClass: 'btn-primary',
                onConfirm: null,
                onCancel: null
            });
            
            // Data stores
            const medicalStaff = ref([]);
            const trainingUnits = ref([]);
            const residentRotations = ref([]);
            const staffAbsences = ref([]);
            const onCallSchedule = ref([]);
            const announcements = ref([]);
            const auditLogs = ref([]);
            const departments = ref([]);
            const clinicalUnits = ref([]);
            const userNotifications = ref([]);
            const systemSettings = ref({});
            const userRoles = ref([]);
            const permissions = ref([]);
            const users = ref([]);
            
            // Modal states
            const staffDetailsModal = ref({ 
                show: false, 
                staff: null, 
                activeTab: 'personal', 
                stats: {}, 
                activityHistory: [],
                currentRotation: null,
                nextOncall: null
            });
            
            const medicalStaffModal = ref({ 
                show: false, 
                mode: 'add', 
                staff: null, 
                activeTab: 'basic',
                form: { 
                    full_name: '', 
                    staff_type: 'medical_resident', 
                    staff_id: '', 
                    employment_status: 'active',
                    professional_email: '', 
                    resident_category: '', 
                    training_level: '',
                    specialization: '',
                    years_experience: '',
                    biography: '',
                    medical_license: '',
                    date_of_birth: '',
                    office_phone: '',
                    mobile_phone: '',
                    department_id: ''
                }
            });
            
            const departmentModal = ref({
                show: false,
                mode: 'add',
                department: null,
                form: {
                    name: '',
                    code: '',
                    status: 'active',
                    description: '',
                    head_of_department_id: ''
                }
            });
            
            const clinicalUnitModal = ref({
                show: false,
                mode: 'add',
                unit: null,
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
            
            const trainingUnitModal = ref({
                show: false,
                mode: 'add',
                unit: null,
                form: {
                    name: '',
                    department_id: '',
                    supervisor_id: '',
                    max_capacity: 10,
                    status: 'active',
                    description: ''
                }
            });
            
            const rotationModal = ref({
                show: false,
                mode: 'add',
                rotation: null,
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
            
            const onCallModal = ref({ 
                show: false, 
                mode: 'add', 
                schedule: null, 
                form: { 
                    duty_date: '', 
                    shift_type: 'backup_call', 
                    start_time: '08:00', 
                    end_time: '20:00',
                    primary_physician_id: '', 
                    backup_physician_id: '', 
                    coverage_notes: '' 
                }
            });
            
            const absenceModal = ref({ 
                show: false, 
                mode: 'add', 
                absence: null, 
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
            
            const quickPlacementModal = ref({ 
                show: false, 
                resident_id: '',
                training_unit_id: '',
                start_date: '',
                duration: 4,
                supervisor_id: '',
                notes: ''
            });
            
            const bulkAssignModal = ref({
                show: false,
                selectedResidents: [],
                training_unit_id: '',
                start_date: '',
                duration: 4,
                supervisor_id: ''
            });
            
            const communicationsModal = ref({ 
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
                    er: { current: 0, max: 0, notes: '' },
                    icu: { current: 0, max: 0, notes: '' },
                    ward: { current: 0, max: 0, notes: '' },
                    stepdown: { current: 0, max: 0, notes: '' },
                    clinic: { current: 0, max: 0, notes: '' },
                    bronch: { current: 0, max: 0, notes: '' },
                    overall_notes: '' 
                },
                quickUpdate: { 
                    message: '', 
                    priority: 'info', 
                    expires: '24', 
                    tags: '' 
                }
            });
            
            const systemSettingsModal = ref({ 
                show: false, 
                form: { 
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
            
            const userProfileModal = ref({ 
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
            
            const roleModal = ref({
                show: false,
                mode: 'add',
                role: null,
                form: {
                    name: '',
                    description: '',
                    permissions: []
                }
            });
            
            // UI states
            const toasts = ref([]);
            let toastId = 0;
            const staffSearch = ref('');
            const staffFilter = ref({ staff_type: '', employment_status: '' });
            const rotationFilter = ref({ resident_id: '', status: '' });
            const absenceFilter = ref({ staff_id: '', status: '', start_date: '' });
            const auditFilters = ref({ dateRange: '', actionType: '', userId: '' });
            
            // Live stats
            const liveStats = ref({
                occupancy: 0,
                occupancyTrend: 0,
                onDutyStaff: 0,
                staffTrend: 0,
                pendingRequests: 0,
                erCapacity: { current: 0, max: 0, status: 'low' },
                icuCapacity: { current: 0, max: 0, status: 'low' }
            });
            
            const currentCapacity = ref({
                er: { current: 0, max: 0, status: 'low' },
                icu: { current: 0, max: 0, status: 'low' }
            });
            
            const loadingStats = ref(false);
            const loadingAnnouncements = ref(false);
            const loadingSchedule = ref(false);
            const loadingStaff = ref(false);
            const loadingRotations = ref(false);
            const loadingAbsences = ref(false);
            const loadingAuditLogs = ref(false);
            
            // Active alerts
            const activeAlerts = ref([]);
            
            // ============ TOAST SYSTEM ============
            const showToast = (title, message, type = 'info', duration = 5000) => {
                const icons = {
                    info: 'fas fa-info-circle', 
                    success: 'fas fa-check-circle',
                    error: 'fas fa-exclamation-circle', 
                    warning: 'fas fa-exclamation-triangle'
                };
                
                const toast = { 
                    id: ++toastId, 
                    title, 
                    message, 
                    type, 
                    icon: icons[type] || icons.info, 
                    duration 
                };
                toasts.value.push(toast);
                setTimeout(() => removeToast(toast.id), duration);
            };

            const removeToast = (id) => {
                const index = toasts.value.findIndex(t => t.id === id);
                if (index > -1) toasts.value.splice(index, 1);
            };

            // ============ CONFIRMATION MODAL ============
            const showConfirmation = (options) => {
                confirmationModal.value = {
                    show: true,
                    title: options.title || 'Confirm Action',
                    message: options.message || 'Are you sure you want to proceed?',
                    icon: options.icon || 'fa-question-circle',
                    confirmButtonText: options.confirmButtonText || 'Confirm',
                    confirmButtonClass: options.confirmButtonClass || 'btn-primary',
                    onConfirm: options.onConfirm || null,
                    onCancel: options.onCancel || null
                };
            };

            const confirmAction = () => {
                if (confirmationModal.value.onConfirm) {
                    confirmationModal.value.onConfirm();
                }
                confirmationModal.value.show = false;
            };

            const cancelConfirmation = () => {
                if (confirmationModal.value.onCancel) {
                    confirmationModal.value.onCancel();
                }
                confirmationModal.value.show = false;
            };

            // ============ FORMATTING FUNCTIONS ============
            const getInitials = (name) => !name ? '??' : name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            
            const formatDate = (dateString) => {
                try { 
                    if (!dateString) return ''; 
                    const date = new Date(dateString); 
                    if (isNaN(date.getTime())) return '';
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } catch { 
                    return ''; 
                }
            };
            
            const formatDateTime = (dateString) => {
                try { 
                    if (!dateString) return ''; 
                    const date = new Date(dateString); 
                    if (isNaN(date.getTime())) return '';
                    return date.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch { 
                    return ''; 
                }
            };
            
            const formatTimeAgo = (date) => {
                try { 
                    if (!date) return 'Just now'; 
                    const now = new Date(); 
                    const then = new Date(date);
                    if (isNaN(then.getTime())) return 'Just now'; 
                    const diffMs = now - then;
                    const diffSec = Math.floor(diffMs / 1000); 
                    const diffMin = Math.floor(diffSec / 60);
                    const diffHour = Math.floor(diffMin / 60); 
                    const diffDay = Math.floor(diffHour / 24);
                    if (diffSec < 60) return 'Just now'; 
                    if (diffMin < 60) return `${diffMin}m ago`;
                    if (diffHour < 24) return `${diffHour}h ago`; 
                    if (diffDay < 7) return `${diffDay}d ago`;
                    return formatDate(date);
                } catch { 
                    return 'Just now'; 
                }
            };
            
            const formatTimeRange = (start, end) => {
                const formatTime = (time) => { 
                    if (!time) return ''; 
                    const [hours] = time.split(':');
                    const hour = parseInt(hours); 
                    return `${hour % 12 || 12}:${time.slice(3,5)} ${hour >= 12 ? 'PM' : 'AM'}`;
                }; 
                return `${formatTime(start)} - ${formatTime(end)}`;
            };
            
            const getUserRoleDisplay = (role) => PermissionSystem.getRoleName(role);
            
            const formatStaffType = (type) => {
                const types = { 
                    medical_resident: 'Medical Resident', 
                    attending_physician: 'Attending Physician',
                    fellow: 'Fellow', 
                    nurse_practitioner: 'Nurse Practitioner' 
                }; 
                return types[type] || type;
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
            
            const formatEmploymentStatus = (status) => {
                const statuses = { active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' };
                return statuses[status] || status;
            };
            
            const formatResidentCategory = (category) => {
                const categories = {
                    department_internal: 'Department Internal',
                    rotating_other_dept: 'Rotating Other Dept',
                    external_institution: 'External Institution'
                };
                return categories[category] || category;
            };
            
            const formatTrainingLevel = (level) => {
                const levels = {
                    pgy1: 'PGY-1 (First Year)',
                    pgy2: 'PGY-2 (Second Year)',
                    pgy3: 'PGY-3 (Third Year)',
                    pgy4: 'PGY-4 (Fourth Year)',
                    other: 'Other'
                };
                return levels[level] || level;
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
                const statuses = { active: 'Active', upcoming: 'Upcoming', completed: 'Completed' };
                return statuses[status] || status;
            };
            
            const getAbsenceStatusClass = (status) => {
                const classes = { active: 'badge-warning', upcoming: 'badge-info', completed: 'badge-success' };
                return classes[status] || 'badge-secondary';
            };
            
            const formatRotationStatus = (status) => {
                const statuses = { active: 'Active', upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };
                return statuses[status] || status;
            };
            
            const getRotationStatusClass = (status) => {
                const classes = { 
                    active: 'badge-success', 
                    upcoming: 'badge-info', 
                    completed: 'badge-secondary',
                    cancelled: 'badge-danger' 
                };
                return classes[status] || 'badge-secondary';
            };
            
            const formatAuditAction = (action) => {
                const actions = { 
                    CREATE: 'Created', 
                    UPDATE: 'Updated', 
                    DELETE: 'Deleted',
                    READ: 'Viewed', 
                    LOGIN: 'Logged In', 
                    LOGOUT: 'Logged Out' 
                };
                return actions[action] || action;
            };
            
            const formatPermissionName = (name) => {
                return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            };
            
            const getPriorityColor = (priority) => {
                const colors = { urgent: 'danger', high: 'warning', medium: 'info', low: 'success' };
                return colors[priority] || 'info';
            };
            
            const getCapacityStatus = (capacity) => {
                if (!capacity.max || capacity.max === 0) return 'unknown';
                const percentage = (capacity.current / capacity.max) * 100;
                if (percentage >= 90) return 'high'; 
                if (percentage >= 75) return 'medium'; 
                return 'low';
            };
            
            const getCommunicationIcon = (tab) => {
                const icons = { announcement: 'fa-bullhorn', capacity: 'fa-bed', quick: 'fa-comment-medical' };
                return icons[tab] || 'fa-comment';
            };
            
            const getCommunicationButtonText = (tab) => {
                const texts = { 
                    announcement: 'Publish Announcement', 
                    capacity: 'Update Capacity', 
                    quick: 'Post Update' 
                };
                return texts[tab] || 'Save';
            };

            // ============ DATA RELATIONSHIP FUNCTIONS ============
            const getStaffName = (staffId) => {
                if (!staffId) return 'Unknown Staff';
                const staff = medicalStaff.value.find(s => s.id === staffId);
                return staff ? staff.full_name : `Staff ${staffId.substring(0, 8)}`;
            };
            
            const getDepartmentName = (departmentId) => {
                if (!departmentId) return 'Unknown Department';
                const department = departments.value.find(d => d.id === departmentId);
                return department ? department.name : `Department ${departmentId.substring(0, 8)}`;
            };
            
            const getTrainingUnitName = (unitId) => {
                if (!unitId) return 'Unknown Unit';
                const unit = trainingUnits.value.find(u => u.id === unitId);
                return unit ? unit.name : `Unit ${unitId.substring(0, 8)}`;
            };
            
            const getDepartmentUnits = (departmentId) => {
                return clinicalUnits.value.filter(unit => unit.department_id === departmentId);
            };
            
            const getUnitResidents = (unitId) => {
                const rotationIds = residentRotations.value
                    .filter(r => r.training_unit_id === unitId && (r.status === 'active' || r.status === 'upcoming'))
                    .map(r => r.resident_id);
                return medicalStaff.value.filter(staff => 
                    staff.staff_type === 'medical_resident' && rotationIds.includes(staff.id));
            };
            
            const getSupervisorName = (supervisorId) => {
                if (!supervisorId) return null;
                const supervisor = medicalStaff.value.find(s => s.id === supervisorId);
                return supervisor ? supervisor.full_name : null;
            };
            
            const getUserName = (userId) => {
                if (!userId) return 'System';
                const user = users.value.find(u => u.id === userId);
                return user ? user.full_name : `User ${userId.substring(0, 8)}`;
            };
            
            const calculateAbsenceDuration = (startDate, endDate) => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays + 1;
            };

            // ============ PERMISSION FUNCTIONS ============
            const hasPermission = (resource, action) => {
                if (!currentUser.value) return false;
                if (currentUser.value.user_role === 'system_admin') return true;
                return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action);
            };

            const roleHasPermission = (roleId, permissionId) => {
                // This would check if a role has a specific permission
                // For now, using the static permission system
                return false;
            };

            const getUserPermissions = (userId) => {
                const user = users.value.find(u => u.id === userId);
                if (!user) return [];
                
                const role = PermissionSystem.roles[user.user_role];
                if (!role) return [];
                
                const permissions = [];
                for (const [resource, actions] of Object.entries(role.permissions)) {
                    for (const [action, hasPerm] of Object.entries(actions)) {
                        if (hasPerm) {
                            permissions.push(`${resource}.${action}`);
                        }
                    }
                }
                return permissions;
            };

            // ============ DATABASE OPERATIONS ============
            // ============ LOAD FUNCTIONS ============
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
                        loadAuditLogs(),
                        loadSystemSettings(),
                        loadUserNotifications(),
                        loadUsers()
                    ]);
                    
                    // Load live stats after initial data
                    await loadLiveStats();
                    
                    showToast('System Ready', 'All data loaded successfully', 'success');
                    await logAuditEvent('SYSTEM_START', 'system', { user: currentUser.value?.email });
                } catch (error) {
                    console.error('Error loading initial data:', error);
                    showToast('Data Load Error', 'Failed to load system data', 'error');
                } finally {
                    loading.value = false;
                }
            };

            const loadMedicalStaff = async () => {
                loadingStaff.value = true;
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.MEDICAL_STAFF)
                        .select('*')
                        .order('full_name');
                    
                    if (error) throw error;
                    
                    medicalStaff.value = data || [];
                    
                    // Update live stats
                    liveStats.value.onDutyStaff = medicalStaff.value.filter(s => 
                        s.employment_status === 'active').length;
                    
                } catch (error) {
                    console.error('Error loading medical staff:', error);
                    showToast('Error', 'Failed to load medical staff', 'error');
                } finally {
                    loadingStaff.value = false;
                }
            };

            const loadDepartments = async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.DEPARTMENTS)
                        .select('*')
                        .order('name');
                    
                    if (error) throw error;
                    departments.value = data || [];
                } catch (error) {
                    console.error('Error loading departments:', error);
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
                }
            };

            const loadTrainingUnits = async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.TRAINING_UNITS)
                        .select('*')
                        .order('name');
                    
                    if (error) throw error;
                    trainingUnits.value = data || [];
                    
                    // Update capacity stats
                    updateCapacityStats();
                } catch (error) {
                    console.error('Error loading training units:', error);
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
                } finally {
                    loadingRotations.value = false;
                }
            };

            const loadStaffAbsences = async () => {
                loadingAbsences.value = true;
                try {
                    const today = getLocalDateString();
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.STAFF_ABSENCES)
                        .select('*')
                        .or(`end_date.gte.${today},end_date.is.null`)
                        .order('start_date');
                    
                    if (error) throw error;
                    staffAbsences.value = data || [];
                    
                    // Update active alerts
                    updateActiveAlerts();
                } catch (error) {
                    console.error('Error loading staff absences:', error);
                } finally {
                    loadingAbsences.value = false;
                }
            };

            const loadOnCallSchedule = async () => {
                loadingSchedule.value = true;
                try {
                    const today = getLocalDateString();
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
                } finally {
                    loadingSchedule.value = false;
                }
            };

            const loadAnnouncements = async () => {
                loadingAnnouncements.value = true;
                try {
                    const today = getLocalDateString();
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.ANNOUNCEMENTS)
                        .select('*')
                        .lte('publish_start_date', today)
                        .or(`publish_end_date.gte.${today},publish_end_date.is.null`)
                        .order('publish_start_date', { ascending: false })
                        .limit(10);
                    
                    if (error) throw error;
                    announcements.value = data || [];
                } catch (error) {
                    console.error('Error loading announcements:', error);
                } finally {
                    loadingAnnouncements.value = false;
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
                } finally {
                    loadingAuditLogs.value = false;
                }
            };

            const loadSystemSettings = async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.SYSTEM_SETTINGS)
                        .select('*')
                        .single();
                    
                    if (error && error.code !== 'PGRST116') throw error;
                    
                    systemSettings.value = data || {
                        hospital_name: 'NeumoCare Hospital',
                        enable_audit_logging: true,
                        notifications_enabled: true
                    };
                    
                    systemSettingsModal.value.form = { ...systemSettings.value };
                } catch (error) {
                    console.error('Error loading system settings:', error);
                }
            };

            const loadUserNotifications = async () => {
                try {
                    if (!currentUser.value) return;
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.NOTIFICATIONS)
                        .select('*')
                        .eq('user_id', currentUser.value.id)
                        .eq('read', false)
                        .order('created_at', { ascending: false })
                        .limit(20);
                    
                    if (error) throw error;
                    userNotifications.value = data || [];
                } catch (error) {
                    console.error('Error loading notifications:', error);
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
                }
            };

            const loadLiveStats = async () => {
                loadingStats.value = true;
                try {
                    // Calculate occupancy based on training units
                    const totalCapacity = trainingUnits.value.reduce((sum, unit) => sum + (unit.max_capacity || 0), 0);
                    const currentResidents = trainingUnits.value.reduce((sum, unit) => sum + (unit.current_residents || 0), 0);
                    const occupancy = totalCapacity > 0 ? Math.round((currentResidents / totalCapacity) * 100) : 0;
                    
                    // Get active staff count
                    const onDutyStaff = medicalStaff.value.filter(s => s.employment_status === 'active').length;
                    
                    // Get pending requests (absences without coverage)
                    const pendingRequests = staffAbsences.value.filter(a => !a.replacement_staff_id).length;
                    
                    liveStats.value = {
                        occupancy,
                        occupancyTrend: 0, // Would need historical data to calculate
                        onDutyStaff,
                        staffTrend: 0, // Would need historical data
                        pendingRequests,
                        erCapacity: { current: 0, max: 0, status: 'low' },
                        icuCapacity: { current: 0, max: 0, status: 'low' }
                    };
                    
                } catch (error) {
                    console.error('Error loading live stats:', error);
                } finally {
                    loadingStats.value = false;
                }
            };

            // ============ SAVE FUNCTIONS ============
            const saveMedicalStaff = async () => {
                saving.value = true;
                try {
                    const permissionNeeded = medicalStaffModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('medical_staff', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    // Validate form
                    if (!medicalStaffModal.value.form.full_name.trim()) {
                        throw new Error('Full name is required');
                    }
                    
                    if (medicalStaffModal.value.form.staff_type === 'medical_resident') {
                        if (!medicalStaffModal.value.form.resident_category) {
                            throw new Error('Resident category is required');
                        }
                        if (!medicalStaffModal.value.form.training_level) {
                            throw new Error('Training level is required');
                        }
                    }
                    
                    let result;
                    if (medicalStaffModal.value.mode === 'add') {
                        const staffData = {
                            ...medicalStaffModal.value.form,
                            staff_id: medicalStaffModal.value.form.staff_id || `MD-${Date.now().toString().slice(-6)}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.MEDICAL_STAFF)
                            .insert([staffData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        medicalStaff.value.unshift(result);
                        showToast('Success', 'Medical staff added successfully', 'success');
                        await logAuditEvent('CREATE', 'medical_staff', { staff_id: result.id, name: result.full_name });
                    } else {
                        const updateData = {
                            ...medicalStaffModal.value.form,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.MEDICAL_STAFF)
                            .update(updateData)
                            .eq('id', medicalStaffModal.value.staff.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = medicalStaff.value.findIndex(s => s.id === result.id);
                        if (index !== -1) {
                            medicalStaff.value[index] = result;
                        }
                        showToast('Success', 'Medical staff updated successfully', 'success');
                        await logAuditEvent('UPDATE', 'medical_staff', { staff_id: result.id, name: result.full_name });
                    }
                    
                    medicalStaffModal.value.show = false;
                    await loadLiveStats(); // Refresh stats
                } catch (error) {
                    console.error('Error saving medical staff:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const saveDepartment = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('system', 'manage_departments')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!departmentModal.value.form.name.trim()) {
                        throw new Error('Department name is required');
                    }
                    
                    if (!departmentModal.value.form.code.trim()) {
                        throw new Error('Department code is required');
                    }
                    
                    let result;
                    if (departmentModal.value.mode === 'add') {
                        const departmentData = {
                            ...departmentModal.value.form,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.DEPARTMENTS)
                            .insert([departmentData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        departments.value.unshift(result);
                        showToast('Success', 'Department added successfully', 'success');
                        await logAuditEvent('CREATE', 'departments', { department_id: result.id, name: result.name });
                    } else {
                        const updateData = {
                            ...departmentModal.value.form,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.DEPARTMENTS)
                            .update(updateData)
                            .eq('id', departmentModal.value.department.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = departments.value.findIndex(d => d.id === result.id);
                        if (index !== -1) {
                            departments.value[index] = result;
                        }
                        showToast('Success', 'Department updated successfully', 'success');
                        await logAuditEvent('UPDATE', 'departments', { department_id: result.id, name: result.name });
                    }
                    
                    departmentModal.value.show = false;
                } catch (error) {
                    console.error('Error saving department:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const saveTrainingUnit = async () => {
                saving.value = true;
                try {
                    const permissionNeeded = trainingUnitModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('training_units', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!trainingUnitModal.value.form.name.trim()) {
                        throw new Error('Unit name is required');
                    }
                    
                    if (!trainingUnitModal.value.form.department_id) {
                        throw new Error('Department is required');
                    }
                    
                    let result;
                    if (trainingUnitModal.value.mode === 'add') {
                        const unitData = {
                            ...trainingUnitModal.value.form,
                            current_residents: 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.TRAINING_UNITS)
                            .insert([unitData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        trainingUnits.value.unshift(result);
                        showToast('Success', 'Training unit added successfully', 'success');
                        await logAuditEvent('CREATE', 'training_units', { unit_id: result.id, name: result.name });
                    } else {
                        const updateData = {
                            ...trainingUnitModal.value.form,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.TRAINING_UNITS)
                            .update(updateData)
                            .eq('id', trainingUnitModal.value.unit.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = trainingUnits.value.findIndex(u => u.id === result.id);
                        if (index !== -1) {
                            trainingUnits.value[index] = result;
                        }
                        showToast('Success', 'Training unit updated successfully', 'success');
                        await logAuditEvent('UPDATE', 'training_units', { unit_id: result.id, name: result.name });
                    }
                    
                    trainingUnitModal.value.show = false;
                    await loadLiveStats(); // Refresh stats
                } catch (error) {
                    console.error('Error saving training unit:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const saveRotation = async () => {
                saving.value = true;
                try {
                    const permissionNeeded = rotationModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('resident_rotations', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!rotationModal.value.form.resident_id) {
                        throw new Error('Resident is required');
                    }
                    
                    if (!rotationModal.value.form.training_unit_id) {
                        throw new Error('Training unit is required');
                    }
                    
                    if (!rotationModal.value.form.start_date || !rotationModal.value.form.end_date) {
                        throw new Error('Start and end dates are required');
                    }
                    
                    const startDate = new Date(rotationModal.value.form.start_date);
                    const endDate = new Date(rotationModal.value.form.end_date);
                    if (startDate >= endDate) {
                        throw new Error('End date must be after start date');
                    }
                    
                    let result;
                    if (rotationModal.value.mode === 'add') {
                        const rotationData = {
                            ...rotationModal.value.form,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                            .insert([rotationData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        residentRotations.value.unshift(result);
                        
                        // Update unit resident count
                        await updateUnitResidentCount(rotationModal.value.form.training_unit_id);
                        
                        showToast('Success', 'Rotation added successfully', 'success');
                        await logAuditEvent('CREATE', 'resident_rotations', { rotation_id: result.id });
                    } else {
                        const updateData = {
                            ...rotationModal.value.form,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                            .update(updateData)
                            .eq('id', rotationModal.value.rotation.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = residentRotations.value.findIndex(r => r.id === result.id);
                        if (index !== -1) {
                            residentRotations.value[index] = result;
                        }
                        
                        // Update unit resident count if unit changed
                        if (rotationModal.value.rotation.training_unit_id !== rotationModal.value.form.training_unit_id) {
                            await updateUnitResidentCount(rotationModal.value.rotation.training_unit_id);
                            await updateUnitResidentCount(rotationModal.value.form.training_unit_id);
                        }
                        
                        showToast('Success', 'Rotation updated successfully', 'success');
                        await logAuditEvent('UPDATE', 'resident_rotations', { rotation_id: result.id });
                    }
                    
                    rotationModal.value.show = false;
                    await loadLiveStats(); // Refresh stats
                } catch (error) {
                    console.error('Error saving rotation:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const saveOnCallSchedule = async () => {
                saving.value = true;
                try {
                    const permissionNeeded = onCallModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('oncall_schedule', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!onCallModal.value.form.duty_date) {
                        throw new Error('Duty date is required');
                    }
                    
                    if (!onCallModal.value.form.primary_physician_id) {
                        throw new Error('Primary physician is required');
                    }
                    
                    let result;
                    if (onCallModal.value.mode === 'add') {
                        const scheduleData = {
                            ...onCallModal.value.form,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.ONCALL_SCHEDULE)
                            .insert([scheduleData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        onCallSchedule.value.push(result);
                        onCallSchedule.value.sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date));
                        showToast('Success', 'On-call schedule created', 'success');
                        await logAuditEvent('CREATE', 'oncall_schedule', { schedule_id: result.id, date: result.duty_date });
                    } else {
                        const updateData = {
                            ...onCallModal.value.form,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.ONCALL_SCHEDULE)
                            .update(updateData)
                            .eq('id', onCallModal.value.schedule.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                        if (index !== -1) {
                            onCallSchedule.value[index] = result;
                        }
                        showToast('Success', 'On-call schedule updated', 'success');
                        await logAuditEvent('UPDATE', 'oncall_schedule', { schedule_id: result.id, date: result.duty_date });
                    }
                    
                    onCallModal.value.show = false;
                } catch (error) {
                    console.error('Error saving on-call schedule:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const saveAbsence = async () => {
                saving.value = true;
                try {
                    const permissionNeeded = absenceModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('staff_absence', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!absenceModal.value.form.staff_member_id) {
                        throw new Error('Staff member is required');
                    }
                    
                    if (!absenceModal.value.form.absence_reason) {
                        throw new Error('Absence reason is required');
                    }
                    
                    if (!absenceModal.value.form.start_date || !absenceModal.value.form.end_date) {
                        throw new Error('Start and end dates are required');
                    }
                    
                    const startDate = new Date(absenceModal.value.form.start_date);
                    const endDate = new Date(absenceModal.value.form.end_date);
                    if (startDate > endDate) {
                        throw new Error('Start date cannot be after end date');
                    }
                    
                    const totalDays = calculateAbsenceDuration(startDate, endDate);
                    
                    let result;
                    if (absenceModal.value.mode === 'add') {
                        const absenceData = {
                            ...absenceModal.value.form,
                            total_days: totalDays,
                            documented_by: currentUser.value.id,
                            documented_by_name: currentUser.value.full_name,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.STAFF_ABSENCES)
                            .insert([absenceData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        staffAbsences.value.unshift(result);
                        showToast('Success', 'Staff absence documented successfully', 'success');
                        await logAuditEvent('CREATE', 'staff_absence', { absence_id: result.id, staff_id: result.staff_member_id });
                    } else {
                        const updateData = {
                            ...absenceModal.value.form,
                            total_days: totalDays,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.STAFF_ABSENCES)
                            .update(updateData)
                            .eq('id', absenceModal.value.absence.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = staffAbsences.value.findIndex(a => a.id === result.id);
                        if (index !== -1) {
                            staffAbsences.value[index] = result;
                        }
                        showToast('Success', 'Staff absence updated successfully', 'success');
                        await logAuditEvent('UPDATE', 'staff_absence', { absence_id: result.id, staff_id: result.staff_member_id });
                    }
                    
                    absenceModal.value.show = false;
                    await updateActiveAlerts();
                } catch (error) {
                    console.error('Error saving staff absence:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            // ============ DELETE FUNCTIONS ============
            const deleteMedicalStaff = async (staff) => {
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
                            if (index !== -1) {
                                medicalStaff.value.splice(index, 1);
                            }
                            
                            showToast('Deleted', `${staff.full_name} has been removed`, 'success');
                            await logAuditEvent('DELETE', 'medical_staff', { staff_id: staff.id, name: staff.full_name });
                            await loadLiveStats();
                        } catch (error) {
                            console.error('Error deleting medical staff:', error);
                            showToast('Error', error.message, 'error');
                        }
                    }
                });
            };

            const deleteDepartment = async (department) => {
                showConfirmation({
                    title: 'Delete Department',
                    message: `Are you sure you want to delete ${department.name}? This will also delete all associated clinical units.`,
                    icon: 'fa-trash',
                    confirmButtonText: 'Delete',
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            if (!hasPermission('system', 'manage_departments')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            // Check if department has associated units
                            const associatedUnits = clinicalUnits.value.filter(u => u.department_id === department.id);
                            if (associatedUnits.length > 0) {
                                // Delete associated units first
                                const { error: unitsError } = await supabaseClient
                                    .from(TABLE_NAMES.CLINICAL_UNITS)
                                    .delete()
                                    .eq('department_id', department.id);
                                
                                if (unitsError) throw unitsError;
                                
                                // Remove from local state
                                clinicalUnits.value = clinicalUnits.value.filter(u => u.department_id !== department.id);
                            }
                            
                            // Delete department
                            const { error } = await supabaseClient
                                .from(TABLE_NAMES.DEPARTMENTS)
                                .delete()
                                .eq('id', department.id);
                            
                            if (error) throw error;
                            
                            const index = departments.value.findIndex(d => d.id === department.id);
                            if (index !== -1) {
                                departments.value.splice(index, 1);
                            }
                            
                            showToast('Deleted', `${department.name} has been removed`, 'success');
                            await logAuditEvent('DELETE', 'departments', { department_id: department.id, name: department.name });
                        } catch (error) {
                            console.error('Error deleting department:', error);
                            showToast('Error', error.message, 'error');
                        }
                    }
                });
            };

            const deleteRotation = async (rotation) => {
                showConfirmation({
                    title: 'Delete Rotation',
                    message: `Are you sure you want to delete this rotation? This action cannot be undone.`,
                    icon: 'fa-trash',
                    confirmButtonText: 'Delete',
                    confirmButtonClass: 'btn-danger',
                    onConfirm: async () => {
                        try {
                            if (!hasPermission('resident_rotations', 'delete')) {
                                throw new Error('Insufficient permissions');
                            }
                            
                            const { error } = await supabaseClient
                                .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                .delete()
                                .eq('id', rotation.id);
                            
                            if (error) throw error;
                            
                            const index = residentRotations.value.findIndex(r => r.id === rotation.id);
                            if (index !== -1) {
                                residentRotations.value.splice(index, 1);
                            }
                            
                            // Update unit resident count
                            await updateUnitResidentCount(rotation.training_unit_id);
                            
                            showToast('Deleted', 'Rotation has been removed', 'success');
                            await logAuditEvent('DELETE', 'resident_rotations', { rotation_id: rotation.id });
                            await loadLiveStats();
                        } catch (error) {
                            console.error('Error deleting rotation:', error);
                            showToast('Error', error.message, 'error');
                        }
                    }
                });
            };

            // ============ HELPER FUNCTIONS ============
            const updateUnitResidentCount = async (unitId) => {
                try {
                    const { count, error } = await supabaseClient
                        .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                        .select('*', { count: 'exact', head: true })
                        .eq('training_unit_id', unitId)
                        .in('status', ['active', 'upcoming']);
                    
                    if (error) throw error;
                    
                    const currentResidents = count || 0;
                    
                    const { error: updateError } = await supabaseClient
                        .from(TABLE_NAMES.TRAINING_UNITS)
                        .update({ current_residents: currentResidents, updated_at: new Date().toISOString() })
                        .eq('id', unitId);
                    
                    if (updateError) throw updateError;
                    
                    // Update local state
                    const unitIndex = trainingUnits.value.findIndex(u => u.id === unitId);
                    if (unitIndex !== -1) {
                        trainingUnits.value[unitIndex].current_residents = currentResidents;
                    }
                } catch (error) {
                    console.error('Error updating unit resident count:', error);
                }
            };

            const updateCapacityStats = () => {
                // Calculate current capacity based on training units
                const totalCapacity = trainingUnits.value.reduce((sum, unit) => sum + (unit.max_capacity || 0), 0);
                const currentResidents = trainingUnits.value.reduce((sum, unit) => sum + (unit.current_residents || 0), 0);
                
                const occupancy = totalCapacity > 0 ? Math.round((currentResidents / totalCapacity) * 100) : 0;
                
                liveStats.value.occupancy = occupancy;
                liveStats.value.erCapacity = { 
                    current: currentResidents, 
                    max: totalCapacity, 
                    status: getCapacityStatus({ current: currentResidents, max: totalCapacity })
                };
                
                currentCapacity.value.er = { ...liveStats.value.erCapacity };
            };

            const updateActiveAlerts = () => {
                const alerts = [];
                
                // Check for understaffed units
                trainingUnits.value.forEach(unit => {
                    if (unit.status === 'active') {
                        const occupancy = ((unit.current_residents || 0) / unit.max_capacity) * 100;
                        if (occupancy < 50) {
                            alerts.push({
                                id: `unit-${unit.id}`,
                                type: 'warning',
                                message: `${unit.name} is understaffed (${unit.current_residents}/${unit.max_capacity} residents)`,
                                priority: occupancy < 30 ? 'high' : 'medium'
                            });
                        }
                    }
                });
                
                // Check for absences without coverage
                staffAbsences.value.forEach(absence => {
                    if (!absence.replacement_staff_id && new Date(absence.start_date) <= new Date()) {
                        alerts.push({
                            id: `absence-${absence.id}`,
                            type: 'danger',
                            message: `${getStaffName(absence.staff_member_id)} is absent without coverage`,
                            priority: 'high'
                        });
                    }
                });
                
                activeAlerts.value = alerts;
            };

            const dismissAlert = (alertId) => {
                activeAlerts.value = activeAlerts.value.filter(alert => alert.id !== alertId);
            };

            // ============ COMPUTED PROPERTIES ============
            const stats = computed(() => {
                const residents = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active');
                const attendings = medicalStaff.value.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active');
                const today = getLocalDateString();
                
                return {
                    totalStaff: medicalStaff.value.length,
                    activePatients: 0, // Would need patient data
                    todayAppointments: 0, // Would need appointments data
                    pendingAlerts: activeAlerts.value.length,
                    activeResidents: residents.length,
                    attendings: attendings.length
                };
            });

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
                
                if (staffFilter.value.staff_type) {
                    filtered = filtered.filter(s => s.staff_type === staffFilter.value.staff_type);
                }
                
                if (staffFilter.value.employment_status) {
                    filtered = filtered.filter(s => s.employment_status === staffFilter.value.employment_status);
                }
                
                return filtered;
            });

            const todaysOnCall = computed(() => {
                const today = getLocalDateString();
                return onCallSchedule.value.filter(o => o.duty_date === today);
            });

            const filteredRotations = computed(() => {
                let filtered = residentRotations.value;
                
                if (rotationFilter.value.resident_id) {
                    filtered = filtered.filter(r => r.resident_id === rotationFilter.value.resident_id);
                }
                
                if (rotationFilter.value.status) {
                    filtered = filtered.filter(r => r.status === rotationFilter.value.status);
                }
                
                return filtered;
            });

            const filteredAbsences = computed(() => {
                let filtered = staffAbsences.value;
                
                if (absenceFilter.value.staff_id) {
                    filtered = filtered.filter(a => a.staff_member_id === absenceFilter.value.staff_id);
                }
                
                if (absenceFilter.value.status) {
                    filtered = filtered.filter(a => {
                        const today = getLocalDateString();
                        const startDate = new Date(a.start_date);
                        const endDate = new Date(a.end_date);
                        const todayDate = new Date(today);
                        
                        if (absenceFilter.value.status === 'active') {
                            return startDate <= todayDate && endDate >= todayDate;
                        } else if (absenceFilter.value.status === 'upcoming') {
                            return startDate > todayDate;
                        } else if (absenceFilter.value.status === 'completed') {
                            return endDate < todayDate;
                        }
                        return true;
                    });
                }
                
                if (absenceFilter.value.start_date) {
                    filtered = filtered.filter(a => a.start_date >= absenceFilter.value.start_date);
                }
                
                return filtered;
            });

            const filteredAuditLogs = computed(() => {
                let filtered = auditLogs.value;
                
                if (auditFilters.value.dateRange) {
                    const date = new Date();
                    if (auditFilters.value.dateRange === 'today') {
                        const today = date.toISOString().split('T')[0];
                        filtered = filtered.filter(log => log.created_at.startsWith(today));
                    } else if (auditFilters.value.dateRange === 'week') {
                        date.setDate(date.getDate() - 7);
                        const weekAgo = date.toISOString();
                        filtered = filtered.filter(log => log.created_at >= weekAgo);
                    }
                }
                
                if (auditFilters.value.actionType) {
                    filtered = filtered.filter(log => log.action === auditFilters.value.actionType.toUpperCase());
                }
                
                if (auditFilters.value.userId) {
                    filtered = filtered.filter(log => log.user_id === auditFilters.value.userId);
                }
                
                return filtered;
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

            const availablePhysicians = computed(() => {
                return medicalStaff.value.filter(staff => 
                    (staff.staff_type === 'attending_physician' || staff.staff_type === 'fellow') && 
                    staff.employment_status === 'active'
                );
            });

            const availableSupervisors = computed(() => {
                return medicalStaff.value.filter(staff => 
                    (staff.staff_type === 'attending_physician') && 
                    staff.employment_status === 'active'
                );
            });

            const availableHeadsOfDepartment = computed(() => {
                return medicalStaff.value.filter(staff => 
                    staff.staff_type === 'attending_physician' && 
                    staff.employment_status === 'active'
                );
            });

            const unreadNotifications = computed(() => {
                return userNotifications.value.filter(n => !n.read).length;
            });

            // ============ UI FUNCTIONS ============
            const switchView = (view) => {
                if (!currentUser.value) return;
                
                currentView.value = view;
                mobileMenuOpen.value = false;
                
                // Load view-specific data
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
                    daily_operations: 'Real-time department dashboard',
                    medical_staff: 'Manage medical staff with comprehensive profiles',
                    resident_rotations: 'Manage resident training rotations and assignments',
                    oncall_schedule: 'Manage physician on-call duties and emergency coverage',
                    staff_absence: 'Document staff absences and manage clinical coverage',
                    training_units: 'Manage training units and resident capacity allocation',
                    department_management: 'Manage departments and clinical units for organizational structure',
                    communications: 'Announcements, capacity planning, and quick updates',
                    audit_logs: 'Track all system activities and permission changes',
                    permission_manager: 'Manage user permissions and access controls',
                    system_settings: 'Configure system-wide settings and preferences'
                };
                return subtitles[currentView.value] || 'Pulmonology Department Management System';
            };

            const toggleStatsSidebar = () => {
                statsSidebarOpen.value = !statsSidebarOpen.value;
            };

            const toggleSearchScope = () => {
                const scopes = ['global', 'staff', 'patients', 'units'];
                const currentIndex = scopes.indexOf(searchScope.value);
                searchScope.value = scopes[(currentIndex + 1) % scopes.length];
            };

            const handleSearch = () => {
                if (!searchQuery.value.trim()) return;
                
                showToast('Search', `Searching for "${searchQuery.value}" in ${searchScope.value}...`, 'info');
                // Actual search implementation would go here
            };

            // ============ MODAL FUNCTIONS ============
            const showAddMedicalStaffModal = () => {
                if (!hasPermission('medical_staff', 'create')) {
                    showToast('Permission Denied', 'You need create permission to add medical staff', 'error');
                    return;
                }
                
                medicalStaffModal.value = {
                    show: true,
                    mode: 'add',
                    staff: null,
                    activeTab: 'basic',
                    form: {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: `MD-${Date.now().toString().slice(-6)}`,
                        employment_status: 'active',
                        professional_email: '',
                        resident_category: '',
                        training_level: '',
                        specialization: '',
                        years_experience: '',
                        biography: '',
                        medical_license: '',
                        date_of_birth: '',
                        office_phone: '',
                        mobile_phone: '',
                        department_id: ''
                    }
                };
            };

            const editMedicalStaff = (staff) => {
                if (!hasPermission('medical_staff', 'update')) {
                    showToast('Permission Denied', 'You need update permission to edit medical staff', 'error');
                    return;
                }
                
                medicalStaffModal.value = {
                    show: true,
                    mode: 'edit',
                    staff: staff,
                    activeTab: 'basic',
                    form: { ...staff }
                };
            };

            const viewStaffDetails = async (staff) => {
                staffDetailsModal.value.staff = staff;
                staffDetailsModal.value.show = true;
                
                // Load staff-specific data
                try {
                    // Load stats
                    const rotations = residentRotations.value.filter(r => r.resident_id === staff.id);
                    const completedRotations = rotations.filter(r => r.status === 'completed').length;
                    
                    staffDetailsModal.value.stats = {
                        completedRotations,
                        oncallShifts: 0, // Would need to query on-call schedule
                        absenceDays: 0, // Would need to query absences
                        supervisionCount: 0 // Would need to query rotations supervised
                    };
                    
                    // Load current rotation
                    const currentRotation = rotations.find(r => r.status === 'active');
                    staffDetailsModal.value.currentRotation = currentRotation ? 
                        `${getTrainingUnitName(currentRotation.training_unit_id)} (${formatDate(currentRotation.start_date)} - ${formatDate(currentRotation.end_date)})` : 
                        'No active rotation';
                    
                    // Load next on-call
                    const today = getLocalDateString();
                    const nextOncall = onCallSchedule.value
                        .filter(o => o.primary_physician_id === staff.id && o.duty_date >= today)
                        .sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date))[0];
                    
                    staffDetailsModal.value.nextOncall = nextOncall ? 
                        `${formatDate(nextOncall.duty_date)} (${formatTimeRange(nextOncall.start_time, nextOncall.end_time)})` : 
                        'No upcoming on-call';
                        
                } catch (error) {
                    console.error('Error loading staff details:', error);
                }
            };

            const showAddDepartmentModal = () => {
                if (!hasPermission('system', 'manage_departments')) {
                    showToast('Permission Denied', 'You need manage_departments permission', 'error');
                    return;
                }
                
                departmentModal.value = {
                    show: true,
                    mode: 'add',
                    department: null,
                    form: {
                        name: '',
                        code: '',
                        status: 'active',
                        description: '',
                        head_of_department_id: ''
                    }
                };
            };

            const editDepartment = (department) => {
                if (!hasPermission('system', 'manage_departments')) {
                    showToast('Permission Denied', 'You need manage_departments permission', 'error');
                    return;
                }
                
                departmentModal.value = {
                    show: true,
                    mode: 'edit',
                    department: department,
                    form: { ...department }
                };
            };

            const showAddClinicalUnitModal = () => {
                if (!hasPermission('system', 'manage_departments')) {
                    showToast('Permission Denied', 'You need manage_departments permission', 'error');
                    return;
                }
                
                clinicalUnitModal.value = {
                    show: true,
                    mode: 'add',
                    unit: null,
                    form: {
                        name: '',
                        code: '',
                        department_id: '',
                        unit_type: 'clinical',
                        status: 'active',
                        description: '',
                        supervisor_id: ''
                    }
                };
            };

            const editClinicalUnit = (unit) => {
                if (!hasPermission('system', 'manage_departments')) {
                    showToast('Permission Denied', 'You need manage_departments permission', 'error');
                    return;
                }
                
                clinicalUnitModal.value = {
                    show: true,
                    mode: 'edit',
                    unit: unit,
                    form: { ...unit }
                };
            };

            const showAddTrainingUnitModal = () => {
                if (!hasPermission('training_units', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                trainingUnitModal.value = {
                    show: true,
                    mode: 'add',
                    unit: null,
                    form: {
                        name: '',
                        department_id: '',
                        supervisor_id: '',
                        max_capacity: 10,
                        status: 'active',
                        description: ''
                    }
                };
            };

            const editTrainingUnit = (unit) => {
                if (!hasPermission('training_units', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                trainingUnitModal.value = {
                    show: true,
                    mode: 'edit',
                    unit: unit,
                    form: { ...unit }
                };
            };

            const showAddRotationModal = () => {
                if (!hasPermission('resident_rotations', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
                
                rotationModal.value = {
                    show: true,
                    mode: 'add',
                    rotation: null,
                    form: {
                        resident_id: '',
                        training_unit_id: '',
                        start_date: getLocalDateString(startDate),
                        end_date: getLocalDateString(endDate),
                        supervisor_id: '',
                        status: 'active',
                        goals: '',
                        notes: ''
                    }
                };
            };

            const editRotation = (rotation) => {
                if (!hasPermission('resident_rotations', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                rotationModal.value = {
                    show: true,
                    mode: 'edit',
                    rotation: rotation,
                    form: { ...rotation }
                };
            };

            const showAddOnCallModal = () => {
                if (!hasPermission('oncall_schedule', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                onCallModal.value = {
                    show: true,
                    mode: 'add',
                    schedule: null,
                    form: {
                        duty_date: getLocalDateString(tomorrow),
                        shift_type: 'backup_call',
                        start_time: '08:00',
                        end_time: '20:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_notes: ''
                    }
                };
            };

            const editOnCallSchedule = (schedule) => {
                if (!hasPermission('oncall_schedule', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                onCallModal.value = {
                    show: true,
                    mode: 'edit',
                    schedule: schedule,
                    form: {
                        duty_date: schedule.duty_date,
                        shift_type: schedule.shift_type || 'backup_call',
                        start_time: schedule.start_time?.slice(0, 5) || '08:00',
                        end_time: schedule.end_time?.slice(0, 5) || '20:00',
                        primary_physician_id: schedule.primary_physician_id,
                        backup_physician_id: schedule.backup_physician_id || '',
                        coverage_notes: schedule.coverage_notes || ''
                    }
                };
            };

            const showAddAbsenceModal = () => {
                if (!hasPermission('staff_absence', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 7);
                
                absenceModal.value = {
                    show: true,
                    mode: 'add',
                    absence: null,
                    form: {
                        staff_member_id: '',
                        absence_reason: '',
                        start_date: getLocalDateString(startDate),
                        end_date: getLocalDateString(endDate),
                        notes: '',
                        replacement_staff_id: '',
                        coverage_instructions: ''
                    }
                };
            };

            const editAbsence = (absence) => {
                if (!hasPermission('staff_absence', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                absenceModal.value = {
                    show: true,
                    mode: 'edit',
                    absence: absence,
                    form: { ...absence }
                };
            };

            const showQuickPlacementModal = () => {
                if (!hasPermission('placements', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                const startDate = new Date();
                
                quickPlacementModal.value = {
                    show: true,
                    resident_id: '',
                    training_unit_id: '',
                    start_date: getLocalDateString(startDate),
                    duration: 4,
                    supervisor_id: '',
                    notes: ''
                };
            };

            const saveQuickPlacement = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('placements', 'create')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!quickPlacementModal.value.resident_id) {
                        throw new Error('Resident is required');
                    }
                    
                    if (!quickPlacementModal.value.training_unit_id) {
                        throw new Error('Training unit is required');
                    }
                    
                    if (!quickPlacementModal.value.start_date) {
                        throw new Error('Start date is required');
                    }
                    
                    const startDate = new Date(quickPlacementModal.value.start_date);
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + (quickPlacementModal.value.duration * 7));
                    
                    const rotationData = {
                        resident_id: quickPlacementModal.value.resident_id,
                        training_unit_id: quickPlacementModal.value.training_unit_id,
                        start_date: getLocalDateString(startDate),
                        end_date: getLocalDateString(endDate),
                        supervisor_id: quickPlacementModal.value.supervisor_id || null,
                        status: 'active',
                        notes: quickPlacementModal.value.notes,
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
                    await updateUnitResidentCount(quickPlacementModal.value.training_unit_id);
                    
                    showToast('Success', 'Resident placed successfully', 'success');
                    await logAuditEvent('CREATE', 'placements', { rotation_id: data.id });
                    
                    quickPlacementModal.value.show = false;
                    await loadLiveStats();
                } catch (error) {
                    console.error('Error saving quick placement:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const showBulkAssignModal = () => {
                if (!hasPermission('training_units', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                bulkAssignModal.value = {
                    show: true,
                    selectedResidents: [],
                    training_unit_id: '',
                    start_date: getLocalDateString(),
                    duration: 4,
                    supervisor_id: ''
                };
            };

            const saveBulkAssignment = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('training_units', 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (bulkAssignModal.value.selectedResidents.length === 0) {
                        throw new Error('Please select at least one resident');
                    }
                    
                    if (!bulkAssignModal.value.training_unit_id) {
                        throw new Error('Training unit is required');
                    }
                    
                    if (!bulkAssignModal.value.start_date) {
                        throw new Error('Start date is required');
                    }
                    
                    const startDate = new Date(bulkAssignModal.value.start_date);
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + (bulkAssignModal.value.duration * 7));
                    
                    const rotations = bulkAssignModal.value.selectedResidents.map(residentId => ({
                        resident_id: residentId,
                        training_unit_id: bulkAssignModal.value.training_unit_id,
                        start_date: getLocalDateString(startDate),
                        end_date: getLocalDateString(endDate),
                        supervisor_id: bulkAssignModal.value.supervisor_id || null,
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                        .insert(rotations)
                        .select();
                    
                    if (error) throw error;
                    
                    data.forEach(rotation => {
                        residentRotations.value.unshift(rotation);
                    });
                    
                    await updateUnitResidentCount(bulkAssignModal.value.training_unit_id);
                    
                    showToast('Success', `${data.length} residents assigned successfully`, 'success');
                    await logAuditEvent('BULK_CREATE', 'resident_rotations', { count: data.length, unit_id: bulkAssignModal.value.training_unit_id });
                    
                    bulkAssignModal.value.show = false;
                    await loadLiveStats();
                } catch (error) {
                    console.error('Error saving bulk assignment:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const showCommunicationsModal = () => {
                if (!hasPermission('communications', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                const today = getLocalDateString();
                
                communicationsModal.value = {
                    show: true,
                    activeTab: 'announcement',
                    form: {
                        announcement_title: '',
                        announcement_content: '',
                        publish_start_date: today,
                        publish_end_date: '',
                        priority_level: 'medium',
                        target_audience: 'all'
                    },
                    capacity: {
                        er: { current: currentCapacity.value.er.current, max: currentCapacity.value.er.max, notes: '' },
                        icu: { current: currentCapacity.value.icu.current, max: currentCapacity.value.icu.max, notes: '' },
                        ward: { current: 0, max: 0, notes: '' },
                        stepdown: { current: 0, max: 0, notes: '' },
                        clinic: { current: 0, max: 0, notes: '' },
                        bronch: { current: 0, max: 0, notes: '' },
                        overall_notes: ''
                    },
                    quickUpdate: {
                        message: '',
                        priority: 'info',
                        expires: '24',
                        tags: ''
                    }
                };
            };

            const saveCommunication = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('communications', 'create')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (communicationsModal.value.activeTab === 'announcement') {
                        if (!communicationsModal.value.form.announcement_title.trim()) {
                            throw new Error('Announcement title is required');
                        }
                        
                        if (!communicationsModal.value.form.announcement_content.trim()) {
                            throw new Error('Announcement content is required');
                        }
                        
                        if (!communicationsModal.value.form.publish_start_date) {
                            throw new Error('Publish date is required');
                        }
                        
                        const announcementData = {
                            ...communicationsModal.value.form,
                            created_by: currentUser.value.id,
                            created_by_name: currentUser.value.full_name,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.ANNOUNCEMENTS)
                            .insert([announcementData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        announcements.value.unshift(data);
                        showToast('Success', 'Announcement published successfully', 'success');
                        await logAuditEvent('CREATE', 'communications', { announcement_id: data.id, title: data.announcement_title });
                        
                    } else if (communicationsModal.value.activeTab === 'capacity') {
                        // Update capacity in system settings or a dedicated table
                        currentCapacity.value.er = { 
                            ...communicationsModal.value.capacity.er,
                            status: getCapacityStatus(communicationsModal.value.capacity.er)
                        };
                        
                        currentCapacity.value.icu = { 
                            ...communicationsModal.value.capacity.icu,
                            status: getCapacityStatus(communicationsModal.value.capacity.icu)
                        };
                        
                        showToast('Success', 'Capacity information updated', 'success');
                        await logAuditEvent('UPDATE', 'communications', { type: 'capacity_update' });
                        
                    } else if (communicationsModal.value.activeTab === 'quick') {
                        if (!communicationsModal.value.quickUpdate.message.trim()) {
                            throw new Error('Message is required');
                        }
                        
                        // Create a quick announcement
                        const quickAnnouncement = {
                            announcement_title: 'Quick Update',
                            announcement_content: communicationsModal.value.quickUpdate.message,
                            publish_start_date: getLocalDateString(),
                            publish_end_date: getLocalDateString(new Date(Date.now() + parseInt(communicationsModal.value.quickUpdate.expires) * 60 * 60 * 1000)),
                            priority_level: communicationsModal.value.quickUpdate.priority,
                            target_audience: 'all',
                            created_by: currentUser.value.id,
                            created_by_name: currentUser.value.full_name,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.ANNOUNCEMENTS)
                            .insert([quickAnnouncement])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        announcements.value.unshift(data);
                        showToast('Success', 'Quick update posted', 'success');
                        await logAuditEvent('CREATE', 'communications', { announcement_id: data.id, type: 'quick_update' });
                    }
                    
                    communicationsModal.value.show = false;
                } catch (error) {
                    console.error('Error saving communication:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const showSystemSettingsModal = () => {
                if (!hasPermission('system', 'read')) {
                    showToast('Permission Denied', 'You need read permission', 'error');
                    return;
                }
                
                systemSettingsModal.value = {
                    show: true,
                    form: { ...systemSettings.value }
                };
            };

            const saveSystemSettings = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('system', 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.SYSTEM_SETTINGS)
                        .upsert([systemSettingsModal.value.form])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    systemSettings.value = data;
                    showToast('Success', 'System settings saved successfully', 'success');
                    await logAuditEvent('UPDATE', 'system', { settings_updated: true });
                    
                    systemSettingsModal.value.show = false;
                } catch (error) {
                    console.error('Error saving system settings:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const showUserProfile = () => {
                userProfileModal.value = {
                    show: true,
                    form: {
                        full_name: currentUser.value.full_name,
                        email: currentUser.value.email,
                        phone: currentUser.value.phone || '',
                        department_id: currentUser.value.department_id || '',
                        notifications_enabled: currentUser.value.notifications_enabled !== false,
                        absence_notifications: currentUser.value.absence_notifications !== false,
                        announcement_notifications: currentUser.value.announcement_notifications !== false
                    }
                };
                userMenuOpen.value = false;
            };

            const saveUserProfile = async () => {
                saving.value = true;
                try {
                    const updateData = {
                        ...userProfileModal.value.form,
                        updated_at: new Date().toISOString()
                    };
                    
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.USERS)
                        .update(updateData)
                        .eq('id', currentUser.value.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    currentUser.value = { ...currentUser.value, ...data };
                    showToast('Success', 'Profile updated successfully', 'success');
                    await logAuditEvent('UPDATE', 'user_profile', { user_id: currentUser.value.id });
                    
                    userProfileModal.value.show = false;
                } catch (error) {
                    console.error('Error saving user profile:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            const showPermissionManager = () => {
                if (!hasPermission('permissions', 'read')) {
                    showToast('Permission Denied', 'You need read permission', 'error');
                    return;
                }
                
                currentView.value = 'permission_manager';
            };

            const showAddRoleModal = () => {
                if (!hasPermission('permissions', 'manage')) {
                    showToast('Permission Denied', 'You need manage permission', 'error');
                    return;
                }
                
                roleModal.value = {
                    show: true,
                    mode: 'add',
                    role: null,
                    form: {
                        name: '',
                        description: '',
                        permissions: []
                    }
                };
            };

            const editRole = (role) => {
                if (!hasPermission('permissions', 'manage')) {
                    showToast('Permission Denied', 'You need manage permission', 'error');
                    return;
                }
                
                roleModal.value = {
                    show: true,
                    mode: 'edit',
                    role: role,
                    form: { ...role }
                };
            };

            const saveRole = async () => {
                saving.value = true;
                try {
                    if (!hasPermission('permissions', 'manage')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!roleModal.value.form.name.trim()) {
                        throw new Error('Role name is required');
                    }
                    
                    let result;
                    if (roleModal.value.mode === 'add') {
                        const roleData = {
                            ...roleModal.value.form,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.USER_ROLES)
                            .insert([roleData])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        userRoles.value.push(result);
                        showToast('Success', 'Role added successfully', 'success');
                        await logAuditEvent('CREATE', 'permissions', { role_id: result.id, name: result.name });
                    } else {
                        const updateData = {
                            ...roleModal.value.form,
                            updated_at: new Date().toISOString()
                        };
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.USER_ROLES)
                            .update(updateData)
                            .eq('id', roleModal.value.role.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        result = data;
                        const index = userRoles.value.findIndex(r => r.id === result.id);
                        if (index !== -1) {
                            userRoles.value[index] = result;
                        }
                        showToast('Success', 'Role updated successfully', 'success');
                        await logAuditEvent('UPDATE', 'permissions', { role_id: result.id, name: result.name });
                    }
                    
                    roleModal.value.show = false;
                } catch (error) {
                    console.error('Error saving role:', error);
                    showToast('Error', error.message, 'error');
                } finally {
                    saving.value = false;
                }
            };

            // ============ AUTHENTICATION ============
            const handleLogin = async () => {
                loading.value = true;
                try {
                    const email = loginForm.value.email.trim().toLowerCase();
                    const password = loginForm.value.password;
                    
                    if (!email || !password) {
                        throw new Error('Please fill in all fields');
                    }
                    
                    // For development: Use demo credentials
                    if (email === 'admin@neumocare.org' && password === 'password123') {
                        currentUser.value = {
                            id: '1',
                            email: email,
                            full_name: 'System Administrator',
                            user_role: 'system_admin',
                            phone: '+1 (555) 123-4567',
                            department_id: '1',
                            account_status: 'active',
                            notifications_enabled: true,
                            absence_notifications: true,
                            announcement_notifications: true
                        };
                        
                        showToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
                        await logAuditEvent('LOGIN', 'auth', { email: email });
                        
                        // Load initial data
                        await loadInitialData();
                        currentView.value = 'daily_operations';
                        
                    } else {
                        throw new Error('Invalid credentials. Use admin@neumocare.org / password123');
                    }
                    
                } catch (error) {
                    console.error('Login error:', error);
                    showToast('Login Failed', error.message, 'error');
                    await logAuditEvent('LOGIN_FAILED', 'auth', { email: loginForm.value.email, error: error.message });
                } finally {
                    loading.value = false;
                    loginForm.value.password = '';
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

            // ============ LIFECYCLE HOOKS ============
            onMounted(() => {
                // Start live stats refresh interval
                const statsInterval = setInterval(async () => {
                    if (currentUser.value && currentView.value === 'daily_operations') {
                        await loadLiveStats();
                    }
                }, 30000);
                
                // Cleanup on unmount
                onUnmounted(() => {
                    clearInterval(statsInterval);
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
                statsSidebarOpen,
                searchQuery,
                searchScope,
                searchFilter,
                userMenuOpen,
                
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
                quickPlacementModal,
                bulkAssignModal,
                communicationsModal,
                systemSettingsModal,
                userProfileModal,
                roleModal,
                
                // Data Stores
                medicalStaff,
                trainingUnits,
                residentRotations,
                staffAbsences,
                onCallSchedule,
                announcements,
                auditLogs,
                departments,
                clinicalUnits,
                userNotifications,
                systemSettings,
                userRoles,
                users,
                
                // UI State
                toasts,
                staffSearch,
                staffFilter,
                rotationFilter,
                absenceFilter,
                auditFilters,
                liveStats,
                currentCapacity,
                loadingStats,
                loadingAnnouncements,
                loadingSchedule,
                loadingStaff,
                loadingRotations,
                loadingAbsences,
                loadingAuditLogs,
                activeAlerts,
                
                // Computed Properties
                stats,
                filteredMedicalStaff,
                todaysOnCall,
                filteredRotations,
                filteredAbsences,
                filteredAuditLogs,
                availableResidents,
                availableTrainingUnits,
                availablePhysicians,
                availableSupervisors,
                availableHeadsOfDepartment,
                unreadNotifications,
                
                // Core Functions
                hasPermission,
                roleHasPermission,
                getUserPermissions,
                
                // Utility Functions
                getInitials,
                formatDate,
                formatDateTime,
                formatTimeAgo,
                formatTimeRange,
                getUserRoleDisplay,
                formatStaffType,
                getStaffTypeClass,
                formatEmploymentStatus,
                formatResidentCategory,
                formatTrainingLevel,
                formatAbsenceReason,
                formatAbsenceStatus,
                getAbsenceStatusClass,
                formatRotationStatus,
                getRotationStatusClass,
                formatAuditAction,
                formatPermissionName,
                getPriorityColor,
                getCapacityStatus,
                getCommunicationIcon,
                getCommunicationButtonText,
                getStaffName,
                getDepartmentName,
                getTrainingUnitName,
                getDepartmentUnits,
                getUnitResidents,
                getSupervisorName,
                getUserName,
                calculateAbsenceDuration,
                
                // Navigation Functions
                switchView,
                getCurrentTitle,
                getCurrentSubtitle,
                toggleStatsSidebar,
                toggleSearchScope,
                handleSearch,
                
                // Modal Functions
                showConfirmation,
                confirmAction,
                cancelConfirmation,
                showAddMedicalStaffModal,
                editMedicalStaff,
                viewStaffDetails,
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
                deleteRotation,
                showAddOnCallModal,
                editOnCallSchedule,
                saveOnCallSchedule,
                showAddAbsenceModal,
                editAbsence,
                saveAbsence,
                showQuickPlacementModal,
                saveQuickPlacement,
                showBulkAssignModal,
                saveBulkAssignment,
                showCommunicationsModal,
                saveCommunication,
                showSystemSettingsModal,
                saveSystemSettings,
                showUserProfile,
                saveUserProfile,
                showPermissionManager,
                showAddRoleModal,
                editRole,
                saveRole,
                
                // Authentication Functions
                handleLogin,
                handleLogout,
                
                // UI Functions
                removeToast,
                dismissAlert,
                toggleUserMenu
            };
        }
    });

    // ============ MOUNT THE APP ============
    app.mount('#app');
    console.log('Vue app mounted successfully');
    
    // Initialize database after app is mounted
    try {
        await initializeDatabase();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});

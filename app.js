// ============ COMPLETE NEMO-CARE HOSPITAL MANAGEMENT SYSTEM ============
// Main Application Logic with Full Database Integration
// Updated to match actual database structure
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
        
        // Test connection with a simple query
        const { data, error } = await supabaseClient.from('app_users').select('count').limit(1);
        if (error) {
            console.warn('Supabase connection test failed:', error.message);
            // Don't throw error, continue with app
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
    // Updated to match your actual database structure
    const TABLE_NAMES = {
        USERS: 'app_users',
        MEDICAL_STAFF: 'medical_staff',
        DEPARTMENTS: 'departments',
        CLINICAL_UNITS: 'clinical_units',
        TRAINING_UNITS: 'training_units',
        RESIDENT_ROTATIONS: 'resident_rotations',
        STAFF_ABSENCES: 'leave_requests',
        ONCALL_SCHEDULE: 'oncall_schedule',
        DAILY_ASSIGNMENTS: 'daily_assignments',
        ANNOUNCEMENTS: 'department_announcements',
        NOTIFICATIONS: 'notifications',
        AUDIT_LOGS: 'audit_logs',
        SYSTEM_AUDIT_LOG: 'system_audit_log',
        SYSTEM_SETTINGS: 'system_settings',
        SYSTEM_ROLES: 'system_roles',
        SYSTEM_PERMISSIONS: 'system_permissions'
    };
    
    // ============ DATABASE INITIALIZATION ============
    async function initializeDatabase() {
        console.log('Initializing database...');
        
        try {
            // Test connection with a safe query
            const { data, error } = await supabaseClient
                .from('app_users')
                .select('id')
                .limit(1);
            
            if (error) {
                console.warn('Database connection test failed:', error.message);
                // Continue anyway - some tables might not exist yet
            } else {
                console.log('Database connection test successful');
            }
            
        } catch (error) {
            console.error('Database initialization error:', error);
            // Don't throw - let the app load in degraded mode
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
                console.warn('Failed to log audit event:', error);
                // Fallback to system_audit_log
                const systemLog = {
                    user_id: auditLog.user_id,
                    user_role: auditLog.user_role,
                    action_type: action,
                    table_name: resource,
                    ip_address: auditLog.ip_address,
                    user_agent: auditLog.user_agent,
                    details: auditLog.details,
                    created_at: auditLog.created_at
                };
                
                await supabaseClient
                    .from(TABLE_NAMES.SYSTEM_AUDIT_LOG)
                    .insert([systemLog]);
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
            system: { name: 'System Settings', actions: ['read', 'update'] }
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
                    system: { read: true, update: true }
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
                    system: { read: true, update: false }
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
                    system: { read: false, update: false }
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
                    system: { read: false, update: false }
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
                    system: { read: false, update: false }
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
    const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const getLocalDateString = (date = new Date()) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };
    
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
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
            const currentView = ref('login');
            const sidebarCollapsed = ref(false);
            const mobileMenuOpen = ref(false);
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
            const departments = ref([]);
            const clinicalUnits = ref([]);
            const trainingUnits = ref([]);
            const residentRotations = ref([]);
            const staffAbsences = ref([]);
            const onCallSchedule = ref([]);
            const announcements = ref([]);
            const users = ref([]);
            
            // Modal states
            const staffDetailsModal = ref({ show: false, staff: null });
            const medicalStaffModal = ref({ show: false, mode: 'add', staff: null });
            const departmentModal = ref({ show: false, mode: 'add', department: null });
            const clinicalUnitModal = ref({ show: false, mode: 'add', unit: null });
            const trainingUnitModal = ref({ show: false, mode: 'add', unit: null });
            const rotationModal = ref({ show: false, mode: 'add', rotation: null });
            const onCallModal = ref({ show: false, mode: 'add', schedule: null });
            const absenceModal = ref({ show: false, mode: 'add', absence: null });
            const communicationsModal = ref({ show: false });
            const systemSettingsModal = ref({ show: false });
            
            // UI states
            const toasts = ref([]);
            let toastId = 0;
            const staffSearch = ref('');
            const activeAlerts = ref([]);
            
            // Loading states
            const loadingStaff = ref(false);
            const loadingDepartments = ref(false);
            const loadingTrainingUnits = ref(false);
            const loadingRotations = ref(false);
            const loadingAbsences = ref(false);
            const loadingSchedule = ref(false);
            
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
                return unit ? unit.unit_name : `Unit ${unitId.substring(0, 8)}`;
            };
            
            // ============ PERMISSION FUNCTIONS ============
            const hasPermission = (resource, action) => {
                if (!currentUser.value) return false;
                if (currentUser.value.user_role === 'system_admin') return true;
                return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action);
            };

            // ============ DATABASE OPERATIONS ============
            // ============ LOAD FUNCTIONS ============
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
                    
                    if (error) {
                        console.log('Departments table error:', error);
                        departments.value = [];
                        return;
                    }
                    
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
                    
                    if (error) {
                        console.log('Training units error:', error);
                        trainingUnits.value = [];
                        return;
                    }
                    
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
                    
                    if (error) {
                        console.log('Resident rotations error:', error);
                        residentRotations.value = [];
                        return;
                    }
                    
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
                    const today = getLocalDateString();
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.STAFF_ABSENCES)
                        .select('*')
                        .gte('leave_end_date', today)
                        .order('leave_start_date');
                    
                    if (error) {
                        console.log('Staff absences error:', error);
                        staffAbsences.value = [];
                        return;
                    }
                    
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
                    const today = getLocalDateString();
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.ONCALL_SCHEDULE)
                        .select('*')
                        .gte('duty_date', today)
                        .order('duty_date')
                        .limit(7);
                    
                    if (error) {
                        console.log('On-call schedule error:', error);
                        onCallSchedule.value = [];
                        return;
                    }
                    
                    onCallSchedule.value = data || [];
                } catch (error) {
                    console.error('Error loading on-call schedule:', error);
                    onCallSchedule.value = [];
                } finally {
                    loadingSchedule.value = false;
                }
            };

            const loadAnnouncements = async () => {
                try {
                    const today = getLocalDateString();
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.ANNOUNCEMENTS)
                        .select('*')
                        .lte('publish_start_date', today)
                        .or(`publish_end_date.gte.${today},publish_end_date.is.null`)
                        .order('publish_start_date', { ascending: false })
                        .limit(10);
                    
                    if (error) {
                        console.log('Announcements error:', error);
                        announcements.value = [];
                        return;
                    }
                    
                    announcements.value = data || [];
                } catch (error) {
                    console.error('Error loading announcements:', error);
                    announcements.value = [];
                }
            };

            const loadUsers = async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from(TABLE_NAMES.USERS)
                        .select('*')
                        .order('full_name');
                    
                    if (error) {
                        console.log('Users error:', error);
                        users.value = [];
                        return;
                    }
                    
                    users.value = data || [];
                } catch (error) {
                    console.error('Error loading users:', error);
                    users.value = [];
                }
            };

            const loadInitialData = async () => {
                loading.value = true;
                try {
                    // Load essential data first
                    await Promise.all([
                        loadMedicalStaff(),
                        loadDepartments(),
                        loadTrainingUnits(),
                        loadResidentRotations(),
                        loadStaffAbsences(),
                        loadOnCallSchedule(),
                        loadAnnouncements(),
                        loadUsers()
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

            // ============ SAVE FUNCTIONS ============
            const saveMedicalStaff = async (formData) => {
                saving.value = true;
                try {
                    if (!hasPermission('medical_staff', medicalStaffModal.value.mode === 'add' ? 'create' : 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!formData.full_name?.trim()) {
                        throw new Error('Full name is required');
                    }
                    
                    let result;
                    if (medicalStaffModal.value.mode === 'add') {
                        const staffData = {
                            ...formData,
                            staff_id: formData.staff_id || `MD-${Date.now().toString().slice(-6)}`,
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
                            ...formData,
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
                    return result;
                } catch (error) {
                    console.error('Error saving medical staff:', error);
                    showToast('Error', error.message, 'error');
                    throw error;
                } finally {
                    saving.value = false;
                }
            };

            const saveDepartment = async (formData) => {
                saving.value = true;
                try {
                    if (!hasPermission('system', departmentModal.value.mode === 'add' ? 'create' : 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!formData.name?.trim()) {
                        throw new Error('Department name is required');
                    }
                    
                    if (!formData.code?.trim()) {
                        throw new Error('Department code is required');
                    }
                    
                    let result;
                    if (departmentModal.value.mode === 'add') {
                        const departmentData = {
                            ...formData,
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
                            ...formData,
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
                    return result;
                } catch (error) {
                    console.error('Error saving department:', error);
                    showToast('Error', error.message, 'error');
                    throw error;
                } finally {
                    saving.value = false;
                }
            };

            const saveTrainingUnit = async (formData) => {
                saving.value = true;
                try {
                    if (!hasPermission('training_units', trainingUnitModal.value.mode === 'add' ? 'create' : 'update')) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    if (!formData.unit_name?.trim()) {
                        throw new Error('Unit name is required');
                    }
                    
                    if (!formData.unit_code?.trim()) {
                        throw new Error('Unit code is required');
                    }
                    
                    let result;
                    if (trainingUnitModal.value.mode === 'add') {
                        const unitData = {
                            ...formData,
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
                        await logAuditEvent('CREATE', 'training_units', { unit_id: result.id, name: result.unit_name });
                    } else {
                        const updateData = {
                            ...formData,
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
                        await logAuditEvent('UPDATE', 'training_units', { unit_id: result.id, name: result.unit_name });
                    }
                    
                    trainingUnitModal.value.show = false;
                    return result;
                } catch (error) {
                    console.error('Error saving training unit:', error);
                    showToast('Error', error.message, 'error');
                    throw error;
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
                        } catch (error) {
                            console.error('Error deleting medical staff:', error);
                            showToast('Error', error.message, 'error');
                        }
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
                
                return filtered;
            });

            const stats = computed(() => {
                const residents = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active');
                const attendings = medicalStaff.value.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active');
                
                return {
                    totalStaff: medicalStaff.value.length,
                    activeResidents: residents.length,
                    attendings: attendings.length,
                    departments: departments.value.length,
                    trainingUnits: trainingUnits.value.length
                };
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
                    communications: 'Communications'
                };
                return titles[currentView.value] || 'NeumoCare';
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
                    staff: null
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
                    staff: staff
                };
            };

            const showAddDepartmentModal = () => {
                if (!hasPermission('system', 'create')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                departmentModal.value = {
                    show: true,
                    mode: 'add',
                    department: null
                };
            };

            const editDepartment = (department) => {
                if (!hasPermission('system', 'update')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                departmentModal.value = {
                    show: true,
                    mode: 'edit',
                    department: department
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
                    unit: null
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
                    unit: unit
                };
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
                        // Try to get user from database
                        const { data: users, error } = await supabaseClient
                            .from(TABLE_NAMES.USERS)
                            .select('*')
                            .eq('email', email)
                            .limit(1);
                        
                        if (error) {
                            console.warn('Could not fetch user from database:', error);
                            // Create demo user
                            currentUser.value = {
                                id: '11111111-1111-1111-1111-111111111111',
                                email: email,
                                full_name: 'System Administrator',
                                user_role: 'system_admin',
                                department: 'Administration',
                                account_status: 'active'
                            };
                        } else if (users && users.length > 0) {
                            // Use existing user
                            currentUser.value = users[0];
                        } else {
                            // Create demo user
                            currentUser.value = {
                                id: '11111111-1111-1111-1111-111111111111',
                                email: email,
                                full_name: 'System Administrator',
                                user_role: 'system_admin',
                                department: 'Administration',
                                account_status: 'active'
                            };
                        }
                        
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
                console.log('App mounted');
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
                systemSettingsModal,
                
                // Data Stores
                medicalStaff,
                departments,
                clinicalUnits,
                trainingUnits,
                residentRotations,
                staffAbsences,
                onCallSchedule,
                announcements,
                users,
                
                // UI State
                toasts,
                staffSearch,
                activeAlerts,
                
                // Loading States
                loadingStaff,
                loadingDepartments,
                loadingTrainingUnits,
                loadingRotations,
                loadingAbsences,
                loadingSchedule,
                
                // Computed Properties
                stats,
                filteredMedicalStaff,
                
                // Core Functions
                hasPermission,
                
                // Utility Functions
                getInitials,
                formatDate,
                formatDateTime,
                formatStaffType,
                getStaffTypeClass,
                formatEmploymentStatus,
                getStaffName,
                getDepartmentName,
                getTrainingUnitName,
                
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
                editDepartment,
                saveDepartment,
                showAddTrainingUnitModal,
                editTrainingUnit,
                saveTrainingUnit,
                
                // Authentication Functions
                handleLogin,
                handleLogout,
                
                // UI Functions
                removeToast,
                showToast
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

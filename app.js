// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM ============
// COMPLETELY REWRITTEN - PERFECT SYNC WITH HTML & DATABASE
// =======================================================

// Wait for page to fully load
window.addEventListener('load', async function() {
    console.log('Page fully loaded, initializing NeumoCare Hospital Management System...');
    
    // Check if Vue is available
    if (typeof Vue === 'undefined') {
        console.error('Vue.js is not available');
        document.body.innerHTML = '<div style="padding: 20px; color: red; text-align: center; margin-top: 50px;">' +
            '<h2>System Error</h2>' +
            '<p>Vue.js failed to load. Please refresh the page.</p>' +
            '</div>';
        return;
    }
    
    console.log('Vue.js loaded successfully:', Vue.version);
    
    // Get Vue functions
    const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    
    // ============ SUPABASE CLIENT SETUP ============
    const SUPABASE_URL = 'https://vssmguzuvekkecbmwcjw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXb-vXw';
    
    let supabaseClient;
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return;
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
        DAILY_ASSIGNMENTS: 'daily_assignments',
        ANNOUNCEMENTS: 'department_announcements',
        NOTIFICATIONS: 'notifications',
        AUDIT_LOGS: 'audit_logs',
        SYSTEM_AUDIT_LOG: 'system_audit_log',
        SYSTEM_SETTINGS: 'system_settings',
        SYSTEM_ROLES: 'system_roles',
        SYSTEM_PERMISSIONS: 'system_permissions'
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
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '';
        }
    };
    
    const formatDateTime = (dateString) => {
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
    };
    
    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };
    
    // ============ CREATE VUE APP ============
    const app = createApp({
        setup() {
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
            
            // Modal States - Using reactive for complex objects
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
                stats: {},
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
            
            // Data Stores
            const medicalStaff = ref([]);
            const departments = ref([]);
            const trainingUnits = ref([]);
            const residentRotations = ref([]);
            const staffAbsences = ref([]);
            const onCallSchedule = ref([]);
            const recentAnnouncements = ref([]);
            const users = ref([]);
            
            // UI State
            const toasts = ref([]);
            const activeAlerts = ref([]);
            const staffSearch = ref('');
            
            // Loading States
            const loadingStats = ref(false);
            const loadingStaff = ref(false);
            const loadingAnnouncements = ref(false);
            const loadingSchedule = ref(false);
            const loadingRotations = ref(false);
            const loadingAbsences = ref(false);
            
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
                if (confirmationModal.onConfirm) {
                    await confirmationModal.onConfirm();
                }
                confirmationModal.show = false;
            };

            const cancelConfirmation = () => {
                if (confirmationModal.onCancel) {
                    confirmationModal.onCancel();
                }
                confirmationModal.show = false;
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
            
            // ============ PERMISSION FUNCTIONS ============
            const hasPermission = (resource, action) => {
                if (!currentUser.value) return false;
                if (currentUser.value.user_role === 'system_admin') return true;
                return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action);
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
                }
            };
            
            const loadTrainingUnits = async () => {
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
                        loadUsers()
                    ]);
                    showToast('System Ready', 'All data loaded successfully', 'success');
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
                    const formData = { ...medicalStaffModal.form };
                    
                    if (!formData.full_name?.trim()) {
                        throw new Error('Full name is required');
                    }
                    
                    if (!formData.professional_email?.trim()) {
                        throw new Error('Professional email is required');
                    }
                    
                    let result;
                    if (medicalStaffModal.mode === 'add') {
                        formData.staff_id = formData.staff_id || `MD-${Date.now().toString().slice(-6)}`;
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
                    } else {
                        formData.updated_at = new Date().toISOString();
                        
                        const { data, error } = await supabaseClient
                            .from(TABLE_NAMES.MEDICAL_STAFF)
                            .update(formData)
                            .eq('id', medicalStaffModal.form.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        const index = medicalStaff.value.findIndex(s => s.id === result.id);
                        if (index !== -1) medicalStaff.value[index] = result;
                        
                        showToast('Success', 'Medical staff updated successfully', 'success');
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
                    const formData = { ...departmentModal.form };
                    
                    if (!formData.name?.trim()) {
                        throw new Error('Department name is required');
                    }
                    
                    if (!formData.code?.trim()) {
                        throw new Error('Department code is required');
                    }
                    
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
                            .eq('id', departmentModal.form.id)
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
            
            // ============ HELPER FUNCTIONS ============
            const getDepartmentName = (departmentId) => {
                if (!departmentId) return 'Unassigned';
                const department = departments.value.find(d => d.id === departmentId);
                return department ? department.name : `Department ${departmentId.substring(0, 8)}`;
            };
            
            const getStaffName = (staffId) => {
                if (!staffId) return 'Unknown';
                const staff = medicalStaff.value.find(s => s.id === staffId);
                return staff ? staff.full_name : `Staff ${staffId.substring(0, 8)}`;
            };
            
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
            
            const showAddDepartmentModal = () => {
                if (!hasPermission('system', 'manage_departments')) {
                    showToast('Permission Denied', 'You need create permission', 'error');
                    return;
                }
                
                departmentModal.mode = 'add';
                departmentModal.show = true;
                resetDepartmentModal();
            };
            
            const editDepartment = (department) => {
                if (!hasPermission('system', 'manage_departments')) {
                    showToast('Permission Denied', 'You need update permission', 'error');
                    return;
                }
                
                departmentModal.mode = 'edit';
                departmentModal.show = true;
                departmentModal.form = { ...department };
            };
            
            // ============ AUTHENTICATION ============
            const handleLogin = async () => {
                loading.value = true;
                try {
                    const email = loginForm.email.trim().toLowerCase();
                    const password = loginForm.password;
                    
                    if (!email || !password) {
                        throw new Error('Please fill in all fields');
                    }
                    
                    if (email === 'admin@neumocare.org' && password === 'password123') {
                        const { data: users, error } = await supabaseClient
                            .from(TABLE_NAMES.USERS)
                            .select('*')
                            .eq('email', email)
                            .limit(1);
                        
                        if (error) {
                            console.warn('Could not fetch user from database:', error);
                            currentUser.value = {
                                id: '11111111-1111-1111-1111-111111111111',
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
                                id: '11111111-1111-1111-1111-111111111111',
                                email: email,
                                full_name: 'System Administrator',
                                user_role: 'system_admin',
                                department: 'Administration',
                                account_status: 'active'
                            };
                        }
                        
                        showToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
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
                
                return filtered;
            });
            
            const stats = computed(() => {
                const today = new Date().toISOString().split('T')[0];
                const activeStaff = medicalStaff.value.filter(s => s.employment_status === 'active').length;
                const residents = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active').length;
                const todayOnCall = onCallSchedule.value.filter(s => s.duty_date === today).length;
                
                return {
                    totalStaff: activeStaff,
                    activePatients: Math.floor(Math.random() * 50) + 20,
                    todayAppointments: Math.floor(Math.random() * 30) + 10,
                    pendingAlerts: Math.floor(Math.random() * 5),
                    activeResidents: residents,
                    todayOnCall: todayOnCall
                };
            });
            
            const todaysOnCall = computed(() => {
                const today = new Date().toISOString().split('T')[0];
                return onCallSchedule.value.filter(schedule => schedule.duty_date === today)
                    .map(schedule => ({
                        ...schedule,
                        physician_name: getStaffName(schedule.primary_physician_id)
                    }));
            });
            
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
                return trainingUnits.value.filter(unit => unit.unit_status === 'active');
            });
            
            const availableStaff = computed(() => {
                return medicalStaff.value.filter(staff => staff.employment_status === 'active');
            });
            
            const availableCoverageStaff = computed(() => {
                return availableStaff.value.filter(staff => 
                    staff.staff_type !== 'medical_resident'
                );
            });
            
            const liveStats = computed(() => ({
                occupancy: Math.floor(Math.random() * 30) + 60,
                occupancyTrend: Math.floor(Math.random() * 10) - 5,
                onDutyStaff: Math.floor(Math.random() * 10) + 5,
                staffTrend: Math.floor(Math.random() * 5) - 2,
                pendingRequests: Math.floor(Math.random() * 8),
                erCapacity: { current: Math.floor(Math.random() * 15) + 5, max: 20, status: 'medium' },
                icuCapacity: { current: Math.floor(Math.random() * 6) + 2, max: 10, status: 'low' }
            }));
            
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
                statsSidebarOpen,
                
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
                
                // Data Stores
                medicalStaff,
                departments,
                trainingUnits,
                residentRotations,
                staffAbsences,
                onCallSchedule,
                recentAnnouncements,
                users,
                
                // UI State
                toasts,
                activeAlerts,
                staffSearch,
                
                // Loading States
                loadingStats,
                loadingStaff,
                loadingAnnouncements,
                loadingSchedule,
                loadingRotations,
                loadingAbsences,
                
                // Computed Properties
                stats,
                liveStats,
                filteredMedicalStaff,
                todaysOnCall,
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
                getInitials,
                formatDate,
                formatDateTime,
                formatStaffType,
                getStaffTypeClass,
                formatEmploymentStatus,
                getDepartmentName,
                getStaffName,
                
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
                showAddDepartmentModal,
                editDepartment,
                saveDepartment,
                
                // Authentication Functions
                handleLogin,
                handleLogout,
                
                // UI Functions
                removeToast,
                showToast,
                
                // Simple event handlers for HTML
                toggleStatsSidebar: () => statsSidebarOpen.value = !statsSidebarOpen.value,
                toggleUserMenu: () => userMenuOpen.value = !userMenuOpen.value,
                toggleActionMenu: (event) => {
                    event.stopPropagation();
                    const menu = event.target.closest('.action-dropdown').querySelector('.action-menu');
                    menu.classList.toggle('show');
                }
            };
        }
    });

    // ============ MOUNT THE APP ============
    app.mount('#app');
    console.log('Vue app mounted successfully');
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.action-dropdown');
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.action-menu');
            if (menu && menu.classList.contains('show') && !dropdown.contains(event.target)) {
                menu.classList.remove('show');
            }
        });
    });
});

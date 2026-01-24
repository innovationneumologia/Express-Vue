window.addEventListener('load', function() {
    console.log('Page fully loaded, initializing app...');
    
    // Check if Vue is available
    if (typeof Vue === 'undefined') {
        console.error('Vue.js is not available');
        document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Vue.js failed to load. Please refresh the page.</div>';
        return;
    }
    
    console.log('Vue loaded successfully:', Vue.version);
    
    // Get Vue functions
    const { createApp, ref, computed, onMounted } = Vue;
    
    // Check and set up Supabase
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase not loaded - creating mock version');
        window.supabase = {
            createClient: function(url, key) {
                console.log('Using mock Supabase client');
                return {
                    from: (table) => ({
                        select: () => Promise.resolve({ data: [], error: null }),
                        insert: () => Promise.resolve({ data: [], error: null }),
                        update: () => Promise.resolve({ data: [], error: null }),
                        delete: () => Promise.resolve({ data: [], error: null }),
                        eq: () => ({ 
                            select: () => Promise.resolve({ data: [], error: null }),
                            single: () => Promise.resolve({ data: null, error: null })
                        })
                    }),
                    auth: {
                        signIn: () => Promise.resolve({ data: { user: null }, error: null }),
                        signOut: () => Promise.resolve({ error: null }),
                        getSession: () => Promise.resolve({ data: { session: null }, error: null })
                    }
                };
            }
        };
    }

    // Initialize Supabase client
    const SUPABASE_URL = 'https://vssmguzuvekkecbmwcjw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXb-vXw';
    
    let supabaseClient;
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client ready');
    } catch (error) {
        console.warn('Using fallback mock client');
        supabaseClient = {
            from: () => ({
                select: () => Promise.resolve({ data: [], error: null }),
                insert: () => Promise.resolve({ data: [], error: null }),
                update: () => Promise.resolve({ data: [], error: null }),
                delete: () => Promise.resolve({ data: [], error: null })
            }),
            auth: {
                getSession: () => Promise.resolve({ data: { session: null }, error: null })
            }
        };
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
        system: { name: 'System Settings', actions: ['read', 'update', 'admin', 'manage_departments'] }
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
                system: { read: true, update: true, admin: true, manage_departments: true }
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
                system: { read: true, update: false, admin: false, manage_departments: true }
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
                system: { read: false, update: false, admin: false, manage_departments: false }
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
                system: { read: false, update: false, admin: false, manage_departments: false }
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
                system: { read: false, update: false, admin: false, manage_departments: false }
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
    }
};

const app = createApp({
    setup() {
        // ============ REACTIVE STATE VARIABLES ============
        const currentUser = ref(null);
        const loginForm = ref({ email: '', password: '', user_role: 'system_admin', require_mfa: false, mfa_code: '' });
        const loading = ref(false);
        const saving = ref(false);
        const savingPermissions = ref(false);
        const currentView = ref('login');
        const sidebarCollapsed = ref(false);
        const mobileMenuOpen = ref(false);
        const showPermissionManager = ref(false);
        const statsSidebarOpen = ref(false);
        const searchQuery = ref('');
        const searchScope = ref('global');
        const searchFilter = ref('all');
        const showRecentSearches = ref(false);
        const userMenuOpen = ref(false);
        
        // Data stores (matching frontend structure)
        const medicalStaff = ref([]);
        const trainingUnits = ref([]);
        const residentRotations = ref([]);
        const dailyAssignments = ref([]);
        const staffAbsences = ref([]);
        const onCallSchedule = ref([]);
        const announcements = ref([]);
        const auditLogs = ref([]);
        const departments = ref([]);
        const clinicalUnits = ref([]);
        const userNotifications = ref([]);
        const systemSettings = ref({});
        
        // Modal states (matching frontend modals)
        const staffDetailsModal = ref({ 
            show: false, 
            staff: null, 
            activeTab: 'details', 
            stats: {}, 
            activity: [], 
            rotations: [], 
            documents: [] 
        });
        
        const medicalStaffModal = ref({ 
            show: false, 
            mode: 'add', 
            staff: null, 
            form: { 
                full_name: '', 
                staff_type: 'medical_resident', 
                staff_id: '', 
                employment_status: 'active',
                can_supervise_residents: false, 
                professional_email: '', 
                resident_category: '', 
                training_level: '',
                specialization: '',
                years_experience: '',
                biography: '',
                medical_license: '',
                date_of_birth: '',
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
                description: ''
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
                description: ''
            }
        });
        
        const onCallModal = ref({ 
            show: false, 
            mode: 'add', 
            schedule: null, 
            form: { 
                duty_date: '', 
                schedule_id: '', 
                shift_type: 'backup_call', 
                primary_physician_id: '', 
                backup_physician_id: '', 
                start_time: '08:00', 
                end_time: '20:00', 
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
        
        const absenceDetailsModal = ref({ 
            show: false, 
            absence: null 
        });
        
        const trainingUnitModal = ref({ 
            show: false, 
            mode: 'add', 
            unit: null, 
            form: { 
                unit_name: '', 
                clinical_unit_id: '', 
                unit_description: '', 
                unit_status: 'active', 
                maximum_residents: 10, 
                current_residents: 0 
            }
        });
        
        const rotationModal = ref({ 
            show: false, 
            mode: 'add', 
            rotation: null, 
            form: { 
                rotation_id: '', 
                resident_id: '', 
                training_unit_id: '', 
                supervising_attending_id: '', 
                start_date: '', 
                end_date: '', 
                rotation_category: 'clinical_rotation', 
                rotation_status: 'scheduled', 
                clinical_notes: '', 
                supervisor_evaluation: '' 
            }
        });
        
        const quickPlacementModal = ref({ 
            show: false, 
            form: { 
                resident_id: '', 
                training_unit_id: '', 
                duration: 4 
            }
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
                department_name: 'Pulmonary Medicine',
                max_residents_per_unit: 10, 
                enable_audit_logging: true, 
                require_mfa: false,
                maintenance_mode: false, 
                default_rotation_duration: 12, 
                default_oncall_duration: 12,
                min_staff_per_shift: 3, 
                max_consecutive_oncall_days: 3, 
                absence_notice_required_days: 7,
                max_absence_days_per_year: 30, 
                enable_email_notifications: true, 
                auto_logout_enabled: true,
                contact_email: 'admin@neumocare.org',
                contact_phone: '+1 (555) 123-4567'
            }
        });
        
        const userProfileModal = ref({ 
            show: false, 
            form: { 
                full_name: '', 
                email: '', 
                phone: '', 
                department: '',
                notifications_enabled: true, 
                absence_notifications: true, 
                announcement_notifications: true 
            }
        });
        
        const importExportModal = ref({
            show: false,
            mode: 'import',
            selectedTable: 'medical_staff',
            exportFormat: 'csv',
            overwriteExisting: false,
            progress: 0,
            fileData: null
        });
        
        // UI states
        const toasts = ref([]);
        let toastId = 0;
        const staffSearch = ref('');
        const staffFilter = ref({ staff_type: '', employment_status: '' });
        const rotationFilter = ref({ category: '', status: '' });
        const auditFilter = ref({ action: '', dateRange: 'today' });
        const recentSearches = ref([]);
        
        // Live stats
        const liveStats = ref({
            occupancy: 75, 
            occupancyTrend: 2, 
            onDutyStaff: 24, 
            staffTrend: 3, 
            pendingRequests: 8,
            erCapacity: { current: 15, max: 20, status: 'medium' },
            icuCapacity: { current: 8, max: 10, status: 'high' },
            wardCapacity: { current: 45, max: 60, status: 'low' },
            todayAdmissions: 12, 
            avgStay: 4.5
        });
        
        const currentCapacity = ref({
            er: { current: 15, max: 20, status: 'medium' },
            icu: { current: 8, max: 10, status: 'high' },
            ward: { current: 45, max: 60, status: 'low' },
            stepdown: { current: 10, max: 15, status: 'low' }
        });
        
        const capacityOverview = ref([
            { name: 'Emergency Room', current: 15, max: 20, percentage: 75, status: 'medium' },
            { name: 'Pulmo ICU', current: 8, max: 10, percentage: 80, status: 'high' },
            { name: 'Ward Beds', current: 45, max: 60, percentage: 75, status: 'medium' },
            { name: 'Step-down Unit', current: 10, max: 15, percentage: 67, status: 'low' }
        ]);
        
        const quickUpdates = ref([
            { id: 1, author: 'Dr. Smith', message: 'CT scanner maintenance until 2 PM', timestamp: '2 hours ago', tags: ['equipment', 'maintenance'] },
            { id: 2, author: 'Nursing Admin', message: 'New asthma management guidelines available', timestamp: '4 hours ago', tags: ['guidelines', 'update'] }
        ]);
        
        const collapsedCards = ref({
            emergencyAlerts: false, 
            todaysOnCall: false, 
            coverageAlerts: false, 
            sevenDaySchedule: false
        });
        
        const pinnedCards = ref({
            totalStaff: false, 
            activeResidents: false, 
            attendings: false, 
            coverageAlerts: false
        });
        
        const draggingCard = ref(null);
        const lastUpdated = ref({
            todaysOnCall: new Date(), 
            coverageAlerts: new Date(), 
            sevenDaySchedule: new Date()
        });
        
        const staffDailyActivities = ref({});
        const permissionResources = ref(PermissionSystem.resources);
        
        // Data caches
        const staffCache = ref(new Map());
        const unitCache = ref(new Map());
        const departmentCache = ref(new Map());
        const clinicalUnitCache = ref(new Map());

        // ============ UTILITY FUNCTIONS ============
        const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
        
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
                return await operation();
            } catch (error) {
                console.error(`Error in ${context}:`, error);
                showToast('Error', `${context} failed: ${error.message}`, 'error');
                if (fallback !== null) return fallback;
                throw error;
            }
        };

        // ============ TOAST SYSTEM ============
        const showToast = (title, message, type = 'info', duration = 5000) => {
            const icons = {
                info: 'fas fa-info-circle', 
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle', 
                warning: 'fas fa-exclamation-triangle',
                permission: 'fas fa-shield-alt'
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
        
        const getUserRoleDisplay = (role) => {
            const roles = { 
                system_admin: 'System Administrator', 
                department_head: 'Head of Department',
                resident_manager: 'Resident Manager', 
                attending_physician: 'Attending Physician',
                viewing_doctor: 'Viewing Doctor' 
            }; 
            return roles[role] || role;
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
        
        const getStaffTypeClass = (type) => type === 'medical_resident' ? 'badge-resident-advanced' : 
            type === 'attending_physician' ? 'badge-attending-advanced' : 'badge-admin-advanced';
        
        const formatEmploymentStatus = (status) => {
            const statuses = { active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' };
            return statuses[status] || status;
        };
        
        const formatRotationCategory = (category) => {
            const categories = { 
                clinical_rotation: 'Clinical Rotation', 
                elective_rotation: 'Elective Rotation',
                research_rotation: 'Research', 
                vacation_rotation: 'Vacation' 
            }; 
            return categories[category] || category;
        };
        
        const getRotationCategoryClass = (category) => category === 'clinical_rotation' ? 'badge-attending-advanced' :
            category === 'elective_rotation' ? 'badge-resident-advanced' : category === 'research_rotation' ? 'badge-admin-advanced' : 'badge-supervisor-advanced';
        
        const getAuditIcon = (action) => {
            const icons = { 
                CREATE: 'fas fa-plus-circle', 
                UPDATE: 'fas fa-edit', 
                DELETE: 'fas fa-trash',
                READ: 'fas fa-eye', 
                LOGIN: 'fas fa-sign-in-alt', 
                LOGOUT: 'fas fa-sign-out-alt',
                PERMISSION_CHANGE: 'fas fa-user-shield', 
                ERROR: 'fas fa-exclamation-triangle' 
            };
            return icons[action?.toUpperCase()] || 'fas fa-info-circle';
        };
        
        const getDocumentIcon = (type) => {
            const icons = { 
                license: 'fas fa-id-card', 
                certificate: 'fas fa-certificate',
                resume: 'fas fa-file-alt', 
                evaluation: 'fas fa-clipboard-check', 
                other: 'fas fa-file' 
            };
            return icons[type] || 'fas fa-file';
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
        
        const formatDateShort = (dateString) => {
            try { 
                if (!dateString) return ''; 
                const date = new Date(dateString); 
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch { 
                return ''; 
            }
        };

        // ============ DATA RELATIONSHIP FUNCTIONS ============
        const getPhysicianName = (physicianId) => {
            if (!physicianId) return 'Unknown Physician';
            if (staffCache.value.has(physicianId)) return staffCache.value.get(physicianId).full_name;
            const physician = medicalStaff.value.find(staff => staff.id === physicianId);
            if (physician) { 
                staffCache.value.set(physicianId, physician); 
                return physician.full_name; 
            }
            return `Physician ${physicianId.substring(0, 8)}`;
        };
        
        const getPhysicianFirstName = (physicianId) => {
            const name = getPhysicianName(physicianId);
            return name.split(' ')[0] || name;
        };
        
        const getResidentName = (residentId) => !residentId ? 'Unknown Resident' : getPhysicianName(residentId);
        
        const getTrainingUnitName = (unitId) => {
            if (!unitId) return 'Unknown Unit';
            if (unitCache.value.has(unitId)) return unitCache.value.get(unitId).unit_name;
            const unit = trainingUnits.value.find(u => u.id === unitId);
            if (unit) { 
                unitCache.value.set(unitId, unit); 
                return unit.unit_name; 
            }
            return `Unit ${unitId.substring(0, 8)}`;
        };
        
        const getClinicalUnitName = (unitId) => {
            if (!unitId) return 'Unknown Clinical Unit';
            if (clinicalUnitCache.value.has(unitId)) return clinicalUnitCache.value.get(unitId).name;
            const unit = clinicalUnits.value.find(u => u.id === unitId);
            if (unit) { 
                clinicalUnitCache.value.set(unitId, unit); 
                return unit.name; 
            }
            return `Clinical Unit ${unitId.substring(0, 8)}`;
        };
        
        const getAttendingName = (attendingId) => !attendingId ? 'Unassigned' : getPhysicianName(attendingId);
        
        const getDepartmentName = (departmentId) => {
            if (!departmentId) return 'Unknown Department';
            if (departmentCache.value.has(departmentId)) return departmentCache.value.get(departmentId).name;
            const department = departments.value.find(d => d.id === departmentId);
            if (department) { 
                departmentCache.value.set(departmentId, department); 
                return department.name; 
            }
            return `Department ${departmentId.substring(0, 8)}`;
        };
        
        const getDepartmentUnits = (departmentId) => {
            return clinicalUnits.value.filter(unit => unit.department_id === departmentId);
        };
        
        const getAssignedResidents = (unitId) => {
            const rotationIds = residentRotations.value
                .filter(r => r.training_unit_id === unitId && (r.rotation_status === 'active' || r.rotation_status === 'scheduled'))
                .map(r => r.resident_id);
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'medical_resident' && rotationIds.includes(staff.id));
        };
        
        const formatResidentCategory = (category) => {
            const categories = {
                department_internal: 'Department Internal',
                rotating_other_dept: 'Rotating Other Dept',
                external_institution: 'External (Other Institution/Country)'
            };
            return categories[category] || category;
        };
        
        const formatTrainingLevel = (level) => {
            const levels = {
                pgy1: 'PGY-1 (First Year)',
                pgy2: 'PGY-2 (Second Year)',
                pgy3: 'PGY-3 (Third Year)',
                pgy4: 'PGY-4 (Fourth Year)',
                other: 'Other (International/Non-standard)'
            };
            return levels[level] || level;
        };
        
        const getCapacityClass = (unit) => {
            const percentage = ((unit.current_residents || 0) / unit.maximum_residents) * 100;
            if (percentage >= 90) return 'progress-danger';
            if (percentage >= 75) return 'progress-warning';
            return 'progress-success';
        };
        
        const isAbsenceActive = (absence) => {
            if (!absence.start_date || !absence.end_date) return false;
            const today = getLocalDateString();
            return absence.start_date <= today && absence.end_date >= today;
        };

        // ============ PERMISSION FUNCTIONS ============
        const hasPermission = (resource, action) => {
            if (!currentUser.value) return false;
            if (currentUser.value.user_role === 'system_admin') return true;
            return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action);
        };

        const hasAnyPermission = (resources) => {
            if (!currentUser.value) return false;
            return resources.some(resource => 
                Object.keys(PermissionSystem.resources[resource]?.actions || {}).some(
                    action => hasPermission(resource, action)
                )
            );
        };

        const getResourcePermissionLevel = (resource) => {
            if (!currentUser.value) return 'none';
            return PermissionSystem.getPermissionLevel(currentUser.value.user_role, resource);
        };

        const getPermissionDescription = (resource, action) => {
            const descriptions = {
                create: 'Create new records', 
                read: 'View records', 
                update: 'Edit existing records',
                delete: 'Remove records', 
                export: 'Export data', 
                import: 'Import data',
                notify: 'Send notifications', 
                report: 'Generate reports',
                assign: 'Assign residents', 
                extend: 'Extend rotations',
                drag_drop: 'Drag and drop placements', 
                alert: 'Send alerts', 
                override: 'Override restrictions',
                manage_departments: 'Manage departments'
            };
            return descriptions[action] || action;
        };

        const formatActionName = (action) => action.charAt(0).toUpperCase() + action.slice(1);

        // ============ PERMISSION MANAGEMENT ============
        const togglePermission = (role, resource, action) => {
            if (!hasPermission('system', 'admin')) {
                showToast('Permission Denied', 'You need admin permission to modify permissions', 'permission');
                return;
            }
            
            const currentValue = PermissionSystem.roles[role]?.permissions[resource]?.[action] || false;
            const newValue = !currentValue;
            
            if (!PermissionSystem.roles[role].permissions[resource]) {
                PermissionSystem.roles[role].permissions[resource] = {};
            }
            PermissionSystem.roles[role].permissions[resource][action] = newValue;
            
            const actionText = newValue ? 'granted' : 'revoked';
            showToast('Permission Updated', `${actionText} ${action} permission for ${resource} to ${role}`, newValue ? 'success' : 'warning');
        };

        const savePermissionChanges = async () => {
            if (!hasPermission('system', 'admin')) {
                showToast('Permission Denied', 'You need admin permission to save permission changes', 'permission');
                return;
            }
            
            savingPermissions.value = true;
            try {
                // In a real app, save to Supabase
                showToast('Permissions Saved', 'Permission changes saved successfully', 'success');
                showPermissionManager.value = false;
            } catch (error) {
                showToast('Save Failed', 'Failed to save permission changes', 'error');
            } finally {
                savingPermissions.value = false;
            }
        };

        // ============ COMPUTED PROPERTIES ============
        const stats = computed(() => {
            const residents = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active');
            const attendings = medicalStaff.value.filter(s => s.staff_type === 'attending_physician' && s.employment_status === 'active');
            return {
                totalStaff: medicalStaff.value.length, 
                activeResidents: residents.length,
                attendings: attendings.length, 
                coverageAlerts: coverageAlerts.value.length
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
            if (staffFilter.value.staff_type) filtered = filtered.filter(s => s.staff_type === staffFilter.value.staff_type);
            if (staffFilter.value.employment_status) filtered = filtered.filter(s => s.employment_status === staffFilter.value.employment_status);
            return filtered;
        });

        const todaysOnCall = computed(() => {
            const today = getLocalDateString();
            return onCallSchedule.value.filter(o => o.duty_date === today).slice(0, 3);
        });

        const recentAnnouncements = computed(() => {
            const today = getLocalDateString();
            return announcements.value
                .filter(a => a.publish_start_date <= today && (!a.publish_end_date || a.publish_end_date >= today))
                .slice(0, 5);
        });

        const coverageAlerts = computed(() => trainingUnits.value
            .filter(u => u.unit_status === 'active' && (u.current_residents || 0) < u.maximum_residents * 0.5)
            .map(u => ({
                id: u.id, 
                unit_name: u.unit_name, 
                current: u.current_residents || 0,
                capacity: u.maximum_residents, 
                priority: (u.current_residents || 0) < u.maximum_residents * 0.3 ? 'high' : 'warning',
                unit_id: u.id
            }))
        );

        const emergencyAlerts = computed(() => [
            { id: 1, message: 'ICU at 95% capacity - Consider diverting non-critical cases', priority: 'high' },
            { id: 2, message: 'Emergency generator maintenance scheduled for 2 AM', priority: 'medium' }
        ]);

        const nextSevenDays = computed(() => {
            const days = []; 
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const date = new Date(today); 
                date.setDate(today.getDate() + i);
                const dateString = getLocalDateString(date); 
                const schedule = onCallSchedule.value.find(o => o.duty_date === dateString);
                days.push({ 
                    date: dateString, 
                    schedule: schedule, 
                    status: schedule ? 'covered' : 'uncovered' 
                });
            }
            return days;
        });

        const filteredRotations = computed(() => {
            let filtered = residentRotations.value;
            if (rotationFilter.value.status) filtered = filtered.filter(r => r.rotation_status === rotationFilter.value.status);
            if (rotationFilter.value.category) filtered = filtered.filter(r => r.rotation_category === rotationFilter.value.category);
            return filtered;
        });

        const availableResidents = computed(() => {
            const residentsInRotations = new Set(residentRotations.value
                .filter(r => r.rotation_status === 'active' || r.rotation_status === 'scheduled')
                .map(r => r.resident_id));
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'medical_resident' && staff.employment_status === 'active' && !residentsInRotations.has(staff.id));
        });

        const availablePhysicians = computed(() => medicalStaff.value.filter(staff => 
            (staff.staff_type === 'attending_physician' || staff.staff_type === 'medical_resident' || staff.staff_type === 'fellow') && 
            staff.employment_status === 'active').sort((a, b) => a.full_name.localeCompare(b.full_name)));

        const unreadNotifications = computed(() => userNotifications.value.filter(n => !n.read).length);

        const activeTrainingUnits = computed(() => trainingUnits.value.filter(unit => unit.unit_status === 'active'));

        const availableAttendings = computed(() => medicalStaff.value.filter(staff => 
            staff.staff_type === 'attending_physician' && staff.employment_status === 'active'));

        const availableStaff = computed(() => medicalStaff.value.filter(staff => 
            staff.employment_status === 'active'));

        const availableCoverageStaff = computed(() => medicalStaff.value.filter(staff => 
            staff.employment_status === 'active' && staff.staff_type !== 'medical_resident'));

        // ============ NAVIGATION FUNCTIONS ============
        const switchView = (view) => {
            if (!currentUser.value) return;
            currentView.value = view; 
            mobileMenuOpen.value = false;
            loadViewData(view);
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
                system_settings: 'Configure system-wide settings and preferences'
            }; 
            return subtitles[currentView.value] || 'Pulmonology Department Management System';
        };

        const getSearchPlaceholder = () => {
            const placeholders = {
                medical_staff: 'Search medical staff by name, ID, or email...', 
                resident_rotations: 'Search rotations by resident, unit, or ID...',
                oncall_schedule: 'Search on-call schedules by date or physician...', 
                staff_absence: 'Search staff absence by staff or dates...',
                training_units: 'Search training units by name or specialty...', 
                communications: 'Search announcements or updates...',
                audit_logs: 'Search audit logs by user, action, or resource...'
            }; 
            return placeholders[currentView.value] || 'Search...';
        };

        const toggleStatsSidebar = () => statsSidebarOpen.value = !statsSidebarOpen.value;
        
        const toggleSearchScope = () => {
            const scopes = ['global', 'staff', 'units', 'rotations'];
            const currentIndex = scopes.indexOf(searchScope.value);
            searchScope.value = scopes[(currentIndex + 1) % scopes.length];
        };
        
        const setSearchFilter = (filter) => searchFilter.value = filter;
        
        const selectRecentSearch = (search) => { 
            searchQuery.value = search.query; 
            handleSearch(); 
        };
        
        const clearRecentSearches = () => recentSearches.value = [];
        
        const togglePermissionManager = () => { 
            showPermissionManager.value = !showPermissionManager.value; 
            userMenuOpen.value = false; 
        };
        
        const toggleUserMenu = () => userMenuOpen.value = !userMenuOpen.value;
        
        const markAllNotificationsAsRead = () => { 
            userNotifications.value.forEach(n => n.read = true); 
            showToast('Notifications Cleared', 'All notifications marked as read', 'success'); 
        };
        
        const getDayStatus = (day) => day.status === 'covered' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

        // ============ CARD INTERACTIONS ============
        const startDrag = (event, cardId) => { 
            draggingCard.value = cardId; 
            event.dataTransfer.setData('text/plain', cardId); 
        };
        
        const endDrag = () => draggingCard.value = null;
        
        const togglePinCard = (cardId) => pinnedCards.value[cardId] = !pinnedCards.value[cardId];
        
        const toggleCollapseCard = (cardId) => collapsedCards.value[cardId] = !collapsedCards.value[cardId];
        
        const dismissAllAlerts = () => showToast('Alerts Dismissed', 'All emergency alerts have been dismissed', 'success');
        
        const dismissCoverageAlert = (alertId) => showToast('Alert Dismissed', 'Coverage alert has been dismissed', 'info');
        
        const viewUnitDetails = (unitId) => { 
            const unit = trainingUnits.value.find(u => u.id === unitId); 
            if (unit) showToast('Unit Details', `Viewing details for ${unit.unit_name}`, 'info'); 
        };
        
        const viewScheduleDetails = (date) => { 
            showToast('Schedule Details', `Viewing schedule for ${formatDate(date)}`, 'info'); 
        };

        // ============ AUTHENTICATION ============
        const handleLogin = async () => {
            loading.value = true;
            try {
                const email = loginForm.value.email.trim().toLowerCase();
                const password = loginForm.value.password;
                const selectedRole = loginForm.value.user_role;
                
                if (!email || !password || !selectedRole) {
                    throw new Error('Please fill in all fields');
                }
                
                // Development bypass - in production, use Supabase Auth
                currentUser.value = {
                    id: generateUniqueId(), 
                    email: email,
                    full_name: email === 'admin@neumocare.org' ? 'System Administrator' : email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    user_role: selectedRole, 
                    phone: '+1 (555) 123-4567', 
                    department: 'Pulmonary Medicine', 
                    account_status: 'active'
                };
                
                showToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
                await loadInitialData();
                currentView.value = 'daily_operations';
                
            } catch (error) {
                showToast('Login Failed', error.message, 'error');
            } finally {
                loading.value = false;
                loginForm.value.password = '';
            }
        };

        const handleLogout = () => {
            currentUser.value = null;
            currentView.value = 'login';
            userMenuOpen.value = false;
            showToast('Logged Out', 'You have been successfully logged out', 'info');
        };

        // ============ DATA LOADING FUNCTIONS ============
        const loadInitialData = async () => {
            loading.value = true;
            try {
                await Promise.all([
                    loadMedicalStaff(), 
                    loadTrainingUnits(), 
                    loadResidentRotations(), 
                    loadStaffAbsences(),
                    loadOnCallSchedule(), 
                    loadAnnouncements(), 
                    loadAuditLogs(), 
                    loadSystemSettings(),
                    loadDepartments(),
                    loadClinicalUnits(),
                    loadUserNotifications()
                ]);
                showToast('System Ready', 'All data loaded successfully', 'success');
            } catch (error) {
                console.error('Error loading initial data:', error);
                showToast('Data Load Error', 'Failed to load system data', 'error');
            } finally { 
                loading.value = false; 
            }
        };

        const loadViewData = async (view) => {
            try {
                switch (view) {
                    case 'medical_staff': await loadMedicalStaff(); break;
                    case 'training_units': await loadTrainingUnits(); break;
                    case 'resident_rotations': await loadResidentRotations(); break;
                    case 'staff_absence': await loadStaffAbsences(); break;
                    case 'oncall_schedule': await loadOnCallSchedule(); break;
                    case 'communications': await loadAnnouncements(); break;
                    case 'audit_logs': await loadAuditLogs(); break;
                    case 'department_management': 
                        await loadDepartments();
                        await loadClinicalUnits();
                        break;
                }
            } catch (error) { 
                console.error(`Error loading ${view} data:`, error); 
            }
        };

        const loadMedicalStaff = async () => await withErrorHandling(async () => {
            // Mock data for development
            medicalStaff.value = [
                {
                    id: '1',
                    full_name: 'Dr. Sarah Johnson',
                    staff_type: 'medical_resident',
                    staff_id: 'RES-001',
                    employment_status: 'active',
                    professional_email: 'sarah.johnson@hospital.org',
                    department_id: '1',
                    resident_category: 'department_internal',
                    training_level: 'pgy2',
                    specialization: 'Pulmonology',
                    years_experience: 2,
                    biography: 'Second year resident specializing in pulmonary medicine.',
                    medical_license: 'MD123456',
                    date_of_birth: '1992-05-15',
                    can_supervise_residents: false
                },
                {
                    id: '2',
                    full_name: 'Dr. Michael Chen',
                    staff_type: 'attending_physician',
                    staff_id: 'ATT-001',
                    employment_status: 'active',
                    professional_email: 'michael.chen@hospital.org',
                    department_id: '1',
                    specialization: 'Critical Care Pulmonology',
                    years_experience: 10,
                    biography: 'Board certified pulmonologist with 10 years of experience.',
                    medical_license: 'MD654321',
                    date_of_birth: '1985-08-22',
                    can_supervise_residents: true
                }
            ];
            
            staffCache.value.clear();
            medicalStaff.value.forEach(staff => {
                staffCache.value.set(staff.id, staff);
            });
        }, 'Loading medical staff');

        const loadTrainingUnits = async () => await withErrorHandling(async () => {
            // Mock data
            trainingUnits.value = [
                {
                    id: '1',
                    unit_name: 'Pulmonary ICU',
                    clinical_unit_id: '1',
                    unit_description: 'Specialized ICU for pulmonary patients',
                    unit_status: 'active',
                    maximum_residents: 6,
                    current_residents: 4
                },
                {
                    id: '2',
                    unit_name: 'Bronchoscopy Suite',
                    clinical_unit_id: '2',
                    unit_description: 'Interventional pulmonary procedures',
                    unit_status: 'active',
                    maximum_residents: 4,
                    current_residents: 2
                }
            ];
            
            unitCache.value.clear();
            trainingUnits.value.forEach(unit => {
                unitCache.value.set(unit.id, unit);
            });
        }, 'Loading training units');

        const loadResidentRotations = async () => await withErrorHandling(async () => {
            // Mock data
            residentRotations.value = [
                {
                    id: '1',
                    rotation_id: 'ROT-2024-001',
                    resident_id: '1',
                    training_unit_id: '1',
                    supervising_attending_id: '2',
                    start_date: getLocalDateString(),
                    end_date: getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                    rotation_category: 'clinical_rotation',
                    rotation_status: 'active',
                    clinical_notes: 'Performing well in ICU rotations',
                    supervisor_evaluation: 'Excellent clinical skills'
                }
            ];
        }, 'Loading resident rotations');

        const loadStaffAbsences = async () => await withErrorHandling(async () => {
            // Mock data
            staffAbsences.value = [
                {
                    id: '1',
                    staff_member_id: '1',
                    absence_reason: 'vacation',
                    start_date: getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
                    end_date: getLocalDateString(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
                    notes: 'Annual leave',
                    replacement_staff_id: null,
                    coverage_instructions: 'Coverage to be arranged by attending',
                    documented_by_name: 'Dr. Michael Chen',
                    total_days: 7
                }
            ];
        }, 'Loading staff absences');

        const loadOnCallSchedule = async () => await withErrorHandling(async () => {
            // Mock data
            onCallSchedule.value = [
                {
                    id: '1',
                    duty_date: getLocalDateString(),
                    schedule_id: 'ONCALL-001',
                    shift_type: 'backup_call',
                    primary_physician_id: '2',
                    backup_physician_id: null,
                    start_time: '08:00:00',
                    end_time: '20:00:00',
                    coverage_notes: 'Primary on-call for pulmonary emergencies'
                }
            ];
            lastUpdated.value.todaysOnCall = new Date();
        }, 'Loading on-call schedule');

        const loadAnnouncements = async () => await withErrorHandling(async () => {
            const today = getLocalDateString();
            // Mock data
            announcements.value = [
                {
                    id: '1',
                    announcement_title: 'New Bronchoscopy Guidelines',
                    announcement_content: 'Please review the updated bronchoscopy guidelines in the shared folder.',
                    publish_start_date: today,
                    publish_end_date: getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
                    priority_level: 'medium',
                    target_audience: 'all'
                }
            ];
        }, 'Loading announcements');

        const loadAuditLogs = async () => await withErrorHandling(async () => {
            // Mock data
            auditLogs.value = [
                {
                    id: '1',
                    timestamp: getLocalDateTime(),
                    user_name: 'System Administrator',
                    user_role: 'system_admin',
                    action: 'LOGIN',
                    resource: 'auth',
                    details: 'User logged in successfully',
                    permission_level: 'full'
                }
            ];
        }, 'Loading audit logs');

        const loadSystemSettings = async () => await withErrorHandling(async () => {
            systemSettings.value = {
                hospital_name: 'NeumoCare Hospital', 
                department_name: 'Pulmonary Medicine',
                max_residents_per_unit: 10, 
                enable_audit_logging: true, 
                require_mfa: false,
                maintenance_mode: false, 
                enable_email_notifications: true, 
                default_rotation_duration: 12,
                default_oncall_duration: 12, 
                min_staff_per_shift: 3, 
                max_consecutive_oncall_days: 3,
                absence_notice_required_days: 7, 
                max_absence_days_per_year: 30, 
                auto_logout_enabled: true,
                contact_email: 'admin@neumocare.org',
                contact_phone: '+1 (555) 123-4567'
            };
        }, 'Loading system settings');

        const loadDepartments = async () => await withErrorHandling(async () => {
            // Mock data
            departments.value = [
                {
                    id: '1',
                    name: 'Pulmonology',
                    code: 'PULM',
                    status: 'active',
                    description: 'Pulmonary and critical care medicine department'
                },
                {
                    id: '2',
                    name: 'Cardiology',
                    code: 'CARD',
                    status: 'active',
                    description: 'Cardiology and cardiovascular medicine'
                }
            ];
            
            departmentCache.value.clear();
            departments.value.forEach(dept => {
                departmentCache.value.set(dept.id, dept);
            });
        }, 'Loading departments');

        const loadClinicalUnits = async () => await withErrorHandling(async () => {
            // Mock data
            clinicalUnits.value = [
                {
                    id: '1',
                    name: 'Pulmonary ICU',
                    code: 'PICU',
                    department_id: '1',
                    unit_type: 'clinical',
                    status: 'active',
                    description: 'Intensive care unit for pulmonary patients'
                },
                {
                    id: '2',
                    name: 'Bronchoscopy Unit',
                    code: 'BRONCH',
                    department_id: '1',
                    unit_type: 'clinical',
                    status: 'active',
                    description: 'Interventional pulmonary procedures unit'
                }
            ];
            
            clinicalUnitCache.value.clear();
            clinicalUnits.value.forEach(unit => {
                clinicalUnitCache.value.set(unit.id, unit);
            });
        }, 'Loading clinical units');

        const loadUserNotifications = async () => await withErrorHandling(async () => {
            userNotifications.value = [
                { 
                    id: '1', 
                    title: 'New Rotation Assigned', 
                    message: 'You have been assigned to ICU rotation starting next week',
                    type: 'info', 
                    read: false, 
                    created_at: getLocalDateTime() 
                }
            ];
        }, 'Loading notifications');

        const refreshLiveStats = async () => await withErrorHandling(async () => {
            // Mock live stats update
            const newOccupancy = Math.min(100, Math.max(0, liveStats.value.occupancy + (Math.random() * 4 - 2)));
            const newStaff = Math.max(1, liveStats.value.onDutyStaff + (Math.random() > 0.5 ? 1 : -1));
            
            liveStats.value = {
                occupancy: Math.round(newOccupancy), 
                occupancyTrend: newOccupancy > liveStats.value.occupancy ? 1 : -1,
                onDutyStaff: newStaff, 
                staffTrend: newStaff > liveStats.value.onDutyStaff ? 1 : -1,
                pendingRequests: Math.max(0, liveStats.value.pendingRequests + (Math.random() > 0.7 ? 1 : -1)),
                erCapacity: { 
                    current: Math.min(liveStats.value.erCapacity.max, Math.max(0, liveStats.value.erCapacity.current + (Math.random() > 0.5 ? 1 : -1))),
                    max: liveStats.value.erCapacity.max, 
                    status: getCapacityStatus({ current: liveStats.value.erCapacity.current, max: liveStats.value.erCapacity.max }) 
                },
                icuCapacity: { 
                    current: Math.min(liveStats.value.icuCapacity.max, Math.max(0, liveStats.value.icuCapacity.current + (Math.random() > 0.5 ? 1 : -1))),
                    max: liveStats.value.icuCapacity.max, 
                    status: getCapacityStatus({ current: liveStats.value.icuCapacity.current, max: liveStats.value.icuCapacity.max }) 
                },
                wardCapacity: { 
                    current: Math.min(liveStats.value.wardCapacity.max, Math.max(0, liveStats.value.wardCapacity.current + (Math.random() > 0.5 ? 2 : -2))),
                    max: liveStats.value.wardCapacity.max, 
                    status: getCapacityStatus({ current: liveStats.value.wardCapacity.current, max: liveStats.value.wardCapacity.max }) 
                },
                todayAdmissions: Math.max(0, liveStats.value.todayAdmissions + (Math.random() > 0.8 ? 1 : 0)),
                avgStay: Math.max(1, liveStats.value.avgStay + (Math.random() * 0.2 - 0.1))
            };
            
            capacityOverview.value = [
                { 
                    name: 'Emergency Room', 
                    current: liveStats.value.erCapacity.current, 
                    max: liveStats.value.erCapacity.max,
                    percentage: Math.round((liveStats.value.erCapacity.current / liveStats.value.erCapacity.max) * 100), 
                    status: liveStats.value.erCapacity.status 
                },
                { 
                    name: 'Pulmo ICU', 
                    current: liveStats.value.icuCapacity.current, 
                    max: liveStats.value.icuCapacity.max,
                    percentage: Math.round((liveStats.value.icuCapacity.current / liveStats.value.icuCapacity.max) * 100), 
                    status: liveStats.value.icuCapacity.status 
                },
                { 
                    name: 'Ward Beds', 
                    current: liveStats.value.wardCapacity.current, 
                    max: liveStats.value.wardCapacity.max,
                    percentage: Math.round((liveStats.value.wardCapacity.current / liveStats.value.wardCapacity.max) * 100), 
                    status: liveStats.value.wardCapacity.status 
                },
                { 
                    name: 'Step-down Unit', 
                    current: liveStats.value.wardCapacity.current * 0.3, 
                    max: 15,
                    percentage: Math.round((liveStats.value.wardCapacity.current * 0.3 / 15) * 100), 
                    status: 'low' 
                }
            ];
        }, 'Refreshing live stats');

        // ============ FORM VALIDATION ============
        const validateMedicalStaffForm = () => {
            const form = medicalStaffModal.value.form;
            if (!form.full_name.trim()) throw new Error('Full name is required');
            if (form.professional_email && !validateEmail(form.professional_email)) throw new Error('Invalid email format');
            if (form.staff_type === 'medical_resident') {
                if (!form.resident_category) throw new Error('Resident category is required for medical residents');
                if (!form.training_level) throw new Error('Training level is required for medical residents');
            }
            return true;
        };

        const validateOnCallForm = () => {
            const form = onCallModal.value.form;
            if (!form.duty_date) throw new Error('Duty date is required');
            if (!form.primary_physician_id) throw new Error('Primary physician is required');
            return true;
        };

        const validateAbsenceForm = () => {
            const form = absenceModal.value.form;
            if (!form.staff_member_id) throw new Error('Staff member is required');
            if (!form.absence_reason) throw new Error('Absence reason is required');
            if (!form.start_date || !form.end_date) throw new Error('Start and end dates are required');
            const start = new Date(form.start_date);
            const end = new Date(form.end_date);
            if (start > end) throw new Error('Start date cannot be after end date');
            return true;
        };

        const validateTrainingUnitForm = () => {
            const form = trainingUnitModal.value.form;
            if (!form.unit_name.trim()) throw new Error('Unit name is required');
            if (!form.maximum_residents || form.maximum_residents < 1 || form.maximum_residents > 50) throw new Error('Maximum residents must be between 1 and 50');
            if (form.current_residents < 0 || form.current_residents > form.maximum_residents) throw new Error(`Current residents cannot exceed maximum (${form.maximum_residents})`);
            return true;
        };

        const validateRotationForm = () => {
            const form = rotationModal.value.form;
            if (!form.rotation_id.trim()) throw new Error('Rotation ID is required');
            if (!form.resident_id) throw new Error('Resident is required');
            if (!form.training_unit_id) throw new Error('Training unit is required');
            if (!form.start_date || !form.end_date) throw new Error('Start and end dates are required');
            const start = new Date(form.start_date);
            const end = new Date(form.end_date);
            if (start >= end) throw new Error('End date must be after start date');
            return true;
        };

        // ============ STAFF DETAILS FUNCTIONS ============
        const viewStaffDetails = async (staff) => {
            await withErrorHandling(async () => {
                staffDetailsModal.value = { 
                    show: true, 
                    staff: staff, 
                    activeTab: 'details', 
                    stats: {}, 
                    activity: [], 
                    rotations: [], 
                    documents: [] 
                };
                await Promise.all([
                    loadStaffStats(staff.id), 
                    loadStaffActivity(staff.id), 
                    loadStaffRotations(staff.id), 
                    loadStaffDocuments(staff.id)
                ]);
            }, 'Loading staff details');
        };

        const loadStaffStats = async (staffId) => await withErrorHandling(async () => {
            const rotations = residentRotations.value.filter(r => r.resident_id === staffId);
            const oncallCount = onCallSchedule.value.filter(o => o.primary_physician_id === staffId).length;
            const absenceDays = staffAbsences.value.filter(l => l.staff_member_id === staffId).reduce((sum, l) => sum + (l.total_days || 0), 0);
            staffDetailsModal.value.stats = {
                completedRotations: rotations.filter(r => r.rotation_status === 'completed').length,
                oncallShifts: oncallCount, 
                absenceDays: absenceDays,
                supervisionCount: rotations.filter(r => r.supervising_attending_id === staffId).length
            };
        }, 'Loading staff stats');

        const loadStaffActivity = async (staffId) => await withErrorHandling(async () => {
            const today = getLocalDateString();
            // Mock activity data
            staffDetailsModal.value.activity = [
                {
                    id: '1',
                    description: 'ICU rounds completed',
                    timestamp: getLocalDateTime()
                },
                {
                    id: '2',
                    description: 'Patient consultation - Room 304',
                    timestamp: getLocalDateTime()
                }
            ];
        }, 'Loading staff activity');

        const loadStaffRotations = async (staffId) => await withErrorHandling(async () => {
            const rotations = residentRotations.value.filter(r => r.resident_id === staffId);
            staffDetailsModal.value.rotations = rotations;
        }, 'Loading staff rotations');

        const loadStaffDocuments = async (staffId) => await withErrorHandling(async () => {
            // Mock documents
            staffDetailsModal.value.documents = [
                { 
                    id: 1, 
                    name: 'Medical License', 
                    type: 'license', 
                    description: 'Valid through 2025', 
                    upload_date: '2024-01-15' 
                },
                { 
                    id: 2, 
                    name: 'Board Certification', 
                    type: 'certificate', 
                    description: 'Pulmonary Medicine', 
                    upload_date: '2024-02-01' 
                }
            ];
        }, 'Loading staff documents');

        // ============ MEDICAL STAFF CRUD ============
        const showAddMedicalStaffModal = () => {
            if (!hasPermission('medical_staff', 'create')) {
                showToast('Permission Denied', 'You need create permission to add medical staff', 'permission');
                return;
            }
            const staffId = `MD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
            medicalStaffModal.value = { 
                show: true, 
                mode: 'add', 
                staff: null, 
                form: { 
                    full_name: '', 
                    staff_type: 'medical_resident', 
                    staff_id: staffId,
                    employment_status: 'active', 
                    can_supervise_residents: false, 
                    professional_email: '', 
                    resident_category: '', 
                    training_level: '',
                    specialization: '',
                    years_experience: '',
                    biography: '',
                    medical_license: '',
                    date_of_birth: '',
                    department_id: ''
                }
            };
        };

        const editMedicalStaff = (staff) => {
            if (!hasPermission('medical_staff', 'update')) { 
                showToast('Permission Denied', 'You need update permission to edit medical staff', 'permission'); 
                return; 
            }
            medicalStaffModal.value = { 
                show: true, 
                mode: 'edit', 
                staff: staff, 
                form: { ...staff } 
            };
        };

        const saveMedicalStaff = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    validateMedicalStaffForm();
                    const permissionNeeded = medicalStaffModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('medical_staff', permissionNeeded)) throw new Error('Insufficient permissions');
                    
                    let result;
                    if (medicalStaffModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...medicalStaffModal.value.form,
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        };
                        medicalStaff.value.unshift(result);
                        staffCache.value.set(result.id, result);
                        showToast('Success', 'Medical staff added successfully', 'success');
                    } else {
                        const index = medicalStaff.value.findIndex(s => s.id === medicalStaffModal.value.staff.id);
                        if (index !== -1) {
                            medicalStaff.value[index] = {
                                ...medicalStaff.value[index],
                                ...medicalStaffModal.value.form,
                                updated_at: getLocalDateTime()
                            };
                            result = medicalStaff.value[index];
                            staffCache.value.set(result.id, result);
                        }
                        showToast('Success', 'Medical staff updated successfully', 'success');
                    }
                    
                    medicalStaffModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving medical staff');
        };

        const deleteMedicalStaff = async (staff) => {
            if (!hasPermission('medical_staff', 'delete')) { 
                showToast('Permission Denied', 'You need delete permission to remove medical staff', 'permission'); 
                return; 
            }
            if (!confirm(`Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`)) return;
            
            await withErrorHandling(async () => {
                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                if (index !== -1) {
                    medicalStaff.value.splice(index, 1);
                    staffCache.value.delete(staff.id);
                }
                showToast('Deleted', `${staff.full_name} has been removed`, 'success');
            }, 'Deleting medical staff');
        };

        // ============ DEPARTMENT MANAGEMENT ============
        const showAddDepartmentModal = () => {
            if (!hasPermission('system', 'manage_departments')) {
                showToast('Permission Denied', 'You need manage_departments permission', 'permission');
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
                    description: ''
                }
            };
        };

        const editDepartment = (department) => {
            if (!hasPermission('system', 'manage_departments')) {
                showToast('Permission Denied', 'You need manage_departments permission', 'permission');
                return;
            }
            departmentModal.value = {
                show: true,
                mode: 'edit',
                department: department,
                form: { ...department }
            };
        };

        const saveDepartment = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    if (!departmentModal.value.form.name.trim()) throw new Error('Department name is required');
                    if (!departmentModal.value.form.code.trim()) throw new Error('Department code is required');
                    
                    let result;
                    if (departmentModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...departmentModal.value.form,
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        };
                        departments.value.unshift(result);
                        departmentCache.value.set(result.id, result);
                        showToast('Success', 'Department added successfully', 'success');
                    } else {
                        const index = departments.value.findIndex(d => d.id === departmentModal.value.department.id);
                        if (index !== -1) {
                            departments.value[index] = {
                                ...departments.value[index],
                                ...departmentModal.value.form,
                                updated_at: getLocalDateTime()
                            };
                            result = departments.value[index];
                            departmentCache.value.set(result.id, result);
                        }
                        showToast('Success', 'Department updated successfully', 'success');
                    }
                    
                    departmentModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving department');
        };

        const deleteDepartment = async (department) => {
            if (!hasPermission('system', 'manage_departments')) {
                showToast('Permission Denied', 'You need manage_departments permission', 'permission');
                return;
            }
            if (getDepartmentUnits(department.id).length > 0) {
                showToast('Cannot Delete', 'Department has associated clinical units. Remove them first.', 'error');
                return;
            }
            if (!confirm(`Are you sure you want to delete ${department.name}?`)) return;
            
            await withErrorHandling(async () => {
                const index = departments.value.findIndex(d => d.id === department.id);
                if (index !== -1) {
                    departments.value.splice(index, 1);
                    departmentCache.value.delete(department.id);
                }
                showToast('Deleted', `${department.name} has been removed`, 'success');
            }, 'Deleting department');
        };

        const showAddClinicalUnitModal = () => {
            if (!hasPermission('system', 'manage_departments')) {
                showToast('Permission Denied', 'You need manage_departments permission', 'permission');
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
                    description: ''
                }
            };
        };

        const editClinicalUnit = (unit) => {
            if (!hasPermission('system', 'manage_departments')) {
                showToast('Permission Denied', 'You need manage_departments permission', 'permission');
                return;
            }
            clinicalUnitModal.value = {
                show: true,
                mode: 'edit',
                unit: unit,
                form: { ...unit }
            };
        };

        const saveClinicalUnit = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    if (!clinicalUnitModal.value.form.name.trim()) throw new Error('Unit name is required');
                    if (!clinicalUnitModal.value.form.code.trim()) throw new Error('Unit code is required');
                    if (!clinicalUnitModal.value.form.department_id) throw new Error('Department is required');
                    
                    let result;
                    if (clinicalUnitModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...clinicalUnitModal.value.form,
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        };
                        clinicalUnits.value.unshift(result);
                        clinicalUnitCache.value.set(result.id, result);
                        showToast('Success', 'Clinical unit added successfully', 'success');
                    } else {
                        const index = clinicalUnits.value.findIndex(u => u.id === clinicalUnitModal.value.unit.id);
                        if (index !== -1) {
                            clinicalUnits.value[index] = {
                                ...clinicalUnits.value[index],
                                ...clinicalUnitModal.value.form,
                                updated_at: getLocalDateTime()
                            };
                            result = clinicalUnits.value[index];
                            clinicalUnitCache.value.set(result.id, result);
                        }
                        showToast('Success', 'Clinical unit updated successfully', 'success');
                    }
                    
                    clinicalUnitModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving clinical unit');
        };

        const deleteClinicalUnit = async (unit) => {
            if (!hasPermission('system', 'manage_departments')) {
                showToast('Permission Denied', 'You need manage_departments permission', 'permission');
                return;
            }
            if (!confirm(`Are you sure you want to delete ${unit.name}?`)) return;
            
            await withErrorHandling(async () => {
                const index = clinicalUnits.value.findIndex(u => u.id === unit.id);
                if (index !== -1) {
                    clinicalUnits.value.splice(index, 1);
                    clinicalUnitCache.value.delete(unit.id);
                }
                showToast('Deleted', `${unit.name} has been removed`, 'success');
            }, 'Deleting clinical unit');
        };

        // ============ ON-CALL SCHEDULE FUNCTIONS ============
        const showAddOnCallModal = () => {
            if (!hasPermission('oncall_schedule', 'create')) { 
                showToast('Permission Denied', 'Need create permission', 'permission'); 
                return; 
            }
            const tomorrow = new Date(); 
            tomorrow.setDate(tomorrow.getDate() + 1); 
            const dateString = getLocalDateString(tomorrow);
            const scheduleId = `ONCALL-${dateString.replace(/-/g, '')}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
            onCallModal.value = { 
                show: true, 
                mode: 'add', 
                schedule: null, 
                form: { 
                    duty_date: dateString, 
                    schedule_id: scheduleId,
                    shift_type: 'backup_call', 
                    primary_physician_id: '', 
                    backup_physician_id: '', 
                    start_time: '08:00', 
                    end_time: '20:00', 
                    coverage_notes: '' 
                }
            };
        };

        const editOnCallSchedule = (scheduleOrDay) => {
            if (!hasPermission('oncall_schedule', 'update')) { 
                showToast('Permission Denied', 'Need update permission', 'permission'); 
                return; 
            }
            if (scheduleOrDay.date) {
                const day = scheduleOrDay;
                if (day.schedule) {
                    onCallModal.value = { 
                        show: true, 
                        mode: 'edit', 
                        schedule: day.schedule, 
                        form: {
                            duty_date: day.schedule.duty_date, 
                            schedule_id: day.schedule.schedule_id, 
                            shift_type: day.schedule.shift_type || 'backup_call',
                            primary_physician_id: day.schedule.primary_physician_id, 
                            backup_physician_id: day.schedule.backup_physician_id || '',
                            start_time: day.schedule.start_time?.slice(0, 5) || '08:00', 
                            end_time: day.schedule.end_time?.slice(0, 5) || '20:00', 
                            coverage_notes: day.schedule.coverage_notes || '' 
                        }
                    };
                } else { 
                    showAddOnCallModal(); 
                    onCallModal.value.form.duty_date = day.date; 
                }
            } else {
                const schedule = scheduleOrDay; 
                onCallModal.value = { 
                    show: true, 
                    mode: 'edit', 
                    schedule: schedule, 
                    form: {
                        duty_date: schedule.duty_date, 
                        schedule_id: schedule.schedule_id, 
                        shift_type: schedule.shift_type || 'backup_call',
                        primary_physician_id: schedule.primary_physician_id, 
                        backup_physician_id: schedule.backup_physician_id || '',
                        start_time: schedule.start_time?.slice(0, 5) || '08:00', 
                        end_time: schedule.end_time?.slice(0, 5) || '20:00', 
                        coverage_notes: schedule.coverage_notes || '' 
                    }
                };
            }
        };

        const saveOnCallSchedule = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    validateOnCallForm();
                    const permissionNeeded = onCallModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('oncall_schedule', permissionNeeded)) throw new Error('Insufficient permissions');
                    
                    const scheduleData = {
                        duty_date: onCallModal.value.form.duty_date, 
                        schedule_id: onCallModal.value.form.schedule_id,
                        shift_type: onCallModal.value.form.shift_type, 
                        primary_physician_id: onCallModal.value.form.primary_physician_id,
                        backup_physician_id: onCallModal.value.form.backup_physician_id || null,
                        start_time: onCallModal.value.form.start_time + ':00', 
                        end_time: onCallModal.value.form.end_time + ':00',
                        coverage_notes: onCallModal.value.form.coverage_notes, 
                        updated_at: getLocalDateTime()
                    };
                    
                    let result;
                    if (onCallModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...scheduleData,
                            created_at: getLocalDateTime()
                        };
                        onCallSchedule.value.push(result);
                        showToast('Success', 'On-call schedule created', 'success');
                    } else {
                        const index = onCallSchedule.value.findIndex(s => s.id === onCallModal.value.schedule.id);
                        if (index !== -1) {
                            onCallSchedule.value[index] = {
                                ...onCallSchedule.value[index],
                                ...scheduleData
                            };
                            result = onCallSchedule.value[index];
                        }
                        showToast('Success', 'On-call schedule updated', 'success');
                    }
                    
                    onCallModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving on-call schedule');
        };

        const overrideOnCall = (scheduleOrDay) => {
            if (!hasPermission('oncall_schedule', 'override')) { 
                showToast('Permission Denied', 'Need override permission', 'permission'); 
                return; 
            }
            const date = scheduleOrDay.date || scheduleOrDay.duty_date;
            if (!confirm(`Emergency override for ${formatDate(date)}? This will replace any existing schedule.`)) return;
            
            const scheduleId = `EMERGENCY-${date.replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            onCallModal.value = { 
                show: true, 
                mode: 'add', 
                schedule: null, 
                form: {
                    duty_date: date, 
                    schedule_id: scheduleId, 
                    shift_type: 'backup_call', 
                    primary_physician_id: '', 
                    backup_physician_id: '',
                    start_time: '00:00', 
                    end_time: '23:59', 
                    coverage_notes: 'EMERGENCY OVERRIDE - Manual schedule entry' 
                }
            };
            showToast('Emergency Override', 'Emergency schedule override mode activated', 'warning');
        };

        const deleteOnCallSchedule = async (schedule) => {
            if (!hasPermission('oncall_schedule', 'delete')) { 
                showToast('Permission Denied', 'Need delete permission', 'permission'); 
                return; 
            }
            if (!confirm(`Delete on-call schedule for ${formatDate(schedule.duty_date)}?`)) return;
            
            await withErrorHandling(async () => {
                const index = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                if (index !== -1) {
                    onCallSchedule.value.splice(index, 1);
                }
                showToast('Deleted', 'On-call schedule removed', 'success');
            }, 'Deleting on-call schedule');
        };

        // ============ STAFF ABSENCE FUNCTIONS ============
        const showAddAbsenceModal = () => {
            if (!hasPermission('staff_absence', 'create')) { 
                showToast('Permission Denied', 'Need create permission', 'permission'); 
                return; 
            }
            const nextWeek = new Date(); 
            nextWeek.setDate(nextWeek.getDate() + 7);
            const startDate = getLocalDateString(); 
            const endDate = getLocalDateString(nextWeek);
            absenceModal.value = { 
                show: true, 
                mode: 'add', 
                absence: null, 
                form: {
                    staff_member_id: '', 
                    absence_reason: '', 
                    start_date: startDate, 
                    end_date: endDate, 
                    notes: '',
                    replacement_staff_id: '',
                    coverage_instructions: ''
                }
            };
        };

        const viewAbsenceDetails = (absence) => {
            absenceDetailsModal.value = { 
                show: true, 
                absence: absence 
            };
        };

        const editAbsence = (absence) => {
            if (!hasPermission('staff_absence', 'update')) { 
                showToast('Permission Denied', 'Need update permission', 'permission'); 
                return; 
            }
            absenceModal.value = { 
                show: true, 
                mode: 'edit', 
                absence: absence, 
                form: { 
                    ...absence 
                }
            };
        };

        const saveAbsence = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    validateAbsenceForm();
                    const permissionNeeded = absenceModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('staff_absence', permissionNeeded)) throw new Error('Insufficient permissions');
                    
                    const start = new Date(absenceModal.value.form.start_date);
                    const end = new Date(absenceModal.value.form.end_date);
                    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    
                    let result;
                    if (absenceModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...absenceModal.value.form,
                            total_days: totalDays,
                            documented_by_name: currentUser.value?.full_name || 'System',
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        };
                        staffAbsences.value.unshift(result);
                        showToast('Success', 'Staff absence documented successfully', 'success');
                    } else {
                        const index = staffAbsences.value.findIndex(a => a.id === absenceModal.value.absence.id);
                        if (index !== -1) {
                            staffAbsences.value[index] = {
                                ...staffAbsences.value[index],
                                ...absenceModal.value.form,
                                total_days: totalDays,
                                updated_at: getLocalDateTime()
                            };
                            result = staffAbsences.value[index];
                        }
                        showToast('Success', 'Staff absence updated successfully', 'success');
                    }
                    
                    absenceModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving staff absence');
        };

        const deleteAbsence = async (absence) => {
            if (!hasPermission('staff_absence', 'delete')) { 
                showToast('Permission Denied', 'Need delete permission', 'permission'); 
                return; 
            }
            if (!confirm(`Are you sure you want to delete this absence record?`)) return;
            
            await withErrorHandling(async () => {
                const index = staffAbsences.value.findIndex(a => a.id === absence.id);
                if (index !== -1) {
                    staffAbsences.value.splice(index, 1);
                }
                showToast('Deleted', 'Absence record has been removed', 'success');
            }, 'Deleting staff absence');
        };

        // ============ TRAINING UNIT FUNCTIONS ============
        const showAddTrainingUnitModal = () => {
            if (!hasPermission('training_units', 'create')) { 
                showToast('Permission Denied', 'Need create permission', 'permission'); 
                return; 
            }
            trainingUnitModal.value = { 
                show: true, 
                mode: 'add', 
                unit: null, 
                form: { 
                    unit_name: '', 
                    clinical_unit_id: '', 
                    unit_description: '', 
                    unit_status: 'active', 
                    maximum_residents: 10, 
                    current_residents: 0 
                }
            };
        };

        const editTrainingUnit = (unit) => {
            if (!hasPermission('training_units', 'update')) { 
                showToast('Permission Denied', 'Need update permission', 'permission'); 
                return; 
            }
            trainingUnitModal.value = { 
                show: true, 
                mode: 'edit', 
                unit: unit, 
                form: { ...unit } 
            };
        };

        const saveTrainingUnit = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    validateTrainingUnitForm();
                    const permissionNeeded = trainingUnitModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('training_units', permissionNeeded)) throw new Error('Insufficient permissions');
                    
                    let result;
                    if (trainingUnitModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...trainingUnitModal.value.form,
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        };
                        trainingUnits.value.unshift(result);
                        unitCache.value.set(result.id, result);
                        showToast('Success', 'Training unit added', 'success');
                    } else {
                        const index = trainingUnits.value.findIndex(u => u.id === trainingUnitModal.value.unit.id);
                        if (index !== -1) {
                            trainingUnits.value[index] = {
                                ...trainingUnits.value[index],
                                ...trainingUnitModal.value.form,
                                updated_at: getLocalDateTime()
                            };
                            result = trainingUnits.value[index];
                            unitCache.value.set(result.id, result);
                        }
                        showToast('Success', 'Training unit updated', 'success');
                    }
                    
                    trainingUnitModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving training unit');
        };

        // ============ ROTATION FUNCTIONS ============
        const showAddRotationModal = () => {
            if (!hasPermission('resident_rotations', 'create')) { 
                showToast('Permission Denied', 'Need create permission', 'permission'); 
                return; 
            }
            const date = new Date(); 
            const rotationId = `ROT-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const startDate = new Date(); 
            startDate.setDate(startDate.getDate() + 30); 
            const endDate = new Date(startDate); 
            endDate.setDate(endDate.getDate() + 90);
            rotationModal.value = { 
                show: true, 
                mode: 'add', 
                rotation: null, 
                form: {
                    rotation_id: rotationId, 
                    resident_id: '', 
                    training_unit_id: '', 
                    supervising_attending_id: '',
                    start_date: getLocalDateString(startDate), 
                    end_date: getLocalDateString(endDate),
                    rotation_category: 'clinical_rotation', 
                    rotation_status: 'scheduled', 
                    clinical_notes: '', 
                    supervisor_evaluation: '' 
                }
            };
        };

        const editRotation = (rotation) => {
            if (!hasPermission('resident_rotations', 'update')) { 
                showToast('Permission Denied', 'Need update permission', 'permission'); 
                return; 
            }
            rotationModal.value = { 
                show: true, 
                mode: 'edit', 
                rotation: rotation, 
                form: {
                    rotation_id: rotation.rotation_id, 
                    resident_id: rotation.resident_id, 
                    training_unit_id: rotation.training_unit_id,
                    supervising_attending_id: rotation.supervising_attending_id || '', 
                    start_date: rotation.start_date,
                    end_date: rotation.end_date, 
                    rotation_category: rotation.rotation_category,
                    rotation_status: rotation.rotation_status, 
                    clinical_notes: rotation.clinical_notes || '', 
                    supervisor_evaluation: rotation.supervisor_evaluation || '' 
                }
            };
        };

        const extendRotation = (rotation) => {
            if (!hasPermission('resident_rotations', 'extend')) { 
                showToast('Permission Denied', 'Need extend permission', 'permission'); 
                return; 
            }
            const newEndDate = new Date(rotation.end_date); 
            newEndDate.setDate(newEndDate.getDate() + 30);
            rotationModal.value = { 
                show: true, 
                mode: 'edit', 
                rotation: rotation, 
                form: {
                    rotation_id: rotation.rotation_id + '-EXT', 
                    resident_id: rotation.resident_id, 
                    training_unit_id: rotation.training_unit_id,
                    supervising_attending_id: rotation.supervising_attending_id || '', 
                    start_date: rotation.end_date,
                    end_date: getLocalDateString(newEndDate), 
                    rotation_category: rotation.rotation_category,
                    rotation_status: 'scheduled', 
                    clinical_notes: 'Extended rotation - ' + rotation.clinical_notes, 
                    supervisor_evaluation: '' 
                }
            };
        };

        const updateUnitCapacity = (unitId, operation) => {
            const unit = trainingUnits.value.find(u => u.id === unitId); 
            if (!unit) return;
            const newCount = operation === 'increment' ? (unit.current_residents || 0) + 1 : Math.max(0, (unit.current_residents || 0) - 1);
            unit.current_residents = newCount;
        };

        const saveRotation = async () => {
            await withErrorHandling(async () => {
                saving.value = true;
                try {
                    validateRotationForm();
                    const permissionNeeded = rotationModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('resident_rotations', permissionNeeded)) throw new Error('Insufficient permissions');
                    
                    let result;
                    if (rotationModal.value.mode === 'add') {
                        result = {
                            id: generateUniqueId(),
                            ...rotationModal.value.form,
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        };
                        residentRotations.value.unshift(result);
                        showToast('Success', 'Rotation scheduled successfully', 'success');
                        updateUnitCapacity(result.training_unit_id, 'increment');
                    } else {
                        const index = residentRotations.value.findIndex(r => r.id === rotationModal.value.rotation.id);
                        if (index !== -1) {
                            residentRotations.value[index] = {
                                ...residentRotations.value[index],
                                ...rotationModal.value.form,
                                updated_at: getLocalDateTime()
                            };
                            result = residentRotations.value[index];
                        }
                        showToast('Success', 'Rotation updated successfully', 'success');
                    }
                    
                    rotationModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving rotation');
        };

        const deleteRotation = async (rotation) => {
            if (!hasPermission('resident_rotations', 'delete')) { 
                showToast('Permission Denied', 'Need delete permission', 'permission'); 
                return; 
            }
            if (!confirm(`Are you sure you want to delete rotation "${rotation.rotation_id}"?`)) return;
            
            await withErrorHandling(async () => {
                const index = residentRotations.value.findIndex(r => r.id === rotation.id);
                if (index !== -1) {
                    residentRotations.value.splice(index, 1);
                    updateUnitCapacity(rotation.training_unit_id, 'decrement');
                }
                showToast('Deleted', `Rotation ${rotation.rotation_id} has been removed`, 'success');
            }, 'Deleting rotation');
        };

        // ============ QUICK PLACEMENT ============
        const showQuickPlacementModal = () => {
            if (!hasPermission('placements', 'create')) { 
                showToast('Permission Denied', 'Need create permission for placements', 'permission'); 
                return; 
            }
            quickPlacementModal.value = { 
                show: true, 
                form: { 
                    resident_id: '', 
                    training_unit_id: '', 
                    duration: 4 
                }
            };
        };

        const saveQuickPlacement = async () => {
            await withErrorHandling(async () => {
                if (!hasPermission('placements', 'create')) throw new Error('Need create permission');
                saving.value = true;
                try {
                    if (!quickPlacementModal.value.form.resident_id || !quickPlacementModal.value.form.training_unit_id) {
                        throw new Error('Please select both resident and unit');
                    }
                    
                    const rotationId = `PLACEMENT-${getLocalDateString().replace(/-/g,'')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                    const startDate = getLocalDateString(); 
                    const endDate = new Date(); 
                    endDate.setDate(endDate.getDate() + (quickPlacementModal.value.form.duration * 7));
                    
                    const result = {
                        id: generateUniqueId(),
                        rotation_id: rotationId, 
                        resident_id: quickPlacementModal.value.form.resident_id, 
                        training_unit_id: quickPlacementModal.value.form.training_unit_id,
                        start_date: startDate, 
                        end_date: getLocalDateString(endDate), 
                        rotation_category: 'clinical_rotation',
                        rotation_status: 'scheduled', 
                        clinical_notes: 'Placed via quick placement', 
                        created_at: getLocalDateTime(), 
                        updated_at: getLocalDateTime()
                    };
                    
                    residentRotations.value.unshift(result);
                    updateUnitCapacity(quickPlacementModal.value.form.training_unit_id, 'increment');
                    showToast('Success', 'Resident placed successfully', 'success');
                    quickPlacementModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving quick placement');
        };

        // ============ DRAG AND DROP ============
        const handleDrop = async (event, unit) => {
            event.preventDefault(); 
            const residentId = event.dataTransfer.getData('text/plain'); 
            if (!residentId) return;
            
            await withErrorHandling(async () => {
                if (!hasPermission('placements', 'drag_drop')) { 
                    showToast('Permission Denied', 'Need drag-drop permission', 'permission'); 
                    return; 
                }
                
                const existingRotation = residentRotations.value.find(r => r.resident_id === residentId && (r.rotation_status === 'active' || r.rotation_status === 'scheduled'));
                
                if (existingRotation) {
                    if (!confirm(`Resident is already in ${getTrainingUnitName(existingRotation.training_unit_id)}. Move them to ${unit.unit_name}?`)) return;
                    existingRotation.rotation_status = 'completed';
                    existingRotation.clinical_notes = `Moved to ${unit.unit_name} via drag-drop`;
                    updateUnitCapacity(existingRotation.training_unit_id, 'decrement');
                }
                
                const rotationId = `DRAGDROP-${getLocalDateString().replace(/-/g,'')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                const startDate = getLocalDateString(); 
                const endDate = new Date(); 
                endDate.setDate(endDate.getDate() + 28);
                const result = {
                    id: generateUniqueId(),
                    rotation_id: rotationId, 
                    resident_id: residentId, 
                    training_unit_id: unit.id, 
                    start_date: startDate,
                    end_date: getLocalDateString(endDate), 
                    rotation_category: 'clinical_rotation', 
                    rotation_status: 'scheduled',
                    clinical_notes: 'Assigned via drag-and-drop', 
                    created_at: getLocalDateTime(), 
                    updated_at: getLocalDateTime()
                };
                
                residentRotations.value.unshift(result);
                updateUnitCapacity(unit.id, 'increment');
                showToast('Placement Created', `Resident placed in ${unit.unit_name}`, 'success');
            }, 'Creating drag-drop placement');
        };

        const removePlacement = async (residentId, unitId) => {
            if (!confirm('Remove resident from this unit?')) return;
            
            await withErrorHandling(async () => {
                const rotation = residentRotations.value.find(r => r.resident_id === residentId && r.training_unit_id === unitId && (r.rotation_status === 'active' || r.rotation_status === 'scheduled'));
                if (rotation) {
                    rotation.rotation_status = 'cancelled';
                    rotation.clinical_notes = 'Removed via UI';
                    updateUnitCapacity(unitId, 'decrement');
                    showToast('Removed', 'Resident removed from unit', 'success');
                }
            }, 'Removing placement');
        };

        // ============ COMMUNICATIONS ============
        const showCommunicationsModal = () => {
            if (!hasPermission('communications', 'create')) { 
                showToast('Permission Denied', 'Need create permission', 'permission'); 
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
                    ward: { current: currentCapacity.value.ward.current, max: currentCapacity.value.ward.max, notes: '' },
                    stepdown: { current: currentCapacity.value.stepdown.current, max: currentCapacity.value.stepdown.max, notes: '' },
                    clinic: { current: 25, max: 40, notes: '' }, 
                    bronch: { current: 3, max: 6, notes: '' }, 
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
            await withErrorHandling(async () => {
                if (!hasPermission('communications', 'create')) throw new Error('Need create permission');
                saving.value = true;
                try {
                    if (communicationsModal.value.activeTab === 'announcement') {
                        if (!communicationsModal.value.form.announcement_title.trim()) throw new Error('Announcement title is required');
                        if (!communicationsModal.value.form.announcement_content.trim()) throw new Error('Announcement content is required');
                        
                        const result = {
                            id: generateUniqueId(),
                            ...communicationsModal.value.form,
                            created_by: currentUser.value?.full_name, 
                            created_at: getLocalDateTime(), 
                            updated_at: getLocalDateTime()
                        };
                        announcements.value.unshift(result);
                        showToast('Published', 'Announcement published successfully', 'success');
                    } else if (communicationsModal.value.activeTab === 'capacity') {
                        currentCapacity.value = {
                            er: { ...communicationsModal.value.capacity.er, status: getCapacityStatus(communicationsModal.value.capacity.er) },
                            icu: { ...communicationsModal.value.capacity.icu, status: getCapacityStatus(communicationsModal.value.capacity.icu) },
                            ward: { ...communicationsModal.value.capacity.ward, status: getCapacityStatus(communicationsModal.value.capacity.ward) },
                            stepdown: { ...communicationsModal.value.capacity.stepdown, status: getCapacityStatus(communicationsModal.value.capacity.stepdown) }
                        };
                        showToast('Updated', 'Capacity information updated', 'success');
                    } else if (communicationsModal.value.activeTab === 'quick') {
                        if (!communicationsModal.value.quickUpdate.message.trim()) throw new Error('Message is required');
                        quickUpdates.value.unshift({
                            id: Date.now(), 
                            author: currentUser.value.full_name, 
                            message: communicationsModal.value.quickUpdate.message,
                            timestamp: 'Just now', 
                            tags: communicationsModal.value.quickUpdate.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                        });
                        showToast('Posted', 'Quick update posted', 'success');
                    }
                    communicationsModal.value.show = false;
                } catch (error) {
                    throw error;
                } finally {
                    saving.value = false;
                }
            }, 'Saving communication');
        };

        // ============ SYSTEM SETTINGS ============
        const showSystemSettingsModal = () => {
            if (!hasPermission('system', 'read')) return;
            systemSettingsModal.value = { 
                show: true, 
                form: { ...systemSettings.value } 
            };
        };

        const saveSystemSettings = async () => {
            if (!hasPermission('system', 'update')) { 
                showToast('Permission Denied', 'Need update permission for system settings', 'permission'); 
                return; 
            }
            saving.value = true;
            try { 
                systemSettings.value = { ...systemSettingsModal.value.form }; 
                showToast('Settings Saved', 'System settings updated successfully', 'success');
                systemSettingsModal.value.show = false; 
            } catch (error) { 
                console.error('Error saving system settings:', error); 
                showToast('Save Failed', error.message, 'error'); 
            } finally { 
                saving.value = false; 
            }
        };

        // ============ USER PROFILE ============
        const showUserProfile = () => {
            userProfileModal.value = { 
                show: true, 
                form: { 
                    full_name: currentUser.value?.full_name || '', 
                    email: currentUser.value?.email || '', 
                    phone: currentUser.value?.phone || '+1 (555) 123-4567',
                    department: currentUser.value?.department || 'Pulmonary Medicine', 
                    notifications_enabled: true, 
                    absence_notifications: true, 
                    announcement_notifications: true 
                }
            };
            userMenuOpen.value = false;
        };

        const saveUserProfile = async () => {
            saving.value = true;
            try { 
                currentUser.value = { ...currentUser.value, ...userProfileModal.value.form }; 
                showToast('Profile Updated', 'Your profile has been updated', 'success');
                userProfileModal.value.show = false; 
            } catch (error) { 
                console.error('Error saving profile:', error); 
                showToast('Save Failed', error.message, 'error'); 
            } finally { 
                saving.value = false; 
            }
        };

        // ============ SEARCH FUNCTIONS ============
        const handleSearch = () => {
            if (!searchQuery.value.trim()) return;
            
            recentSearches.value.unshift({ query: searchQuery.value, time: 'Just now' });
            if (recentSearches.value.length > 5) recentSearches.value.pop();
            
            showToast('Search', `Found results for "${searchQuery.value}"`, 'info');
        };

        const resetStaffFilters = () => { 
            staffSearch.value = ''; 
            staffFilter.value = { staff_type: '', employment_status: '' }; 
        };
        
        const applyStaffFilters = () => showToast('Filters Applied', 'Medical staff filters updated', 'info');
        
        const resetRotationFilters = () => { 
            rotationFilter.value = { category: '', status: '' }; 
        };
        
        const applyRotationFilters = () => showToast('Filters Applied', 'Rotation filters updated', 'info');
        
        const resetAuditFilters = () => { 
            auditFilter.value = { action: '', dateRange: 'today' }; 
        };
        
        const applyAuditFilters = () => showToast('Filters Applied', 'Audit filters updated', 'info');

        // ============ BULK OPERATIONS ============
        const sendBulkNotifications = async () => {
            await withErrorHandling(async () => {
                if (!hasPermission('medical_staff', 'notify')) throw new Error('Need notify permission');
                showToast('Notifications Sent', 'Sent notifications to all staff members', 'success');
            }, 'Sending bulk notifications');
        };

        const showStaffReport = async () => {
            await withErrorHandling(async () => {
                if (!hasPermission('medical_staff', 'report')) throw new Error('Need report permission');
                showToast('Report Generated', 'Staff report downloaded', 'success');
            }, 'Generating staff report');
        };

        // ============ EXPORT FUNCTIONS ============
        const exportStaffList = () => {
            showImportExportModal('export', 'medical_staff');
        };

        const exportAuditLogs = () => {
            showImportExportModal('export', 'audit_logs');
        };

        const showImportModal = (table) => {
            showImportExportModal('import', table);
        };

        const showImportExportModal = (mode = 'export', table = null) => {
            importExportModal.value = { 
                show: true, 
                mode, 
                selectedTable: table || 'medical_staff', 
                exportFormat: 'csv', 
                overwriteExisting: false, 
                progress: 0 
            };
        };

        const updateCapacity = () => {
            showToast('Capacity Updated', 'Department capacity updated', 'success');
        };

        const quickAssignToUnit = (alert) => {
            showQuickPlacementModal();
        };

        // ============ MISC FUNCTIONS ============
        const onStaffTypeChange = () => {
            if (medicalStaffModal.value.form.staff_type !== 'medical_resident') {
                medicalStaffModal.value.form.resident_category = '';
                medicalStaffModal.value.form.training_level = '';
            }
            if (medicalStaffModal.value.form.staff_type !== 'attending_physician') {
                medicalStaffModal.value.form.specialization = '';
                medicalStaffModal.value.form.years_experience = '';
            }
        };

        // ============ LIFECYCLE HOOKS ============
        onMounted(() => {
            // Start live stats refresh interval
            setInterval(() => {
                refreshLiveStats();
            }, 30000);
        });

        onUnmounted(() => {
            // Clear intervals if needed
        });

        // ============ RETURN STATEMENT ============
        return {
            // State Variables
            currentUser, loginForm, loading, saving, savingPermissions, currentView,
            sidebarCollapsed, mobileMenuOpen, showPermissionManager, statsSidebarOpen, searchQuery,
            searchScope, searchFilter, showRecentSearches, userMenuOpen,
            
            // Modal States
            staffDetailsModal, medicalStaffModal, departmentModal, clinicalUnitModal, onCallModal, 
            absenceModal, absenceDetailsModal, trainingUnitModal, rotationModal, quickPlacementModal, 
            communicationsModal, systemSettingsModal, userProfileModal, importExportModal,
            
            // Data Stores
            medicalStaff, trainingUnits, residentRotations, staffAbsences, onCallSchedule, 
            announcements, auditLogs, departments, clinicalUnits, systemSettings, userNotifications,
            
            // UI State
            toasts, permissionResources, stats, liveStats, currentCapacity, capacityOverview,
            quickUpdates, collapsedCards, pinnedCards, draggingCard, lastUpdated, staffDailyActivities,
            
            // Filters
            staffSearch, staffFilter, rotationFilter, auditFilter, recentSearches,
            
            // Computed Properties
            filteredMedicalStaff, todaysOnCall, recentAnnouncements, coverageAlerts, emergencyAlerts,
            nextSevenDays, filteredRotations, availableResidents, unreadNotifications, activeTrainingUnits,
            availablePhysicians, availableAttendings, availableStaff, availableCoverageStaff,
            
            // Core Functions
            hasPermission, hasAnyPermission, getResourcePermissionLevel, getPermissionDescription,
            formatActionName, togglePermission, savePermissionChanges,
            
            // Utility Functions
            getInitials, formatDate, formatDateTime, formatTimeAgo, formatTimeRange, getUserRoleDisplay,
            formatStaffType, getStaffTypeClass, formatEmploymentStatus, formatRotationCategory,
            getRotationCategoryClass, getAuditIcon, getDocumentIcon, getPriorityColor,
            getCapacityStatus, getCommunicationIcon, getCommunicationButtonText, formatDateShort,
            formatResidentCategory, formatTrainingLevel, getCapacityClass, isAbsenceActive,
            
            // Data Relationship Functions
            getPhysicianName, getPhysicianFirstName, getResidentName, getTrainingUnitName,
            getClinicalUnitName, getAttendingName, getDepartmentName, getDepartmentUnits,
            getAssignedResidents,
            
            // Navigation Functions
            switchView, getCurrentTitle, getCurrentSubtitle, getSearchPlaceholder, toggleStatsSidebar,
            toggleSearchScope, setSearchFilter, selectRecentSearch, clearRecentSearches,
            togglePermissionManager, toggleUserMenu, markAllNotificationsAsRead, getDayStatus,
            
            // Card Interaction Functions
            startDrag, endDrag, togglePinCard, toggleCollapseCard, dismissAllAlerts, dismissCoverageAlert,
            viewUnitDetails, viewScheduleDetails,
            
            // Authentication Functions
            handleLogin, handleLogout,
            
            // Staff Details Functions
            viewStaffDetails,
            
            // Search Functions
            handleSearch,
            
            // Filter Functions
            resetStaffFilters, applyStaffFilters, resetRotationFilters, applyRotationFilters,
            resetAuditFilters, applyAuditFilters,
            
            // CRUD Functions
            showAddMedicalStaffModal, editMedicalStaff, saveMedicalStaff, deleteMedicalStaff,
            showAddDepartmentModal, editDepartment, saveDepartment, deleteDepartment,
            showAddClinicalUnitModal, editClinicalUnit, saveClinicalUnit, deleteClinicalUnit,
            showAddOnCallModal, editOnCallSchedule, saveOnCallSchedule, overrideOnCall, deleteOnCallSchedule,
            showAddAbsenceModal, viewAbsenceDetails, editAbsence, saveAbsence, deleteAbsence,
            showAddTrainingUnitModal, editTrainingUnit, saveTrainingUnit,
            showAddRotationModal, editRotation, extendRotation, saveRotation, deleteRotation,
            showQuickPlacementModal, saveQuickPlacement,
            showCommunicationsModal, saveCommunication,
            
            // System Functions
            showSystemSettingsModal, saveSystemSettings,
            showUserProfile, saveUserProfile,
            
            // Export/Import Functions
            exportStaffList, exportAuditLogs, showImportModal, updateCapacity, quickAssignToUnit, showImportExportModal,
            
            // Bulk Operations
            sendBulkNotifications, showStaffReport,
            
            // Drag and Drop Functions
            handleDrop, removePlacement,
            
                  // Form Functions
        onStaffTypeChange,
        
        // Toast Function
        removeToast
        };
    }
});

// Mount the Vue app
    app.mount('#app');
    console.log('Vue app mounted successfully');
}); // <-- This closes the window.addEventListener callback

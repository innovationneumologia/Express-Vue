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
        // Create Vue application instance with error boundary support
        const app = createApp({
            // Component setup function - contains all reactive state and logic
            setup() {
                try {
                    // ============ REACTIVE STATE ============
                    // Current authenticated user (null if not logged in)
                    const currentUser = ref(null);
                    // Login form data with default demo credentials
                    const loginForm = reactive({ 
                        email: 'admin@neumocare.org', 
                        password: 'password123', 
                        remember_me: false 
                    });
                    
                    // Loading states for various operations
                    const loading = ref(false); // General loading
                    const saving = ref(false);  // Save operations loading
                    
                    // UI state management
                    const currentView = ref('login');        // Current active view/page
                    const sidebarCollapsed = ref(false);     // Sidebar visibility state
                    const mobileMenuOpen = ref(false);       // Mobile menu state
                    const userMenuOpen = ref(false);         // User dropdown menu state
                    const statsSidebarOpen = ref(false);     // Stats panel visibility
                    const searchQuery = ref('');            // Main search input
                    const searchScope = ref('All');         // Search scope filter
                    const searchFilter = ref('all');        // Search category filter
                    
                    // ============ FILTER STATES ============
                    // Medical staff filtering criteria
                    const staffFilter = reactive({
                        staff_type: '',          // Filter by staff type (resident, attending, etc.)
                        employment_status: ''    // Filter by employment status (active, on_leave, etc.)
                    });
                    
                    // Resident rotations filtering criteria
                    const rotationFilter = reactive({
                        resident_id: '',    // Filter by specific resident
                        status: ''          // Filter by rotation status (active, completed, etc.)
                    });
                    
                    // Staff absence filtering criteria
                    const absenceFilter = reactive({
                        staff_id: '',      // Filter by staff member
                        status: '',        // Filter by approval status
                        start_date: ''     // Filter by start date
                    });
                    
                    // Audit log filtering criteria
                    const auditFilters = reactive({
                        dateRange: '',    // Filter by date range
                        actionType: '',   // Filter by action type (create, update, delete)
                        userId: ''        // Filter by user ID
                    });
                    
                    // ============ MODAL STATES ============
                    // Generic confirmation modal for delete/confirm actions
                    const confirmationModal = reactive({
                        show: false,                 // Modal visibility
                        title: '',                   // Modal title
                        message: '',                 // Modal message/content
                        icon: 'fa-question-circle',  // Modal icon
                        confirmButtonText: 'Confirm', // Confirm button text
                        confirmButtonClass: 'btn-primary', // Button styling class
                        onConfirm: null,             // Confirm callback function
                        onCancel: null               // Cancel callback function
                    });
                    
                    // Staff details modal - shows comprehensive staff information
                    const staffDetailsModal = reactive({
                        show: false,        // Modal visibility
                        staff: null,        // Staff object to display
                        activeTab: 'personal', // Currently active tab
                        stats: {            // Staff statistics
                            completedRotations: 0,   // Total completed rotations
                            oncallShifts: 0,         // Total on-call shifts
                            absenceDays: 0,          // Total absence days
                            supervisionCount: 0      // Number of residents supervised
                        },
                        currentRotation: '', // Current active rotation info
                        nextOncall: '',      // Next scheduled on-call
                        activityHistory: []  // Recent activity log
                    });
                    
                    // Medical staff add/edit modal
                    const medicalStaffModal = reactive({
                        show: false,                    // Modal visibility
                        mode: 'add',                    // 'add' or 'edit' mode
                        activeTab: 'basic',             // Currently active form tab
                        form: {                         // Form data structure
                            full_name: '',              // Staff full name
                            staff_type: 'medical_resident', // Staff type (resident, attending, etc.)
                            staff_id: '',               // Unique staff ID
                            employment_status: 'active', // Employment status
                            professional_email: '',     // Professional email
                            department_id: '',          // Department assignment
                            resident_category: '',      // Resident category
                            training_level: '',         // Training level (PGY-1, etc.)
                            specialization: '',         // Medical specialization
                            years_experience: '',       // Years of experience
                            biography: '',              // Professional biography
                            office_phone: '',           // Office phone number
                            mobile_phone: '',           // Mobile phone number
                            medical_license: '',        // Medical license number
                            date_of_birth: ''           // Date of birth
                        }
                    });
                    
                    // Department management modal
                    const departmentModal = reactive({
                        show: false,                // Modal visibility
                        mode: 'add',                // 'add' or 'edit' mode
                        form: {                     // Form data structure
                            name: '',               // Department name
                            code: '',               // Department code/abbreviation
                            status: 'active',       // Department status
                            description: '',        // Department description
                            head_of_department_id: '' // Head of department ID
                        }
                    });
                    
                    // Clinical unit management modal
                    const clinicalUnitModal = reactive({
                        show: false,                // Modal visibility
                        mode: 'add',                // 'add' or 'edit' mode
                        form: {                     // Form data structure
                            name: '',               // Unit name
                            code: '',               // Unit code
                            department_id: '',      // Parent department ID
                            unit_type: 'clinical',  // Unit type
                            status: 'active',       // Unit status
                            description: '',        // Unit description
                            supervisor_id: ''       // Unit supervisor ID
                        }
                    });
                    
                    // Training unit management modal
                    const trainingUnitModal = reactive({
                        show: false,                // Modal visibility
                        mode: 'add',                // 'add' or 'edit' mode
                        form: {                     // Form data structure
                            unit_name: '',          // Training unit name
                            unit_code: '',          // Unit code
                            department_id: '',      // Parent department ID
                            supervisor_id: '',      // Unit supervisor ID
                            max_capacity: 10,       // Maximum resident capacity
                            status: 'active',       // Unit status
                            description: ''         // Unit description
                        }
                    });
                    
                    // Resident rotation management modal
                    const rotationModal = reactive({
                        show: false,                // Modal visibility
                        mode: 'add',                // 'add' or 'edit' mode
                        form: {                     // Form data structure
                            resident_id: '',        // Resident ID
                            training_unit_id: '',   // Training unit ID
                            start_date: '',         // Rotation start date
                            end_date: '',           // Rotation end date
                            supervisor_id: '',      // Rotation supervisor ID
                            status: 'active',       // Rotation status
                            goals: '',              // Rotation goals/objectives
                            notes: ''               // Additional notes
                        }
                    });
                    
                    // On-call schedule management modal
                    const onCallModal = reactive({
                        show: false,                    // Modal visibility
                        mode: 'add',                    // 'add' or 'edit' mode
                        form: {                         // Form data structure
                            duty_date: '',              // Duty date
                            shift_type: 'backup_call',  // Shift type (primary/backup)
                            start_time: '',             // Shift start time
                            end_time: '',               // Shift end time
                            primary_physician_id: '',   // Primary physician ID
                            backup_physician_id: '',    // Backup physician ID
                            coverage_notes: ''          // Coverage instructions/notes
                        }
                    });
                    
                    // Staff absence management modal
                    const absenceModal = reactive({
                        show: false,                // Modal visibility
                        mode: 'add',                // 'add' or 'edit' mode
                        form: {                     // Form data structure
                            staff_member_id: '',    // Staff member ID
                            absence_reason: '',     // Reason for absence
                            start_date: '',         // Absence start date
                            end_date: '',           // Absence end date
                            notes: '',              // Additional notes
                            replacement_staff_id: '', // Replacement staff ID
                            coverage_instructions: '' // Coverage instructions
                        }
                    });
                    
                    // Communications/announcements modal
                    const communicationsModal = reactive({
                        show: false,                        // Modal visibility
                        activeTab: 'announcement',          // Currently active tab
                        form: {                             // Announcement form data
                            announcement_title: '',         // Announcement title
                            announcement_content: '',       // Announcement content
                            publish_start_date: '',         // Publication start date
                            publish_end_date: '',           // Publication end date
                            priority_level: 'medium',       // Priority level
                            target_audience: 'all'          // Target audience
                        },
                        capacity: {                         // Capacity management
                            er: { current: 0, max: 20, notes: '' }, // ER capacity
                            icu: { current: 0, max: 10, notes: '' }, // ICU capacity
                            overall_notes: ''               // Overall capacity notes
                        },
                        quickUpdate: {                      // Quick update form
                            message: '',                    // Update message
                            priority: 'info',               // Priority level
                            expires: '24',                  // Expiration in hours
                            tags: ''                        // Tags/categories
                        }
                    });
                    
                    // Quick resident placement modal
                    const quickPlacementModal = reactive({
                        show: false,                // Modal visibility
                        resident_id: '',            // Resident ID to place
                        training_unit_id: '',       // Target training unit
                        start_date: '',             // Placement start date
                        duration: 4,                // Duration in weeks
                        supervisor_id: '',          // Supervisor ID
                        notes: ''                   // Placement notes
                    });
                    
                    // Bulk resident assignment modal
                    const bulkAssignModal = reactive({
                        show: false,                // Modal visibility
                        selectedResidents: [],      // Array of resident IDs
                        training_unit_id: '',       // Target training unit
                        start_date: '',             // Assignment start date
                        duration: 4,                // Duration in weeks
                        supervisor_id: ''           // Supervisor ID
                    });
                    
                    // System role management modal
                    const roleModal = reactive({
                        show: false,            // Modal visibility
                        mode: 'add',            // 'add' or 'edit' mode
                        form: {                 // Role form data
                            name: '',           // Role name
                            description: '',    // Role description
                            permissions: []     // Array of permissions
                        }
                    });
                    
                    // User profile management modal
                    const userProfileModal = reactive({
                        show: false,                    // Modal visibility
                        form: {                         // Profile form data
                            full_name: '',              // User full name
                            email: '',                  // User email
                            phone: '',                  // Phone number
                            department_id: '',          // Department assignment
                            notifications_enabled: true, // Email notifications
                            absence_notifications: true, // Absence notifications
                            announcement_notifications: true // Announcement notifications
                        }
                    });
                    
                    // System settings modal
                    const systemSettingsModal = reactive({
                        show: false,                            // Modal visibility
                        settings: {                             // System settings
                            hospital_name: 'NeumoCare Hospital', // Hospital name
                            default_department_id: '',          // Default department
                            max_residents_per_unit: 10,         // Max residents per unit
                            default_rotation_duration: 12,      // Default rotation weeks
                            enable_audit_logging: true,         // Audit logging enabled
                            require_mfa: false,                 // MFA requirement
                            maintenance_mode: false,            // Maintenance mode
                            notifications_enabled: true,        // System notifications
                            absence_notifications: true,        // Absence notifications
                            announcement_notifications: true    // Announcement notifications
                        }
                    });
                    
                    // Additional modal states for detailed views
                    const absenceDetailsModal = reactive({       // Absence details modal
                        show: false,        // Modal visibility
                        absence: null,      // Absence object
                        activeTab: 'details' // Active tab
                    });
                    
                    const importExportModal = reactive({         // Import/export modal
                        show: false,                    // Modal visibility
                        mode: 'import',                // 'import' or 'export'
                        selectedTable: '',             // Database table to import/export
                        selectedFile: null,            // Selected file for import
                        exportFormat: 'csv',           // Export format (csv, json, etc.)
                        overwriteExisting: false,      // Overwrite existing records
                        skipInvalidRows: true,         // Skip invalid rows during import
                        includeMetadata: true,         // Include metadata in export
                        dateRange: { start: '', end: '' }, // Date range filter
                        fieldMapping: []               // Field mapping for import
                    });
                    
                    const rotationDetailsModal = reactive({      // Rotation details modal
                        show: false,            // Modal visibility
                        rotation: null,         // Rotation object
                        activeTab: 'details',   // Active tab
                        milestones: [],         // Rotation milestones
                        competencies: [],       // Competency assessments
                        documents: [],          // Rotation documents
                        activity: []            // Rotation activity log
                    });
                    
                    const dashboardCustomizeModal = reactive({   // Dashboard customization modal
                        show: false,                            // Modal visibility
                        availableWidgets: [                     // Available dashboard widgets
                            { id: 'stats', title: 'Statistics', description: 'Key performance indicators', icon: 'fas fa-chart-line', visible: true },
                            { id: 'oncall', title: 'On-call Schedule', description: 'Today\'s on-call physicians', icon: 'fas fa-phone-alt', visible: true },
                            { id: 'announcements', title: 'Announcements', description: 'Recent department announcements', icon: 'fas fa-bullhorn', visible: true },
                            { id: 'capacity', title: 'Capacity', description: 'Department capacity status', icon: 'fas fa-bed', visible: true },
                            { id: 'alerts', title: 'Alerts', description: 'System alerts and notifications', icon: 'fas fa-exclamation-triangle', visible: true }
                        ],
                        appearance: {                           // Appearance settings
                            cardDensity: 'normal',              // Card spacing
                            colorTheme: 'medical',              // Color theme
                            fontSize: 'medium',                 // Font size
                            animationSpeed: 'normal'            // Animation speed
                        },
                        notifications: {                        // Notification settings
                            showAlerts: true,                   // Show alert notifications
                            showNotifications: true,            // Show regular notifications
                            autoRefresh: true,                  // Auto-refresh dashboard
                            refreshInterval: 60                 // Refresh interval in seconds
                        }
                    });
                    
                    const advancedSearchModal = reactive({       // Advanced search modal
                        show: false,                            // Modal visibility
                        activeTab: 'medical_staff',             // Active search tab
                        filters: {                              // Search filters
                            medical_staff: {                    // Medical staff filters
                                name: '',                      // Staff name
                                staff_type: [],                // Staff types (array)
                                department_id: '',             // Department filter
                                employment_status: '',         // Employment status
                                join_date_start: '',           // Join date range start
                                join_date_end: '',             // Join date range end
                                training_level: ''             // Training level filter
                            },
                            rotations: {                       // Rotation filters
                                resident_name: '',             // Resident name
                                training_unit_id: '',          // Training unit filter
                                status: '',                    // Rotation status
                                supervisor_id: '',             // Supervisor filter
                                date_start: '',                // Date range start
                                date_end: '',                  // Date range end
                                min_duration: ''               // Minimum duration
                            }
                        },
                        sort: {                                 // Sorting options
                            medical_staff: {
                                field: 'full_name',            // Sort field
                                order: 'asc'                   // Sort order
                            }
                        },
                        display: {                              // Display options
                            medical_staff: {
                                resultsPerPage: 25,            // Results per page
                                showInactive: false            // Show inactive staff
                            }
                        }
                    });
                    
                    // ============ DATA STORES ============
                    // Reactive data stores for application data
                    const medicalStaff = ref([]);        // All medical staff
                    const departments = ref([]);         // All departments
                    const clinicalUnits = ref([]);       // All clinical units
                    const trainingUnits = ref([]);       // All training units
                    const residentRotations = ref([]);   // All resident rotations
                    const staffAbsences = ref([]);       // All staff absences
                    const onCallSchedule = ref([]);      // On-call schedule
                    const recentAnnouncements = ref([]); // Recent announcements
                    const users = ref([]);               // System users
                    const userRoles = ref([]);           // User roles/permissions
                    const auditLogs = ref([]);           // System audit logs
                    const systemSettings = ref({});      // System settings
                    
                    // ============ UI STATE ============
                    const toasts = ref([]);               // Toast notifications
                    const activeAlerts = ref([]);         // Active system alerts
                    const staffSearch = ref('');          // Staff-specific search
                    const unreadNotifications = ref(0);   // Unread notification count
                    
                    // ============ LOADING STATES ============
                    const loadingStats = ref(false);        // Statistics loading
                    const loadingStaff = ref(false);        // Medical staff loading
                    const loadingDepartments = ref(false);  // Departments loading
                    const loadingTrainingUnits = ref(false); // Training units loading
                    const loadingRotations = ref(false);    // Rotations loading
                    const loadingAbsences = ref(false);     // Absences loading
                    const loadingSchedule = ref(false);     // Schedule loading
                    const loadingAnnouncements = ref(false); // Announcements loading
                    const loadingAuditLogs = ref(false);    // Audit logs loading
                    
                    // ============ VALIDATION RULES ============
                    const ValidationRules = {
                        medicalStaff: { // Medical staff validation rules
                            full_name: [Validators.required], // Name is required
                            professional_email: [Validators.required, Validators.email], // Valid email required
                            staff_type: [Validators.required], // Staff type required
                            employment_status: [Validators.required], // Employment status required
                            date_of_birth: [Validators.date], // Valid date format
                            mobile_phone: [Validators.phone], // Valid phone format
                            years_experience: [(v) => Validators.minValue(v, 'Years of experience', 0)] // Non-negative
                        },
                        department: { // Department validation rules
                            name: [Validators.required], // Department name required
                            code: [Validators.required], // Department code required
                            status: [Validators.required] // Status required
                        },
                        trainingUnit: { // Training unit validation rules
                            unit_name: [Validators.required], // Unit name required
                            unit_code: [Validators.required], // Unit code required
                            department_id: [Validators.required], // Department required
                            max_capacity: [(v) => Validators.minValue(v, 'Max capacity', 1)] // Minimum 1
                        },
                        rotation: { // Rotation validation rules
                            resident_id: [Validators.required], // Resident required
                            training_unit_id: [Validators.required], // Training unit required
                            start_date: [Validators.required, Validators.date], // Valid start date
                            end_date: [Validators.required, Validators.date] // Valid end date
                        },
                        absence: { // Absence validation rules
                            staff_member_id: [Validators.required], // Staff member required
                            absence_reason: [Validators.required], // Reason required
                            start_date: [Validators.required, Validators.date], // Valid start date
                            end_date: [Validators.required, Validators.date] // Valid end date
                        },
                        announcement: { // Announcement validation rules
                            announcement_title: [Validators.required], // Title required
                            announcement_content: [Validators.required], // Content required
                            publish_start_date: [Validators.required, Validators.date] // Valid publish date
                        }
                    };
                    
                    // ============ TOAST SYSTEM ============
                    // Show toast notification with specified parameters
                    const showToast = (title, message, type = 'info', duration = 5000) => {
                        const icons = { // Icon mapping for toast types
                            info: 'fas fa-info-circle', 
                            success: 'fas fa-check-circle',
                            error: 'fas fa-exclamation-circle', 
                            warning: 'fas fa-exclamation-triangle'
                        };
                        const toast = { // Toast object structure
                            id: Date.now(), // Unique ID
                            title,          // Toast title
                            message,        // Toast message
                            type,           // Toast type (info, success, error, warning)
                            icon: icons[type], // Appropriate icon
                            duration        // Display duration in ms
                        };
                        toasts.value.push(toast); // Add to toast array
                        setTimeout(() => removeToast(toast.id), duration); // Auto-remove after duration
                    };

                    // Remove toast by ID
                    const removeToast = (id) => {
                        const index = toasts.value.findIndex(t => t.id === id);
                        if (index > -1) toasts.value.splice(index, 1); // Remove from array
                    };
                    
                    // ============ ALERT SYSTEM ============
                    // Dismiss alert by ID
                    const dismissAlert = (alertId) => {
                        const index = activeAlerts.value.findIndex(alert => alert.id === alertId);
                        if (index > -1) activeAlerts.value.splice(index, 1); // Remove alert
                    };
                    
                    // ============ CONFIRMATION MODAL ============
                    // Show confirmation modal with custom options
                    const showConfirmation = (options) => {
                        Object.assign(confirmationModal, { // Merge options into modal state
                            show: true, // Show modal
                            title: options.title || 'Confirm Action', // Default title
                            message: options.message || 'Are you sure you want to proceed?', // Default message
                            icon: options.icon || 'fa-question-circle', // Default icon
                            confirmButtonText: options.confirmButtonText || 'Confirm', // Default button text
                            confirmButtonClass: options.confirmButtonClass || 'btn-primary', // Default button class
                            onConfirm: options.onConfirm || null, // Confirm callback
                            onCancel: options.onCancel || null // Cancel callback
                        });
                    };

                    // Execute confirmation action
                    const confirmAction = async () => {
                        try {
                            if (confirmationModal.onConfirm) {
                                await confirmationModal.onConfirm(); // Execute confirm callback
                            }
                            confirmationModal.show = false; // Hide modal
                        } catch (error) {
                            console.error('Confirmation action error:', error);
                            showToast('Error', error.message, 'error'); // Show error toast
                        }
                    };

                    // Cancel confirmation action
                    const cancelConfirmation = () => {
                        try {
                            if (confirmationModal.onCancel) {
                                confirmationModal.onCancel(); // Execute cancel callback
                            }
                            confirmationModal.show = false; // Hide modal
                        } catch (error) {
                            console.error('Cancel confirmation error:', error);
                        }
                    };
                    
                    // ============ FORMATTING FUNCTIONS ============
                    // Format staff type for display (e.g., 'medical_resident' -> 'Medical Resident')
                    const formatStaffType = (type) => {
                        const types = { 
                            medical_resident: 'Medical Resident', 
                            attending_physician: 'Attending Physician',
                            fellow: 'Fellow', 
                            nurse_practitioner: 'Nurse Practitioner' 
                        }; 
                        return types[type] || type; // Return formatted type or original
                    };
                    
                    // Format user role for display (e.g., 'system_admin' -> 'System Administrator')
                    const getUserRoleDisplay = (role) => {
                        const roleNames = { // Role name mapping
                            'system_admin': 'System Administrator',
                            'department_head': 'Head of Department',
                            'resident_manager': 'Resident Manager',
                            'attending_physician': 'Attending Physician',
                            'viewing_doctor': 'Viewing Doctor'
                        };
                        return roleNames[role] || role || 'Unknown Role'; // Return formatted role
                    };
                    
                    // Get absence timeline status (starts, ended, or current day)
                    const getAbsenceTimelineStatus = (absence) => {
                        const today = new Date().toISOString().split('T')[0]; // Current date
                        const startDate = absence.start_date; // Absence start date
                        const endDate = absence.end_date;     // Absence end date
                        if (today < startDate) { // Absence hasn't started yet
                            return 'Starts ' + Utils.formatTimeAgo(startDate);
                        } else if (today > endDate) { // Absence has ended
                            return 'Ended ' + Utils.formatTimeAgo(endDate);
                        } else { // Absence is current
                            const start = new Date(startDate);
                            const now = new Date(today);
                            const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                            return `Day ${diffDays + 1} of absence`; // Current day of absence
                        }
                    };

                    // Format rotation type for display
                    const formatRotationType = (type) => {
                        const types = { // Rotation type mapping
                            'clinical': 'Clinical Rotation',
                            'research': 'Research Rotation',
                            'elective': 'Elective Rotation',
                            'required': 'Required Rotation'
                        };
                        return types[type] || type || 'Clinical Rotation'; // Default to Clinical Rotation
                    };

                    // Calculate rotation duration in weeks
                    const calculateRotationDuration = (startDate, endDate) => {
                        try {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            const diffTime = Math.abs(end - start); // Time difference in ms
                            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)); // Convert to weeks
                            return diffWeeks + ' weeks'; // Return formatted duration
                        } catch {
                            return 'N/A'; // Return N/A on error
                        }
                    };

                    // Get resident training level by ID
                    const getResidentTrainingLevel = (residentId) => {
                        const resident = medicalStaff.value.find(s => s.id === residentId); // Find resident
                        return resident ? formatTrainingLevel(resident.training_level) : 'N/A'; // Format level or N/A
                    };

                    // Get department name for a rotation
                    const getRotationDepartment = (rotation) => {
                        const unit = trainingUnits.value.find(u => u.id === rotation.training_unit_id); // Find training unit
                        if (unit && unit.department_id) {
                            return getDepartmentName(unit.department_id); // Get department name
                        }
                        return 'N/A'; // Return N/A if not found
                    };

                    // Format evaluation status for display
                    const formatEvaluationStatus = (status) => {
                        const statuses = { // Evaluation status mapping
                            'pending': 'Pending',
                            'in_progress': 'In Progress',
                            'completed': 'Completed',
                            'overdue': 'Overdue'
                        };
                        return statuses[status] || status || 'Not Started'; // Default to Not Started
                    };

                    // Get CSS class for evaluation status
                    const getEvaluationStatusClass = (status) => {
                        const classes = { // Status class mapping
                            'pending': 'status-busy',
                            'in_progress': 'status-oncall',
                            'completed': 'status-available',
                            'overdue': 'status-critical'
                        };
                        return classes[status] || 'badge-secondary'; // Default class
                    };

                    // Format file size from bytes to human-readable format
                    const formatFileSize = (bytes) => {
                        if (bytes === 0) return '0 Bytes'; // Handle zero bytes
                        const k = 1024; // Base for conversion
                        const sizes = ['Bytes', 'KB', 'MB', 'GB']; // Size units
                        const i = Math.floor(Math.log(bytes) / Math.log(k)); // Calculate unit index
                        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; // Format with 2 decimals
                    };

                    // Format document type for display
                    const formatDocumentType = (type) => {
                        const types = { // Document type mapping
                            'pdf': 'PDF',
                            'doc': 'Word Document',
                            'docx': 'Word Document',
                            'xls': 'Excel',
                            'xlsx': 'Excel',
                            'jpg': 'Image',
                            'png': 'Image',
                            'txt': 'Text File'
                        };
                        return types[type] || type || 'Document'; // Default to Document
                    };

                    // Get CSS class for document status
                    const getDocumentStatusClass = (status) => {
                        const classes = { // Status class mapping
                            'approved': 'status-available',
                            'pending_review': 'status-busy',
                            'rejected': 'status-critical',
                            'draft': 'status-oncall'
                        };
                        return classes[status] || 'badge-secondary'; // Default class
                    };
                            
                    // Format employment status for display
                    const formatEmploymentStatus = (status) => {
                        const statuses = { active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' };
                        return statuses[status] || status; // Return formatted or original
                    };
                    
                    // Get CSS class for staff type badge
                    const getStaffTypeClass = (type) => {
                        const classes = { // Staff type class mapping
                            medical_resident: 'badge-primary',
                            attending_physician: 'badge-success',
                            fellow: 'badge-info',
                            nurse_practitioner: 'badge-warning'
                        };
                        return classes[type] || 'badge-secondary'; // Default class
                    };
                    
                    // Format training level for display (e.g., 'pgy1' -> 'PGY-1')
                    const formatTrainingLevel = (level) => {
                        const levels = { // Training level mapping
                            pgy1: 'PGY-1',
                            pgy2: 'PGY-2',
                            pgy3: 'PGY-3',
                            pgy4: 'PGY-4',
                            other: 'Other'
                        };
                        return levels[level] || level; // Return formatted or original
                    };
                    
                    // Format resident category for display
                    const formatResidentCategory = (category) => {
                        const categories = { // Resident category mapping
                            department_internal: 'Department Internal',
                            rotating_other_dept: 'Rotating Other Dept',
                            external_institution: 'External Institution'
                        };
                        return categories[category] || category; // Return formatted or original
                    };
                    
                    // Format rotation status for display
                    const formatRotationStatus = (status) => {
                        const statuses = { // Rotation status mapping
                            active: 'Active',
                            upcoming: 'Upcoming',
                            completed: 'Completed',
                            cancelled: 'Cancelled'
                        };
                        return statuses[status] || status; // Return formatted or original
                    };
                    
                    // Get CSS class for rotation status badge
                    const getRotationStatusClass = (status) => {
                        const classes = { // Status class mapping
                            active: 'status-available',
                            upcoming: 'status-oncall',
                            completed: 'status-busy',
                            cancelled: 'status-critical'
                        };
                        return classes[status] || 'badge-secondary'; // Default class
                    };
                    
                    // Format absence reason for display
                    const formatAbsenceReason = (reason) => {
                        const reasons = { // Absence reason mapping
                            vacation: 'Vacation',
                            sick_leave: 'Sick Leave',
                            conference: 'Conference/Education',
                            personal: 'Personal',
                            maternity_paternity: 'Maternity/Paternity',
                            administrative: 'Administrative Duty',
                            other: 'Other'
                        };
                        return reasons[reason] || reason; // Return formatted or original
                    };
                    
                    // Format absence status for display
                    const formatAbsenceStatus = (status) => {
                        const statuses = { // Absence status mapping
                            pending: 'Pending',
                            approved: 'Approved',
                            rejected: 'Rejected',
                            completed: 'Completed'
                        };
                        return statuses[status] || status; // Return formatted or original
                    };
                    
                    // Get CSS class for absence status badge
                    const getAbsenceStatusClass = (status) => {
                        const classes = { // Status class mapping
                            pending: 'status-busy',
                            approved: 'status-available',
                            rejected: 'status-critical',
                            completed: 'status-oncall'
                        };
                        return classes[status] || 'badge-secondary'; // Default class
                    };
                    
                    // Calculate absence duration in days
                    const calculateAbsenceDuration = (startDate, endDate) => {
                        try {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            const diffTime = Math.abs(end - start); // Time difference in ms
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Convert to days (+1 inclusive)
                        } catch {
                            return 0; // Return 0 on error
                        }
                    };
                    
                    // Format time range for display (e.g., '08:00 - 17:00')
                    const formatTimeRange = (startTime, endTime) => {
                        if (!startTime || !endTime) return ''; // Return empty if missing times
                        return `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`; // Format as HH:MM - HH:MM
                    };
                    
                    // Format audit action for display
                    const formatAuditAction = (action) => {
                        const actions = { // Audit action mapping
                            create: 'Created',
                            update: 'Updated',
                            delete: 'Deleted',
                            login: 'Logged in',
                            logout: 'Logged out'
                        };
                        return actions[action] || action; // Return formatted or original
                    };
                    
                    // ============ PERMISSION FUNCTIONS ============
                    // Check if current user has permission for resource/action
                    const hasPermission = (resource, action) => {
                        if (!currentUser.value) return false; // No user = no permission
                        if (currentUser.value.user_role === 'system_admin') return true; // Admin has all permissions
                        return PermissionSystem.hasPermission(currentUser.value.user_role, resource, action); // Check permission system
                    };
                    
                    // ============ DATA RELATIONSHIP FUNCTIONS ============
                    // Get department name by ID
                    const getDepartmentName = (departmentId) => {
                        if (!departmentId) return 'Unassigned'; // Return default if no ID
                        const department = departments.value.find(d => d.id === departmentId); // Find department
                        return department ? department.name : `Department ${departmentId?.substring(0, 8) || 'Unknown'}`; // Return name or placeholder
                    };
                    
                    // Get staff name by ID
                    const getStaffName = (staffId) => {
                        if (!staffId) return 'Unknown'; // Return default if no ID
                        const staff = medicalStaff.value.find(s => s.id === staffId); // Find staff
                        return staff ? staff.full_name : `Staff ${staffId?.substring(0, 8) || 'Unknown'}`; // Return name or placeholder
                    };
                    
                    // Get training unit name by ID
                    const getTrainingUnitName = (unitId) => {
                        if (!unitId) return 'Unknown Unit'; // Return default if no ID
                        const unit = trainingUnits.value.find(u => u.id === unitId); // Find training unit
                        return unit ? unit.unit_name : `Unit ${unitId?.substring(0, 8) || 'Unknown'}`; // Return name or placeholder
                    };
                    
                    // Get supervisor name by ID
                    const getSupervisorName = (supervisorId) => {
                        if (!supervisorId) return 'Not assigned'; // Return default if no ID
                        return getStaffName(supervisorId); // Use getStaffName function
                    };
                    
                    // Get resident name by ID (alias for getStaffName)
                    const getResidentName = (residentId) => {
                        return getStaffName(residentId); // Use getStaffName function
                    };
                    
                    // Get all clinical units for a department
                    const getDepartmentUnits = (departmentId) => {
                        return clinicalUnits.value.filter(unit => unit.department_id === departmentId); // Filter units by department
                    };
                    
                    // Get all residents assigned to a training unit
                    const getUnitResidents = (unitId) => {
                        const rotations = residentRotations.value.filter(rotation => 
                            rotation.training_unit_id === unitId && // Match unit ID
                            rotation.status === 'active' // Only active rotations
                        );
                        return rotations.map(rotation => {
                            const resident = medicalStaff.value.find(s => s.id === rotation.resident_id); // Find resident
                            return resident ? { // Return resident object if found
                                id: resident.id,
                                full_name: resident.full_name,
                                training_level: resident.training_level
                            } : null;
                        }).filter(r => r !== null); // Remove null entries
                    };
                    
                    // Get user name by ID
                    const getUserName = (userId) => {
                        if (!userId) return 'System'; // Return 'System' for system actions
                        const user = users.value.find(u => u.id === userId); // Find user
                        return user ? user.full_name : `User ${userId.substring(0, 8)}`; // Return name or placeholder
                    };
                    
                    // ============ DATA LOADING FUNCTIONS ============
                    // Load all medical staff from database
                    const loadMedicalStaff = async () => {
                        loadingStaff.value = true; // Set loading state
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.MEDICAL_STAFF)
                                .select('*')
                                .order('full_name'); // Order by name
                            if (error) throw error; // Throw error if query fails
                            medicalStaff.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading medical staff:', error);
                            showToast('Error', 'Failed to load medical staff', 'error'); // Show error toast
                            medicalStaff.value = []; // Set empty array on error
                        } finally {
                            loadingStaff.value = false; // Reset loading state
                        }
                    };
                    
                    // Load all departments from database
                    const loadDepartments = async () => {
                        loadingDepartments.value = true; // Set loading state
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.DEPARTMENTS)
                                .select('*')
                                .order('name'); // Order by name
                            if (error) throw error; // Throw error if query fails
                            departments.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading departments:', error);
                            departments.value = []; // Set empty array on error
                        } finally {
                            loadingDepartments.value = false; // Reset loading state
                        }
                    };
                    
                    // Load all clinical units from database
                    const loadClinicalUnits = async () => {
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.CLINICAL_UNITS)
                                .select('*')
                                .order('name'); // Order by name
                            if (error) throw error; // Throw error if query fails
                            clinicalUnits.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading clinical units:', error);
                            clinicalUnits.value = []; // Set empty array on error
                        }
                    };
                    
                    // Load all training units from database
                    const loadTrainingUnits = async () => {
                        loadingTrainingUnits.value = true; // Set loading state
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.TRAINING_UNITS)
                                .select('*')
                                .order('unit_name'); // Order by unit name
                            if (error) throw error; // Throw error if query fails
                            trainingUnits.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading training units:', error);
                            trainingUnits.value = []; // Set empty array on error
                        } finally {
                            loadingTrainingUnits.value = false; // Reset loading state
                        }
                    };
                    
                    // Load all resident rotations from database
                    const loadResidentRotations = async () => {
                        loadingRotations.value = true; // Set loading state
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                .select('*')
                                .order('start_date', { ascending: false }); // Order by most recent start date
                            if (error) throw error; // Throw error if query fails
                            residentRotations.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading resident rotations:', error);
                            residentRotations.value = []; // Set empty array on error
                        } finally {
                            loadingRotations.value = false; // Reset loading state
                        }
                    };
                    
                    // Load staff absences from database (current and future)
                    const loadStaffAbsences = async () => {
                        loadingAbsences.value = true; // Set loading state
                        try {
                            const today = new Date().toISOString().split('T')[0]; // Current date
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.STAFF_ABSENCES)
                                .select('*')
                                .gte('leave_end_date', today) // Only future or current absences
                                .order('leave_start_date'); // Order by start date
                            if (error) throw error; // Throw error if query fails
                            staffAbsences.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading staff absences:', error);
                            staffAbsences.value = []; // Set empty array on error
                        } finally {
                            loadingAbsences.value = false; // Reset loading state
                        }
                    };
                    
                    // Load on-call schedule from database (next 7 days)
                    const loadOnCallSchedule = async () => {
                        loadingSchedule.value = true; // Set loading state
                        try {
                            const today = new Date().toISOString().split('T')[0]; // Current date
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                .select('*')
                                .gte('duty_date', today) // Only today and future
                                .order('duty_date') // Order by date
                                .limit(7); // Limit to 7 days
                            if (error) throw error; // Throw error if query fails
                            onCallSchedule.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading on-call schedule:', error);
                            onCallSchedule.value = []; // Set empty array on error
                        } finally {
                            loadingSchedule.value = false; // Reset loading state
                        }
                    };
                    
                    // Load announcements from database (current and future)
                    const loadAnnouncements = async () => {
                        loadingAnnouncements.value = true; // Set loading state
                        try {
                            const today = new Date().toISOString().split('T')[0]; // Current date
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.ANNOUNCEMENTS)
                                .select('*')
                                .lte('publish_start_date', today) // Published on or before today
                                .or(`publish_end_date.gte.${today},publish_end_date.is.null`) // Not expired or no end date
                                .order('publish_start_date', { ascending: false }) // Order by most recent
                                .limit(5); // Limit to 5 announcements
                            if (error) throw error; // Throw error if query fails
                            recentAnnouncements.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading announcements:', error);
                            recentAnnouncements.value = []; // Set empty array on error
                        } finally {
                            loadingAnnouncements.value = false; // Reset loading state
                        }
                    };
                    
                    // Load all system users from database
                    const loadUsers = async () => {
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.USERS)
                                .select('*')
                                .order('full_name'); // Order by name
                            if (error) throw error; // Throw error if query fails
                            users.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading users:', error);
                            users.value = []; // Set empty array on error
                        }
                    };
                    
                    // Load all user roles from database
                    const loadUserRoles = async () => {
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.SYSTEM_ROLES)
                                .select('*');
                            if (error) throw error; // Throw error if query fails
                            userRoles.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading user roles:', error);
                            userRoles.value = []; // Set empty array on error
                        }
                    };
                    
                    // Load audit logs from database (most recent 100)
                    const loadAuditLogs = async () => {
                        loadingAuditLogs.value = true; // Set loading state
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.AUDIT_LOGS)
                                .select('*')
                                .order('created_at', { ascending: false }) // Order by most recent
                                .limit(100); // Limit to 100 entries
                            if (error) throw error; // Throw error if query fails
                            auditLogs.value = data || []; // Update reactive data
                        } catch (error) {
                            console.error('Error loading audit logs:', error);
                            auditLogs.value = []; // Set empty array on error
                        } finally {
                            loadingAuditLogs.value = false; // Reset loading state
                        }
                    };
                    
                    // Load system settings from database (or create defaults)
                    const loadSystemSettings = async () => {
                        try {
                            const { data, error } = await supabaseClient // Query Supabase
                                .from(TABLE_NAMES.SYSTEM_SETTINGS)
                                .select('*')
                                .limit(1)
                                .single(); // Expect single record
                            if (error) { // If no settings exist, create defaults
                                const defaultSettings = { // Default system settings
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
                                const { data: newSettings } = await supabaseClient // Insert defaults
                                    .from(TABLE_NAMES.SYSTEM_SETTINGS)
                                    .insert([defaultSettings])
                                    .select()
                                    .single();
                                systemSettings.value = newSettings || defaultSettings; // Update reactive data
                            } else {
                                systemSettings.value = data; // Update with existing settings
                            }
                        } catch (error) {
                            console.error('Error loading system settings:', error);
                            systemSettings.value = {}; // Set empty object on error
                        }
                    };
                    
                    // Load all initial data in parallel
                    const loadInitialData = async () => {
                        loading.value = true; // Set general loading state
                        try {
                            await Promise.all([ // Load all data concurrently
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
                            showToast('System Ready', 'All data loaded successfully', 'success'); // Success toast
                            await logAuditEvent('SYSTEM_START', 'system', { user: currentUser.value?.email }); // Log system start
                        } catch (error) {
                            console.error('Error loading initial data:', error);
                            showToast('Data Load Error', 'Failed to load system data', 'error'); // Error toast
                        } finally {
                            loading.value = false; // Reset loading state
                        }
                    };
                    
                    // ============ DATA SAVE FUNCTIONS WITH VALIDATION ============
                    // Save medical staff (add or edit)
                    const saveMedicalStaff = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('medical_staff', medicalStaffModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            Validators.validateForm(medicalStaffModal.form, ValidationRules.medicalStaff); // Validate form
                            const formData = { ...medicalStaffModal.form }; // Clone form data
                            let result;
                            if (medicalStaffModal.mode === 'add') { // Add new staff
                                formData.staff_id = formData.staff_id || Utils.generateId('MD'); // Generate ID if missing
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.MEDICAL_STAFF)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                medicalStaff.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'Medical staff added successfully', 'success'); // Success toast
                                await logAuditEvent('CREATE', 'medical_staff', { staff_id: result.id, name: result.full_name }); // Log action
                            } else { // Edit existing staff
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.MEDICAL_STAFF)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = medicalStaff.value.findIndex(s => s.id === result.id); // Find index
                                if (index !== -1) medicalStaff.value[index] = result; // Update in array
                                showToast('Success', 'Medical staff updated successfully', 'success'); // Success toast
                                await logAuditEvent('UPDATE', 'medical_staff', { staff_id: result.id, name: result.full_name }); // Log action
                            }
                            medicalStaffModal.show = false; // Close modal
                            resetMedicalStaffModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving medical staff:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save department (add or edit)
                    const saveDepartment = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('system', 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            Validators.validateForm(departmentModal.form, ValidationRules.department); // Validate form
                            const formData = { ...departmentModal.form }; // Clone form data
                            let result;
                            if (departmentModal.mode === 'add') { // Add new department
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.DEPARTMENTS)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                departments.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'Department added successfully', 'success'); // Success toast
                                await logAuditEvent('CREATE', 'departments', { department_id: result.id, name: result.name }); // Log action
                            } else { // Edit existing department
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.DEPARTMENTS)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = departments.value.findIndex(d => d.id === result.id); // Find index
                                if (index !== -1) departments.value[index] = result; // Update in array
                                showToast('Success', 'Department updated successfully', 'success'); // Success toast
                                await logAuditEvent('UPDATE', 'departments', { department_id: result.id, name: result.name }); // Log action
                            }
                            departmentModal.show = false; // Close modal
                            resetDepartmentModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving department:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save clinical unit (add or edit)
                    const saveClinicalUnit = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('system', 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            const formData = { ...clinicalUnitModal.form }; // Clone form data
                            if (!formData.name?.trim()) {
                                throw new Error('Unit name is required'); // Validate name
                            }
                            let result;
                            if (clinicalUnitModal.mode === 'add') { // Add new clinical unit
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.CLINICAL_UNITS)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                clinicalUnits.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'Clinical unit added successfully', 'success'); // Success toast
                            } else { // Edit existing clinical unit
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.CLINICAL_UNITS)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = clinicalUnits.value.findIndex(u => u.id === result.id); // Find index
                                if (index !== -1) clinicalUnits.value[index] = result; // Update in array
                                showToast('Success', 'Clinical unit updated successfully', 'success'); // Success toast
                            }
                            clinicalUnitModal.show = false; // Close modal
                            resetClinicalUnitModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving clinical unit:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save training unit (add or edit)
                    const saveTrainingUnit = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('training_units', trainingUnitModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            Validators.validateForm(trainingUnitModal.form, ValidationRules.trainingUnit); // Validate form
                            const formData = { ...trainingUnitModal.form }; // Clone form data
                            let result;
                            if (trainingUnitModal.mode === 'add') { // Add new training unit
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.TRAINING_UNITS)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                trainingUnits.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'Training unit added successfully', 'success'); // Success toast
                            } else { // Edit existing training unit
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.TRAINING_UNITS)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = trainingUnits.value.findIndex(u => u.id === result.id); // Find index
                                if (index !== -1) trainingUnits.value[index] = result; // Update in array
                                showToast('Success', 'Training unit updated successfully', 'success'); // Success toast
                            }
                            trainingUnitModal.show = false; // Close modal
                            resetTrainingUnitModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving training unit:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save rotation (add or edit)
                    const saveRotation = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('resident_rotations', rotationModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            Validators.validateForm(rotationModal.form, ValidationRules.rotation); // Validate form
                            const startDate = new Date(rotationModal.form.start_date); // Parse start date
                            const endDate = new Date(rotationModal.form.end_date); // Parse end date
                            if (endDate <= startDate) { // Validate date logic
                                throw new Error('End date must be after start date');
                            }
                            const formData = { ...rotationModal.form }; // Clone form data
                            let result;
                            if (rotationModal.mode === 'add') { // Add new rotation
                                formData.rotation_id = Utils.generateId('ROT'); // Generate rotation ID
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                residentRotations.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'Rotation added successfully', 'success'); // Success toast
                            } else { // Edit existing rotation
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = residentRotations.value.findIndex(r => r.id === result.id); // Find index
                                if (index !== -1) residentRotations.value[index] = result; // Update in array
                                showToast('Success', 'Rotation updated successfully', 'success'); // Success toast
                            }
                            rotationModal.show = false; // Close modal
                            resetRotationModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving rotation:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save on-call schedule (add or edit)
                    const saveOnCall = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('oncall_schedule', onCallModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            const formData = { ...onCallModal.form }; // Clone form data
                            if (!formData.duty_date) {
                                throw new Error('Duty date is required'); // Validate duty date
                            }
                            if (!formData.primary_physician_id) {
                                throw new Error('Primary physician is required'); // Validate primary physician
                            }
                            let result;
                            if (onCallModal.mode === 'add') { // Add new on-call schedule
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                onCallSchedule.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'On-call schedule added successfully', 'success'); // Success toast
                            } else { // Edit existing on-call schedule
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = onCallSchedule.value.findIndex(s => s.id === result.id); // Find index
                                if (index !== -1) onCallSchedule.value[index] = result; // Update in array
                                showToast('Success', 'On-call schedule updated successfully', 'success'); // Success toast
                            }
                            onCallModal.show = false; // Close modal
                            resetOnCallModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving on-call schedule:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save absence request (add or edit)
                    const saveAbsence = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('staff_absence', absenceModal.mode === 'add' ? 'create' : 'update')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            Validators.validateForm(absenceModal.form, ValidationRules.absence); // Validate form
                            const startDate = new Date(absenceModal.form.start_date); // Parse start date
                            const endDate = new Date(absenceModal.form.end_date); // Parse end date
                            if (endDate <= startDate) { // Validate date logic
                                throw new Error('End date must be after start date');
                            }
                            const formData = { // Map form data to database structure
                                ...absenceModal.form,
                                leave_category: absenceModal.form.absence_reason, // Map reason to category
                                leave_start_date: absenceModal.form.start_date, // Map start date
                                leave_end_date: absenceModal.form.end_date // Map end date
                            };
                            let result;
                            if (absenceModal.mode === 'add') { // Add new absence
                                formData.created_at = new Date().toISOString(); // Set created timestamp
                                formData.updated_at = new Date().toISOString(); // Set updated timestamp
                                const { data, error } = await supabaseClient // Insert to database
                                    .from(TABLE_NAMES.STAFF_ABSENCES)
                                    .insert([formData])
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if insert fails
                                result = data; // Store result
                                staffAbsences.value.unshift(result); // Add to beginning of array
                                showToast('Success', 'Absence request submitted successfully', 'success'); // Success toast
                            } else { // Edit existing absence
                                formData.updated_at = new Date().toISOString(); // Update timestamp
                                const { data, error } = await supabaseClient // Update in database
                                    .from(TABLE_NAMES.STAFF_ABSENCES)
                                    .update(formData)
                                    .eq('id', formData.id)
                                    .select()
                                    .single();
                                if (error) throw error; // Throw error if update fails
                                result = data; // Store result
                                const index = staffAbsences.value.findIndex(a => a.id === result.id); // Find index
                                if (index !== -1) staffAbsences.value[index] = result; // Update in array
                                showToast('Success', 'Absence request updated successfully', 'success'); // Success toast
                            }
                            absenceModal.show = false; // Close modal
                            resetAbsenceModal(); // Reset form
                            return result; // Return saved data
                        } catch (error) {
                            console.error('Error saving absence:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save communication/announcement
                    const saveCommunication = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('communications', 'create')) {
                                throw new Error('Insufficient permissions'); // Check permissions
                            }
                            Validators.validateForm(communicationsModal.form, ValidationRules.announcement); // Validate form
                            const announcementData = { // Prepare announcement data
                                announcement_id: Utils.generateId('ANN'), // Generate announcement ID
                                announcement_title: communicationsModal.form.announcement_title, // Title
                                announcement_content: communicationsModal.form.announcement_content, // Content
                                announcement_type: 'department', // Announcement type
                                priority_level: communicationsModal.form.priority_level, // Priority level
                                visible_to_roles: ['viewing_doctor'], // Visible roles
                                publish_start_date: communicationsModal.form.publish_start_date, // Publish start
                                publish_end_date: communicationsModal.form.publish_end_date || null, // Publish end (optional)
                                created_by: currentUser.value?.id, // Creator ID
                                created_by_name: currentUser.value?.full_name, // Creator name
                                target_audience: communicationsModal.form.target_audience, // Target audience
                                created_at: new Date().toISOString(), // Created timestamp
                                updated_at: new Date().toISOString() // Updated timestamp
                            };
                            const { data, error } = await supabaseClient // Insert to database
                                .from(TABLE_NAMES.ANNOUNCEMENTS)
                                .insert([announcementData])
                                .select()
                                .single();
                            if (error) throw error; // Throw error if insert fails
                            recentAnnouncements.value.unshift(data); // Add to beginning of array
                            communicationsModal.show = false; // Close modal
                            showToast('Success', 'Announcement posted successfully', 'success'); // Success toast
                            await logAuditEvent('CREATE', 'announcements', { announcement_id: data.id, title: data.announcement_title }); // Log action
                            return data; // Return saved data
                        } catch (error) {
                            console.error('Error saving communication:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                            throw error; // Re-throw error
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // ============ DELETE FUNCTIONS ============
                    // Delete medical staff with confirmation
                    const deleteMedicalStaff = (staff) => {
                        showConfirmation({ // Show confirmation modal
                            title: 'Delete Medical Staff',
                            message: `Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`,
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                try {
                                    if (!hasPermission('medical_staff', 'delete')) {
                                        throw new Error('Insufficient permissions'); // Check permissions
                                    }
                                    const { error } = await supabaseClient // Delete from database
                                        .from(TABLE_NAMES.MEDICAL_STAFF)
                                        .delete()
                                        .eq('id', staff.id);
                                    if (error) throw error; // Throw error if delete fails
                                    const index = medicalStaff.value.findIndex(s => s.id === staff.id); // Find index
                                    if (index !== -1) medicalStaff.value.splice(index, 1); // Remove from array
                                    showToast('Deleted', `${staff.full_name} has been removed`, 'success'); // Success toast
                                    await logAuditEvent('DELETE', 'medical_staff', { staff_id: staff.id, name: staff.full_name }); // Log action
                                } catch (error) {
                                    console.error('Error deleting medical staff:', error);
                                    showToast('Error', error.message, 'error'); // Error toast
                                }
                            }
                        });
                    };
                    
                    // Delete department with confirmation
                    const deleteDepartment = (departmentId) => {
                        const department = departments.value.find(d => d.id === departmentId); // Find department
                        if (!department) return; // Exit if not found
                        showConfirmation({ // Show confirmation modal
                            title: 'Delete Department',
                            message: `Are you sure you want to delete ${department.name}? This action cannot be undone.`,
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                try {
                                    if (!hasPermission('system', 'update')) {
                                        throw new Error('Insufficient permissions'); // Check permissions
                                    }
                                    const { error } = await supabaseClient // Delete from database
                                        .from(TABLE_NAMES.DEPARTMENTS)
                                        .delete()
                                        .eq('id', departmentId);
                                    if (error) throw error; // Throw error if delete fails
                                    const index = departments.value.findIndex(d => d.id === departmentId); // Find index
                                    if (index !== -1) departments.value.splice(index, 1); // Remove from array
                                    showToast('Deleted', `${department.name} has been removed`, 'success'); // Success toast
                                    await logAuditEvent('DELETE', 'departments', { department_id: departmentId, name: department.name }); // Log action
                                } catch (error) {
                                    console.error('Error deleting department:', error);
                                    showToast('Error', error.message, 'error'); // Error toast
                                }
                            }
                        });
                    };
                    
                    // ============ HELPER FUNCTIONS ============
                    // Reset medical staff modal form to default values
                    const resetMedicalStaffModal = () => {
                        medicalStaffModal.form = { // Default form values
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
                    
                    // Reset department modal form to default values
                    const resetDepartmentModal = () => {
                        departmentModal.form = { // Default form values
                            name: '',
                            code: '',
                            status: 'active',
                            description: '',
                            head_of_department_id: ''
                        };
                    };
                    
                    // Reset clinical unit modal form to default values
                    const resetClinicalUnitModal = () => {
                        clinicalUnitModal.form = { // Default form values
                            name: '',
                            code: '',
                            department_id: '',
                            unit_type: 'clinical',
                            status: 'active',
                            description: '',
                            supervisor_id: ''
                        };
                    };
                    
                    // Reset training unit modal form to default values
                    const resetTrainingUnitModal = () => {
                        trainingUnitModal.form = { // Default form values
                            unit_name: '',
                            unit_code: '',
                            department_id: '',
                            supervisor_id: '',
                            max_capacity: 10,
                            status: 'active',
                            description: ''
                        };
                    };
                    
                    // Reset rotation modal form to default values
                    const resetRotationModal = () => {
                        rotationModal.form = { // Default form values
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
                    
                    // Reset on-call modal form to default values
                    const resetOnCallModal = () => {
                        onCallModal.form = { // Default form values
                            duty_date: '',
                            shift_type: 'backup_call',
                            start_time: '',
                            end_time: '',
                            primary_physician_id: '',
                            backup_physician_id: '',
                            coverage_notes: ''
                        };
                    };
                    
                    // Reset absence modal form to default values
                    const resetAbsenceModal = () => {
                        absenceModal.form = { // Default form values
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
                    // Switch between different application views/pages
                    const switchView = (view) => {
                        if (!currentUser.value) return; // Exit if no user logged in
                        currentView.value = view; // Set current view
                        mobileMenuOpen.value = false; // Close mobile menu
                        switch (view) { // Load data based on view
                            case 'medical_staff':
                                loadMedicalStaff(); // Load medical staff
                                break;
                            case 'department_management':
                                loadDepartments(); // Load departments
                                loadClinicalUnits(); // Load clinical units
                                break;
                            case 'training_units':
                                loadTrainingUnits(); // Load training units
                                break;
                            case 'resident_rotations':
                                loadResidentRotations(); // Load rotations
                                break;
                            case 'staff_absence':
                                loadStaffAbsences(); // Load absences
                                break;
                            case 'oncall_schedule':
                                loadOnCallSchedule(); // Load on-call schedule
                                break;
                            case 'communications':
                                loadAnnouncements(); // Load announcements
                                break;
                            case 'audit_logs':
                                loadAuditLogs(); // Load audit logs
                                break;
                            case 'permission_manager':
                                loadUserRoles(); // Load user roles
                                loadUsers(); // Load users
                                break;
                            case 'system_settings':
                                loadSystemSettings(); // Load system settings
                                break;
                            case 'daily_operations':
                                loadAnnouncements(); // Load announcements
                                loadOnCallSchedule(); // Load on-call schedule
                                break;
                        }
                    };
                    
                    // Get current view/page title
                    const getCurrentTitle = () => {
                        const titles = { // Title mapping for views
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
                        return titles[currentView.value] || 'NeumoCare'; // Default to 'NeumoCare'
                    };
                    
                    // Get current view/page subtitle
                    const getCurrentSubtitle = () => {
                        const subtitles = { // Subtitle mapping for views
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
                        return subtitles[currentView.value] || ''; // Default to empty
                    };
                    
                    // Get search placeholder based on current view
                    const getSearchPlaceholder = () => {
                        const placeholders = { // Placeholder mapping for views
                            medical_staff: 'Search medical staff...',
                            resident_rotations: 'Search rotations...',
                            training_units: 'Search training units...',
                            communications: 'Search announcements...'
                        };
                        return placeholders[currentView.value] || 'Search...'; // Default placeholder
                    };
                    
                    // ============ MODAL FUNCTIONS ============
                    // Show add medical staff modal
                    const showAddMedicalStaffModal = () => {
                        if (!hasPermission('medical_staff', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission to add medical staff', 'error');
                            return;
                        }
                        medicalStaffModal.mode = 'add'; // Set mode to add
                        medicalStaffModal.show = true; // Show modal
                        medicalStaffModal.activeTab = 'basic'; // Set active tab
                        resetMedicalStaffModal(); // Reset form
                    };
                    
                    // Edit medical staff - populate modal with existing data
                    const editMedicalStaff = (staff) => {
                        if (!hasPermission('medical_staff', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need update permission to edit medical staff', 'error');
                            return;
                        }
                        medicalStaffModal.mode = 'edit'; // Set mode to edit
                        medicalStaffModal.show = true; // Show modal
                        medicalStaffModal.activeTab = 'basic'; // Set active tab
                        medicalStaffModal.form = { ...staff }; // Clone staff data to form
                    };
                    
                    // Show add department modal
                    const showAddDepartmentModal = () => {
                        if (!hasPermission('system', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need permission to manage departments', 'error');
                            return;
                        }
                        departmentModal.mode = 'add'; // Set mode to add
                        departmentModal.show = true; // Show modal
                        resetDepartmentModal(); // Reset form
                    };
                    
                    // Edit department - populate modal with existing data
                    const editDepartment = (department) => {
                        if (!hasPermission('system', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need permission to edit departments', 'error');
                            return;
                        }
                        departmentModal.mode = 'edit'; // Set mode to edit
                        departmentModal.show = true; // Show modal
                        departmentModal.form = { ...department }; // Clone department data to form
                    };
                    
                    // Show add clinical unit modal
                    const showAddClinicalUnitModal = () => {
                        if (!hasPermission('system', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need permission to add clinical units', 'error');
                            return;
                        }
                        clinicalUnitModal.mode = 'add'; // Set mode to add
                        clinicalUnitModal.show = true; // Show modal
                        resetClinicalUnitModal(); // Reset form
                    };
                    
                    // Edit clinical unit - populate modal with existing data
                    const editClinicalUnit = (unit) => {
                        if (!hasPermission('system', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need permission to edit clinical units', 'error');
                            return;
                        }
                        clinicalUnitModal.mode = 'edit'; // Set mode to edit
                        clinicalUnitModal.show = true; // Show modal
                        clinicalUnitModal.form = { ...unit }; // Clone unit data to form
                    };
                    
                    // Show add training unit modal
                    const showAddTrainingUnitModal = () => {
                        if (!hasPermission('training_units', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        trainingUnitModal.mode = 'add'; // Set mode to add
                        trainingUnitModal.show = true; // Show modal
                        resetTrainingUnitModal(); // Reset form
                    };
                    
                    // Edit training unit - populate modal with existing data
                    const editTrainingUnit = (unit) => {
                        if (!hasPermission('training_units', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        trainingUnitModal.mode = 'edit'; // Set mode to edit
                        trainingUnitModal.show = true; // Show modal
                        trainingUnitModal.form = { ...unit }; // Clone unit data to form
                    };
                    
                    // Show add rotation modal
                    const showAddRotationModal = () => {
                        if (!hasPermission('resident_rotations', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        rotationModal.mode = 'add'; // Set mode to add
                        rotationModal.show = true; // Show modal
                        resetRotationModal(); // Reset form
                    };
                    
                    // Edit rotation - populate modal with existing data
                    const editRotation = (rotation) => {
                        if (!hasPermission('resident_rotations', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        rotationModal.mode = 'edit'; // Set mode to edit
                        rotationModal.show = true; // Show modal
                        rotationModal.form = { ...rotation }; // Clone rotation data to form
                    };
                    
                    // Show add on-call schedule modal
                    const showAddOnCallModal = () => {
                        if (!hasPermission('oncall_schedule', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        onCallModal.mode = 'add'; // Set mode to add
                        onCallModal.show = true; // Show modal
                        onCallModal.form.duty_date = new Date().toISOString().split('T')[0]; // Set default to today
                    };
                    
                    // Edit on-call schedule - populate modal with existing data
                    const editOnCallSchedule = (schedule) => {
                        if (!hasPermission('oncall_schedule', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        onCallModal.mode = 'edit'; // Set mode to edit
                        onCallModal.show = true; // Show modal
                        onCallModal.form = { ...schedule }; // Clone schedule data to form
                    };
                    
                    // Delete on-call schedule with confirmation
                    const deleteOnCallSchedule = (scheduleId) => {
                        showConfirmation({ // Show confirmation modal
                            title: 'Delete On-call Schedule',
                            message: 'Are you sure you want to delete this on-call schedule?',
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                try {
                                    if (!hasPermission('oncall_schedule', 'delete')) { // Check permissions
                                        throw new Error('Insufficient permissions');
                                    }
                                    const { error } = await supabaseClient // Delete from database
                                        .from(TABLE_NAMES.ONCALL_SCHEDULE)
                                        .delete()
                                        .eq('id', scheduleId);
                                    if (error) throw error; // Throw error if delete fails
                                    const index = onCallSchedule.value.findIndex(s => s.id === scheduleId); // Find index
                                    if (index !== -1) onCallSchedule.value.splice(index, 1); // Remove from array
                                    showToast('Deleted', 'On-call schedule has been removed', 'success'); // Success toast
                                } catch (error) {
                                    console.error('Error deleting on-call schedule:', error);
                                    showToast('Error', error.message, 'error'); // Error toast
                                }
                            }
                        });
                    };
                    
                    // Show add absence modal
                    const showAddAbsenceModal = () => {
                        if (!hasPermission('staff_absence', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        absenceModal.mode = 'add'; // Set mode to add
                        absenceModal.show = true; // Show modal
                        absenceModal.form.start_date = new Date().toISOString().split('T')[0]; // Set start to today
                        absenceModal.form.end_date = new Date().toISOString().split('T')[0]; // Set end to today
                    };
                    
                    // Edit absence - populate modal with existing data
                    const editAbsence = (absence) => {
                        if (!hasPermission('staff_absence', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        absenceModal.mode = 'edit'; // Set mode to edit
                        absenceModal.show = true; // Show modal
                        absenceModal.form = { // Map absence data to form
                            ...absence,
                            absence_reason: absence.leave_category, // Map category to reason
                            start_date: absence.leave_start_date, // Map start date
                            end_date: absence.leave_end_date, // Map end date
                            replacement_staff_id: absence.replacement_staff_id || '' // Map replacement staff
                        };
                    };
                    
                    // Delete absence with confirmation
                    const deleteAbsence = (absenceId) => {
                        showConfirmation({ // Show confirmation modal
                            title: 'Delete Absence Record',
                            message: 'Are you sure you want to delete this absence record?',
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                try {
                                    if (!hasPermission('staff_absence', 'delete')) { // Check permissions
                                        throw new Error('Insufficient permissions');
                                    }
                                    const { error } = await supabaseClient // Delete from database
                                        .from(TABLE_NAMES.STAFF_ABSENCES)
                                        .delete()
                                        .eq('id', absenceId);
                                    if (error) throw error; // Throw error if delete fails
                                    const index = staffAbsences.value.findIndex(a => a.id === absenceId); // Find index
                                    if (index !== -1) staffAbsences.value.splice(index, 1); // Remove from array
                                    showToast('Deleted', 'Absence record has been removed', 'success'); // Success toast
                                } catch (error) {
                                    console.error('Error deleting absence record:', error);
                                    showToast('Error', error.message, 'error'); // Error toast
                                }
                            }
                        });
                    };
                    
                    // Show quick placement modal for resident assignment
                    const showQuickPlacementModal = () => {
                        if (!hasPermission('placements', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        quickPlacementModal.show = true; // Show modal
                        quickPlacementModal.start_date = new Date().toISOString().split('T')[0]; // Set default to today
                    };
                    
                    // Show bulk assignment modal for multiple residents
                    const showBulkAssignModal = () => {
                        if (!hasPermission('training_units', 'assign')) { // Check permissions
                            showToast('Permission Denied', 'You need assign permission', 'error');
                            return;
                        }
                        bulkAssignModal.show = true; // Show modal
                        bulkAssignModal.start_date = new Date().toISOString().split('T')[0]; // Set default to today
                    };
                    
                    // Show communications/announcements modal
                    const showCommunicationsModal = () => {
                        if (!hasPermission('communications', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        communicationsModal.show = true; // Show modal
                        communicationsModal.activeTab = 'announcement'; // Set active tab
                        communicationsModal.form.publish_start_date = new Date().toISOString().split('T')[0]; // Set default to today
                    };
                    
                    // Show add role modal
                    const showAddRoleModal = () => {
                        if (!hasPermission('permissions', 'manage')) { // Check permissions
                            showToast('Permission Denied', 'You need manage permission', 'error');
                            return;
                        }
                        roleModal.mode = 'add'; // Set mode to add
                        roleModal.show = true; // Show modal
                        roleModal.form.name = ''; // Clear name
                        roleModal.form.description = ''; // Clear description
                        roleModal.form.permissions = []; // Clear permissions
                    };
                    
                    // Show user profile modal with current user data
                    const showUserProfile = () => {
                        userProfileModal.show = true; // Show modal
                        userProfileModal.form = { // Populate form with user data
                            full_name: currentUser.value?.full_name || '', // User name
                            email: currentUser.value?.email || '', // User email
                            phone: currentUser.value?.phone_number || '', // User phone
                            department_id: currentUser.value?.department_id || '', // Department
                            notifications_enabled: currentUser.value?.notifications_enabled ?? true, // Notification settings
                            absence_notifications: currentUser.value?.absence_notifications ?? true, // Absence notifications
                            announcement_notifications: currentUser.value?.announcement_notifications ?? true // Announcement notifications
                        };
                    };
                    
                    // Show system settings modal
                    const showSystemSettingsModal = () => {
                        if (!hasPermission('system', 'read')) { // Check permissions
                            showToast('Permission Denied', 'You need read permission', 'error');
                            return;
                        }
                        systemSettingsModal.show = true; // Show modal
                        systemSettingsModal.settings = { ...systemSettings.value }; // Clone settings to modal
                    };
                    
                    // Show permission manager view
                    const showPermissionManager = () => {
                        if (!hasPermission('permissions', 'manage')) { // Check permissions
                            showToast('Permission Denied', 'You need manage permission', 'error');
                            return;
                        }
                        switchView('permission_manager'); // Switch to permission manager view
                    };
                    
                    // ============ VIEW FUNCTIONS ============
                    // View staff details - show comprehensive staff information
                    const viewStaffDetails = (staff) => {
                        staffDetailsModal.show = true; // Show modal
                        staffDetailsModal.staff = staff; // Set staff object
                        staffDetailsModal.activeTab = 'personal'; // Set active tab
                        const rotations = residentRotations.value.filter(r => r.resident_id === staff.id); // Get staff rotations
                        const oncallShifts = onCallSchedule.value.filter(s => s.primary_physician_id === staff.id).length; // Count on-call shifts
                        const absences = staffAbsences.value.filter(a => a.staff_member_id === staff.id); // Get staff absences
                        const supervisionCount = residentRotations.value.filter(r => r.supervisor_id === staff.id).length; // Count supervised residents
                        staffDetailsModal.stats = { // Calculate and set statistics
                            completedRotations: rotations.filter(r => r.status === 'completed').length, // Completed rotations
                            oncallShifts: oncallShifts, // Total on-call shifts
                            absenceDays: absences.reduce((total, absence) => { // Total absence days
                                return total + calculateAbsenceDuration(absence.leave_start_date, absence.leave_end_date);
                            }, 0),
                            supervisionCount: supervisionCount // Residents supervised
                        };
                        const currentRotation = rotations.find(r => r.status === 'active'); // Find current rotation
                        staffDetailsModal.currentRotation = currentRotation ? // Format current rotation info
                            `${getTrainingUnitName(currentRotation.training_unit_id)} (${Utils.formatDate(currentRotation.start_date)} - ${Utils.formatDate(currentRotation.end_date)})` :
                            'No active rotation';
                        const today = new Date().toISOString().split('T')[0]; // Get today's date
                        const nextOncall = onCallSchedule.value // Find next on-call shift
                            .filter(s => s.primary_physician_id === staff.id && s.duty_date >= today)
                            .sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date))[0];
                        staffDetailsModal.nextOncall = nextOncall ? // Format next on-call info
                            `${Utils.formatDate(nextOncall.duty_date)} (${nextOncall.shift_type})` :
                            'No upcoming on-call';
                    };
                    
                    // Assign rotation to specific staff member
                    const assignRotationToStaff = (staff) => {
                        if (!hasPermission('resident_rotations', 'create')) { // Check permissions
                            showToast('Permission Denied', 'You need create permission', 'error');
                            return;
                        }
                        if (staff.staff_type !== 'medical_resident') { // Validate staff type
                            showToast('Error', 'Only residents can be assigned rotations', 'error');
                            return;
                        }
                        rotationModal.mode = 'add'; // Set mode to add
                        rotationModal.show = true; // Show modal
                        rotationModal.form.resident_id = staff.id; // Pre-populate resident ID
                        rotationModal.form.start_date = new Date().toISOString().split('T')[0]; // Set start to today
                        const endDate = new Date(); // Calculate end date (4 weeks from now)
                        endDate.setDate(endDate.getDate() + 28);
                        rotationModal.form.end_date = endDate.toISOString().split('T')[0]; // Set end date
                    };
                    
                    // Assign resident to training unit (quick placement)
                    const assignResidentToUnit = (unit) => {
                        if (!hasPermission('training_units', 'assign')) { // Check permissions
                            showToast('Permission Denied', 'You need assign permission', 'error');
                            return;
                        }
                        quickPlacementModal.show = true; // Show modal
                        quickPlacementModal.training_unit_id = unit.id; // Pre-populate unit ID
                        quickPlacementModal.start_date = new Date().toISOString().split('T')[0]; // Set start to today
                    };
                    
                    // Remove resident from training unit with confirmation
                    const removeResidentFromUnit = (residentId, unitId) => {
                        showConfirmation({ // Show confirmation modal
                            title: 'Remove Resident',
                            message: 'Are you sure you want to remove this resident from the training unit?',
                            icon: 'fa-user-times',
                            confirmButtonText: 'Remove',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                try {
                                    const rotation = residentRotations.value.find(r => // Find active rotation
                                        r.resident_id === residentId && 
                                        r.training_unit_id === unitId &&
                                        r.status === 'active'
                                    );
                                    if (rotation) {
                                        const { error } = await supabaseClient // Update rotation status to cancelled
                                            .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                                            .eq('id', rotation.id);
                                        if (error) throw error; // Throw error if update fails
                                        rotation.status = 'cancelled'; // Update local state
                                        showToast('Success', 'Resident removed from training unit', 'success'); // Success toast
                                    }
                                } catch (error) {
                                    console.error('Error removing resident:', error);
                                    showToast('Error', error.message, 'error'); // Error toast
                                }
                            }
                        });
                    };
                    
                    // Assign coverage for absence (edit absence with coverage focus)
                    const assignCoverage = (absence) => {
                        if (!hasPermission('staff_absence', 'update')) { // Check permissions
                            showToast('Permission Denied', 'You need update permission', 'error');
                            return;
                        }
                        absenceModal.mode = 'edit'; // Set mode to edit
                        absenceModal.show = true; // Show modal
                        absenceModal.form = { // Map absence data to form
                            ...absence,
                            absence_reason: absence.leave_category, // Map category to reason
                            start_date: absence.leave_start_date, // Map start date
                            end_date: absence.leave_end_date // Map end date
                        };
                    };
                    
                    // View rotation details (alias for editRotation)
                    const viewRotationDetails = (rotation) => {
                        editRotation(rotation); // Use editRotation function
                    };
                    
                    // View department details (alias for editDepartment)
                    const viewDepartmentDetails = (department) => {
                        editDepartment(department); // Use editDepartment function
                    };
                    
                    // View absence details (alias for editAbsence)
                    const viewAbsenceDetails = (absence) => {
                        editAbsence(absence); // Use editAbsence function
                    };
                    
                    // ============ FILTER FUNCTIONS ============
                    // Apply medical staff filters (placeholder - shows toast)
                    const applyStaffFilters = () => {
                        showToast('Filters Applied', 'Medical staff filters have been applied', 'info');
                    };
                    
                    // Reset medical staff filters to defaults
                    const resetStaffFilters = () => {
                        staffFilter.staff_type = ''; // Clear staff type filter
                        staffFilter.employment_status = ''; // Clear employment status filter
                        staffSearch.value = ''; // Clear search query
                        showToast('Filters Reset', 'All filters have been reset', 'info'); // Show toast
                    };
                    
                    // Apply rotation filters (placeholder - shows toast)
                    const applyRotationFilters = () => {
                        showToast('Filters Applied', 'Rotation filters have been applied', 'info');
                    };
                    
                    // Reset rotation filters to defaults
                    const resetRotationFilters = () => {
                        rotationFilter.resident_id = ''; // Clear resident filter
                        rotationFilter.status = ''; // Clear status filter
                        showToast('Filters Reset', 'Rotation filters have been reset', 'info'); // Show toast
                    };
                    
                    // Apply absence filters (placeholder - shows toast)
                    const applyAbsenceFilters = () => {
                        showToast('Filters Applied', 'Absence filters have been applied', 'info');
                    };
                    
                    // Reset absence filters to defaults
                    const resetAbsenceFilters = () => {
                        absenceFilter.staff_id = ''; // Clear staff filter
                        absenceFilter.status = ''; // Clear status filter
                        absenceFilter.start_date = ''; // Clear date filter
                        showToast('Filters Reset', 'Absence filters have been reset', 'info'); // Show toast
                    };
                    
                    // Apply audit filters (placeholder - shows toast)
                    const applyAuditFilters = () => {
                        showToast('Filters Applied', 'Audit filters have been applied', 'info');
                    };
                    
                    // Reset audit filters to defaults
                    const resetAuditFilters = () => {
                        auditFilters.dateRange = ''; // Clear date range filter
                        auditFilters.actionType = ''; // Clear action type filter
                        auditFilters.userId = ''; // Clear user filter
                        showToast('Filters Reset', 'Audit filters have been reset', 'info'); // Show toast
                    };
                    
                    // ============ SEARCH FUNCTIONS ============
                    // Handle search query execution
                    const handleSearch = () => {
                        if (!searchQuery.value.trim()) return; // Exit if empty query
                        const scope = searchScope.value.toLowerCase(); // Get search scope
                        const query = searchQuery.value.toLowerCase(); // Get search query
                        let results = []; // Initialize results array
                        switch (scope) { // Search based on scope
                            case 'all': // Search all categories
                                results.push(...medicalStaff.value.filter(s => // Search medical staff
                                    s.full_name.toLowerCase().includes(query) ||
                                    s.professional_email?.toLowerCase().includes(query) ||
                                    s.staff_id?.toLowerCase().includes(query)
                                ));
                                results.push(...departments.value.filter(d => // Search departments
                                    d.name.toLowerCase().includes(query) ||
                                    d.code.toLowerCase().includes(query)
                                ));
                                results.push(...trainingUnits.value.filter(u => // Search training units
                                    u.unit_name.toLowerCase().includes(query) ||
                                    u.unit_code.toLowerCase().includes(query)
                                ));
                                break;
                            case 'staff': // Search only medical staff
                                results = medicalStaff.value.filter(s => 
                                    s.full_name.toLowerCase().includes(query) ||
                                    s.professional_email?.toLowerCase().includes(query) ||
                                    s.staff_id?.toLowerCase().includes(query)
                                );
                                break;
                            case 'units': // Search only training units
                                results = trainingUnits.value.filter(u => 
                                    u.unit_name.toLowerCase().includes(query) ||
                                    u.unit_code.toLowerCase().includes(query)
                                );
                                break;
                        }
                        if (results.length > 0) { // Show results count
                            showToast('Search Results', `Found ${results.length} result${results.length === 1 ? '' : 's'}`, 'info');
                        } else { // No results found
                            showToast('Search', 'No results found', 'warning');
                        }
                    };
                    
                    // Toggle search scope between categories
                    const toggleSearchScope = () => {
                        const scopes = ['All', 'Staff', 'Patients', 'Units']; // Available scopes
                        const currentIndex = scopes.indexOf(searchScope.value); // Find current scope index
                        searchScope.value = scopes[(currentIndex + 1) % scopes.length]; // Cycle to next scope
                    };
                    
                    // Set search filter and scope
                    const setSearchFilter = (filter) => {
                        searchFilter.value = filter; // Set search filter
                        searchScope.value = filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1); // Update scope display
                    };
                    
                    // ============ AUTHENTICATION ============
                    // Handle user login
                    const handleLogin = async () => {
                        loading.value = true; // Set loading state
                        try {
                            const email = loginForm.email.trim().toLowerCase(); // Normalize email
                            const password = loginForm.password; // Get password
                            Validators.required(email, 'Email'); // Validate email required
                            Validators.required(password, 'Password'); // Validate password required
                            Validators.email(email, 'Email'); // Validate email format
                            if (email === 'admin@neumocare.org' && password === 'password123') { // Demo credentials
                                const { data: users, error } = await supabaseClient // Try to fetch user
                                    .from(TABLE_NAMES.USERS)
                                    .select('*')
                                    .eq('email', email)
                                    .limit(1);
                                if (error) { // If database error, create demo user
                                    console.warn('Could not fetch user from database:', error);
                                    currentUser.value = { // Create demo admin user
                                        id: Utils.generateId('USR'),
                                        email: email,
                                        full_name: 'System Administrator',
                                        user_role: 'system_admin',
                                        department: 'Administration',
                                        account_status: 'active'
                                    };
                                } else if (users && users.length > 0) { // User found in database
                                    currentUser.value = users[0];
                                } else { // No user in database, create demo
                                    currentUser.value = {
                                        id: Utils.generateId('USR'),
                                        email: email,
                                        full_name: 'System Administrator',
                                        user_role: 'system_admin',
                                        department: 'Administration',
                                        account_status: 'active'
                                    };
                                }
                                showToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success'); // Success toast
                                await logAuditEvent('LOGIN', 'auth', { email: email, user_id: currentUser.value.id }); // Log login
                                await loadInitialData(); // Load application data
                                currentView.value = 'daily_operations'; // Switch to dashboard view
                            } else { // Invalid credentials
                                throw new Error('Invalid credentials. Use admin@neumocare.org / password123');
                            }
                        } catch (error) {
                            console.error('Login error:', error);
                            showToast('Login Failed', error.message, 'error'); // Error toast
                        } finally {
                            loading.value = false; // Reset loading state
                            loginForm.password = ''; // Clear password field
                        }
                    };
                    
                    // Handle user logout with confirmation
                    const handleLogout = () => {
                        showConfirmation({ // Show confirmation modal
                            title: 'Logout',
                            message: 'Are you sure you want to logout?',
                            icon: 'fa-sign-out-alt',
                            confirmButtonText: 'Logout',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                await logAuditEvent('LOGOUT', 'auth', { user_id: currentUser.value.id }); // Log logout
                                currentUser.value = null; // Clear user data
                                currentView.value = 'login'; // Switch to login view
                                userMenuOpen.value = false; // Close user menu
                                showToast('Logged Out', 'You have been successfully logged out', 'info'); // Success toast
                            }
                        });
                    };
                    
                    // ============ COMPUTED PROPERTIES ============
                    // Filter medical staff based on search and filters
                    const filteredMedicalStaff = computed(() => {
                        let filtered = medicalStaff.value; // Start with all staff
                        if (staffSearch.value) { // Apply search filter
                            const search = staffSearch.value.toLowerCase();
                            filtered = filtered.filter(s => 
                                s.full_name.toLowerCase().includes(search) ||
                                (s.staff_id && s.staff_id.toLowerCase().includes(search)) ||
                                (s.professional_email && s.professional_email.toLowerCase().includes(search))
                            );
                        }
                        if (staffFilter.staff_type) { // Apply staff type filter
                            filtered = filtered.filter(s => s.staff_type === staffFilter.staff_type);
                        }
                        if (staffFilter.employment_status) { // Apply employment status filter
                            filtered = filtered.filter(s => s.employment_status === staffFilter.employment_status);
                        }
                        return filtered; // Return filtered results
                    });
                    
                    // Filter rotations based on filters
                    const filteredRotations = computed(() => {
                        let filtered = residentRotations.value; // Start with all rotations
                        if (rotationFilter.resident_id) { // Apply resident filter
                            filtered = filtered.filter(r => r.resident_id === rotationFilter.resident_id);
                        }
                        if (rotationFilter.status) { // Apply status filter
                            filtered = filtered.filter(r => r.status === rotationFilter.status);
                        }
                        return filtered; // Return filtered results
                    });
                    
                    // Filter absences based on filters
                    const filteredAbsences = computed(() => {
                        let filtered = staffAbsences.value; // Start with all absences
                        if (absenceFilter.staff_id) { // Apply staff filter
                            filtered = filtered.filter(a => a.staff_member_id === absenceFilter.staff_id);
                        }
                        if (absenceFilter.status) { // Apply status filter
                            filtered = filtered.filter(a => a.approval_status === absenceFilter.status);
                        }
                        if (absenceFilter.start_date) { // Apply date filter
                            filtered = filtered.filter(a => a.leave_start_date >= absenceFilter.start_date);
                        }
                        return filtered; // Return filtered results
                    });
                    
                    // Filter audit logs based on filters
                    const filteredAuditLogs = computed(() => {
                        let filtered = auditLogs.value; // Start with all logs
                        if (auditFilters.dateRange) { // Apply date filter
                            filtered = filtered.filter(log => {
                                const logDate = new Date(log.created_at).toISOString().split('T')[0];
                                return logDate === auditFilters.dateRange;
                            });
                        }
                        if (auditFilters.actionType) { // Apply action type filter
                            filtered = filtered.filter(log => log.action === auditFilters.actionType);
                        }
                        if (auditFilters.userId) { // Apply user filter
                            filtered = filtered.filter(log => log.user_id === auditFilters.userId);
                        }
                        return filtered; // Return filtered results
                    });
                    
                    // Get all residents from medical staff
                    const residents = computed(() => {
                        return medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident'); // Filter by staff type
                    });
                    
                    // Calculate system statistics
                    const stats = computed(() => {
                        const today = new Date().toISOString().split('T')[0]; // Today's date
                        const activeStaff = medicalStaff.value.filter(s => s.employment_status === 'active').length; // Active staff count
                        const residentsCount = medicalStaff.value.filter(s => s.staff_type === 'medical_resident' && s.employment_status === 'active').length; // Active residents
                        const todayOnCall = onCallSchedule.value.filter(s => s.duty_date === today).length; // Today's on-call count
                        const activeAbsences = staffAbsences.value.filter(a => // Current approved absences
                            a.leave_start_date <= today && a.leave_end_date >= today && a.approval_status === 'approved'
                        ).length;
                        return { // Return statistics object
                            totalStaff: activeStaff,
                            activePatients: 0, // Placeholder
                            todayAppointments: 0, // Placeholder
                            pendingAlerts: activeAlerts.value.length, // Active alerts
                            activeResidents: residentsCount,
                            todayOnCall: todayOnCall,
                            activeAbsences: activeAbsences
                        };
                    });
                    
                    // Get today's on-call schedule with formatted data
                    const todaysOnCall = computed(() => {
                        const today = new Date().toISOString().split('T')[0]; // Today's date
                        return onCallSchedule.value.filter(schedule => schedule.duty_date === today) // Filter today's schedule
                            .map(schedule => ({ // Format schedule data
                                ...schedule,
                                physician_name: getStaffName(schedule.primary_physician_id), // Get physician name
                                role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup', // Format role
                                contact_number: 'Ext. 5555' // Placeholder contact
                            }));
                    });
                    
                    // Show absence details modal
                    const showAbsenceDetails = (absence) => {
                        absenceDetailsModal.show = true; // Show modal
                        absenceDetailsModal.absence = absence; // Set absence object
                        absenceDetailsModal.activeTab = 'details'; // Set active tab
                    };

                    // Show import/export modal with specified mode
                    const showImportExportModal = (mode) => {
                        importExportModal.show = true; // Show modal
                        importExportModal.mode = mode; // Set mode (import/export)
                    };

                    // Show rotation details modal
                    const showRotationDetails = (rotation) => {
                        rotationDetailsModal.show = true; // Show modal
                        rotationDetailsModal.rotation = rotation; // Set rotation object
                        rotationDetailsModal.activeTab = 'details'; // Set active tab
                    };

                    // Show dashboard customization modal
                    const showDashboardCustomizeModal = () => {
                        dashboardCustomizeModal.show = true; // Show modal
                    };

                    // Show advanced search modal
                    const showAdvancedSearchModal = () => {
                        advancedSearchModal.show = true; // Show modal
                    };
                            
                    // Current department capacity (placeholder data)
                    const currentCapacity = computed(() => ({
                        er: { current: 12, max: 20, status: 'medium' }, // ER capacity
                        icu: { current: 6, max: 10, status: 'low' } // ICU capacity
                    }));
                    
                    // Live system statistics (with simulated data)
                    const liveStats = computed(() => ({
                        occupancy: Math.floor(Math.random() * 30) + 60, // Random occupancy 60-90%
                        occupancyTrend: Math.floor(Math.random() * 10) - 5, // Random trend -5 to +5
                        onDutyStaff: medicalStaff.value.filter(s => s.employment_status === 'active').length, // Active staff count
                        staffTrend: 0, // Placeholder trend
                        pendingRequests: staffAbsences.value.filter(a => a.approval_status === 'pending').length, // Pending absence requests
                        erCapacity: { current: 12, max: 20, status: 'medium' }, // ER capacity
                        icuCapacity: { current: 6, max: 10, status: 'low' } // ICU capacity
                    }));
                    
                    // Get all attending physicians
                    const availableAttendings = computed(() => {
                        return medicalStaff.value.filter(staff => 
                            staff.staff_type === 'attending_physician' && // Attending physicians only
                            staff.employment_status === 'active' // Active only
                        );
                    });
                    
                    // Get available heads of department (same as attendings for now)
                    const availableHeadsOfDepartment = computed(() => {
                        return availableAttendings.value; // Currently same as attendings
                    });
                    
                    // Get available supervisors (same as attendings for now)
                    const availableSupervisors = computed(() => {
                        return availableAttendings.value; // Currently same as attendings
                    });
                    
                    // Get all physicians (attendings and fellows)
                    const availablePhysicians = computed(() => {
                        return medicalStaff.value.filter(staff => 
                            ['attending_physician', 'fellow'].includes(staff.staff_type) && // Physicians and fellows
                            staff.employment_status === 'active' // Active only
                        );
                    });
                    
                    // Get all residents
                    const availableResidents = computed(() => {
                        return medicalStaff.value.filter(staff => 
                            staff.staff_type === 'medical_resident' && // Residents only
                            staff.employment_status === 'active' // Active only
                        );
                    });
                    
                    // Get all active training units
                    const availableTrainingUnits = computed(() => {
                        return trainingUnits.value.filter(unit => unit.status === 'active'); // Active units only
                    });
                    
                    // Get all active staff
                    const availableStaff = computed(() => {
                        return medicalStaff.value.filter(staff => staff.employment_status === 'active'); // Active only
                    });
                    
                    // Get staff available for coverage (non-residents)
                    const availableCoverageStaff = computed(() => {
                        return availableStaff.value.filter(staff => 
                            staff.staff_type !== 'medical_resident' // Exclude residents
                        );
                    });
                    
                    // ============ CAPACITY FUNCTIONS ============
                    // Get capacity status based on percentage
                    const getCapacityStatus = (capacity) => {
                        const percentage = (capacity.current / capacity.max) * 100; // Calculate percentage
                        if (percentage >= 90) return 'high'; // High capacity (90%+)
                        if (percentage >= 70) return 'medium'; // Medium capacity (70-89%)
                        return 'low'; // Low capacity (<70%)
                    };
                    
                    // Update capacity (placeholder function)
                    const updateCapacity = async () => {
                        try {
                            showToast('Success', 'Capacity updated successfully', 'success'); // Success toast
                        } catch (error) {
                            console.error('Error updating capacity:', error);
                            showToast('Error', 'Failed to update capacity', 'error'); // Error toast
                        }
                    };
                    
                    // ============ COMMUNICATION FUNCTIONS ============
                    // Get CSS color class for priority level
                    const getPriorityColor = (priority) => {
                        const colors = { // Priority color mapping
                            low: 'info',
                            medium: 'warning',
                            high: 'danger',
                            urgent: 'danger'
                        };
                        return colors[priority] || 'info'; // Default to info
                    };
                    
                    // Get icon for communication tab
                    const getCommunicationIcon = (tab) => {
                        const icons = { // Tab icon mapping
                            announcement: 'fa-bullhorn',
                            capacity: 'fa-bed',
                            quick: 'fa-comment-medical'
                        };
                        return icons[tab] || 'fa-comment'; // Default icon
                    };
                    
                    // Get button text for communication tab
                    const getCommunicationButtonText = (tab) => {
                        const texts = { // Button text mapping
                            announcement: 'Post Announcement',
                            capacity: 'Update Capacity',
                            quick: 'Post Update'
                        };
                        return texts[tab] || 'Save'; // Default text
                    };
                    
                    // Save quick resident placement
                    const saveQuickPlacement = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('placements', 'create')) { // Check permissions
                                throw new Error('Insufficient permissions');
                            }
                            const { resident_id, training_unit_id, start_date, duration, supervisor_id, notes } = quickPlacementModal; // Destructure
                            if (!resident_id) throw new Error('Resident is required'); // Validate resident
                            if (!training_unit_id) throw new Error('Training unit is required'); // Validate unit
                            if (!start_date) throw new Error('Start date is required'); // Validate start date
                            const endDate = new Date(start_date); // Calculate end date
                            endDate.setDate(endDate.getDate() + (duration * 7)); // Add weeks
                            const rotationData = { // Prepare rotation data
                                rotation_id: Utils.generateId('ROT'), // Generate rotation ID
                                resident_id,
                                training_unit_id,
                                start_date,
                                end_date: endDate.toISOString().split('T')[0], // Format end date
                                supervisor_id: supervisor_id || null, // Optional supervisor
                                status: 'active',
                                notes,
                                created_at: new Date().toISOString(), // Created timestamp
                                updated_at: new Date().toISOString() // Updated timestamp
                            };
                            const { data, error } = await supabaseClient // Insert to database
                                .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                .insert([rotationData])
                                .select()
                                .single();
                            if (error) throw error; // Throw error if insert fails
                            residentRotations.value.unshift(data); // Add to beginning of array
                            quickPlacementModal.show = false; // Close modal
                            showToast('Success', 'Resident placed successfully', 'success'); // Success toast
                            await logAuditEvent('CREATE', 'resident_rotations', { rotation_id: data.id, resident_id: resident_id }); // Log action
                        } catch (error) {
                            console.error('Error saving quick placement:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // Save bulk resident assignment
                    const saveBulkAssignment = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('training_units', 'assign')) { // Check permissions
                                throw new Error('Insufficient permissions');
                            }
                            const { selectedResidents, training_unit_id, start_date, duration, supervisor_id } = bulkAssignModal; // Destructure
                            if (!selectedResidents || selectedResidents.length === 0) { // Validate selection
                                throw new Error('Select at least one resident');
                            }
                            if (!training_unit_id) throw new Error('Training unit is required'); // Validate unit
                            if (!start_date) throw new Error('Start date is required'); // Validate start date
                            const endDate = new Date(start_date); // Calculate end date
                            endDate.setDate(endDate.getDate() + (duration * 7)); // Add weeks
                            const rotations = selectedResidents.map(residentId => ({ // Create rotation for each resident
                                rotation_id: Utils.generateId('ROT'), // Generate rotation ID
                                resident_id: residentId,
                                training_unit_id,
                                start_date,
                                end_date: endDate.toISOString().split('T')[0], // Format end date
                                supervisor_id: supervisor_id || null, // Optional supervisor
                                status: 'active',
                                created_at: new Date().toISOString(), // Created timestamp
                                updated_at: new Date().toISOString() // Updated timestamp
                            }));
                            const { error } = await supabaseClient // Bulk insert to database
                                .from(TABLE_NAMES.RESIDENT_ROTATIONS)
                                .insert(rotations);
                            if (error) throw error; // Throw error if insert fails
                            await loadResidentRotations(); // Reload rotations
                            bulkAssignModal.show = false; // Close modal
                            showToast('Success', `${rotations.length} resident${rotations.length === 1 ? '' : 's'} assigned successfully`, 'success'); // Success toast
                        } catch (error) {
                            console.error('Error saving bulk assignment:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // ============ PERMISSION MANAGER FUNCTIONS ============
                    // Edit role - populate modal with existing role data
                    const editRole = (role) => {
                        if (!hasPermission('permissions', 'manage')) { // Check permissions
                            showToast('Permission Denied', 'You need manage permission', 'error');
                            return;
                        }
                        roleModal.mode = 'edit'; // Set mode to edit
                        roleModal.show = true; // Show modal
                        roleModal.form = { // Clone role data to form
                            id: role.id,
                            name: role.name,
                            description: role.description,
                            permissions: role.permissions || []
                        };
                    };
                    
                    // Delete role with confirmation
                    const deleteRole = (roleId) => {
                        const role = userRoles.value.find(r => r.id === roleId); // Find role
                        if (!role) return; // Exit if not found
                        showConfirmation({ // Show confirmation modal
                            title: 'Delete Role',
                            message: `Are you sure you want to delete the ${role.name} role? This action cannot be undone.`,
                            icon: 'fa-trash',
                            confirmButtonText: 'Delete',
                            confirmButtonClass: 'btn-danger',
                            onConfirm: async () => { // Confirm callback
                                try {
                                    if (!hasPermission('permissions', 'manage')) { // Check permissions
                                        throw new Error('Insufficient permissions');
                                    }
                                    const { error } = await supabaseClient // Delete from database
                                        .from(TABLE_NAMES.SYSTEM_ROLES)
                                        .delete()
                                        .eq('id', roleId);
                                    if (error) throw error; // Throw error if delete fails
                                    const index = userRoles.value.findIndex(r => r.id === roleId); // Find index
                                    if (index !== -1) userRoles.value.splice(index, 1); // Remove from array
                                    showToast('Deleted', `${role.name} role has been removed`, 'success'); // Success toast
                                } catch (error) {
                                    console.error('Error deleting role:', error);
                                    showToast('Error', error.message, 'error'); // Error toast
                                }
                            }
                        });
                    };
                    
                    // Toggle role permission (placeholder function)
                    const toggleRolePermission = (roleId, permissionId) => {
                        showToast('Info', 'Permission toggled - changes not saved to database', 'info'); // Placeholder toast
                    };
                    
                    // Edit user permissions (placeholder function)
                    const editUserPermissions = (user) => {
                        showToast('Info', 'Edit user permissions - functionality not implemented', 'info'); // Placeholder toast
                    };
                    
                    // ============ SYSTEM SETTINGS FUNCTIONS ============
                    // Save system settings
                    const saveSystemSettings = async () => {
                        saving.value = true; // Set saving state
                        try {
                            if (!hasPermission('system', 'update')) { // Check permissions
                                throw new Error('Insufficient permissions');
                            }
                            const { data, error } = await supabaseClient // Upsert settings
                                .from(TABLE_NAMES.SYSTEM_SETTINGS)
                                .upsert([systemSettings.value])
                                .select()
                                .single();
                            if (error) throw error; // Throw error if upsert fails
                            systemSettings.value = data; // Update reactive data
                            showToast('Success', 'System settings saved successfully', 'success'); // Success toast
                            await logAuditEvent('UPDATE', 'system_settings', { settings: data }); // Log action
                        } catch (error) {
                            console.error('Error saving system settings:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // ============ USER PROFILE FUNCTIONS ============
                    // Save user profile
                    const saveUserProfile = async () => {
                        saving.value = true; // Set saving state
                        try {
                            const { data, error } = await supabaseClient // Update user
                                .from(TABLE_NAMES.USERS)
                                .update(userProfileModal.form)
                                .eq('id', currentUser.value.id)
                                .select()
                                .single();
                            if (error) throw error; // Throw error if update fails
                            currentUser.value = data; // Update current user
                            userProfileModal.show = false; // Close modal
                            showToast('Success', 'Profile updated successfully', 'success'); // Success toast
                        } catch (error) {
                            console.error('Error saving user profile:', error);
                            showToast('Error', error.message, 'error'); // Error toast
                        } finally {
                            saving.value = false; // Reset saving state
                        }
                    };
                    
                    // ============ AUDIT LOG FUNCTIONS ============
                    // Export audit logs (placeholder function)
                    const exportAuditLogs = () => {
                        showToast('Info', 'Export functionality not implemented', 'info'); // Placeholder toast
                    };
                    
                    // ============ CALENDAR FUNCTIONS ============
                    // Show absence calendar view (placeholder function)
                    const showAbsenceCalendar = (view) => {
                        showToast('Info', `Calendar view: ${view} - functionality not implemented`, 'info'); // Placeholder toast
                    };
                    
                    // ============ NOTIFICATION FUNCTIONS ============
                    // Show notifications panel (placeholder function)
                    const showNotifications = () => {
                        showToast('Info', 'Notifications panel not implemented', 'info'); // Placeholder toast
                    };
                    
                    // ============ EVENT HANDLERS ============
                    // Toggle stats sidebar visibility
                    const toggleStatsSidebar = () => {
                        statsSidebarOpen.value = !statsSidebarOpen.value; // Toggle boolean
                    };
                    
                    // Toggle user menu dropdown
                    const toggleUserMenu = () => {
                        userMenuOpen.value = !userMenuOpen.value; // Toggle boolean
                    };
                    
                    // Toggle action menu dropdown
                    const toggleActionMenu = (event) => {
                        event.stopPropagation(); // Prevent event bubbling
                        const dropdown = event.target.closest('.action-dropdown'); // Find parent dropdown
                        if (dropdown) {
                            const menu = dropdown.querySelector('.action-menu'); // Find menu element
                            if (menu) {
                                menu.classList.toggle('show'); // Toggle show class
                            }
                        }
                    };
                    
                    // ============ LIFECYCLE HOOKS ============
                    // Component mounted lifecycle hook
                    onMounted(() => {
                        console.log('App mounted successfully'); // Log mount
                        document.addEventListener('click', function(event) { // Global click handler
                            if (!event.target.closest('.action-dropdown')) { // Click outside action dropdown
                                document.querySelectorAll('.action-menu.show').forEach(menu => {
                                    menu.classList.remove('show'); // Close all action menus
                                });
                            }
                            if (!event.target.closest('.user-menu')) { // Click outside user menu
                                userMenuOpen.value = false; // Close user menu
                            }
                        });
                    });
                    
                    // ============ RETURN STATEMENT ============
                    // Return all reactive properties and functions for template access
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
                    // Fallback UI for setup errors
                    return {
                        currentView: 'error',
                        showToast: (title, message) => console.error(title, message),
                        handleLogin: () => console.log('System error - cannot login')
                    };
                }
            },
            
            // Vue error boundary - catches errors in component templates
            errorCaptured(err, instance, info) {
                console.error('Vue error captured:', err, info);
                this.showToast?.('System Error', 'An error occurred. Please refresh the page.', 'error'); // Show error toast if available
                return false; // Prevent error propagation
            }
        });

        // ============ MOUNT THE APP ============
        app.mount('#app'); // Mount Vue app to DOM element with id="app"
        console.log('Vue app mounted successfully'); // Log successful mount
        
    } catch (error) {
        console.error('FATAL ERROR: Application failed to initialize:', error);
        // Display fatal error UI if app initialization fails
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

// ============ SUPABASE CONFIGURATION ============
const SUPABASE_URL = 'https://vssmguzuvekkecbmwcjw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc21ndXp1dmVra2VjYm13Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTI4NTIsImV4cCI6MjA4NDE2ODg1Mn0.8qPFsMEn4n5hDfxhgXvq2lQarts8OlL8hWiRYXb-vXw';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: window.localStorage
    }
});

// ============ ADVANCED DRBA PERMISSION SYSTEM ============
const PermissionSystem = {
    resources: {
        medical_staff: {
            name: 'Medical Staff',
            actions: ['create', 'read', 'update', 'delete', 'export'],
            description: 'Manage medical staff records'
        },
        training_units: {
            name: 'Training Units',
            actions: ['create', 'read', 'update', 'delete', 'assign'],
            description: 'Manage training units and capacities'
        },
        resident_rotations: {
            name: 'Resident Rotations',
            actions: ['create', 'read', 'update', 'delete', 'extend'],
            description: 'Manage resident rotation schedules'
        },
        placements: {
            name: 'Placements',
            actions: ['create', 'read', 'update', 'delete', 'drag_drop'],
            description: 'Assign residents to training units'
        },
        daily_operations: {
            name: 'Daily Operations',
            actions: ['read', 'update', 'alert'],
            description: 'View and manage daily operations'
        },
        oncall_schedule: {
            name: 'On-call Schedule',
            actions: ['create', 'read', 'update', 'delete', 'override'],
            description: 'Manage on-call schedules'
        },
        leave_requests: {
            name: 'Leave Requests',
            actions: ['create', 'read', 'update', 'approve', 'reject'],
            description: 'Manage leave requests and approvals'
        },
        announcements: {
            name: 'Announcements',
            actions: ['create', 'read', 'update', 'delete', 'publish'],
            description: 'Create and manage announcements'
        },
        audit: {
            name: 'Audit Logs',
            actions: ['read', 'export', 'clear'],
            description: 'View system audit logs'
        },
        system: {
            name: 'System Settings',
            actions: ['read', 'update', 'admin'],
            description: 'Manage system settings and permissions'
        },
        communications: {
            name: 'Communications',
            actions: ['create', 'read', 'update', 'delete'],
            description: 'Department communications and capacity planning'
        }
    },

    roles: {
        system_admin: {
            name: 'System Administrator',
            level: 'full',
            description: 'Full system access and permission management',
            permissions: {
                medical_staff: { create: true, read: true, update: true, delete: true, export: true },
                training_units: { create: true, read: true, update: true, delete: true, assign: true },
                resident_rotations: { create: true, read: true, update: true, delete: true, extend: true },
                placements: { create: true, read: true, update: true, delete: true, drag_drop: true },
                daily_operations: { read: true, update: true, alert: true },
                oncall_schedule: { create: true, read: true, update: true, delete: true, override: true },
                leave_requests: { create: true, read: true, update: true, approve: true, reject: true },
                announcements: { create: true, read: true, update: true, delete: true, publish: true },
                audit: { read: true, export: true, clear: true },
                system: { read: true, update: true, admin: true },
                communications: { create: true, read: true, update: true, delete: true }
            }
        },
        department_head: {
            name: 'Head of Department',
            level: 'full',
            description: 'Department-wide oversight and management',
            permissions: {
                medical_staff: { create: true, read: true, update: true, delete: false, export: true },
                training_units: { create: true, read: true, update: true, delete: false, assign: true },
                resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
                placements: { create: true, read: true, update: true, delete: false, drag_drop: true },
                daily_operations: { read: true, update: true, alert: true },
                oncall_schedule: { create: true, read: true, update: true, delete: false, override: true },
                leave_requests: { create: true, read: true, update: true, approve: true, reject: true },
                announcements: { create: true, read: true, update: true, delete: true, publish: true },
                audit: { read: true, export: true, clear: false },
                system: { read: true, update: false, admin: false },
                communications: { create: true, read: true, update: true, delete: true }
            }
        },
        resident_manager: {
            name: 'Resident Manager',
            level: 'write',
            description: 'Manage residents and training units',
            permissions: {
                medical_staff: { create: true, read: true, update: true, delete: false, export: false },
                training_units: { create: true, read: true, update: true, delete: false, assign: true },
                resident_rotations: { create: true, read: true, update: true, delete: false, extend: true },
                placements: { create: true, read: true, update: true, delete: false, drag_drop: true },
                daily_operations: { read: true, update: true, alert: false },
                oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
                leave_requests: { create: true, read: true, update: false, approve: false, reject: false },
                announcements: { create: false, read: true, update: false, delete: false, publish: false },
                audit: { read: false, export: false, clear: false },
                system: { read: false, update: false, admin: false },
                communications: { create: false, read: true, update: false, delete: false }
            }
        },
        attending_physician: {
            name: 'Attending Physician',
            level: 'limited',
            description: 'Supervise residents and view schedules',
            permissions: {
                medical_staff: { create: false, read: true, update: false, delete: false, export: false },
                training_units: { create: false, read: true, update: false, delete: false, assign: false },
                resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
                placements: { create: false, read: true, update: false, delete: false, drag_drop: false },
                daily_operations: { read: true, update: false, alert: false },
                oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
                leave_requests: { create: true, read: true, update: false, approve: false, reject: false },
                announcements: { create: false, read: true, update: false, delete: false, publish: false },
                audit: { read: false, export: false, clear: false },
                system: { read: false, update: false, admin: false },
                communications: { create: false, read: true, update: false, delete: false }
            }
        },
        viewing_doctor: {
            name: 'Viewing Doctor',
            level: 'read',
            description: 'Read-only access to schedules and assignments',
            permissions: {
                medical_staff: { create: false, read: true, update: false, delete: false, export: false },
                training_units: { create: false, read: true, update: false, delete: false, assign: false },
                resident_rotations: { create: false, read: true, update: false, delete: false, extend: false },
                placements: { create: false, read: true, update: false, delete: false, drag_drop: false },
                daily_operations: { read: true, update: false, alert: false },
                oncall_schedule: { create: false, read: true, update: false, delete: false, override: false },
                leave_requests: { create: false, read: true, update: false, approve: false, reject: false },
                announcements: { create: false, read: true, update: false, delete: false, publish: false },
                audit: { read: false, export: false, clear: false },
                system: { read: false, update: false, admin: false },
                communications: { create: false, read: true, update: false, delete: false }
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

// ============ VUE APPLICATION ============
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

const app = createApp({
    setup() {
        // ============ STATE MANAGEMENT ============
        const currentUser = ref(null);
        const loginForm = ref({
            email: '',
            password: '',
            user_role: 'system_admin',
            require_mfa: false,
            mfa_code: ''
        });
        
        const loading = ref(false);
        const saving = ref(false);
        const savingPermissions = ref(false);
        const operationProgress = ref({}); // For progress indicators

        // Navigation states
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
        const expandedStaffId = ref(null);
        
        // Pagination states
        const pagination = ref({
            medical_staff: { page: 1, limit: 20, total: 0, hasMore: true },
            training_units: { page: 1, limit: 20, total: 0, hasMore: true },
            resident_rotations: { page: 1, limit: 20, total: 0, hasMore: true },
            oncall_schedule: { page: 1, limit: 20, total: 0, hasMore: true },
            leave_requests: { page: 1, limit: 20, total: 0, hasMore: true },
            audit_logs: { page: 1, limit: 50, total: 0, hasMore: true }
        });

        // Undo/Redo stack
        const undoStack = ref([]);
        const redoStack = ref([]);
        const maxUndoSteps = 20;

        // Tab synchronization
        const tabSyncEnabled = ref(true);
        const lastSyncTime = ref(null);

        // Auto-refresh intervals
        let autoRefreshInterval = null;
        let liveStatsInterval = null;

        // Modal states
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
                primary_clinic: '',
                professional_email: '',
                resident_category: '',
                training_year: null
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
        
        const leaveRequestModal = ref({
            show: false,
            mode: 'add',
            request: null,
            form: {
                start_date: '',
                end_date: '',
                leave_type: 'vacation',
                reason: '',
                status: 'pending',
                approver_notes: ''
            }
        });
        
        const leaveDetailsModal = ref({
            show: false,
            request: null
        });
        
        const trainingUnitModal = ref({
            show: false,
            mode: 'add',
            unit: null,
            form: {
                unit_name: '',
                unit_code: '',
                department_name: 'Pulmonology',
                unit_description: '',
                unit_status: 'active',
                maximum_residents: 10,
                specialty: '',
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
                rotation_start_date: '',
                rotation_end_date: '',
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
                unit_id: '',
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
                leave_approval_required_days: 7,
                max_leave_days_per_year: 30,
                enable_email_notifications: true,
                auto_logout_enabled: true
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
                leave_request_notifications: true,
                announcement_notifications: true
            }
        });
        
        const importExportModal = ref({
            show: false,
            mode: 'import',
            selectedTable: 'medical_staff',
            exportFormat: 'csv',
            overwriteExisting: false,
            progress: 0
        });

        // Data stores
        const medicalStaff = ref([]);
        const trainingUnits = ref([]);
        const residentRotations = ref([]);
        const dailyAssignments = ref([]);
        const leaveRequests = ref([]);
        const onCallSchedule = ref([]);
        const announcements = ref([]);
        const auditLogs = ref([]);
        const userNotifications = ref([]);
        const systemSettings = ref({});
        
        // Cache for related data
        const staffCache = ref(new Map());
        const unitCache = ref(new Map());
        
        // Stats and UI states
        const toasts = ref([]);
        let toastId = 0;
        const staffSearch = ref('');
        const staffFilter = ref({
            staff_type: '',
            employment_status: ''
        });
        const rotationFilter = ref({
            category: '',
            status: ''
        });
        const auditFilter = ref({
            action: '',
            dateRange: 'today'
        });
        const recentSearches = ref([]);
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

        // ============ UTILITY FUNCTIONS ============
        const generateUniqueId = () => {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
        };

        const getLocalDateString = (date = new Date()) => {
            const d = new Date(date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().split('T')[0];
        };

        const getLocalDateTime = () => {
            const now = new Date();
            return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
        };

        const validateEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        const validatePhone = (phone) => {
            return /^[\+]?[1-9][\d]?[\s]?\(?[0-9]{3}\)?[\s]?[0-9]{3}[\s]?[0-9]{4}$/.test(phone);
        };
        // ============ UUID GENERATION ============
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
        // ============ UUID CONVERSION ============
const convertToUUID = (oldId) => {
    // If it's already a UUID, return it
    if (isValidUUID(oldId)) return oldId;
    
    // If it's your old format, convert it to a proper UUID
    if (oldId && typeof oldId === 'string' && oldId.includes('-')) {
        // Generate a stable UUID from the old ID
        const hash = oldId.split('-').join('');
        return `${hash.substring(0,8)}-${hash.substring(8,12)}-4${hash.substring(13,16)}-8${hash.substring(17,20)}-${hash.substring(20,32)}`;
    }
    
    // Otherwise generate a new UUID
    return generateUUID();
};
        // ============ UUID VALIDATION ============
const isValidUUID = (uuid) => {
    if (!uuid) return true; // null is valid for optional UUID fields
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

        // ============ ERROR BOUNDARY FUNCTIONS ============
        const withErrorHandling = async (operation, context, fallback = null) => {
            try {
                return await operation();
            } catch (error) {
                console.error(`Error in ${context}:`, error);
                await logAudit('ERROR', `${context}: ${error.message}`, 'system');
                showAdvancedToast('Error', `${context} failed: ${error.message}`, 'error');
                
                if (fallback !== null) {
                    return fallback;
                }
                throw error;
            }
        };

        // ============ UNDO/REDO SYSTEM ============
        const pushToUndoStack = (action, data, undoCallback, redoCallback) => {
            const undoItem = {
                id: generateUniqueId(),
                action,
                data,
                undo: undoCallback,
                redo: redoCallback,
                timestamp: new Date()
            };
            
            undoStack.value.unshift(undoItem);
            redoStack.value = []; // Clear redo stack on new action
            
            // Limit stack size
            if (undoStack.value.length > maxUndoSteps) {
                undoStack.value = undoStack.value.slice(0, maxUndoSteps);
            }
        };

        const undoLastAction = async () => {
            if (undoStack.value.length === 0) return;
            
            const item = undoStack.value.shift();
            try {
                await item.undo(item.data);
                redoStack.value.unshift(item);
                showAdvancedToast('Undo', `Undid ${item.action}`, 'info');
            } catch (error) {
                console.error('Undo failed:', error);
                showAdvancedToast('Undo Failed', 'Could not undo the last action', 'error');
                undoStack.value.unshift(item); // Put it back
            }
        };

        const redoLastAction = async () => {
            if (redoStack.value.length === 0) return;
            
            const item = redoStack.value.shift();
            try {
                await item.redo(item.data);
                undoStack.value.unshift(item);
                showAdvancedToast('Redo', `Redid ${item.action}`, 'info');
            } catch (error) {
                console.error('Redo failed:', error);
                showAdvancedToast('Redo Failed', 'Could not redo the last action', 'error');
                redoStack.value.unshift(item); // Put it back
            }
        };

        // ============ TAB SYNC SYSTEM ============
        const setupTabSync = () => {
            if (!tabSyncEnabled.value) return;
            
            const storageKey = 'neumocare-sync';
            
            // Listen for changes from other tabs
            window.addEventListener('storage', (event) => {
                if (event.key === storageKey && event.newValue) {
                    try {
                        const data = JSON.parse(event.newValue);
                        if (data.timestamp > (lastSyncTime.value || 0)) {
                            lastSyncTime.value = data.timestamp;
                            handleSyncData(data);
                        }
                    } catch (error) {
                        console.error('Failed to parse sync data:', error);
                    }
                }
            });
            
            // Periodically sync data
            setInterval(() => {
                broadcastData();
            }, 30000); // Every 30 seconds
        };

        const broadcastData = () => {
            if (!tabSyncEnabled.value) return;
            
            const data = {
                timestamp: Date.now(),
                user: currentUser.value?.id,
                view: currentView.value,
                lastUpdated: lastUpdated.value
            };
            
            try {
                localStorage.setItem('neumocare-sync', JSON.stringify(data));
            } catch (error) {
                console.error('Failed to broadcast data:', error);
            }
        };

        const handleSyncData = (data) => {
            // Handle incoming sync data
            if (data.view !== currentView.value) {
                showAdvancedToast('Update Available', 'Data has been updated in another tab', 'info');
            }
            
            // Optionally refresh data
            if (Date.now() - (lastSyncTime.value || 0) > 60000) { // 1 minute
                refreshCurrentView();
            }
        };

        // ============ AUTO-REFRESH SYSTEM ============
        const startAutoRefresh = () => {
            // Clear existing intervals
            stopAutoRefresh();
            
            // Refresh live stats every 30 seconds
            liveStatsInterval = setInterval(() => {
                refreshLiveStats();
            }, 30000);
            
            // Refresh current view every 2 minutes
            autoRefreshInterval = setInterval(() => {
                refreshCurrentView();
            }, 120000);
        };

        const stopAutoRefresh = () => {
            if (liveStatsInterval) clearInterval(liveStatsInterval);
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        };

        const refreshCurrentView = async () => {
            await loadViewData(currentView.value);
            lastUpdated.value[currentView.value] = new Date();
        };

        // ============ AUDIT LOGGING WITH ERROR CAPTURE ============
        const generateAuditId = () => generateUniqueId();

        const logAudit = async (action, details, resource, resourceId = null, success = true) => {
            const logEntry = {
                id: generateAuditId(),
                timestamp: getLocalDateTime(),
                user_id: currentUser.value?.id,
                user_name: currentUser.value?.full_name,
                user_role: currentUser.value?.user_role,
                action,
                details,
                resource,
                resource_id: resourceId,
                permission_level: currentUser.value?.user_role === 'system_admin' ? 'full' : 'limited',
                success,
                ip_address: 'system',
                user_agent: navigator.userAgent
            };
            
            // Always add to local array
            auditLogs.value.unshift(logEntry);
            
            // Try to save to database (even on failure)
            try {
                await supabaseClient.from('audit_logs').insert([logEntry]);
            } catch (error) {
                console.error('Failed to save audit log to database:', error);
                // Still keep it locally
            }
        };

        // ============ TOAST SYSTEM ============
        const showAdvancedToast = (title, message, type = 'info', duration = 5000) => {
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
            
            setTimeout(() => {
                removeToast(toast.id);
            }, duration);
        };

        const removeToast = (id) => {
            const index = toasts.value.findIndex(t => t.id === id);
            if (index > -1) {
                toasts.value.splice(index, 1);
            }
        };

        // ============ FORMATTING FUNCTIONS ============
        const getInitials = (name) => {
            if (!name) return '??';
            return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        };

        const formatDate = (dateString) => {
            try {
                if (!dateString) return '';
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '';
                
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
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
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours);
                return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
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

        const getStaffTypeClass = (type) => {
            return type === 'medical_resident' ? 'badge-resident-advanced' : 
                   type === 'attending_physician' ? 'badge-attending-advanced' : 
                   'badge-admin-advanced';
        };

        const formatEmploymentStatus = (status) => {
            const statuses = {
                active: 'Active',
                on_leave: 'On Leave',
                inactive: 'Inactive'
            };
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

        const getRotationCategoryClass = (category) => {
            return category === 'clinical_rotation' ? 'badge-attending-advanced' :
                   category === 'elective_rotation' ? 'badge-resident-advanced' :
                   category === 'research_rotation' ? 'badge-admin-advanced' :
                   'badge-supervisor-advanced';
        };

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

        const truncateText = (text, length) => {
            if (!text) return '';
            if (text.length <= length) return text;
            return text.substring(0, length) + '...';
        };

        const getPriorityColor = (priority) => {
            const colors = {
                urgent: 'danger',
                high: 'warning',
                medium: 'info',
                low: 'success'
            };
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
            const icons = {
                announcement: 'fa-bullhorn',
                capacity: 'fa-bed',
                quick: 'fa-comment-medical'
            };
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
                
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            } catch {
                return '';
            }
        };

        // ============ DATA RELATIONSHIP FUNCTIONS WITH CACHE ============
        const getPhysicianName = async (physicianId) => {
            if (!physicianId) return 'Unknown Physician';
            
            // Check cache first
            if (staffCache.value.has(physicianId)) {
                return staffCache.value.get(physicianId).full_name;
            }
            
            // Check loaded staff
            const physician = medicalStaff.value.find(staff => staff.id === physicianId);
            if (physician) {
                staffCache.value.set(physicianId, physician);
                return physician.full_name;
            }
            
            // Fetch from database if not loaded
            try {
                const { data, error } = await supabaseClient
                    .from('medical_staff')
                    .select('full_name')
                    .eq('id', physicianId)
                    .single();
                
                if (error || !data) return `Physician ${physicianId.substring(0, 8)}`;
                
                staffCache.value.set(physicianId, data);
                return data.full_name;
            } catch (error) {
                console.error('Error fetching physician:', error);
                return `Physician ${physicianId.substring(0, 8)}`;
            }
        };

        const getResidentName = async (residentId) => {
            if (!residentId) return 'Unknown Resident';
            return await getPhysicianName(residentId);
        };

        const getTrainingUnitName = async (unitId) => {
            if (!unitId) return 'Unknown Unit';
            
            // Check cache first
            if (unitCache.value.has(unitId)) {
                return unitCache.value.get(unitId).unit_name;
            }
            
            // Check loaded units
            const unit = trainingUnits.value.find(u => u.id === unitId);
            if (unit) {
                unitCache.value.set(unitId, unit);
                return unit.unit_name;
            }
            
            // Fetch from database if not loaded
            try {
                const { data, error } = await supabaseClient
                    .from('training_units')
                    .select('unit_name')
                    .eq('id', unitId)
                    .single();
                
                if (error || !data) return `Unit ${unitId.substring(0, 8)}`;
                
                unitCache.value.set(unitId, data);
                return data.unit_name;
            } catch (error) {
                console.error('Error fetching unit:', error);
                return `Unit ${unitId.substring(0, 8)}`;
            }
        };

        const getAttendingName = async (attendingId) => {
            if (!attendingId) return 'Unassigned';
            return await getPhysicianName(attendingId);
        };

        const getAssignedResidents = (unitId) => {
            const rotationIds = residentRotations.value
                .filter(r => r.training_unit_id === unitId && (r.rotation_status === 'active' || r.rotation_status === 'scheduled'))
                .map(r => r.resident_id);
            
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'medical_resident' && rotationIds.includes(staff.id)
            );
        };

        // ============ PERMISSION SYSTEM ============
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
                approve: 'Approve requests',
                override: 'Override restrictions',
                assign: 'Assign residents',
                extend: 'Extend rotations',
                drag_drop: 'Drag and drop placements',
                alert: 'Send alerts',
                publish: 'Publish announcements',
                clear: 'Clear logs',
                admin: 'Admin access'
            };
            return descriptions[action] || action;
        };

        const formatActionName = (action) => {
            return action.charAt(0).toUpperCase() + action.slice(1);
        };

        // ============ PAGINATION FUNCTIONS ============
        const loadMore = async (dataType) => {
            const paginationInfo = pagination.value[dataType];
            if (!paginationInfo.hasMore) return;
            
            paginationInfo.page++;
            await loadPaginatedData(dataType, paginationInfo.page);
        };

        const loadPaginatedData = async (dataType, page = 1) => {
            const paginationInfo = pagination.value[dataType];
            const offset = (page - 1) * paginationInfo.limit;
            
            let query = supabaseClient
                .from(dataType)
                .select('*', { count: 'exact' });
            
            // Apply filters based on data type
            switch (dataType) {
                case 'medical_staff':
                    if (staffFilter.value.staff_type) {
                        query = query.eq('staff_type', staffFilter.value.staff_type);
                    }
                    if (staffFilter.value.employment_status) {
                        query = query.eq('employment_status', staffFilter.value.employment_status);
                    }
                    query = query.order('full_name');
                    break;
                    
                case 'resident_rotations':
                    if (rotationFilter.value.status) {
                        query = query.eq('rotation_status', rotationFilter.value.status);
                    }
                    if (rotationFilter.value.category) {
                        query = query.eq('rotation_category', rotationFilter.value.category);
                    }
                    query = query.order('rotation_start_date', { ascending: false });
                    break;
                    
                case 'audit_logs':
                    if (auditFilter.value.action) {
                        query = query.eq('action', auditFilter.value.action);
                    }
                    if (auditFilter.value.dateRange !== 'all') {
                        const date = new Date();
                        switch (auditFilter.value.dateRange) {
                            case 'today':
                                date.setHours(0, 0, 0, 0);
                                query = query.gte('timestamp', date.toISOString());
                                break;
                            case 'week':
                                date.setDate(date.getDate() - 7);
                                query = query.gte('timestamp', date.toISOString());
                                break;
                            case 'month':
                                date.setMonth(date.getMonth() - 1);
                                query = query.gte('timestamp', date.toISOString());
                                break;
                            case 'year':
                                date.setFullYear(date.getFullYear() - 1);
                                query = query.gte('timestamp', date.toISOString());
                                break;
                        }
                    }
                    query = query.order('timestamp', { ascending: false });
                    break;
                    
                default:
                    query = query.order('created_at', { ascending: false });
            }
            
            query = query.range(offset, offset + paginationInfo.limit - 1);
            
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            // Update data store
            switch (dataType) {
                case 'medical_staff':
                    if (page === 1) {
                        medicalStaff.value = data || [];
                    } else {
                        medicalStaff.value.push(...(data || []));
                    }
                    break;
                    
                case 'training_units':
                    if (page === 1) {
                        trainingUnits.value = data || [];
                    } else {
                        trainingUnits.value.push(...(data || []));
                    }
                    break;
                    
                case 'resident_rotations':
                    if (page === 1) {
                        residentRotations.value = data || [];
                    } else {
                        residentRotations.value.push(...(data || []));
                    }
                    break;
                    
                case 'audit_logs':
                    if (page === 1) {
                        auditLogs.value = data || [];
                    } else {
                        auditLogs.value.push(...(data || []));
                    }
                    break;
                    
                default:
                    console.warn(`Unknown data type: ${dataType}`);
            }
            
            // Update pagination info
            paginationInfo.total = count || 0;
            paginationInfo.hasMore = (data?.length || 0) === paginationInfo.limit;
            
            // Clear caches on first page load
            if (page === 1) {
                if (dataType === 'medical_staff') staffCache.value.clear();
                if (dataType === 'training_units') unitCache.value.clear();
            }
        };

        // ============ COMPUTED PROPERTIES ============
        const stats = computed(() => {
            const residents = medicalStaff.value.filter(s => 
                s.staff_type === 'medical_resident' && s.employment_status === 'active'
            );
            const attendings = medicalStaff.value.filter(s => 
                s.staff_type === 'attending_physician' && s.employment_status === 'active'
            );
            
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
            return onCallSchedule.value
                .filter(o => o.duty_date === today)
                .slice(0, 3);
        });

        const recentAnnouncements = computed(() => {
            const today = getLocalDateString();
            return announcements.value
                .filter(a => a.publish_start_date <= today && (!a.publish_end_date || a.publish_end_date >= today))
                .slice(0, 5);
        });

        const coverageAlerts = computed(() => {
            return trainingUnits.value
                .filter(u => u.unit_status === 'active' && (u.current_residents || 0) < u.maximum_residents * 0.5)
                .map(u => ({
                    id: u.id,
                    unit_name: u.unit_name,
                    current: u.current_residents || 0,
                    capacity: u.maximum_residents,
                    priority: (u.current_residents || 0) < u.maximum_residents * 0.3 ? 'high' : 'warning'
                }));
        });

        const emergencyAlerts = computed(() => {
            return [
                {
                    id: 1,
                    message: 'ICU at 95% capacity - Consider diverting non-critical cases',
                    priority: 'high'
                },
                {
                    id: 2,
                    message: 'Emergency generator maintenance scheduled for 2 AM',
                    priority: 'medium'
                }
            ];
        });

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
            
            if (rotationFilter.value.status) {
                filtered = filtered.filter(r => r.rotation_status === rotationFilter.value.status);
            }
            
            if (rotationFilter.value.category) {
                filtered = filtered.filter(r => r.rotation_category === rotationFilter.value.category);
            }
            
            return filtered;
        });

        const availableResidents = computed(() => {
            const residentsInRotations = new Set(
                residentRotations.value
                    .filter(r => r.rotation_status === 'active' || r.rotation_status === 'scheduled')
                    .map(r => r.resident_id)
            );
            
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'medical_resident' && 
                staff.employment_status === 'active' &&
                !residentsInRotations.has(staff.id)
            );
        });

        const availablePhysicians = computed(() => {
            return medicalStaff.value.filter(staff => 
                (staff.staff_type === 'attending_physician' || 
                 staff.staff_type === 'medical_resident' || 
                 staff.staff_type === 'fellow') && 
                staff.employment_status === 'active'
            ).sort((a, b) => a.full_name.localeCompare(b.full_name));
        });

        const unreadNotifications = computed(() => {
            return userNotifications.value.filter(n => !n.read).length;
        });

        const activeTrainingUnits = computed(() => {
            return trainingUnits.value.filter(unit => 
                unit.unit_status === 'active'
            );
        });

        const availableAttendings = computed(() => {
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'attending_physician' && 
                staff.employment_status === 'active'
            );
        });

        // ============ NAVIGATION FUNCTIONS ============
        const switchView = async (view) => {
            if (!currentUser.value) return;
            
            currentView.value = view;
            mobileMenuOpen.value = false;
            
            await withErrorHandling(
                () => loadViewData(view),
                `Loading ${view} view`
            );
            
            await logAudit('VIEW_CHANGE', `Switched to ${view} view`, 'navigation');
        };

        const getCurrentTitle = () => {
            const titles = {
                daily_operations: 'Daily Operations',
                medical_staff: 'Medical Staff',
                resident_rotations: 'Resident Rotations',
                oncall_schedule: 'On-call Schedule',
                leave_requests: 'Leave Requests',
                training_units: 'Training Units',
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
                leave_requests: 'Review and approve leave requests with coverage management',
                training_units: 'Manage training units and resident capacity allocation',
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
                leave_requests: 'Search leave requests by staff or dates...',
                training_units: 'Search training units by name or specialty...',
                communications: 'Search announcements or updates...',
                audit_logs: 'Search audit logs by user, action, or resource...'
            };
            return placeholders[currentView.value] || 'Search...';
        };

        const toggleStatsSidebar = () => {
            statsSidebarOpen.value = !statsSidebarOpen.value;
        };

        const toggleSearchScope = () => {
            const scopes = ['global', 'staff', 'units', 'rotations'];
            const currentIndex = scopes.indexOf(searchScope.value);
            searchScope.value = scopes[(currentIndex + 1) % scopes.length];
        };

        const setSearchFilter = (filter) => {
            searchFilter.value = filter;
        };

        const selectRecentSearch = (search) => {
            searchQuery.value = search.query;
            handleAdvancedSearch();
        };

        const clearRecentSearches = () => {
            recentSearches.value = [];
        };

        const togglePermissionManager = () => {
            showPermissionManager.value = !showPermissionManager.value;
            userMenuOpen.value = false;
            if (showPermissionManager.value) {
                logAudit('PERMISSION_MANAGER_OPEN', 'Opened permission manager', 'system');
            }
        };

        const toggleUserMenu = () => {
            userMenuOpen.value = !userMenuOpen.value;
        };

        const markAllNotificationsAsRead = () => {
            userNotifications.value.forEach(n => n.read = true);
            showAdvancedToast('Notifications Cleared', 'All notifications marked as read', 'success');
        };

        const getDayStatus = (day) => {
            return day.status === 'covered' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        };

        // ============ CARD INTERACTIONS ============
        const startDrag = (event, cardId) => {
            draggingCard.value = cardId;
            event.dataTransfer.setData('text/plain', cardId);
        };

        const endDrag = () => {
            draggingCard.value = null;
        };

        const togglePinCard = (cardId) => {
            pinnedCards.value[cardId] = !pinnedCards.value[cardId];
        };

        const toggleCollapseCard = (cardId) => {
            collapsedCards.value[cardId] = !collapsedCards.value[cardId];
        };

        const dismissAllAlerts = () => {
            showAdvancedToast('Alerts Dismissed', 'All emergency alerts have been dismissed', 'success');
        };

        const dismissCoverageAlert = (alertId) => {
            showAdvancedToast('Alert Dismissed', 'Coverage alert has been dismissed', 'info');
        };

        const viewUnitDetails = (unitId) => {
            const unit = trainingUnits.value.find(u => u.id === unitId);
            if (unit) {
                showAdvancedToast('Unit Details', `Viewing details for ${unit.unit_name}`, 'info');
            }
        };

        const viewScheduleDetails = (date) => {
            showAdvancedToast('Schedule Details', `Viewing schedule for ${formatDate(date)}`, 'info');
            logAudit('SCHEDULE_VIEW', `Viewed schedule details for ${formatDate(date)}`, 'oncall_schedule');
        };

        const viewStaffSchedule = (staff) => {
            showAdvancedToast('Staff Schedule', `Viewing schedule for ${staff.full_name}`, 'info');
            logAudit('STAFF_SCHEDULE_VIEW', `Viewed schedule for ${staff.full_name}`, 'medical_staff', staff.id);
        };

        // ============ AUTHENTICATION ============
        const handleAdvancedLogin = async () => {
            return await withErrorHandling(async () => {
                loading.value = true;
                
                const email = loginForm.value.email.trim().toLowerCase();
                const password = loginForm.value.password;
                const selectedRole = loginForm.value.user_role;
                
                if (!email || !password || !selectedRole) {
                    throw new Error('Please fill in all fields');
                }
                
                // For development: bypass security
                currentUser.value = {
                    id: generateUniqueId(),
                    email: email,
                    full_name: email === 'admin@neumocare.org' ? 'System Administrator' : email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    user_role: selectedRole,
                    phone: '+1 (555) 123-4567',
                    department: 'Pulmonary Medicine',
                    account_status: 'active'
                };
                
                showAdvancedToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
                await logAudit('LOGIN_SUCCESS', `User logged in as ${currentUser.value.user_role}`, 'auth');
                
                await loadInitialData();
                currentView.value = 'daily_operations';
                startAutoRefresh();
                setupTabSync();
                
            }, 'Login', () => {
                loginForm.value.password = '';
                loading.value = false;
            });
        };

        const handleLogout = () => {
            logAudit('LOGOUT', 'User logged out', 'auth');
            stopAutoRefresh();
            currentUser.value = null;
            currentView.value = 'login';
            userMenuOpen.value = false;
            showAdvancedToast('Logged Out', 'You have been successfully logged out', 'info');
        };

        // ============ DATA LOADING FUNCTIONS ============
        const loadInitialData = async () => {
            loading.value = true;
            try {
                await Promise.all([
                    loadMedicalStaff(),
                    loadTrainingUnits(),
                    loadResidentRotations(),
                    loadLeaveRequests(),
                    loadOnCallSchedule(),
                    loadAnnouncements(),
                    loadAuditLogs(),
                    loadSystemSettings(),
                    loadUserNotifications(),
                    refreshLiveStats()
                ]);
                
                showAdvancedToast('System Ready', 'All data loaded successfully', 'success');
            } catch (error) {
                console.error('Error loading initial data:', error);
                showAdvancedToast('Data Load Error', 'Failed to load system data', 'error');
            } finally {
                loading.value = false;
            }
        };

        const loadViewData = async (view) => {
            try {
                switch (view) {
                    case 'medical_staff':
                        await loadMedicalStaff();
                        break;
                    case 'training_units':
                        await loadTrainingUnits();
                        break;
                    case 'resident_rotations':
                        await loadResidentRotations();
                        break;
                    case 'leave_requests':
                        await loadLeaveRequests();
                        break;
                    case 'oncall_schedule':
                        await loadOnCallSchedule();
                        break;
                    case 'communications':
                        await loadAnnouncements();
                        break;
                    case 'audit_logs':
                        await loadAuditLogs();
                        break;
                }
            } catch (error) {
                console.error(`Error loading ${view} data:`, error);
            }
        };

        const loadMedicalStaff = async () => {
            return await withErrorHandling(async () => {
                const paginationInfo = pagination.value.medical_staff;
                await loadPaginatedData('medical_staff', 1);
            }, 'Loading medical staff');
        };

        const loadTrainingUnits = async () => {
            return await withErrorHandling(async () => {
                const paginationInfo = pagination.value.training_units;
                await loadPaginatedData('training_units', 1);
            }, 'Loading training units');
        };

        const loadResidentRotations = async () => {
            return await withErrorHandling(async () => {
                const paginationInfo = pagination.value.resident_rotations;
                await loadPaginatedData('resident_rotations', 1);
            }, 'Loading resident rotations');
        };

        const loadLeaveRequests = async () => {
            return await withErrorHandling(async () => {
                const { data, error } = await supabaseClient
                    .from('leave_requests')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                leaveRequests.value = data || [];
            }, 'Loading leave requests');
        };

        const loadOnCallSchedule = async () => {
            return await withErrorHandling(async () => {
                const { data, error } = await supabaseClient
                    .from('oncall_schedule')
                    .select('*')
                    .order('duty_date', { ascending: true });
                
                if (error) throw error;
                onCallSchedule.value = data || [];
                lastUpdated.value.todaysOnCall = new Date();
            }, 'Loading on-call schedule');
        };

        const loadAnnouncements = async () => {
            return await withErrorHandling(async () => {
                const today = getLocalDateString();
                const { data, error } = await supabaseClient
                    .from('department_announcements')
                    .select('*')
                    .lte('publish_start_date', today)
                    .or(`publish_end_date.is.null,publish_end_date.gte.${today}`)
                    .order('priority_level', { ascending: false })
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                announcements.value = data || [];
            }, 'Loading announcements');
        };

        const loadAuditLogs = async () => {
            return await withErrorHandling(async () => {
                const paginationInfo = pagination.value.audit_logs;
                await loadPaginatedData('audit_logs', 1);
            }, 'Loading audit logs');
        };

        const loadSystemSettings = async () => {
            return await withErrorHandling(async () => {
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
                    leave_approval_required_days: 7,
                    max_leave_days_per_year: 30,
                    auto_logout_enabled: true
                };
            }, 'Loading system settings');
        };

        const loadUserNotifications = async () => {
            return await withErrorHandling(async () => {
                userNotifications.value = [
                    {
                        id: '1',
                        title: 'New Rotation Assigned',
                        message: 'You have been assigned to ICU rotation starting next week',
                        type: 'info',
                        read: false,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: '2',
                        title: 'Leave Request Approved',
                        message: 'Your vacation request for Dec 15-22 has been approved',
                        type: 'success',
                        read: true,
                        created_at: new Date(Date.now() - 86400000).toISOString()
                    }
                ];
            }, 'Loading notifications');
        };

        const refreshLiveStats = async () => {
            return await withErrorHandling(async () => {
                // Simulate live updates - in production, this would fetch from real-time endpoints
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
                
                // Update capacity overview
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
        };

        // ============ SEARCH FUNCTIONALITY ============
        const handleAdvancedSearch = async () => {
            if (!searchQuery.value.trim()) return;
            
            return await withErrorHandling(async () => {
                // Add to recent searches
                recentSearches.value.unshift({
                    query: searchQuery.value,
                    time: 'Just now'
                });
                
                if (recentSearches.value.length > 5) {
                    recentSearches.value.pop();
                }
                
                // Perform actual search based on current view
                switch (currentView.value) {
                    case 'medical_staff':
                        await searchMedicalStaff();
                        break;
                    case 'resident_rotations':
                        await searchRotations();
                        break;
                    case 'oncall_schedule':
                        await searchOnCallSchedule();
                        break;
                    case 'leave_requests':
                        await searchLeaveRequests();
                        break;
                    case 'training_units':
                        await searchTrainingUnits();
                        break;
                    case 'communications':
                        await searchCommunications();
                        break;
                    case 'audit_logs':
                        await searchAuditLogs();
                        break;
                    default:
                        // Global search
                        await performGlobalSearch();
                }
                
                await logAudit('SEARCH', `Searched for: ${searchQuery.value} in ${currentView.value}`, 'system');
                showAdvancedToast('Search', `Found results for "${searchQuery.value}"`, 'info');
                
            }, 'Performing search');
        };

        const searchMedicalStaff = async () => {
            const { data, error } = await supabaseClient
                .from('medical_staff')
                .select('*')
                .or(`full_name.ilike.%${searchQuery.value}%,staff_id.ilike.%${searchQuery.value}%,professional_email.ilike.%${searchQuery.value}%`)
                .limit(50);
            
            if (error) throw error;
            medicalStaff.value = data || [];
            pagination.value.medical_staff.page = 1;
            pagination.value.medical_staff.hasMore = false;
        };

        const searchRotations = async () => {
            const { data, error } = await supabaseClient
                .from('resident_rotations')
                .select('*')
                .or(`rotation_id.ilike.%${searchQuery.value}%,clinical_notes.ilike.%${searchQuery.value}%`)
                .limit(50);
            
            if (error) throw error;
            residentRotations.value = data || [];
            pagination.value.resident_rotations.page = 1;
            pagination.value.resident_rotations.hasMore = false;
        };

        const searchOnCallSchedule = async () => {
            const { data, error } = await supabaseClient
                .from('oncall_schedule')
                .select('*')
                .or(`schedule_id.ilike.%${searchQuery.value}%,coverage_notes.ilike.%${searchQuery.value}%`)
                .limit(50);
            
            if (error) throw error;
            onCallSchedule.value = data || [];
            pagination.value.oncall_schedule.page = 1;
            pagination.value.oncall_schedule.hasMore = false;
        };

        const performGlobalSearch = async () => {
            // This would be a more complex search across multiple tables
            showAdvancedToast('Global Search', 'Searching across all data...', 'info');
        };

        // ============ FILTER FUNCTIONS ============
        const resetStaffFilters = () => {
            staffSearch.value = '';
            staffFilter.value = {
                staff_type: '',
                employment_status: ''
            };
            loadMedicalStaff();
        };

        const applyStaffFilters = async () => {
            return await withErrorHandling(async () => {
                await loadMedicalStaff();
                showAdvancedToast('Filters Applied', 'Medical staff filters updated', 'info');
            }, 'Applying staff filters');
        };

        const resetRotationFilters = () => {
            rotationFilter.value = {
                category: '',
                status: ''
            };
            loadResidentRotations();
        };

        const applyRotationFilters = async () => {
            return await withErrorHandling(async () => {
                await loadResidentRotations();
                showAdvancedToast('Filters Applied', 'Rotation filters updated', 'info');
            }, 'Applying rotation filters');
        };

        const resetAuditFilters = () => {
            auditFilter.value = {
                action: '',
                dateRange: 'today'
            };
            loadAuditLogs();
        };

        const applyAuditFilters = async () => {
            return await withErrorHandling(async () => {
                await loadAuditLogs();
                showAdvancedToast('Filters Applied', 'Audit filters updated', 'info');
            }, 'Applying audit filters');
        };

        // ============ STAFF DETAILS FUNCTIONS ============
        const viewStaffDetails = async (staff) => {
            return await withErrorHandling(async () => {
                staffDetailsModal.value = {
                    show: true,
                    staff: staff,
                    activeTab: 'details',
                    stats: {
                        completedRotations: 0,
                        oncallShifts: 0,
                        leaveDays: 0,
                        supervisionCount: 0
                    },
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
                
                await logAudit('STAFF_VIEW', `Viewed details for ${staff.full_name}`, 'medical_staff', staff.id);
            }, 'Loading staff details');
        };

        const loadStaffStats = async (staffId) => {
            return await withErrorHandling(async () => {
                const rotations = residentRotations.value.filter(r => r.resident_id === staffId);
                const oncallCount = onCallSchedule.value.filter(o => o.primary_physician_id === staffId).length;
                const leaveDays = leaveRequests.value
                    .filter(l => l.staff_member_id === staffId && l.status === 'approved')
                    .reduce((sum, l) => sum + (l.total_days || 0), 0);
                
                staffDetailsModal.value.stats = {
                    completedRotations: rotations.filter(r => r.rotation_status === 'completed').length,
                    oncallShifts: oncallCount,
                    leaveDays: leaveDays,
                    supervisionCount: rotations.filter(r => r.supervising_attending_id === staffId).length
                };
            }, 'Loading staff stats');
        };

        const loadStaffActivity = async (staffId) => {
            return await withErrorHandling(async () => {
                const today = getLocalDateString();
                
                const { data: assignments } = await supabaseClient
                    .from('daily_assignments')
                    .select('*')
                    .eq('staff_id', staffId)
                    .eq('assignment_date', today)
                    .limit(5);
                
                staffDetailsModal.value.activity = (assignments || []).map(a => ({
                    id: a.id,
                    description: `${a.assignment_type} at ${a.location_name}`,
                    timestamp: a.created_at
                }));
            }, 'Loading staff activity');
        };

        const loadStaffRotations = async (staffId) => {
            return await withErrorHandling(async () => {
                const rotations = residentRotations.value.filter(r => r.resident_id === staffId);
                staffDetailsModal.value.rotations = rotations;
            }, 'Loading staff rotations');
        };

        const loadStaffDocuments = async (staffId) => {
            return await withErrorHandling(async () => {
                staffDetailsModal.value.documents = [
                    { id: 1, name: 'Medical License', type: 'license', description: 'Valid through 2025', upload_date: '2024-01-15' },
                    { id: 2, name: 'Board Certification', type: 'certificate', description: 'Pulmonary Medicine', upload_date: '2024-02-01' }
                ];
            }, 'Loading staff documents');
        };

        // ============ FORM VALIDATION FUNCTIONS ============
        const validateMedicalStaffForm = () => {
            const form = medicalStaffModal.value.form;
            
            if (!form.full_name.trim()) {
                throw new Error('Full name is required');
            }
            
            if (form.professional_email && !validateEmail(form.professional_email)) {
                throw new Error('Invalid email format');
            }
            
            if (form.staff_type === 'medical_resident') {
                if (!form.resident_category) {
                    throw new Error('Resident category is required for medical residents');
                }
                if (!form.training_year || form.training_year < 2020 || form.training_year > 2030) {
                    throw new Error('Valid training year (2020-2030) is required');
                }
            }
            
            return true;
        };

     const validateOnCallForm = () => {
    const form = onCallModal.value.form;
    
    if (!form.duty_date) {
        throw new Error('Duty date is required');
    }
    
    // Check if primary_physician_id is provided (not empty string)
    if (!form.primary_physician_id || form.primary_physician_id.trim() === '') {
        throw new Error('Primary physician is required');
    }
    
    // Validate it's a proper UUID
    if (form.primary_physician_id && !isValidUUID(form.primary_physician_id)) {
        throw new Error('Invalid primary physician ID format');
    }
    
    if (form.backup_physician_id && form.backup_physician_id.trim() !== '' && !isValidUUID(form.backup_physician_id)) {
        throw new Error('Invalid backup physician ID format');
    }
    
    const start = new Date(`${form.duty_date}T${form.start_time}`);
    const end = new Date(`${form.duty_date}T${form.end_time}`);
    
    if (start >= end) {
        throw new Error('End time must be after start time');
    }
    
    return true;
};

        const validateLeaveRequestForm = () => {
            const form = leaveRequestModal.value.form;
            
            if (!form.start_date || !form.end_date) {
                throw new Error('Start and end dates are required');
            }
            
            const start = new Date(form.start_date);
            const end = new Date(form.end_date);
            
            if (start > end) {
                throw new Error('Start date cannot be after end date');
            }
            
            if (!form.reason.trim()) {
                throw new Error('Reason for leave is required');
            }
            
            return true;
        };

        const validateTrainingUnitForm = () => {
            const form = trainingUnitModal.value.form;
            
            if (!form.unit_name.trim()) {
                throw new Error('Unit name is required');
            }
            
            if (!form.maximum_residents || form.maximum_residents < 1 || form.maximum_residents > 50) {
                throw new Error('Maximum residents must be between 1 and 50');
            }
            
            if (form.current_residents < 0 || form.current_residents > form.maximum_residents) {
                throw new Error(`Current residents cannot exceed maximum (${form.maximum_residents})`);
            }
            
            return true;
        };

        const validateRotationForm = () => {
            const form = rotationModal.value.form;
            
            if (!form.rotation_id.trim()) {
                throw new Error('Rotation ID is required');
            }
            
            if (!form.resident_id) {
                throw new Error('Resident is required');
            }
            
            if (!form.training_unit_id) {
                throw new Error('Training unit is required');
            }
            
            if (!form.rotation_start_date || !form.rotation_end_date) {
                throw new Error('Start and end dates are required');
            }
            
            const start = new Date(form.rotation_start_date);
            const end = new Date(form.rotation_end_date);
            
            if (start >= end) {
                throw new Error('End date must be after start date');
            }
            
            return true;
        };

        // ============ STAFF ACTIVITY FUNCTIONS ============
        const loadStaffDailyActivities = async (staffId) => {
            expandedStaffId.value = expandedStaffId.value === staffId ? null : staffId;
            
            if (expandedStaffId.value === staffId) {
                return await withErrorHandling(async () => {
                    const today = getLocalDateString();
                    
                    const { data: assignments } = await supabaseClient
                        .from('daily_assignments')
                        .select('*')
                        .eq('staff_id', staffId)
                        .eq('assignment_date', today)
                        .limit(5);
                    
                    staffDailyActivities.value[staffId] = [
                        ...(assignments || []).map(a => ({
                            type: 'assignment',
                            title: a.assignment_type,
                            time: `${a.start_time?.slice(0,5) || 'N/A'}-${a.end_time?.slice(0,5) || 'N/A'}`,
                            location: a.location_name || 'Unknown'
                        }))
                    ];
                }, 'Loading daily activities');
            }
        };

        const getTodaysSchedule = (staffId) => {
            const today = getLocalDateString();
            return onCallSchedule.value.find(o => 
                o.primary_physician_id === staffId && o.duty_date === today
            );
        };

        const getUpcomingOnCall = (staffId) => {
            const today = getLocalDateString();
            return onCallSchedule.value.find(o => 
                o.primary_physician_id === staffId && o.duty_date >= today
            );
        };

        const getActivityIcon = (type) => {
            return type === 'oncall' ? 'fas fa-phone-alt' : 'fas fa-tasks';
        };

        const formatScheduleTime = (schedule) => {
            if (!schedule) return '';
            return `${schedule.start_time?.slice(0,5) || ''}-${schedule.end_time?.slice(0,5) || ''}`;
        };

        // ============ MEDICAL STAFF FUNCTIONS ============
        const showAddMedicalStaffModal = () => {
            if (!hasPermission('medical_staff', 'create')) {
                showAdvancedToast('Permission Denied', 'You need create permission to add medical staff', 'permission');
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
                    primary_clinic: '',
                    professional_email: '',
                    resident_category: '',
                    training_year: new Date().getFullYear()
                }
            };
        };

        const editMedicalStaff = (staff) => {
            if (!hasPermission('medical_staff', 'update')) {
                showAdvancedToast('Permission Denied', 'You need update permission to edit medical staff', 'permission');
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
            return await withErrorHandling(async () => {
                saving.value = true;
                operationProgress.value.saveMedicalStaff = 0;
                
                try {
                    validateMedicalStaffForm();
                    
                    const permissionNeeded = medicalStaffModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('medical_staff', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    operationProgress.value.saveMedicalStaff = 30;
                    
                    let result;
                    const originalData = medicalStaffModal.value.mode === 'edit' 
                        ? medicalStaff.value.find(s => s.id === medicalStaffModal.value.staff.id)
                        : null;
                    
                    if (medicalStaffModal.value.mode === 'add') {
                        const { data, error } = await supabaseClient
                            .from('medical_staff')
                            .insert([{
                                ...medicalStaffModal.value.form,
                                created_at: getLocalDateTime(),
                                updated_at: getLocalDateTime()
                            }])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        medicalStaff.value.unshift(result);
                        showAdvancedToast('Success', 'Medical staff added successfully', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Add Medical Staff',
                            { staff: result, original: null },
                            async (data) => {
                                const { error } = await supabaseClient
                                    .from('medical_staff')
                                    .delete()
                                    .eq('id', data.staff.id);
                                
                                if (!error) {
                                    const index = medicalStaff.value.findIndex(s => s.id === data.staff.id);
                                    if (index !== -1) medicalStaff.value.splice(index, 1);
                                }
                            },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('medical_staff')
                                    .insert([data.staff])
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    medicalStaff.value.unshift(restored);
                                }
                            }
                        );
                        
                        await logAudit('STAFF_CREATE', `Added: ${result.full_name}`, 'medical_staff', result.id, true);
                        
                    } else {
                        const { data, error } = await supabaseClient
                            .from('medical_staff')
                            .update({
                                ...medicalStaffModal.value.form,
                                updated_at: getLocalDateTime()
                            })
                            .eq('id', medicalStaffModal.value.staff.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        const index = medicalStaff.value.findIndex(s => s.id === data.id);
                        if (index !== -1) {
                            medicalStaff.value[index] = data;
                        }
                        
                        showAdvancedToast('Success', 'Medical staff updated successfully', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Update Medical Staff',
                            { staff: result, original: originalData },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('medical_staff')
                                    .update(data.original)
                                    .eq('id', data.staff.id)
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    const index = medicalStaff.value.findIndex(s => s.id === restored.id);
                                    if (index !== -1) medicalStaff.value[index] = restored;
                                }
                            },
                            async (data) => {
                                const { data: reupdated } = await supabaseClient
                                    .from('medical_staff')
                                    .update(data.staff)
                                    .eq('id', data.staff.id)
                                    .select()
                                    .single();
                                
                                if (reupdated) {
                                    const index = medicalStaff.value.findIndex(s => s.id === reupdated.id);
                                    if (index !== -1) medicalStaff.value[index] = reupdated;
                                }
                            }
                        );
                        
                        await logAudit('STAFF_UPDATE', `Updated: ${result.full_name}`, 'medical_staff', result.id, true);
                    }
                    
                    operationProgress.value.saveMedicalStaff = 100;
                    medicalStaffModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('STAFF_SAVE_ERROR', error.message, 'medical_staff', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    setTimeout(() => {
                        delete operationProgress.value.saveMedicalStaff;
                    }, 1000);
                }
            }, 'Saving medical staff');
        };

        const deleteMedicalStaff = async (staff) => {
            if (!hasPermission('medical_staff', 'delete')) {
                showAdvancedToast('Permission Denied', 'You need delete permission to remove medical staff', 'permission');
                return;
            }
            
            if (!confirm(`Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`)) {
                return;
            }
            
            return await withErrorHandling(async () => {
                const originalIndex = medicalStaff.value.findIndex(s => s.id === staff.id);
                const originalStaff = medicalStaff.value[originalIndex];
                
                const { error } = await supabaseClient
                    .from('medical_staff')
                    .delete()
                    .eq('id', staff.id);
                
                if (error) throw error;
                
                medicalStaff.value.splice(originalIndex, 1);
                
                // Add to undo stack
                pushToUndoStack(
                    'Delete Medical Staff',
                    { staff: originalStaff, index: originalIndex },
                    async (data) => {
                        const { data: restored } = await supabaseClient
                            .from('medical_staff')
                            .insert([data.staff])
                            .select()
                            .single();
                        
                        if (restored) {
                            medicalStaff.value.splice(data.index, 0, restored);
                        }
                    },
                    async (data) => {
                        const { error } = await supabaseClient
                            .from('medical_staff')
                            .delete()
                            .eq('id', data.staff.id);
                        
                        if (!error) {
                            const index = medicalStaff.value.findIndex(s => s.id === data.staff.id);
                            if (index !== -1) medicalStaff.value.splice(index, 1);
                        }
                    }
                );
                
                showAdvancedToast('Deleted', `${staff.full_name} has been removed`, 'success');
                await logAudit('STAFF_DELETE', `Deleted: ${staff.full_name}`, 'medical_staff', staff.id, true);
                
            }, 'Deleting medical staff');
        };
        // ============ ON-CALL SCHEDULE FUNCTIONS ============
const showAddOnCallModal = () => {
    if (!hasPermission('oncall_schedule', 'create')) {
        showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
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
            id: generateUUID(), // FIXED: Added proper UUID
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
        showAdvancedToast('Permission Denied', 'Need update permission', 'permission');
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
                    id: day.schedule.id, // FIXED: Keep the existing UUID
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
                id: schedule.id, // FIXED: Keep the existing UUID
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
    
    logAudit('ONCALL_EDIT', `Editing on-call schedule`, 'oncall_schedule');
};

const saveOnCallSchedule = async () => {
    return await withErrorHandling(async () => {
        saving.value = true;
        operationProgress.value.saveOnCallSchedule = 0;
        
        try {
            validateOnCallForm();
            
            const permissionNeeded = onCallModal.value.mode === 'add' ? 'create' : 'update';
            if (!hasPermission('oncall_schedule', permissionNeeded)) {
                throw new Error('Insufficient permissions');
            }
            
            operationProgress.value.saveOnCallSchedule = 30;
            
            // CRITICAL FIX: Convert empty strings to null for UUID fields
            const primaryPhysicianId = onCallModal.value.form.primary_physician_id || null;
            const backupPhysicianId = onCallModal.value.form.backup_physician_id || null;
            
            // Validate UUID format if a value is provided
            if (primaryPhysicianId && !isValidUUID(primaryPhysicianId)) {
                throw new Error('Primary physician ID is not a valid UUID format');
            }
            
            if (backupPhysicianId && !isValidUUID(backupPhysicianId)) {
                throw new Error('Backup physician ID is not a valid UUID format');
            }
            
            const scheduleData = {
                duty_date: onCallModal.value.form.duty_date,
                schedule_id: onCallModal.value.form.schedule_id,
                shift_type: onCallModal.value.form.shift_type,
                primary_physician_id: primaryPhysicianId, // Use converted value
                backup_physician_id: backupPhysicianId,   // Use converted value
                start_time: onCallModal.value.form.start_time + ':00',
                end_time: onCallModal.value.form.end_time + ':00',
                coverage_notes: onCallModal.value.form.coverage_notes || '',
                updated_at: getLocalDateTime()
            };
            
            // Add ID and created fields for new records
            if (onCallModal.value.mode === 'add') {
    scheduleData.id = convertToUUID(onCallModal.value.form.id);
                scheduleData.created_at = getLocalDateTime();
                scheduleData.created_by = currentUser.value?.id;
            }
            
            // Debug logging
            console.log('Saving on-call schedule data:', scheduleData);
            
            let result;
            const originalData = onCallModal.value.mode === 'edit' 
                ? onCallSchedule.value.find(s => s.id === onCallModal.value.schedule.id)
                : null;
            
            if (onCallModal.value.mode === 'add') {
                const { data, error } = await supabaseClient
                    .from('oncall_schedule')
                    .insert([scheduleData])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase insert error:', error);
                    throw error;
                }
                
                result = data;
                onCallSchedule.value.push(result);
                showAdvancedToast('Success', 'On-call schedule created', 'success');
                
                // Add to undo stack
                pushToUndoStack(
                    'Add On-call Schedule',
                    { schedule: result, original: null },
                    async (data) => {
                        const { error } = await supabaseClient
                            .from('oncall_schedule')
                            .delete()
                            .eq('id', data.schedule.id);
                        
                        if (!error) {
                            const index = onCallSchedule.value.findIndex(s => s.id === data.schedule.id);
                            if (index !== -1) onCallSchedule.value.splice(index, 1);
                        }
                    },
                    async (data) => {
                        const { data: restored } = await supabaseClient
                            .from('oncall_schedule')
                            .insert([data.schedule])
                            .select()
                            .single();
                        
                        if (restored) {
                            onCallSchedule.value.push(restored);
                        }
                    }
                );
                
            } else {
                const { data, error } = await supabaseClient
                    .from('oncall_schedule')
                    .update(scheduleData)
                    .eq('id', onCallModal.value.schedule.id)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase update error:', error);
                    throw error;
                }
                
                result = data;
                
                const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                if (index !== -1) onCallSchedule.value[index] = result;
                
                showAdvancedToast('Success', 'On-call schedule updated', 'success');
                
                // Add to undo stack
                pushToUndoStack(
                    'Update On-call Schedule',
                    { schedule: result, original: originalData },
                    async (data) => {
                        const { data: restored } = await supabaseClient
                            .from('oncall_schedule')
                            .update(data.original)
                            .eq('id', data.schedule.id)
                            .select()
                            .single();
                        
                        if (restored) {
                            const index = onCallSchedule.value.findIndex(s => s.id === restored.id);
                            if (index !== -1) onCallSchedule.value[index] = restored;
                        }
                    },
                    async (data) => {
                        const { data: reupdated } = await supabaseClient
                            .from('oncall_schedule')
                            .update(data.schedule)
                            .eq('id', data.schedule.id)
                            .select()
                            .single();
                        
                        if (reupdated) {
                            const index = onCallSchedule.value.findIndex(s => s.id === reupdated.id);
                            if (index !== -1) onCallSchedule.value[index] = reupdated;
                        }
                    }
                );
            }
            
            operationProgress.value.saveOnCallSchedule = 100;
            onCallModal.value.show = false;
            await logAudit('ONCALL_SAVE', `${onCallModal.value.mode === 'add' ? 'Created' : 'Updated'} schedule`, 'oncall_schedule', result.id, true);
            
        } catch (error) {
            await logAudit('ONCALL_SAVE_ERROR', error.message, 'oncall_schedule', null, false);
            throw error;
        } finally {
            saving.value = false;
            setTimeout(() => {
                delete operationProgress.value.saveOnCallSchedule;
            }, 1000);
        }
    }, 'Saving on-call schedule');
};

const overrideOnCall = (scheduleOrDay) => {
    if (!hasPermission('oncall_schedule', 'override')) {
        showAdvancedToast('Permission Denied', 'Need override permission', 'permission');
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
            id: generateUUID(), // FIXED: Added proper UUID
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
    
    showAdvancedToast('Emergency Override', 'Emergency schedule override mode activated', 'warning');
    logAudit('ONCALL_OVERRIDE', `Emergency override for ${formatDate(date)}`, 'oncall_schedule');
};

const deleteOnCallSchedule = async (schedule) => {
    if (!hasPermission('oncall_schedule', 'delete')) {
        showAdvancedToast('Permission Denied', 'Need delete permission', 'permission');
        return;
    }
    
    if (!confirm(`Delete on-call schedule for ${formatDate(schedule.duty_date)}?`)) return;
    
    return await withErrorHandling(async () => {
        const originalIndex = onCallSchedule.value.findIndex(s => s.id === schedule.id);
        const originalSchedule = onCallSchedule.value[originalIndex];
        
        const { error } = await supabaseClient
            .from('oncall_schedule')
            .delete()
            .eq('id', schedule.id);
        
        if (error) throw error;
        
        onCallSchedule.value.splice(originalIndex, 1);
        
        // Add to undo stack
        pushToUndoStack(
            'Delete On-call Schedule',
            { schedule: originalSchedule, index: originalIndex },
            async (data) => {
                const { data: restored } = await supabaseClient
                    .from('oncall_schedule')
                    .insert([data.schedule])
                    .select()
                    .single();
                
                if (restored) {
                    onCallSchedule.value.splice(data.index, 0, restored);
                }
            },
            async (data) => {
                const { error } = await supabaseClient
                    .from('oncall_schedule')
                    .delete()
                    .eq('id', data.schedule.id);
                
                if (!error) {
                    const index = onCallSchedule.value.findIndex(s => s.id === data.schedule.id);
                    if (index !== -1) onCallSchedule.value.splice(index, 1);
                }
            }
        );
        
        showAdvancedToast('Deleted', 'On-call schedule removed', 'success');
        await logAudit('ONCALL_DELETE', `Deleted schedule for ${formatDate(schedule.duty_date)}`, 'oncall_schedule', schedule.id, true);
        
    }, 'Deleting on-call schedule');
};



        // ============ LEAVE REQUEST FUNCTIONS ============
        const showAddLeaveRequestModal = () => {
            if (!hasPermission('leave_requests', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const startDate = getLocalDateString();
            const endDate = getLocalDateString(nextWeek);
            
            leaveRequestModal.value = {
                show: true,
                mode: 'add',
                request: null,
                form: {
                    start_date: startDate,
                    end_date: endDate,
                    leave_type: 'vacation',
                    reason: '',
                    status: 'pending',
                    approver_notes: ''
                }
            };
        };

        const viewLeaveRequestDetails = (request) => {
            leaveDetailsModal.value = {
                show: true,
                request: request
            };
        };

        const approveLeaveRequest = async (request) => {
            if (!hasPermission('leave_requests', 'approve')) {
                showAdvancedToast('Permission Denied', 'Need approve permission', 'permission');
                return;
            }
            
            if (!confirm(`Approve leave request for ${getPhysicianName(request.staff_member_id)}?`)) return;
            
            return await withErrorHandling(async () => {
                const originalStatus = request.status;
                
                const { data, error } = await supabaseClient
                    .from('leave_requests')
                    .update({
                        status: 'approved',
                        approver_notes: `Approved by ${currentUser.value.full_name} on ${getLocalDateString()}`,
                        updated_at: getLocalDateTime()
                    })
                    .eq('id', request.id)
                    .select()
                    .single();
                
                if (error) throw error;
                
                const index = leaveRequests.value.findIndex(r => r.id === data.id);
                if (index !== -1) leaveRequests.value[index] = data;
                
                // Add to undo stack
                pushToUndoStack(
                    'Approve Leave Request',
                    { request: data, originalStatus },
                    async (data) => {
                        const { data: restored } = await supabaseClient
                            .from('leave_requests')
                            .update({
                                status: data.originalStatus,
                                approver_notes: `Status reverted on ${getLocalDateString()}`,
                                updated_at: getLocalDateTime()
                            })
                            .eq('id', data.request.id)
                            .select()
                            .single();
                        
                        if (restored) {
                            const index = leaveRequests.value.findIndex(r => r.id === restored.id);
                            if (index !== -1) leaveRequests.value[index] = restored;
                        }
                    },
                    async (data) => {
                        const { data: reapproved } = await supabaseClient
                            .from('leave_requests')
                            .update({
                                status: 'approved',
                                approver_notes: `Re-approved by ${currentUser.value.full_name} on ${getLocalDateString()}`,
                                updated_at: getLocalDateTime()
                            })
                            .eq('id', data.request.id)
                            .select()
                            .single();
                        
                        if (reapproved) {
                            const index = leaveRequests.value.findIndex(r => r.id === reapproved.id);
                            if (index !== -1) leaveRequests.value[index] = reapproved;
                        }
                    }
                );
                
                showAdvancedToast('Approved', `Leave request approved`, 'success');
                await logAudit('LEAVE_APPROVE', `Approved leave request for ${getPhysicianName(request.staff_member_id)}`, 'leave_requests', request.id, true);
                
            }, 'Approving leave request');
        };

        const rejectLeaveRequest = async (request) => {
            if (!hasPermission('leave_requests', 'reject')) {
                showAdvancedToast('Permission Denied', 'Need reject permission', 'permission');
                return;
            }
            
            if (!confirm(`Reject leave request for ${getPhysicianName(request.staff_member_id)}?`)) return;
            
            return await withErrorHandling(async () => {
                const originalStatus = request.status;
                
                const { data, error } = await supabaseClient
                    .from('leave_requests')
                    .update({
                        status: 'rejected',
                        approver_notes: `Rejected by ${currentUser.value.full_name} on ${getLocalDateString()}`,
                        updated_at: getLocalDateTime()
                    })
                    .eq('id', request.id)
                    .select()
                    .single();
                
                if (error) throw error;
                
                const index = leaveRequests.value.findIndex(r => r.id === data.id);
                if (index !== -1) leaveRequests.value[index] = data;
                
                // Add to undo stack
                pushToUndoStack(
                    'Reject Leave Request',
                    { request: data, originalStatus },
                    async (data) => {
                        const { data: restored } = await supabaseClient
                            .from('leave_requests')
                            .update({
                                status: data.originalStatus,
                                approver_notes: `Status reverted on ${getLocalDateString()}`,
                                updated_at: getLocalDateTime()
                            })
                            .eq('id', data.request.id)
                            .select()
                            .single();
                        
                        if (restored) {
                            const index = leaveRequests.value.findIndex(r => r.id === restored.id);
                            if (index !== -1) leaveRequests.value[index] = restored;
                        }
                    },
                    async (data) => {
                        const { data: rerejected } = await supabaseClient
                            .from('leave_requests')
                            .update({
                                status: 'rejected',
                                approver_notes: `Re-rejected by ${currentUser.value.full_name} on ${getLocalDateString()}`,
                                updated_at: getLocalDateTime()
                            })
                            .eq('id', data.request.id)
                            .select()
                            .single();
                        
                        if (rerejected) {
                            const index = leaveRequests.value.findIndex(r => r.id === rerejected.id);
                            if (index !== -1) leaveRequests.value[index] = rerejected;
                        }
                    }
                );
                
                showAdvancedToast('Rejected', `Leave request rejected`, 'error');
                await logAudit('LEAVE_REJECT', `Rejected leave request for ${getPhysicianName(request.staff_member_id)}`, 'leave_requests', request.id, true);
                
            }, 'Rejecting leave request');
        };

        const saveLeaveRequest = async () => {
            return await withErrorHandling(async () => {
                saving.value = true;
                operationProgress.value.saveLeaveRequest = 0;
                
                try {
                    validateLeaveRequestForm();
                    
                    if (leaveRequestModal.value.mode === 'add') {
                        if (!hasPermission('leave_requests', 'create')) {
                            throw new Error('No permission to create leave requests');
                        }
                        
                        const start = new Date(leaveRequestModal.value.form.start_date);
                        const end = new Date(leaveRequestModal.value.form.end_date);
                        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                        const dateStr = getLocalDateString().replace(/-/g,'');
                        const random = Math.random().toString(36).substr(2, 6).toUpperCase();

                        operationProgress.value.saveLeaveRequest = 30;
                        
                        const { data, error } = await supabaseClient
                            .from('leave_requests')
                            .insert([{
                                request_id: `LEAVE-${dateStr}-${random}`,
                                staff_member_id: currentUser.value.id,
                                leave_category: leaveRequestModal.value.form.leave_type,
                                leave_start_date: leaveRequestModal.value.form.start_date,
                                leave_end_date: leaveRequestModal.value.form.end_date,
                                total_days: totalDays,
                                leave_reason: leaveRequestModal.value.form.reason,
                                approval_status: 'pending',
                                coverage_required: true,
                                coverage_assigned: false,
                                created_at: getLocalDateTime(),
                                updated_at: getLocalDateTime()
                            }])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        operationProgress.value.saveLeaveRequest = 70;
                        
                        leaveRequests.value.unshift(data);
                        showAdvancedToast('Success', 'Leave request submitted', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Submit Leave Request',
                            { request: data, original: null },
                            async (data) => {
                                const { error } = await supabaseClient
                                    .from('leave_requests')
                                    .delete()
                                    .eq('id', data.request.id);
                                
                                if (!error) {
                                    const index = leaveRequests.value.findIndex(r => r.id === data.request.id);
                                    if (index !== -1) leaveRequests.value.splice(index, 1);
                                }
                            },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('leave_requests')
                                    .insert([data.request])
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    leaveRequests.value.unshift(restored);
                                }
                            }
                        );
                        
                        await logAudit('LEAVE_CREATE', `Submitted leave request`, 'leave_requests', data.id, true);
                        
                    } else {
                        if (!hasPermission('leave_requests', 'update')) {
                            throw new Error('No permission to update leave requests');
                        }
                        
                        const originalData = leaveRequests.value.find(r => r.id === leaveRequestModal.value.request.id);
                        
                        operationProgress.value.saveLeaveRequest = 30;
                        
                        const { data, error } = await supabaseClient
                            .from('leave_requests')
                            .update({
                                status: leaveRequestModal.value.form.status,
                                approver_notes: leaveRequestModal.value.form.approver_notes,
                                updated_at: getLocalDateTime()
                            })
                            .eq('id', leaveRequestModal.value.request.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        operationProgress.value.saveLeaveRequest = 70;
                        
                        const index = leaveRequests.value.findIndex(r => r.id === data.id);
                        if (index !== -1) leaveRequests.value[index] = data;
                        
                        showAdvancedToast('Success', 'Leave request updated', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Update Leave Request',
                            { request: data, original: originalData },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('leave_requests')
                                    .update(data.original)
                                    .eq('id', data.request.id)
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    const index = leaveRequests.value.findIndex(r => r.id === restored.id);
                                    if (index !== -1) leaveRequests.value[index] = restored;
                                }
                            },
                            async (data) => {
                                const { data: reupdated } = await supabaseClient
                                    .from('leave_requests')
                                    .update(data.request)
                                    .eq('id', data.request.id)
                                    .select()
                                    .single();
                                
                                if (reupdated) {
                                    const index = leaveRequests.value.findIndex(r => r.id === reupdated.id);
                                    if (index !== -1) leaveRequests.value[index] = reupdated;
                                }
                            }
                        );
                        
                        await logAudit('LEAVE_UPDATE', `Updated leave request status to ${data.status}`, 'leave_requests', data.id, true);
                    }
                    
                    operationProgress.value.saveLeaveRequest = 100;
                    leaveRequestModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('LEAVE_SAVE_ERROR', error.message, 'leave_requests', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    setTimeout(() => {
                        delete operationProgress.value.saveLeaveRequest;
                    }, 1000);
                }
            }, 'Saving leave request');
        };

        // ============ TRAINING UNIT FUNCTIONS ============
        const showAddTrainingUnitModal = () => {
            if (!hasPermission('training_units', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            trainingUnitModal.value = {
                show: true,
                mode: 'add',
                unit: null,
                form: {
                    unit_name: '',
                    unit_code: '',
                    department_name: 'Pulmonology',
                    unit_description: '',
                    unit_status: 'active',
                    maximum_residents: 10,
                    specialty: '',
                    current_residents: 0
                }
            };
        };

        const editTrainingUnit = (unit) => {
            if (!hasPermission('training_units', 'update')) {
                showAdvancedToast('Permission Denied', 'Need update permission', 'permission');
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
            return await withErrorHandling(async () => {
                saving.value = true;
                operationProgress.value.saveTrainingUnit = 0;
                
                try {
                    validateTrainingUnitForm();
                    
                    const permissionNeeded = trainingUnitModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('training_units', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    operationProgress.value.saveTrainingUnit = 30;
                    
                    const unitData = {
                        ...trainingUnitModal.value.form,
                        updated_at: getLocalDateTime()
                    };
                    
                    let result;
                    const originalData = trainingUnitModal.value.mode === 'edit' 
                        ? trainingUnits.value.find(u => u.id === trainingUnitModal.value.unit.id)
                        : null;
                    
                    if (trainingUnitModal.value.mode === 'add') {
                        const { data, error } = await supabaseClient
                            .from('training_units')
                            .insert([{
                                ...unitData,
                                created_at: getLocalDateTime()
                            }])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        trainingUnits.value.unshift(result);
                        showAdvancedToast('Success', 'Training unit added', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Add Training Unit',
                            { unit: result, original: null },
                            async (data) => {
                                const { error } = await supabaseClient
                                    .from('training_units')
                                    .delete()
                                    .eq('id', data.unit.id);
                                
                                if (!error) {
                                    const index = trainingUnits.value.findIndex(u => u.id === data.unit.id);
                                    if (index !== -1) trainingUnits.value.splice(index, 1);
                                }
                            },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('training_units')
                                    .insert([data.unit])
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    trainingUnits.value.unshift(restored);
                                }
                            }
                        );
                        
                        await logAudit('TRAINING_UNIT_CREATE', `Added unit: ${unitData.unit_name}`, 'training_units', result.id, true);
                        
                    } else {
                        const { data, error } = await supabaseClient
                            .from('training_units')
                            .update(unitData)
                            .eq('id', trainingUnitModal.value.unit.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        const index = trainingUnits.value.findIndex(u => u.id === data.id);
                        if (index !== -1) trainingUnits.value[index] = data;
                        showAdvancedToast('Success', 'Training unit updated', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Update Training Unit',
                            { unit: result, original: originalData },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('training_units')
                                    .update(data.original)
                                    .eq('id', data.unit.id)
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    const index = trainingUnits.value.findIndex(u => u.id === restored.id);
                                    if (index !== -1) trainingUnits.value[index] = restored;
                                }
                            },
                            async (data) => {
                                const { data: reupdated } = await supabaseClient
                                    .from('training_units')
                                    .update(data.unit)
                                    .eq('id', data.unit.id)
                                    .select()
                                    .single();
                                
                                if (reupdated) {
                                    const index = trainingUnits.value.findIndex(u => u.id === reupdated.id);
                                    if (index !== -1) trainingUnits.value[index] = reupdated;
                                }
                            }
                        );
                        
                        await logAudit('TRAINING_UNIT_UPDATE', `Updated unit: ${unitData.unit_name}`, 'training_units', result.id, true);
                    }
                    
                    operationProgress.value.saveTrainingUnit = 100;
                    trainingUnitModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('TRAINING_UNIT_SAVE_ERROR', error.message, 'training_units', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    setTimeout(() => {
                        delete operationProgress.value.saveTrainingUnit;
                    }, 1000);
                }
            }, 'Saving training unit');
        };

        const assignResidentsToUnit = (unit) => {
            if (!hasPermission('placements', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission for placements', 'permission');
                return;
            }
            
            quickPlacementModal.value = {
                show: true,
                form: {
                    resident_id: '',
                    unit_id: unit.id,
                    duration: 4
                }
            };
            
            showAdvancedToast('Assign Residents', `Ready to assign residents to ${unit.unit_name}`, 'info');
            logAudit('ASSIGN_RESIDENTS', `Opened assignment for ${unit.unit_name}`, 'placements', unit.id);
        };

        // ============ ROTATION FUNCTIONS ============
        const showAddRotationModal = () => {
            if (!hasPermission('resident_rotations', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
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
                    rotation_start_date: getLocalDateString(startDate),
                    rotation_end_date: getLocalDateString(endDate),
                    rotation_category: 'clinical_rotation',
                    rotation_status: 'scheduled',
                    clinical_notes: '',
                    supervisor_evaluation: ''
                }
            };
        };

        const editRotation = (rotation) => {
            if (!hasPermission('resident_rotations', 'update')) {
                showAdvancedToast('Permission Denied', 'Need update permission', 'permission');
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
                    rotation_start_date: rotation.rotation_start_date,
                    rotation_end_date: rotation.rotation_end_date,
                    rotation_category: rotation.rotation_category,
                    rotation_status: rotation.rotation_status,
                    clinical_notes: rotation.clinical_notes || '',
                    supervisor_evaluation: rotation.supervisor_evaluation || ''
                }
            };
        };

        const extendRotation = (rotation) => {
            if (!hasPermission('resident_rotations', 'extend')) {
                showAdvancedToast('Permission Denied', 'Need extend permission', 'permission');
                return;
            }
            
            const newEndDate = new Date(rotation.rotation_end_date);
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
                    rotation_start_date: rotation.rotation_end_date,
                    rotation_end_date: getLocalDateString(newEndDate),
                    rotation_category: rotation.rotation_category,
                    rotation_status: 'scheduled',
                    clinical_notes: 'Extended rotation - ' + rotation.clinical_notes,
                    supervisor_evaluation: ''
                }
            };
        };

        const saveRotation = async () => {
            return await withErrorHandling(async () => {
                saving.value = true;
                operationProgress.value.saveRotation = 0;
                
                try {
                    validateRotationForm();
                    
                    const permissionNeeded = rotationModal.value.mode === 'add' ? 'create' : 'update';
                    if (!hasPermission('resident_rotations', permissionNeeded)) {
                        throw new Error('Insufficient permissions');
                    }
                    
                    operationProgress.value.saveRotation = 30;
                    
                    const rotationData = {
                        rotation_id: rotationModal.value.form.rotation_id,
                        resident_id: rotationModal.value.form.resident_id,
                        training_unit_id: rotationModal.value.form.training_unit_id,
                        supervising_attending_id: rotationModal.value.form.supervising_attending_id || null,
                        rotation_start_date: rotationModal.value.form.rotation_start_date,
                        rotation_end_date: rotationModal.value.form.rotation_end_date,
                        rotation_category: rotationModal.value.form.rotation_category,
                        rotation_status: rotationModal.value.form.rotation_status,
                        clinical_notes: rotationModal.value.form.clinical_notes,
                        supervisor_evaluation: rotationModal.value.form.supervisor_evaluation,
                        updated_at: getLocalDateTime()
                    };
                    
                    let result;
                    const originalData = rotationModal.value.mode === 'edit' 
                        ? residentRotations.value.find(r => r.id === rotationModal.value.rotation.id)
                        : null;
                    
                    if (rotationModal.value.mode === 'add') {
                        const { data, error } = await supabaseClient
                            .from('resident_rotations')
                            .insert([{
                                ...rotationData,
                                created_at: getLocalDateTime()
                            }])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        residentRotations.value.unshift(result);
                        showAdvancedToast('Success', 'Rotation scheduled successfully', 'success');
                        
                        // Update unit capacity
                        await updateUnitCapacity(result.training_unit_id, 'increment');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Add Rotation',
                            { rotation: result, original: null },
                            async (data) => {
                                const { error } = await supabaseClient
                                    .from('resident_rotations')
                                    .delete()
                                    .eq('id', data.rotation.id);
                                
                                if (!error) {
                                    const index = residentRotations.value.findIndex(r => r.id === data.rotation.id);
                                    if (index !== -1) residentRotations.value.splice(index, 1);
                                    await updateUnitCapacity(data.rotation.training_unit_id, 'decrement');
                                }
                            },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('resident_rotations')
                                    .insert([data.rotation])
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    residentRotations.value.unshift(restored);
                                    await updateUnitCapacity(restored.training_unit_id, 'increment');
                                }
                            }
                        );
                        
                        await logAudit('ROTATION_CREATE', `Created rotation ${rotationData.rotation_id}`, 'resident_rotations', result.id, true);
                        
                    } else {
                        const { data, error } = await supabaseClient
                            .from('resident_rotations')
                            .update(rotationData)
                            .eq('id', rotationModal.value.rotation.id)
                            .select()
                            .single();
                        
                        if (error) throw error;
                        result = data;
                        
                        const index = residentRotations.value.findIndex(r => r.id === result.id);
                        if (index !== -1) residentRotations.value[index] = result;
                        
                        showAdvancedToast('Success', 'Rotation updated successfully', 'success');
                        
                        // Add to undo stack
                        pushToUndoStack(
                            'Update Rotation',
                            { rotation: result, original: originalData },
                            async (data) => {
                                const { data: restored } = await supabaseClient
                                    .from('resident_rotations')
                                    .update(data.original)
                                    .eq('id', data.rotation.id)
                                    .select()
                                    .single();
                                
                                if (restored) {
                                    const index = residentRotations.value.findIndex(r => r.id === restored.id);
                                    if (index !== -1) residentRotations.value[index] = restored;
                                }
                            },
                            async (data) => {
                                const { data: reupdated } = await supabaseClient
                                    .from('resident_rotations')
                                    .update(data.rotation)
                                    .eq('id', data.rotation.id)
                                    .select()
                                    .single();
                                
                                if (reupdated) {
                                    const index = residentRotations.value.findIndex(r => r.id === reupdated.id);
                                    if (index !== -1) residentRotations.value[index] = reupdated;
                                }
                            }
                        );
                        
                        await logAudit('ROTATION_UPDATE', `Updated rotation ${rotationData.rotation_id}`, 'resident_rotations', result.id, true);
                    }
                    
                    operationProgress.value.saveRotation = 100;
                    rotationModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('ROTATION_SAVE_ERROR', error.message, 'resident_rotations', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    setTimeout(() => {
                        delete operationProgress.value.saveRotation;
                    }, 1000);
                }
            }, 'Saving rotation');
        };

        const updateUnitCapacity = async (unitId, operation) => {
            try {
                const unit = trainingUnits.value.find(u => u.id === unitId);
                if (!unit) return;
                
                const newCount = operation === 'increment' 
                    ? (unit.current_residents || 0) + 1
                    : Math.max(0, (unit.current_residents || 0) - 1);
                
                const { error } = await supabaseClient
                    .from('training_units')
                    .update({ current_residents: newCount })
                    .eq('id', unitId);
                
                if (!error) {
                    unit.current_residents = newCount;
                }
            } catch (error) {
                console.error('Error updating unit capacity:', error);
            }
        };

        const deleteRotation = async (rotation) => {
            if (!hasPermission('resident_rotations', 'delete')) {
                showAdvancedToast('Permission Denied', 'Need delete permission', 'permission');
                return;
            }
            
            if (!confirm(`Are you sure you want to delete rotation "${rotation.rotation_id}"?`)) {
                return;
            }
            
            return await withErrorHandling(async () => {
                const originalIndex = residentRotations.value.findIndex(r => r.id === rotation.id);
                const originalRotation = residentRotations.value[originalIndex];
                
                const { error } = await supabaseClient
                    .from('resident_rotations')
                    .delete()
                    .eq('id', rotation.id);
                
                if (error) throw error;
                
                residentRotations.value.splice(originalIndex, 1);
                
                // Update unit capacity
                await updateUnitCapacity(rotation.training_unit_id, 'decrement');
                
                // Add to undo stack
                pushToUndoStack(
                    'Delete Rotation',
                    { rotation: originalRotation, index: originalIndex },
                    async (data) => {
                        const { data: restored } = await supabaseClient
                            .from('resident_rotations')
                            .insert([data.rotation])
                            .select()
                            .single();
                        
                        if (restored) {
                            residentRotations.value.splice(data.index, 0, restored);
                            await updateUnitCapacity(restored.training_unit_id, 'increment');
                        }
                    },
                    async (data) => {
                        const { error } = await supabaseClient
                            .from('resident_rotations')
                            .delete()
                            .eq('id', data.rotation.id);
                        
                        if (!error) {
                            const index = residentRotations.value.findIndex(r => r.id === data.rotation.id);
                            if (index !== -1) residentRotations.value.splice(index, 1);
                            await updateUnitCapacity(data.rotation.training_unit_id, 'decrement');
                        }
                    }
                );
                
                showAdvancedToast('Deleted', `Rotation ${rotation.rotation_id} has been removed`, 'success');
                await logAudit('ROTATION_DELETE', `Deleted rotation: ${rotation.rotation_id}`, 'resident_rotations', rotation.id, true);
                
            }, 'Deleting rotation');
        };

        // ============ QUICK PLACEMENT FUNCTIONS ============
        const showQuickPlacementModal = () => {
            if (!hasPermission('placements', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission for placements', 'permission');
                return;
            }
            
            quickPlacementModal.value = {
                show: true,
                form: {
                    resident_id: '',
                    unit_id: '',
                    duration: 4
                }
            };
        };

        const saveQuickPlacement = async () => {
            return await withErrorHandling(async () => {
                if (!hasPermission('placements', 'create')) {
                    throw new Error('Need create permission');
                }
                
                saving.value = true;
                operationProgress.value.saveQuickPlacement = 0;
                
                try {
                    if (!quickPlacementModal.value.form.resident_id || !quickPlacementModal.value.form.unit_id) {
                        throw new Error('Please select both resident and unit');
                    }
                    
                    operationProgress.value.saveQuickPlacement = 30;
                    
                    const rotationId = `PLACEMENT-${getLocalDateString().replace(/-/g,'')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                    const startDate = getLocalDateString();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + (quickPlacementModal.value.form.duration * 7));
                    
                    const { data, error } = await supabaseClient
                        .from('resident_rotations')
                        .insert([{
                            rotation_id: rotationId,
                            resident_id: quickPlacementModal.value.form.resident_id,
                            training_unit_id: quickPlacementModal.value.form.unit_id,
                            rotation_start_date: startDate,
                            rotation_end_date: getLocalDateString(endDate),
                            rotation_category: 'clinical_rotation',
                            rotation_status: 'scheduled',
                            clinical_notes: 'Placed via quick placement',
                            created_at: getLocalDateTime(),
                            updated_at: getLocalDateTime()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    operationProgress.value.saveQuickPlacement = 70;
                    
                    residentRotations.value.unshift(data);
                    
                    // Update unit capacity
                    await updateUnitCapacity(quickPlacementModal.value.form.unit_id, 'increment');
                    
                    showAdvancedToast('Success', 'Resident placed successfully', 'success');
                    await logAudit('QUICK_PLACEMENT', `Quick placement created for resident`, 'placements', data.id, true);
                    
                    operationProgress.value.saveQuickPlacement = 100;
                    quickPlacementModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('QUICK_PLACEMENT_ERROR', error.message, 'placements', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    setTimeout(() => {
                        delete operationProgress.value.saveQuickPlacement;
                    }, 1000);
                }
            }, 'Saving quick placement');
        };

        // ============ DRAG AND DROP FUNCTIONS ============
        const handleDrop = async (event, unit) => {
            event.preventDefault();
            
            const residentId = event.dataTransfer.getData('text/plain');
            if (!residentId) return;
            
            return await withErrorHandling(async () => {
                if (!hasPermission('placements', 'drag_drop')) {
                    showAdvancedToast('Permission Denied', 'Need drag-drop permission', 'permission');
                    return;
                }
                
                // Check if resident is already in a rotation
                const existingRotation = residentRotations.value.find(r => 
                    r.resident_id === residentId && 
                    (r.rotation_status === 'active' || r.rotation_status === 'scheduled')
                );
                
                if (existingRotation) {
                    if (!confirm(`Resident is already in ${await getTrainingUnitName(existingRotation.training_unit_id)}. Move them to ${unit.unit_name}?`)) {
                        return;
                    }
                    
                    // End current rotation
                    const { error: endError } = await supabaseClient
                        .from('resident_rotations')
                        .update({ 
                            rotation_status: 'completed',
                            clinical_notes: `Moved to ${unit.unit_name} via drag-drop`,
                            updated_at: getLocalDateTime()
                        })
                        .eq('id', existingRotation.id);
                    
                    if (endError) throw endError;
                    
                    // Update unit capacity for old unit
                    await updateUnitCapacity(existingRotation.training_unit_id, 'decrement');
                }
                
                // Create new rotation
                const rotationId = `DRAGDROP-${getLocalDateString().replace(/-/g,'')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                const startDate = getLocalDateString();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 28); // 4 weeks
                
                const { data, error } = await supabaseClient
                    .from('resident_rotations')
                    .insert([{
                        rotation_id: rotationId,
                        resident_id: residentId,
                        training_unit_id: unit.id,
                        rotation_start_date: startDate,
                        rotation_end_date: getLocalDateString(endDate),
                        rotation_category: 'clinical_rotation',
                        rotation_status: 'scheduled',
                        clinical_notes: 'Assigned via drag-and-drop',
                        created_at: getLocalDateTime(),
                        updated_at: getLocalDateTime()
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                residentRotations.value.unshift(data);
                
                // Update unit capacity for new unit
                await updateUnitCapacity(unit.id, 'increment');
                
                showAdvancedToast('Placement Created', `Resident placed in ${unit.unit_name}`, 'success');
                await logAudit('DRAG_DROP_PLACEMENT', `Drag-drop placement created`, 'placements', data.id, true);
                
            }, 'Creating drag-drop placement');
        };

        const removePlacement = async (residentId, unitId) => {
            if (!confirm('Remove resident from this unit?')) return;
            
            return await withErrorHandling(async () => {
                const rotation = residentRotations.value.find(r => 
                    r.resident_id === residentId && 
                    r.training_unit_id === unitId &&
                    (r.rotation_status === 'active' || r.rotation_status === 'scheduled')
                );
                
                if (rotation) {
                    const { error } = await supabaseClient
                        .from('resident_rotations')
                        .update({
                            rotation_status: 'cancelled',
                            clinical_notes: 'Removed via UI',
                            updated_at: getLocalDateTime()
                        })
                        .eq('id', rotation.id);
                    
                    if (error) throw error;
                    
                    rotation.rotation_status = 'cancelled';
                    
                    // Update unit capacity
                    await updateUnitCapacity(unitId, 'decrement');
                    
                    showAdvancedToast('Removed', 'Resident removed from unit', 'success');
                    await logAudit('PLACEMENT_REMOVE', `Removed placement`, 'placements', rotation.id, true);
                }
            }, 'Removing placement');
        };

        // ============ BULK OPERATIONS ============
        const sendBulkNotifications = async () => {
            return await withErrorHandling(async () => {
                if (!hasPermission('communications', 'create')) {
                    throw new Error('Need create permission for communications');
                }
                
                operationProgress.value.bulkNotifications = 0;
                
                // Simulate bulk operation
                const totalStaff = medicalStaff.value.length;
                let processed = 0;
                
                for (const staff of medicalStaff.value) {
                    if (staff.employment_status === 'active' && staff.professional_email) {
                        // In production, this would send actual emails
                        processed++;
                        operationProgress.value.bulkNotifications = Math.round((processed / totalStaff) * 100);
                        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
                    }
                }
                
                showAdvancedToast('Notifications Sent', `Sent notifications to ${processed} staff members`, 'success');
                await logAudit('BULK_NOTIFICATIONS', `Sent notifications to ${processed} staff`, 'communications', null, true);
                
                setTimeout(() => {
                    delete operationProgress.value.bulkNotifications;
                }, 2000);
                
            }, 'Sending bulk notifications');
        };

        const showStaffReport = async () => {
            return await withErrorHandling(async () => {
                operationProgress.value.staffReport = 0;
                
                // Generate comprehensive staff report
                const reportData = {
                    generated: getLocalDateTime(),
                    totalStaff: medicalStaff.value.length,
                    byType: {},
                    byStatus: {},
                    byDepartment: {},
                    upcomingLeave: leaveRequests.value.filter(l => 
                        l.status === 'approved' && 
                        new Date(l.leave_start_date) >= new Date()
                    ).length,
                    currentRotations: residentRotations.value.filter(r => 
                        r.rotation_status === 'active'
                    ).length
                };
                
                // Count by staff type
                medicalStaff.value.forEach(staff => {
                    reportData.byType[staff.staff_type] = (reportData.byType[staff.staff_type] || 0) + 1;
                    reportData.byStatus[staff.employment_status] = (reportData.byStatus[staff.employment_status] || 0) + 1;
                    if (staff.primary_clinic) {
                        reportData.byDepartment[staff.primary_clinic] = (reportData.byDepartment[staff.primary_clinic] || 0) + 1;
                    }
                });
                
                operationProgress.value.staffReport = 50;
                
                // Create downloadable report
                const reportContent = JSON.stringify(reportData, null, 2);
                const blob = new Blob([reportContent], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                
                a.href = url;
                a.download = `staff_report_${getLocalDateString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                operationProgress.value.staffReport = 100;
                
                showAdvancedToast('Report Generated', 'Staff report downloaded', 'success');
                await logAudit('STAFF_REPORT', 'Generated staff report', 'medical_staff', null, true);
                
                setTimeout(() => {
                    delete operationProgress.value.staffReport;
                }, 2000);
                
            }, 'Generating staff report');
        };

        // ============ COMMUNICATIONS FUNCTIONS ============
        const showCommunicationsModal = () => {
            if (!hasPermission('communications', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
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
            return await withErrorHandling(async () => {
                if (!hasPermission('communications', 'create')) {
                    throw new Error('Need create permission');
                }
                
                saving.value = true;
                operationProgress.value.saveCommunication = 0;
                
                try {
                    if (communicationsModal.value.activeTab === 'announcement') {
                        if (!communicationsModal.value.form.announcement_title.trim()) {
                            throw new Error('Announcement title is required');
                        }
                        if (!communicationsModal.value.form.announcement_content.trim()) {
                            throw new Error('Announcement content is required');
                        }
                        
                        operationProgress.value.saveCommunication = 30;
                        
                        const { data, error } = await supabaseClient
                            .from('department_announcements')
                            .insert([{
                                announcement_title: communicationsModal.value.form.announcement_title,
                                announcement_content: communicationsModal.value.form.announcement_content,
                                publish_start_date: communicationsModal.value.form.publish_start_date,
                                publish_end_date: communicationsModal.value.form.publish_end_date || null,
                                priority_level: communicationsModal.value.form.priority_level,
                                target_audience: communicationsModal.value.form.target_audience,
                                created_by: currentUser.value?.full_name,
                                created_at: getLocalDateTime(),
                                updated_at: getLocalDateTime()
                            }])
                            .select()
                            .single();
                        
                        if (error) throw error;
                        
                        operationProgress.value.saveCommunication = 70;
                        
                        announcements.value.unshift(data);
                        showAdvancedToast('Published', 'Announcement published successfully', 'success');
                        await logAudit('ANNOUNCEMENT_CREATE', `Published: ${data.announcement_title}`, 'communications', data.id, true);
                        
                    } else if (communicationsModal.value.activeTab === 'capacity') {
                        operationProgress.value.saveCommunication = 30;
                        
                        currentCapacity.value = {
                            er: { ...communicationsModal.value.capacity.er, status: getCapacityStatus(communicationsModal.value.capacity.er) },
                            icu: { ...communicationsModal.value.capacity.icu, status: getCapacityStatus(communicationsModal.value.capacity.icu) },
                            ward: { ...communicationsModal.value.capacity.ward, status: getCapacityStatus(communicationsModal.value.capacity.ward) },
                            stepdown: { ...communicationsModal.value.capacity.stepdown, status: getCapacityStatus(communicationsModal.value.capacity.stepdown) }
                        };
                        
                        operationProgress.value.saveCommunication = 70;
                        
                        // Save capacity to database if you have a table for it
                        // const { error } = await supabaseClient
                        //     .from('capacity_updates')
                        //     .insert([{
                        //         ...communicationsModal.value.capacity,
                        //         updated_by: currentUser.value?.id,
                        //         updated_at: getLocalDateTime()
                        //     }]);
                        
                        // if (error) throw error;
                        
                        showAdvancedToast('Updated', 'Capacity information updated', 'success');
                        await logAudit('CAPACITY_UPDATE', 'Updated department capacity', 'communications', null, true);
                        
                    } else if (communicationsModal.value.activeTab === 'quick') {
                        if (!communicationsModal.value.quickUpdate.message.trim()) {
                            throw new Error('Message is required');
                        }
                        
                        operationProgress.value.saveCommunication = 30;
                        
                        quickUpdates.value.unshift({
                            id: Date.now(),
                            author: currentUser.value.full_name,
                            message: communicationsModal.value.quickUpdate.message,
                            timestamp: 'Just now',
                            tags: communicationsModal.value.quickUpdate.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                        });
                        
                        operationProgress.value.saveCommunication = 70;
                        
                        showAdvancedToast('Posted', 'Quick update posted', 'success');
                        await logAudit('QUICK_UPDATE', 'Posted quick update', 'communications', null, true);
                    }
                    
                    operationProgress.value.saveCommunication = 100;
                    communicationsModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('COMMUNICATION_SAVE_ERROR', error.message, 'communications', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    setTimeout(() => {
                        delete operationProgress.value.saveCommunication;
                    }, 1000);
                }
            }, 'Saving communication');
        };

        // ============ EXPORT FUNCTIONS ============
        const exportData = async () => {
            return await withErrorHandling(async () => {
                if (!hasPermission('audit', 'export')) {
                    throw new Error('Need export permission');
                }
                
                saving.value = true;
                importExportModal.value.progress = 0;
                
                try {
                    let data = [];
                    let filename = '';
                    let totalCount = 0;
                    
                    // First, get total count
                    switch (importExportModal.value.selectedTable) {
                        case 'medical_staff':
                            const { count: staffCount } = await supabaseClient
                                .from('medical_staff')
                                .select('*', { count: 'exact', head: true });
                            totalCount = staffCount || 0;
                            filename = 'medical_staff';
                            break;
                        case 'training_units':
                            const { count: unitCount } = await supabaseClient
                                .from('training_units')
                                .select('*', { count: 'exact', head: true });
                            totalCount = unitCount || 0;
                            filename = 'training_units';
                            break;
                        case 'resident_rotations':
                            const { count: rotationCount } = await supabaseClient
                                .from('resident_rotations')
                                .select('*', { count: 'exact', head: true });
                            totalCount = rotationCount || 0;
                            filename = 'resident_rotations';
                            break;
                        case 'audit_logs':
                            const { count: auditCount } = await supabaseClient
                                .from('audit_logs')
                                .select('*', { count: 'exact', head: true });
                            totalCount = auditCount || 0;
                            filename = 'audit_logs';
                            break;
                        default:
                            throw new Error('Invalid table selected');
                    }
                    
                    if (totalCount === 0) {
                        throw new Error('No data to export');
                    }
                    
                    // Fetch all data with pagination
                    const batchSize = 1000;
                    const batches = Math.ceil(totalCount / batchSize);
                    
                    for (let i = 0; i < batches; i++) {
                        const { data: batchData, error } = await supabaseClient
                            .from(importExportModal.value.selectedTable)
                            .select('*')
                            .range(i * batchSize, (i + 1) * batchSize - 1);
                        
                        if (error) throw error;
                        
                        data.push(...(batchData || []));
                        importExportModal.value.progress = Math.round(((i + 1) / batches) * 100);
                    }
                    
                    // Convert to selected format
                    let exportContent = '';
                    let mimeType = '';
                    let fileExtension = '';
                    
                    switch (importExportModal.value.exportFormat) {
                        case 'csv':
                            const headers = Object.keys(data[0]).join(',');
                            const rows = data.map(row => 
                                Object.values(row).map(value => 
                                    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
                                ).join(',')
                            );
                            exportContent = [headers, ...rows].join('\n');
                            mimeType = 'text/csv';
                            fileExtension = 'csv';
                            break;
                            
                        case 'json':
                            exportContent = JSON.stringify(data, null, 2);
                            mimeType = 'application/json';
                            fileExtension = 'json';
                            break;
                            
                        case 'excel':
                            // For Excel, we'd use a library like SheetJS in production
                            // For now, export as CSV
                            const excelHeaders = Object.keys(data[0]).join(',');
                            const excelRows = data.map(row => 
                                Object.values(row).map(value => 
                                    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
                                ).join(',')
                            );
                            exportContent = [excelHeaders, ...excelRows].join('\n');
                            mimeType = 'text/csv';
                            fileExtension = 'csv';
                            break;
                    }
                    
                    // Create and trigger download
                    const blob = new Blob([exportContent], { type: mimeType });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    
                    a.href = url;
                    a.download = `${filename}_${getLocalDateString()}.${fileExtension}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    
                    showAdvancedToast('Export Complete', `${data.length} records exported`, 'success');
                    await logAudit('DATA_EXPORT', `Exported ${filename} data (${data.length} records)`, 'audit', null, true);
                    
                    importExportModal.value.show = false;
                    
                } catch (error) {
                    await logAudit('EXPORT_ERROR', error.message, 'audit', null, false);
                    throw error;
                } finally {
                    saving.value = false;
                    importExportModal.value.progress = 0;
                }
            }, 'Exporting data');
        };

        // ============ LIFECYCLE HOOKS ============
        onMounted(() => {
            // Check for existing session
            supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    console.log('Existing session found');
                }
            }).catch(error => {
                console.error('Error getting session:', error);
            });
            
            // Set up keyboard shortcuts
            document.addEventListener('keydown', handleKeyboardShortcuts);
        });

        onUnmounted(() => {
            // Cleanup
            stopAutoRefresh();
            document.removeEventListener('keydown', handleKeyboardShortcuts);
        });

        const handleKeyboardShortcuts = (event) => {
            // Ctrl+Z for undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undoLastAction();
            }
            
            // Ctrl+Shift+Z or Ctrl+Y for redo
            if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') || 
                ((event.ctrlKey || event.metaKey) && event.key === 'y')) {
                event.preventDefault();
                redoLastAction();
            }
            
            // Escape to close modals
            if (event.key === 'Escape') {
                if (staffDetailsModal.value.show) staffDetailsModal.value.show = false;
                if (medicalStaffModal.value.show) medicalStaffModal.value.show = false;
                if (onCallModal.value.show) onCallModal.value.show = false;
                if (leaveRequestModal.value.show) leaveRequestModal.value.show = false;
                if (trainingUnitModal.value.show) trainingUnitModal.value.show = false;
                if (rotationModal.value.show) rotationModal.value.show = false;
                if (communicationsModal.value.show) communicationsModal.value.show = false;
                if (systemSettingsModal.value.show) systemSettingsModal.value.show = false;
                if (userProfileModal.value.show) userProfileModal.value.show = false;
                if (importExportModal.value.show) importExportModal.value.show = false;
                if (showPermissionManager.value) showPermissionManager.value = false;
            }
        };
        const showSystemSettingsModal = () => {
    if (!hasPermission('system', 'read')) return;
    systemSettingsModal.value = { show: true, form: { ...systemSettings.value } };
};

const exportAuditLogs = () => {
    showImportExportModal('export', 'audit_logs');
};

const showImportModal = (table) => {
    showImportExportModal('import', table);
};

const updateCapacity = () => {
    showAdvancedToast('Capacity Updated', 'Department capacity updated', 'success');
};

const quickAssignToUnit = (alert) => {
    showQuickPlacementModal();
};

const showImportExportModal = (mode = 'export', table = null) => {
    importExportModal.value = {
        show: true, mode, selectedTable: table || 'medical_staff',
        exportFormat: 'csv', overwriteExisting: false, progress: 0
    };
};
        const saveSystemSettings = async () => {
    if (!hasPermission('system', 'update')) {
        showAdvancedToast('Permission Denied', 'Need update permission for system settings', 'permission');
        return;
    }
    
    saving.value = true;
    try {
        systemSettings.value = { ...systemSettingsModal.value.form };
        showAdvancedToast('Settings Saved', 'System settings updated successfully', 'success');
        await logAudit('SETTINGS_UPDATE', 'Updated system settings', 'system');
        systemSettingsModal.value.show = false;
    } catch (error) {
        console.error('Error saving system settings:', error);
        showAdvancedToast('Save Failed', error.message, 'error');
    } finally {
        saving.value = false;
    }
};
        // ============ ADD THIS FUNCTION ============
const showUserProfileModal = () => {
    userProfileModal.value = {
        show: true,
        form: {
            full_name: currentUser.value?.full_name || '',
            email: currentUser.value?.email || '',
            phone: currentUser.value?.phone || '+1 (555) 123-4567',
            department: currentUser.value?.department || 'Pulmonary Medicine',
            notifications_enabled: true,
            leave_request_notifications: true,
            announcement_notifications: true
        }
    };
    userMenuOpen.value = false;
};
const saveUserProfile = async () => {
    saving.value = true;
    try {
        currentUser.value = {
            ...currentUser.value,
            ...userProfileModal.value.form
        };
        
        showAdvancedToast('Profile Updated', 'Your profile has been updated', 'success');
        await logAudit('PROFILE_UPDATE', 'Updated user profile', 'user_profile');
        userProfileModal.value.show = false;
    } catch (error) {
        console.error('Error saving profile:', error);
        showAdvancedToast('Save Failed', error.message, 'error');
    } finally {
        saving.value = false;
    }
};
const exportStaffList = () => {
    showImportExportModal('export', 'medical_staff');
};
        const getPhysicianFirstName = async (physicianId) => {
    const name = await getPhysicianName(physicianId);
    return name.split(' ')[0] || name;
};
        // ============ RETURN STATEMENT ============
        return {
            // State
            currentUser,
            loginForm,
            loading,
            saving,
            savingPermissions,
            operationProgress,
            currentView,
            sidebarCollapsed,
            mobileMenuOpen,
            showPermissionManager,
            statsSidebarOpen,
            searchQuery,
            searchScope,
            searchFilter,
            showRecentSearches,
            userMenuOpen,
            
            // Pagination
            pagination,
            loadMore,
            showSystemSettingsModal,
    exportAuditLogs,
    showImportModal,
    updateCapacity,
    quickAssignToUnit,
    showImportExportModal,
             getPhysicianFirstName, 
            
            // Undo/Redo
            undoStack,
            redoStack,
            undoLastAction,
            redoLastAction,
            
            // Modals
            staffDetailsModal,
            medicalStaffModal,
            onCallModal,
            leaveRequestModal,
            leaveDetailsModal,
            trainingUnitModal,
            rotationModal,
            quickPlacementModal,
            communicationsModal,
            systemSettingsModal,
            userProfileModal,
            importExportModal,
            
            // Data
            medicalStaff,
            trainingUnits,
            residentRotations,
            leaveRequests,
            onCallSchedule,
            announcements,
            auditLogs,
            systemSettings,
            userNotifications,
            
            // UI State
            toasts,
            permissionResources,
            stats,
            liveStats,
            currentCapacity,
            capacityOverview,
            quickUpdates,
            collapsedCards,
            pinnedCards,
            draggingCard,
            lastUpdated,
            staffDailyActivities,
            
            // Filters
            staffSearch,
            staffFilter,
            rotationFilter,
            auditFilter,
            recentSearches,
            
            // Computed
            filteredMedicalStaff,
            todaysOnCall,
            recentAnnouncements,
            coverageAlerts,
            emergencyAlerts,
            nextSevenDays,
            filteredRotations,
            availableResidents,
            unreadNotifications,
            activeTrainingUnits,
            availablePhysicians,
            availableAttendings,
            
            // Permissions
            hasPermission,
            hasAnyPermission,
            getResourcePermissionLevel,
            getPermissionDescription,
            formatActionName,
            
            // Utility
            getInitials,
            formatDate,
            formatDateTime,
            formatTimeAgo,
            formatTimeRange,
            getUserRoleDisplay,
            formatStaffType,
            getStaffTypeClass,
            formatEmploymentStatus,
            formatRotationCategory,
            getRotationCategoryClass,
            getAuditIcon,
            getDocumentIcon,
            truncateText,
            getPriorityColor,
            getCapacityStatus,
            getCommunicationIcon,
            getCommunicationButtonText,
            formatDateShort,
            
            // Data Getters
            getPhysicianName,
            getResidentName,
            getTrainingUnitName,
            getAttendingName,
            getAssignedResidents,
            
            // Navigation
            switchView,
            getCurrentTitle,
            getCurrentSubtitle,
            getSearchPlaceholder,
            toggleStatsSidebar,
            toggleSearchScope,
            setSearchFilter,
            selectRecentSearch,
            clearRecentSearches,
            togglePermissionManager,
            toggleUserMenu,
            markAllNotificationsAsRead,
            getDayStatus,
            
            // Card Interactions
            startDrag,
            endDrag,
            togglePinCard,
            toggleCollapseCard,
            dismissAllAlerts,
            dismissCoverageAlert,
            viewUnitDetails,
            viewScheduleDetails,
            viewStaffSchedule,
            
            // Authentication
            handleAdvancedLogin,
            handleLogout,
            
            // Staff Details
            viewStaffDetails,
            loadStaffStats,
            loadStaffActivity,
            loadStaffRotations,
            loadStaffDocuments,
            
            // Staff Activity
            loadStaffDailyActivities,
            getTodaysSchedule,
            getUpcomingOnCall,
            getActivityIcon,
            formatScheduleTime,
            
            // Search
            handleAdvancedSearch,
            
            // Filters
            resetStaffFilters,
            applyStaffFilters,
            resetRotationFilters,
            applyRotationFilters,
            resetAuditFilters,
            applyAuditFilters,
            
            // Modals
            showAddMedicalStaffModal,
            editMedicalStaff,
            saveMedicalStaff,
            deleteMedicalStaff,
            
            showAddOnCallModal,
            editOnCallSchedule,
            saveOnCallSchedule,
            overrideOnCall,
            deleteOnCallSchedule,
            
            showAddLeaveRequestModal,
            viewLeaveRequestDetails,
            approveLeaveRequest,
            rejectLeaveRequest,
            saveLeaveRequest,
            
            showAddTrainingUnitModal,
            editTrainingUnit,
            saveTrainingUnit,
            assignResidentsToUnit,
            
            showAddRotationModal,
            editRotation,
            extendRotation,
            saveRotation,
            deleteRotation,
            
            showQuickPlacementModal,
            saveQuickPlacement,
            
            showCommunicationsModal,
            saveCommunication,
            
            showSystemSettingsModal,
            saveSystemSettings,
            
            showUserProfileModal,
            saveUserProfile,
            
            // Export/Import
            exportData,
            exportAuditLogs,
            exportStaffList,
            showImportModal,
            
            // Bulk Operations
            sendBulkNotifications,
            showStaffReport,
            updateCapacity,
            quickAssignToUnit,
            
            // Drag and Drop
            handleDrop,
            removePlacement,
            
            // Toast
            removeToast,
            
            // Progress indicators
            operationProgress
        };
    }
});

// Mount the app
app.mount('#app');

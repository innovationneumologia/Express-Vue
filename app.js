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
const { createApp, ref, computed, onMounted } = Vue;

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
            overwriteExisting: false
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

        // ============ AUDIT LOGGING ============
        const generateAuditId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const logAudit = async (action, details, resource, resourceId = null) => {
            const logEntry = {
                id: generateAuditId(),
                timestamp: new Date().toISOString(),
                user_id: currentUser.value?.id,
                user_name: currentUser.value?.full_name,
                user_role: currentUser.value?.user_role,
                action,
                details,
                resource,
                resource_id: resourceId,
                permission_level: currentUser.value?.user_role === 'system_admin' ? 'full' : 'limited',
                ip_address: 'system',
                user_agent: navigator.userAgent
            };
            
            auditLogs.value.unshift(logEntry);
            
            try {
                await supabaseClient.from('audit_logs').insert([logEntry]);
            } catch (error) {
                console.error('Failed to save audit log:', error);
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

        // ============ UTILITY FUNCTIONS ============
        const getInitials = (name) => {
            if (!name) return '??';
            return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        };

        const formatDateTime = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const formatTimeAgo = (date) => {
            if (!date) return 'Just now';
            const now = new Date();
            const then = new Date(date);
            const diffMs = now - then;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            
            if (diffSec < 60) return 'Just now';
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHour < 24) return `${diffHour}h ago`;
            return formatDate(date);
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
                PERMISSION_CHANGE: 'fas fa-user-shield'
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

        // ============ DATA GETTERS ============
        const getPhysicianName = (physicianId) => {
            const physician = medicalStaff.value.find(staff => staff.id === physicianId);
            return physician ? physician.full_name : 'Unknown Physician';
        };

        const getResidentName = (residentId) => {
            const resident = medicalStaff.value.find(s => s.id === residentId);
            return resident ? resident.full_name : `Resident ${residentId?.substring(0, 8) || 'Unknown'}`;
        };

        const getTrainingUnitName = (unitId) => {
            const unit = trainingUnits.value.find(u => u.id === unitId);
            return unit ? unit.unit_name : `Unit ${unitId?.substring(0, 8) || 'Unknown'}`;
        };

        const getAttendingName = (attendingId) => {
            const attending = medicalStaff.value.find(s => s.id === attendingId && s.staff_type === 'attending_physician');
            return attending ? attending.full_name : `Attending ${attendingId?.substring(0, 8) || 'Unknown'}`;
        };

        const getAssignedResidents = (unitId) => {
            const rotationIds = residentRotations.value
                .filter(r => r.training_unit_id === unitId && (r.rotation_status === 'active' || r.rotation_status === 'scheduled'))
                .map(r => r.resident_id);
            
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'medical_resident' && rotationIds.includes(staff.id)
            );
        };

        // ============ STAFF DETAILS FUNCTIONS ============
        const viewStaffDetails = async (staff) => {
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
            
            await loadStaffStats(staff.id);
            await loadStaffActivity(staff.id);
            await loadStaffRotations(staff.id);
            await loadStaffDocuments(staff.id);
            
            logAudit('STAFF_VIEW', `Viewed details for ${staff.full_name}`, 'medical_staff', staff.id);
        };

        const loadStaffStats = async (staffId) => {
            try {
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
            } catch (error) {
                console.error('Error loading staff stats:', error);
            }
        };

        const loadStaffActivity = async (staffId) => {
            try {
                const today = new Date().toISOString().split('T')[0];
                
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
            } catch (error) {
                console.error('Error loading staff activity:', error);
                staffDetailsModal.value.activity = [];
            }
        };

        const loadStaffRotations = async (staffId) => {
            try {
                const rotations = residentRotations.value.filter(r => r.resident_id === staffId);
                staffDetailsModal.value.rotations = rotations;
            } catch (error) {
                console.error('Error loading staff rotations:', error);
                staffDetailsModal.value.rotations = [];
            }
        };

        const loadStaffDocuments = async (staffId) => {
            try {
                staffDetailsModal.value.documents = [
                    { id: 1, name: 'Medical License', type: 'license', description: 'Valid through 2025', upload_date: '2024-01-15' },
                    { id: 2, name: 'Board Certification', type: 'certificate', description: 'Pulmonary Medicine', upload_date: '2024-02-01' }
                ];
            } catch (error) {
                console.error('Error loading staff documents:', error);
                staffDetailsModal.value.documents = [];
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
            const today = new Date().toISOString().split('T')[0];
            return onCallSchedule.value
                .filter(o => o.duty_date === today)
                .slice(0, 3);
        });

        const recentAnnouncements = computed(() => {
            const today = new Date().toISOString().split('T')[0];
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
                const dateString = date.toISOString().split('T')[0];
                
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
            
            await loadViewData(view);
            logAudit('VIEW_CHANGE', `Switched to ${view} view`, 'navigation');
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

        const formatDateShort = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
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
            showAdvancedToast('Info', `Viewing unit details`, 'info');
        };

        const viewScheduleDetails = (date) => {
            showAdvancedToast('Info', `Viewing schedule for ${formatDate(date)}`, 'info');
        };

        // ============ AUTHENTICATION ============
        const handleAdvancedLogin = async () => {
            loading.value = true;
            
            try {
                const email = loginForm.value.email.trim().toLowerCase();
                const password = loginForm.value.password;
                const selectedRole = loginForm.value.user_role;
                
                if (!email || !password || !selectedRole) {
                    throw new Error('Please fill in all fields');
                }
                
                if (email === 'admin@neumocare.org' && password === 'password123') {
                    currentUser.value = {
                        id: '1',
                        email: email,
                        full_name: 'System Administrator',
                        user_role: selectedRole,
                        phone: '+1 (555) 123-4567',
                        department: 'Pulmonary Medicine',
                        account_status: 'active'
                    };
                } else {
                    const { data: existingUser } = await supabaseClient
                        .from('app_users')
                        .select('*')
                        .eq('email', email)
                        .maybeSingle();
                    
                    if (existingUser) {
                        currentUser.value = existingUser;
                    } else {
                        const { data: newUser } = await supabaseClient
                            .from('app_users')
                            .insert([{
                                email: email,
                                full_name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                user_role: selectedRole,
                                account_status: 'active'
                            }])
                            .select()
                            .single();
                        
                        currentUser.value = newUser;
                    }
                }
                
                showAdvancedToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
                logAudit('LOGIN_SUCCESS', `User logged in as ${currentUser.value.user_role}`, 'auth');
                
                await loadInitialData();
                currentView.value = 'daily_operations';
                
            } catch (error) {
                console.error('Login error:', error);
                showAdvancedToast('Login Failed', error.message || 'Invalid credentials', 'error');
                logAudit('LOGIN_FAILED', `Failed login attempt: ${error.message}`, 'auth');
            } finally {
                loading.value = false;
            }
        };

        const handleLogout = () => {
            logAudit('LOGOUT', 'User logged out', 'auth');
            currentUser.value = null;
            currentView.value = 'login';
            userMenuOpen.value = false;
            showAdvancedToast('Logged Out', 'You have been successfully logged out', 'info');
        };

        // ============ DATA LOADING ============
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
                    loadUserNotifications()
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
            try {
                const { data, error } = await supabaseClient
                    .from('medical_staff')
                    .select('*')
                    .order('full_name');
                
                if (error) throw error;
                medicalStaff.value = data || [];
            } catch (error) {
                console.error('Error loading medical staff:', error);
                medicalStaff.value = [];
            }
        };

        const loadTrainingUnits = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('training_units')
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
            try {
                const { data, error } = await supabaseClient
                    .from('resident_rotations')
                    .select('*')
                    .order('rotation_start_date', { ascending: false });
                
                if (error) throw error;
                residentRotations.value = data || [];
            } catch (error) {
                console.error('Error loading resident rotations:', error);
                residentRotations.value = [];
            }
        };

        const loadLeaveRequests = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('leave_requests')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                leaveRequests.value = data || [];
            } catch (error) {
                console.error('Error loading leave requests:', error);
                leaveRequests.value = [];
            }
        };

        const loadOnCallSchedule = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('oncall_schedule')
                    .select('*')
                    .order('duty_date', { ascending: true });
                
                if (error) throw error;
                onCallSchedule.value = data || [];
                lastUpdated.value.todaysOnCall = new Date();
            } catch (error) {
                console.error('Error loading on-call schedule:', error);
                onCallSchedule.value = [];
            }
        };

        const loadAnnouncements = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const { data, error } = await supabaseClient
                    .from('department_announcements')
                    .select('*')
                    .lte('publish_start_date', today)
                    .or(`publish_end_date.is.null,publish_end_date.gte.${today}`)
                    .order('priority_level', { ascending: false })
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                announcements.value = data || [];
            } catch (error) {
                console.error('Error loading announcements:', error);
                announcements.value = [];
            }
        };

        const loadAuditLogs = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('audit_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(50);
                
                if (error) throw error;
                auditLogs.value = data || [];
            } catch (error) {
                console.error('Error loading audit logs:', error);
                auditLogs.value = [];
            }
        };

        const loadSystemSettings = async () => {
            try {
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
            } catch (error) {
                console.error('Error loading system settings:', error);
                systemSettings.value = {};
            }
        };

        const loadUserNotifications = async () => {
            try {
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
            } catch (error) {
                console.error('Error loading notifications:', error);
                userNotifications.value = [];
            }
        };

        // ============ FILTER FUNCTIONS ============
        const resetStaffFilters = () => {
            staffSearch.value = '';
            staffFilter.value = {
                staff_type: '',
                employment_status: ''
            };
        };

        const applyStaffFilters = () => {
            showAdvancedToast('Filters Applied', 'Medical staff filters updated', 'info');
        };

        const resetRotationFilters = () => {
            rotationFilter.value = {
                category: '',
                status: ''
            };
        };

        const applyRotationFilters = () => {
            showAdvancedToast('Filters Applied', 'Rotation filters updated', 'info');
        };

        const resetAuditFilters = () => {
            auditFilter.value = {
                action: '',
                dateRange: 'today'
            };
        };

        const applyAuditFilters = () => {
            showAdvancedToast('Filters Applied', 'Audit filters updated', 'info');
        };

        // ============ MODAL FUNCTIONS ============
        const showAddMedicalStaffModal = () => {
            if (!hasPermission('medical_staff', 'create')) {
                showAdvancedToast('Permission Denied', 'You need create permission to add medical staff', 'permission');
                return;
            }
            
            medicalStaffModal.value = {
                show: true,
                mode: 'add',
                staff: null,
                form: {
                    full_name: '',
                    staff_type: 'medical_resident',
                    staff_id: `MD-${Date.now().toString().slice(-6)}`,
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
            if (!hasPermission('medical_staff', medicalStaffModal.value.mode === 'add' ? 'create' : 'update')) {
                showAdvancedToast('Permission Denied', 'Insufficient permissions', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (!medicalStaffModal.value.form.full_name.trim()) {
                    throw new Error('Full name is required');
                }
                
                if (medicalStaffModal.value.mode === 'add') {
                    const { data, error } = await supabaseClient
                        .from('medical_staff')
                        .insert([{
                            ...medicalStaffModal.value.form,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    medicalStaff.value.unshift(data);
                    showAdvancedToast('Success', 'Medical staff added successfully', 'success');
                    logAudit('STAFF_CREATE', `Added: ${data.full_name}`, 'medical_staff', data.id);
                } else {
                    const { data, error } = await supabaseClient
                        .from('medical_staff')
                        .update({
                            ...medicalStaffModal.value.form,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', medicalStaffModal.value.staff.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    const index = medicalStaff.value.findIndex(s => s.id === data.id);
                    if (index !== -1) {
                        medicalStaff.value[index] = data;
                    }
                    
                    showAdvancedToast('Success', 'Medical staff updated successfully', 'success');
                    logAudit('STAFF_UPDATE', `Updated: ${data.full_name}`, 'medical_staff', data.id);
                }
                
                medicalStaffModal.value.show = false;
            } catch (error) {
                console.error('Error saving medical staff:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const deleteMedicalStaff = async (staff) => {
            if (!hasPermission('medical_staff', 'delete')) {
                showAdvancedToast('Permission Denied', 'You need delete permission to remove medical staff', 'permission');
                return;
            }
            
            if (!confirm(`Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`)) {
                return;
            }
            
            try {
                const { error } = await supabaseClient
                    .from('medical_staff')
                    .delete()
                    .eq('id', staff.id);
                
                if (error) throw error;
                
                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                if (index !== -1) {
                    medicalStaff.value.splice(index, 1);
                }
                
                showAdvancedToast('Deleted', `${staff.full_name} has been removed`, 'success');
                logAudit('STAFF_DELETE', `Deleted: ${staff.full_name}`, 'medical_staff', staff.id);
            } catch (error) {
                console.error('Error deleting medical staff:', error);
                showAdvancedToast('Delete Failed', error.message, 'error');
            }
        };

        const showAddOnCallModal = () => {
            if (!hasPermission('oncall_schedule', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            
            onCallModal.value = {
                show: true,
                mode: 'add',
                schedule: null,
                form: {
                    duty_date: dateString,
                    schedule_id: `ONCALL-${dateString.replace(/-/g, '')}-001`,
                    shift_type: 'backup_call',
                    primary_physician_id: '',
                    backup_physician_id: '',
                    start_time: '08:00',
                    end_time: '20:00',
                    coverage_notes: ''
                }
            };
        };

        const saveOnCallSchedule = async () => {
            if (!hasPermission('oncall_schedule', onCallModal.value.mode === 'add' ? 'create' : 'update')) {
                showAdvancedToast('Permission Denied', 'Insufficient permissions', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (!onCallModal.value.form.duty_date) throw new Error('Date required');
                if (!onCallModal.value.form.primary_physician_id) throw new Error('Primary physician required');
                
                const scheduleData = {
                    duty_date: onCallModal.value.form.duty_date,
                    schedule_id: onCallModal.value.form.schedule_id,
                    shift_type: onCallModal.value.form.shift_type,
                    primary_physician_id: onCallModal.value.form.primary_physician_id,
                    backup_physician_id: onCallModal.value.form.backup_physician_id || null,
                    start_time: onCallModal.value.form.start_time + ':00',
                    end_time: onCallModal.value.form.end_time + ':00',
                    coverage_notes: onCallModal.value.form.coverage_notes,
                    updated_at: new Date().toISOString()
                };
                
                let result;
                
                if (onCallModal.value.mode === 'add') {
                    const { data, error } = await supabaseClient
                        .from('oncall_schedule')
                        .insert([{
                            ...scheduleData,
                            created_at: new Date().toISOString(),
                            created_by: currentUser.value?.id
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    result = data;
                    onCallSchedule.value.push(result);
                    showAdvancedToast('Success', 'On-call schedule created', 'success');
                    
                } else {
                    const { data, error } = await supabaseClient
                        .from('oncall_schedule')
                        .update(scheduleData)
                        .eq('id', onCallModal.value.schedule.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    result = data;
                    
                    const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                    if (index !== -1) onCallSchedule.value[index] = result;
                    
                    showAdvancedToast('Success', 'On-call schedule updated', 'success');
                }
                
                onCallModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving on-call schedule:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const deleteOnCallSchedule = async (schedule) => {
            if (!hasPermission('oncall_schedule', 'delete')) {
                showAdvancedToast('Permission Denied', 'Need delete permission', 'permission');
                return;
            }
            
            if (!confirm(`Delete on-call schedule for ${formatDate(schedule.duty_date)}?`)) return;
            
            try {
                const { error } = await supabaseClient
                    .from('oncall_schedule')
                    .delete()
                    .eq('id', schedule.id);
                
                if (error) throw error;
                
                const index = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                if (index !== -1) {
                    onCallSchedule.value.splice(index, 1);
                }
                
                showAdvancedToast('Deleted', 'On-call schedule removed', 'success');
                logAudit('ONCALL_DELETE', `Deleted schedule for ${formatDate(schedule.duty_date)}`, 'oncall_schedule', schedule.id);
            } catch (error) {
                console.error('Error deleting on-call schedule:', error);
                showAdvancedToast('Delete Failed', error.message, 'error');
            }
        };

        const showAddLeaveRequestModal = () => {
            if (!hasPermission('leave_requests', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = nextWeek.toISOString().split('T')[0];
            
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
            
            try {
                const { data, error } = await supabaseClient
                    .from('leave_requests')
                    .update({
                        status: 'approved',
                        approver_notes: `Approved by ${currentUser.value.full_name}`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', request.id)
                    .select()
                    .single();
                
                if (error) throw error;
                
                const index = leaveRequests.value.findIndex(r => r.id === data.id);
                if (index !== -1) leaveRequests.value[index] = data;
                
                showAdvancedToast('Approved', `Leave request approved`, 'success');
                logAudit('LEAVE_APPROVE', `Approved leave request for ${getPhysicianName(request.staff_member_id)}`, 'leave_requests', request.id);
                
            } catch (error) {
                console.error('Error approving leave:', error);
                showAdvancedToast('Approval Failed', error.message, 'error');
            }
        };

        const rejectLeaveRequest = async (request) => {
            if (!hasPermission('leave_requests', 'reject')) {
                showAdvancedToast('Permission Denied', 'Need reject permission', 'permission');
                return;
            }
            
            if (!confirm(`Reject leave request for ${getPhysicianName(request.staff_member_id)}?`)) return;
            
            try {
                const { data, error } = await supabaseClient
                    .from('leave_requests')
                    .update({
                        status: 'rejected',
                        approver_notes: `Rejected by ${currentUser.value.full_name}`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', request.id)
                    .select()
                    .single();
                
                if (error) throw error;
                
                const index = leaveRequests.value.findIndex(r => r.id === data.id);
                if (index !== -1) leaveRequests.value[index] = data;
                
                showAdvancedToast('Rejected', `Leave request rejected`, 'error');
                logAudit('LEAVE_REJECT', `Rejected leave request for ${getPhysicianName(request.staff_member_id)}`, 'leave_requests', request.id);
                
            } catch (error) {
                console.error('Error rejecting leave:', error);
                showAdvancedToast('Rejection Failed', error.message, 'error');
            }
        };

        const saveLeaveRequest = async () => {
            saving.value = true;
            try {
                if (!leaveRequestModal.value.form.start_date || !leaveRequestModal.value.form.end_date) {
                    throw new Error('Start and end dates are required');
                }
                
                if (leaveRequestModal.value.mode === 'add') {
                    if (!hasPermission('leave_requests', 'create')) {
                        throw new Error('No permission to create leave requests');
                    }
                    
                    const start = new Date(leaveRequestModal.value.form.start_date);
                    const end = new Date(leaveRequestModal.value.form.end_date);
                    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
                    const random = Math.floor(Math.random() * 1000).toString().padStart(3,'0');

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
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    leaveRequests.value.unshift(data);
                    showAdvancedToast('Success', 'Leave request submitted', 'success');
                    logAudit('LEAVE_CREATE', `Submitted leave request`, 'leave_requests', data.id);
                    
                } else {
                    if (!hasPermission('leave_requests', 'update')) {
                        throw new Error('No permission to update leave requests');
                    }
                    
                    const { data, error } = await supabaseClient
                        .from('leave_requests')
                        .update({
                            status: leaveRequestModal.value.form.status,
                            approver_notes: leaveRequestModal.value.form.approver_notes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', leaveRequestModal.value.request.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    const index = leaveRequests.value.findIndex(r => r.id === data.id);
                    if (index !== -1) leaveRequests.value[index] = data;
                    
                    showAdvancedToast('Success', 'Leave request updated', 'success');
                    logAudit('LEAVE_UPDATE', `Updated leave request status to ${data.status}`, 'leave_requests', data.id);
                }
                
                leaveRequestModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving leave request:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const showAddRotationModal = () => {
            if (!hasPermission('resident_rotations', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            const date = new Date();
            const rotationId = `ROT-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
            
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
                    rotation_start_date: startDate.toISOString().split('T')[0],
                    rotation_end_date: endDate.toISOString().split('T')[0],
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
                    rotation_end_date: newEndDate.toISOString().split('T')[0],
                    rotation_category: rotation.rotation_category,
                    rotation_status: 'scheduled',
                    clinical_notes: 'Extended rotation - ' + rotation.clinical_notes,
                    supervisor_evaluation: ''
                }
            };
        };

        const saveRotation = async () => {
            const permissionNeeded = rotationModal.value.mode === 'add' ? 'create' : 'update';
            if (!hasPermission('resident_rotations', permissionNeeded)) {
                showAdvancedToast('Permission Denied', 'Insufficient permissions', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (!rotationModal.value.form.rotation_id) throw new Error('Rotation ID required');
                if (!rotationModal.value.form.resident_id) throw new Error('Resident ID required');
                if (!rotationModal.value.form.training_unit_id) throw new Error('Training Unit ID required');
                if (!rotationModal.value.form.rotation_start_date) throw new Error('Start date required');
                if (!rotationModal.value.form.rotation_end_date) throw new Error('End date required');
                
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
                    updated_at: new Date().toISOString()
                };
                
                let result;
                
                if (rotationModal.value.mode === 'add') {
                    const { data, error } = await supabaseClient
                        .from('resident_rotations')
                        .insert([{
                            ...rotationData,
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    result = data;
                    
                    residentRotations.value.unshift(result);
                    showAdvancedToast('Success', 'Rotation scheduled successfully', 'success');
                    logAudit('ROTATION_CREATE', `Created rotation ${rotationData.rotation_id}`, 'resident_rotations', result.id);
                    
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
                    logAudit('ROTATION_UPDATE', `Updated rotation ${rotationData.rotation_id}`, 'resident_rotations', result.id);
                }
                
                rotationModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving rotation:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
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
            
            try {
                const { error } = await supabaseClient
                    .from('resident_rotations')
                    .delete()
                    .eq('id', rotation.id);
                
                if (error) throw error;
                
                const index = residentRotations.value.findIndex(r => r.id === rotation.id);
                if (index !== -1) {
                    residentRotations.value.splice(index, 1);
                }
                
                showAdvancedToast('Deleted', `Rotation ${rotation.rotation_id} has been removed`, 'success');
                logAudit('ROTATION_DELETE', `Deleted rotation: ${rotation.rotation_id}`, 'resident_rotations', rotation.id);
            } catch (error) {
                console.error('Error deleting rotation:', error);
                showAdvancedToast('Delete Failed', error.message, 'error');
            }
        };

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
            if (!hasPermission('training_units', trainingUnitModal.value.mode === 'add' ? 'create' : 'update')) {
                showAdvancedToast('Permission Denied', 'Insufficient permissions', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (!trainingUnitModal.value.form.unit_name.trim()) {
                    throw new Error('Unit name required');
                }
                
                const unitData = {
                    ...trainingUnitModal.value.form,
                    updated_at: new Date().toISOString()
                };
                
                if (trainingUnitModal.value.mode === 'add') {
                    const { data, error } = await supabaseClient
                        .from('training_units')
                        .insert([{
                            ...unitData,
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    trainingUnits.value.unshift(data);
                    showAdvancedToast('Success', 'Training unit added', 'success');
                    logAudit('TRAINING_UNIT_CREATE', `Added unit: ${unitData.unit_name}`, 'training_units', data.id);
                } else {
                    const { data, error } = await supabaseClient
                        .from('training_units')
                        .update(unitData)
                        .eq('id', trainingUnitModal.value.unit.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    const index = trainingUnits.value.findIndex(u => u.id === data.id);
                    if (index !== -1) trainingUnits.value[index] = data;
                    showAdvancedToast('Success', 'Training unit updated', 'success');
                    logAudit('TRAINING_UNIT_UPDATE', `Updated unit: ${unitData.unit_name}`, 'training_units', data.id);
                }
                
                trainingUnitModal.value.show = false;
            } catch (error) {
                console.error('Error saving training unit:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

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
            if (!hasPermission('placements', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (!quickPlacementModal.value.form.resident_id || !quickPlacementModal.value.form.unit_id) {
                    throw new Error('Please select both resident and unit');
                }
                
                const rotationId = `PLACEMENT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000)}`;
                const startDate = new Date().toISOString().split('T')[0];
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + (quickPlacementModal.value.form.duration * 7));
                
                const { data, error } = await supabaseClient
                    .from('resident_rotations')
                    .insert([{
                        rotation_id: rotationId,
                        resident_id: quickPlacementModal.value.form.resident_id,
                        training_unit_id: quickPlacementModal.value.form.unit_id,
                        rotation_start_date: startDate,
                        rotation_end_date: endDate.toISOString().split('T')[0],
                        rotation_category: 'clinical_rotation',
                        rotation_status: 'scheduled',
                        clinical_notes: 'Placed via quick placement',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                residentRotations.value.unshift(data);
                
                const unitIndex = trainingUnits.value.findIndex(u => u.id === quickPlacementModal.value.form.unit_id);
                if (unitIndex !== -1) {
                    trainingUnits.value[unitIndex].current_residents = 
                        (trainingUnits.value[unitIndex].current_residents || 0) + 1;
                }
                
                showAdvancedToast('Success', 'Resident placed successfully', 'success');
                logAudit('QUICK_PLACEMENT', `Quick placement created for resident`, 'placements', data.id);
                
                quickPlacementModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving quick placement:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const showCommunicationsModal = () => {
            if (!hasPermission('communications', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            const today = new Date().toISOString().split('T')[0];
            
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
            if (!hasPermission('communications', 'create')) {
                showAdvancedToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (communicationsModal.value.activeTab === 'announcement') {
                    if (!communicationsModal.value.form.announcement_title.trim()) {
                        throw new Error('Announcement title is required');
                    }
                    if (!communicationsModal.value.form.announcement_content.trim()) {
                        throw new Error('Announcement content is required');
                    }
                    
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
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    announcements.value.unshift(data);
                    showAdvancedToast('Published', 'Announcement published successfully', 'success');
                    logAudit('ANNOUNCEMENT_CREATE', `Published: ${data.announcement_title}`, 'communications', data.id);
                    
                } else if (communicationsModal.value.activeTab === 'capacity') {
                    currentCapacity.value = {
                        er: { ...communicationsModal.value.capacity.er, status: getCapacityStatus(communicationsModal.value.capacity.er) },
                        icu: { ...communicationsModal.value.capacity.icu, status: getCapacityStatus(communicationsModal.value.capacity.icu) },
                        ward: { ...communicationsModal.value.capacity.ward, status: getCapacityStatus(communicationsModal.value.capacity.ward) },
                        stepdown: { ...communicationsModal.value.capacity.stepdown, status: getCapacityStatus(communicationsModal.value.capacity.stepdown) }
                    };
                    
                    showAdvancedToast('Updated', 'Capacity information updated', 'success');
                    logAudit('CAPACITY_UPDATE', 'Updated department capacity', 'communications');
                    
                } else if (communicationsModal.value.activeTab === 'quick') {
                    if (!communicationsModal.value.quickUpdate.message.trim()) {
                        throw new Error('Message is required');
                    }
                    
                    quickUpdates.value.unshift({
                        id: Date.now(),
                        author: currentUser.value.full_name,
                        message: communicationsModal.value.quickUpdate.message,
                        timestamp: 'Just now',
                        tags: communicationsModal.value.quickUpdate.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                    });
                    
                    showAdvancedToast('Posted', 'Quick update posted', 'success');
                    logAudit('QUICK_UPDATE', 'Posted quick update', 'communications');
                }
                
                communicationsModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving communication:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const showSystemSettingsModal = () => {
            if (!hasPermission('system', 'read')) {
                showAdvancedToast('Permission Denied', 'Need read permission for system settings', 'permission');
                return;
            }
            
            systemSettingsModal.value = {
                show: true,
                form: { ...systemSettings.value }
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
                logAudit('SETTINGS_UPDATE', 'Updated system settings', 'system');
                
                systemSettingsModal.value.show = false;
            } catch (error) {
                console.error('Error saving system settings:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

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
                logAudit('PROFILE_UPDATE', 'Updated user profile', 'user_profile');
                
                userProfileModal.value.show = false;
            } catch (error) {
                console.error('Error saving profile:', error);
                showAdvancedToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const showImportExportModal = (mode = 'export', table = null) => {
            if (mode === 'export' && !hasPermission('audit', 'export')) {
                showAdvancedToast('Permission Denied', 'Need export permission', 'permission');
                return;
            }
            
            if (mode === 'import' && !hasPermission('system', 'admin')) {
                showAdvancedToast('Permission Denied', 'Admin access required for import', 'permission');
                return;
            }
            
            importExportModal.value = {
                show: true,
                mode: mode,
                selectedTable: table || 'medical_staff',
                exportFormat: 'csv',
                overwriteExisting: false
            };
        };

        const exportData = async () => {
            if (!hasPermission('audit', 'export')) {
                showAdvancedToast('Permission Denied', 'Need export permission', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                let data = [];
                let filename = '';
                
                switch (importExportModal.value.selectedTable) {
                    case 'medical_staff':
                        data = medicalStaff.value;
                        filename = 'medical_staff';
                        break;
                    case 'training_units':
                        data = trainingUnits.value;
                        filename = 'training_units';
                        break;
                    case 'resident_rotations':
                        data = residentRotations.value;
                        filename = 'resident_rotations';
                        break;
                    case 'audit_logs':
                        data = auditLogs.value;
                        filename = 'audit_logs';
                        break;
                    default:
                        throw new Error('Invalid table selected');
                }
                
                if (data.length === 0) {
                    throw new Error('No data to export');
                }
                
                const headers = Object.keys(data[0]).join(',');
                const rows = data.map(row => 
                    Object.values(row).map(value => 
                        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
                    ).join(',')
                );
                
                const csvContent = [headers, ...rows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                
                a.href = url;
                a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showAdvancedToast('Export Complete', `${data.length} records exported`, 'success');
                logAudit('DATA_EXPORT', `Exported ${filename} data`, 'audit');
                
                importExportModal.value.show = false;
            } catch (error) {
                console.error('Error exporting data:', error);
                showAdvancedToast('Export Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const importData = async () => {
            if (!hasPermission('system', 'admin')) {
                showAdvancedToast('Permission Denied', 'Admin access required', 'permission');
                return;
            }
            
            showAdvancedToast('Import', 'Import functionality would process the file here', 'info');
            importExportModal.value.show = false;
        };

        const exportAuditLogs = () => {
            showImportExportModal('export', 'audit_logs');
        };

        const exportStaffList = () => {
            showImportExportModal('export', 'medical_staff');
        };

        const showImportModal = (table) => {
            showImportExportModal('import', table);
        };

        const sendBulkNotifications = () => {
            showAdvancedToast('Notifications', 'Bulk notifications would be sent here', 'info');
        };

        const showStaffReport = () => {
            showAdvancedToast('Report', 'Staff report would be generated here', 'info');
        };

        const updateCapacity = () => {
            showAdvancedToast('Capacity Updated', 'Department capacity has been updated', 'success');
        };

        const quickAssignToUnit = (alert) => {
            showQuickPlacementModal();
        };

        const handleAdvancedSearch = () => {
            if (searchQuery.value.trim()) {
                recentSearches.value.unshift({
                    query: searchQuery.value,
                    time: 'Just now'
                });
                
                if (recentSearches.value.length > 5) {
                    recentSearches.value.pop();
                }
                
                logAudit('SEARCH', `Searched for: ${searchQuery.value}`, 'system');
                showAdvancedToast('Search', `Searching for "${searchQuery.value}"`, 'info');
            }
        };

        const savePermissionChanges = async () => {
            if (!hasPermission('system', 'admin')) {
                showAdvancedToast('Permission Denied', 'Admin access required', 'permission');
                return;
            }
            
            savingPermissions.value = true;
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                showAdvancedToast('Permissions Saved', 'All permission changes have been saved', 'success');
                logAudit('PERMISSIONS_SAVED', 'Updated system permissions', 'system');
            } catch (error) {
                console.error('Error saving permissions:', error);
                showAdvancedToast('Save Failed', 'Failed to save permission changes', 'error');
            } finally {
                savingPermissions.value = false;
                showPermissionManager.value = false;
            }
        };

        const togglePermission = (roleId, resource, action) => {
            showAdvancedToast('Permission', `Permission ${action} for ${resource} would be toggled here`, 'info');
        };

        const handleDrop = (event, unit) => {
            event.preventDefault();
            showAdvancedToast('Drop', `Resident would be placed in ${unit.unit_name}`, 'info');
        };

        const removePlacement = async (residentId, unitId) => {
            if (!confirm('Remove resident from this unit?')) return;
            showAdvancedToast('Removed', 'Resident removed from unit', 'success');
        };

        const loadStaffDailyActivities = async (staffId) => {
            staffDailyActivities.value[staffId] = [
                { type: 'assignment', title: 'Morning Rounds', time: '08:00-10:00', location: 'Ward A' },
                { type: 'oncall', title: 'On-call Duty', time: '18:00-08:00', location: 'Hospital-wide' }
            ];
            expandedStaffId.value = expandedStaffId.value === staffId ? null : staffId;
        };

        // ============ INITIALIZATION ============
        onMounted(() => {
            supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    console.log('Existing session found');
                }
            }).catch(error => {
                console.error('Error getting session:', error);
            });
        });

        // ============ RETURN STATEMENT ============
        return {
            // State
            currentUser,
            loginForm,
            loading,
            saving,
            savingPermissions,
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
            formatDateShort,
            
            // Card Interactions
            startDrag,
            endDrag,
            togglePinCard,
            toggleCollapseCard,
            dismissAllAlerts,
            dismissCoverageAlert,
            viewUnitDetails,
            viewScheduleDetails,
            
            // Authentication
            handleAdvancedLogin,
            handleLogout,
            
            // Staff Details
            viewStaffDetails,
            loadStaffStats,
            loadStaffActivity,
            loadStaffRotations,
            loadStaffDocuments,
            
            // Modals
            showAddMedicalStaffModal,
            editMedicalStaff,
            saveMedicalStaff,
            deleteMedicalStaff,
            
            showAddOnCallModal,
            saveOnCallSchedule,
            deleteOnCallSchedule,
            editOnCallSchedule,
            overrideOnCall,
            
            showAddLeaveRequestModal,
            viewLeaveRequestDetails,
            approveLeaveRequest,
            rejectLeaveRequest,
            saveLeaveRequest,
            
            showAddTrainingUnitModal,
            editTrainingUnit,
            saveTrainingUnit,
            
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
            
            showImportExportModal,
            exportData,
            importData,
            exportAuditLogs,
            exportStaffList,
            showImportModal,
            
            // Actions
            sendBulkNotifications,
            showStaffReport,
            updateCapacity,
            quickAssignToUnit,
            handleAdvancedSearch,
            savePermissionChanges,
            togglePermission,
            handleDrop,
            removePlacement,
            loadStaffDailyActivities,
            
            // Filters
            resetStaffFilters,
            applyStaffFilters,
            resetRotationFilters,
            applyRotationFilters,
            resetAuditFilters,
            applyAuditFilters,
            
            // Toast
            removeToast
        };
    }
});

// Mount the app
app.mount('#app');

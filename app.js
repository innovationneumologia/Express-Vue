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
                system: { read: true, update: true, admin: true }
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
                system: { read: true, update: false, admin: false }
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
                system: { read: false, update: false, admin: false }
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
                system: { read: false, update: false, admin: false }
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
                system: { read: false, update: false, admin: false }
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
const { createApp, ref, computed, onMounted, watch } = Vue;

const app = createApp({
    setup() {
        // ============ STATE MANAGEMENT ============
        const currentUser = ref(null);
        const loginForm = ref({
            email: '',
            password: '',
            user_role: 'resident_manager',
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
        const searchQuery = ref('');
        const permissionFilter = ref([]);
        const userMenuOpen = ref(false);
        const expandedStaffId = ref(null);
        const staffDailyActivities = ref({});
        const unitDropZone = ref(null);
        
        // Announcements Panel state
        const announcementsPanel = ref({
            open: false
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
        const systemRoles = ref([]);
        const systemSettings = ref({});
        const userNotifications = ref([]);
        const emergencyContacts = ref([]);

        // Stats
        const systemStats = ref({
            active_users: 0,
            total_staff: 0,
            today_assignments: 0,
            pending_approvals: 0
        });

        // Toast system
        const toasts = ref([]);
        let toastId = 0;

        // ============ MODAL STATES ============
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

        const announcementModal = ref({
            show: false,
            mode: 'add',
            announcement: null,
            form: {
                announcement_title: '',
                announcement_content: '',
                publish_start_date: '',
                publish_end_date: '',
                priority_level: 'medium',
                target_audience: 'all'
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

        const systemSettingsModal = ref({
            show: false,
            form: {
                hospital_name: 'PneumoCare Hospital',
                department_name: 'Pulmonary Medicine',
                max_residents_per_unit: 10,
                enable_audit_logging: true,
                require_mfa: false,
                maintenance_mode: false
            }
        });

        const userProfileModal = ref({
            show: false,
            form: {
                full_name: '',
                email: '',
                phone: '',
                department: '',
                notifications_enabled: true
            }
        });

        const importExportModal = ref({
            show: false,
            mode: 'import',
            selectedTable: 'medical_staff',
            importFile: null,
            exportFormat: 'csv'
        });

        // Filter states
        const staffSearch = ref('');
        const staffFilter = ref({
            staff_type: '',
            employment_status: ''
        });
        const rotationFilter = ref({
            status: '',
            category: '',
            search: ''
        });

        // ============ PERMISSION SYSTEM ============
        const userPermissions = ref({});
        const permissionResources = ref(PermissionSystem.resources);

        // Initialize user permissions based on role
        const initializePermissions = (userRole) => {
            const role = PermissionSystem.roles[userRole];
            if (role) {
                userPermissions.value = role.permissions;
            }
            logAudit('PERMISSION_INIT', `Permissions initialized for ${userRole}`, 'system');
        };

        // Check if user has permission
        const hasPermission = (resource, action) => {
            if (!currentUser.value) return false;
            
            // System admin always has permission
            if (currentUser.value.user_role === 'system_admin') {
                return true;
            }
            
            const role = PermissionSystem.roles[currentUser.value.user_role];
            if (!role || !role.permissions[resource]) {
                return false;
            }
            
            return role.permissions[resource][action] === true;
        };

        const hasAnyPermission = (resources) => {
            if (!currentUser.value) return false;
            return resources.some(resource => 
                Object.keys(userPermissions.value[resource] || {}).some(
                    action => userPermissions.value[resource][action]
                )
            );
        };

        const getUserPermissionLevel = () => {
            if (!currentUser.value) return 'none';
            const role = PermissionSystem.roles[currentUser.value.user_role];
            return role ? role.level : 'none';
        };

        const togglePermission = (roleId, resource, action) => {
            if (!hasPermission('system', 'admin')) {
                showToast('Permission Denied', 'Admin access required', 'permission');
                return;
            }
            
            const roleIndex = systemRoles.value.findIndex(r => r.id === roleId);
            if (roleIndex === -1) return;
            
            const currentState = systemRoles.value[roleIndex].permissions[resource]?.[action] || false;
            const newState = !currentState;
            
            if (!systemRoles.value[roleIndex].permissions[resource]) {
                systemRoles.value[roleIndex].permissions[resource] = {};
            }
            systemRoles.value[roleIndex].permissions[resource][action] = newState;
            
            showToast(
                'Permission Updated',
                `${action} permission for ${resource} ${newState ? 'granted' : 'revoked'}`,
                'permission'
            );
            
            logAudit('PERMISSION_TOGGLE', 
                `Toggled ${action} permission for ${resource} in role ${roleId} to ${newState}`, 
                'system'
            );
        };

        const savePermissionChanges = async () => {
            if (!hasPermission('system', 'admin')) {
                showToast('Permission Denied', 'Admin access required', 'permission');
                return;
            }
            
            savingPermissions.value = true;
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                showToast(
                    'Permissions Saved',
                    'All permission changes have been saved',
                    'success'
                );
                logAudit('PERMISSIONS_SAVED', 'Updated system permissions', 'system');
            } catch (error) {
                console.error('Error saving permissions:', error);
                showToast('Save Failed', 'Failed to save permission changes', 'error');
            } finally {
                savingPermissions.value = false;
                showPermissionManager.value = false;
            }
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
                override: 'Override restrictions'
            };
            return descriptions[action] || action;
        };

        const formatActionName = (action) => {
            return action.charAt(0).toUpperCase() + action.slice(1);
        };

        // ============ AUDIT LOGGING SYSTEM ============
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
                permission_level: getUserPermissionLevel(),
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

        // ============ UTILITY FUNCTIONS ============
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

        const formatTimeRange = (start, end) => {
            const formatTime = (time) => {
                if (!time) return '';
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours);
                return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
            };
            return `${formatTime(start)} - ${formatTime(end)}`;
        };

        const generateUUID = () => {
            return crypto.randomUUID();
        };

        const getUserRoleDisplay = (role) => {
            const roles = {
                resident_manager: 'Resident Manager',
                department_head: 'Head of Department',
                system_admin: 'System Administrator',
                viewing_doctor: 'Viewing Doctor',
                attending_physician: 'Attending Physician'
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
            return icons[action] || 'fas fa-info-circle';
        };

        const formatResidentCategory = (category) => {
            if (!category || category === 'null' || category === null) return 'N/A';
            const categories = {
                department_internal: 'Department Internal',
                rotating_other_dept: 'Rotating Other Dept',
                pgy1: 'PGY-1',
                pgy2: 'PGY-2',
                pgy3: 'PGY-3',
                pgy4: 'PGY-4',
                pgy5: 'PGY-5'
            };
            return categories[category] || category;
        };

        const formatEmploymentStatus = (status) => {
            const statuses = {
                active: 'Active',
                on_leave: 'On Leave',
                inactive: 'Inactive'
            };
            return statuses[status] || status;
        };

        // ============ HELPER FUNCTIONS ============
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

        const getPhysicianName = (physicianId) => {
            const physician = medicalStaff.value.find(staff => staff.id === physicianId);
            return physician ? physician.full_name : 'Unknown Physician';
        };

        const getAssignedResidents = (unitId) => {
            const rotationIds = residentRotations.value
                .filter(r => r.training_unit_id === unitId && (r.rotation_status === 'active' || r.rotation_status === 'scheduled'))
                .map(r => r.resident_id);
            
            return medicalStaff.value.filter(staff => 
                staff.staff_type === 'medical_resident' && rotationIds.includes(staff.id)
            );
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

        const formatDateShort = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
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
                attendings: attendings.length
            };
        });

        const unreadAnnouncements = computed(() => {
            const today = new Date().toISOString().split('T')[0];
            return announcements.value.filter(a => 
                a.publish_start_date <= today && 
                (!a.publish_end_date || a.publish_end_date >= today)
            ).length;
        });

        const filteredMedicalStaff = computed(() => {
            let filtered = medicalStaff.value;
            
            if (staffSearch.value) {
                const search = staffSearch.value.toLowerCase();
                filtered = filtered.filter(s => 
                    s.full_name.toLowerCase().includes(search) ||
                    (s.staff_id && s.staff_id.toLowerCase().includes(search))
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

        const coverageAlerts = computed(() => {
            return trainingUnits.value
                .filter(u => u.unit_status === 'active' && (u.current_residents || 0) < u.maximum_residents * 0.5)
                .map(u => ({
                    id: u.id,
                    unit_name: u.unit_name,
                    current: u.current_residents || 0,
                    capacity: u.maximum_residents,
                    priority: 'high'
                }));
        });

        const emergencyAlerts = computed(() => {
            return [
                {
                    id: 1,
                    message: 'ICU at 95% capacity - Consider diverting non-critical cases',
                    priority: 'high'
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
            
            if (rotationFilter.value.search) {
                const search = rotationFilter.value.search.toLowerCase();
                filtered = filtered.filter(r => 
                    r.rotation_id.toLowerCase().includes(search) ||
                    getResidentName(r.resident_id).toLowerCase().includes(search) ||
                    getTrainingUnitName(r.training_unit_id).toLowerCase().includes(search)
                );
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

        // ============ NAVIGATION & UI ============
        const switchView = async (view) => {
            currentView.value = view;
            mobileMenuOpen.value = false;
            logAudit('VIEW_CHANGE', `Switched to ${view} view`, 'navigation');
            
            await loadViewData(view);
        };

        const getCurrentTitle = () => {
            const titles = {
                medical_staff: 'Medical Staff Management',
                training_units: 'Training Units',
                daily_operations: 'Daily Operations Board',
                permission_management: 'Permission Management',
                audit_logs: 'Audit Logs',
                oncall_schedule: 'On-call Schedule',
                leave_requests: 'Leave Requests',
                department_overview: 'Department Overview',
                system_settings: 'System Settings'
            };
            return titles[currentView.value] || 'DRBA HMS';
        };

        const getCurrentSubtitle = () => {
            const subtitles = {
                medical_staff: 'Manage medical staff with advanced permissions',
                daily_operations: 'Real-time department operations dashboard',
                permission_management: 'Configure system permissions and roles',
                audit_logs: 'Track all system activities and changes',
                oncall_schedule: 'Manage on-call duties and coverage',
                leave_requests: 'Review and approve leave requests',
                system_settings: 'Configure system-wide settings'
            };
            return subtitles[currentView.value] || 'Advanced DRBA Hospital Management System';
        };

        const toggleAnnouncementsPanel = () => {
            announcementsPanel.value.open = !announcementsPanel.value.open;
            if (announcementsPanel.value.open) {
                loadAnnouncements();
            }
        };

        const getSearchPlaceholder = () => {
            const placeholders = {
                medical_staff: 'Search medical staff by name, ID, or department...',
                daily_operations: 'Search assignments, alerts, or announcements...',
                audit_logs: 'Search audit logs by user, action, or resource...',
                training_units: 'Search training units by name or specialty...',
                resident_rotations: 'Search rotations by resident, unit, or ID...'
            };
            return placeholders[currentView.value] || 'Search...';
        };

        const togglePermissionManager = () => {
            showPermissionManager.value = !showPermissionManager.value;
            userMenuOpen.value = false;
            if (showPermissionManager.value) {
                loadSystemRoles();
                logAudit('PERMISSION_MANAGER_OPEN', 'Opened permission manager', 'system');
            }
        };

        const toggleUserMenu = () => {
            userMenuOpen.value = !userMenuOpen.value;
        };

        const getDayStatus = (day) => {
            return day.status === 'covered' ? 'status-available' : 'status-critical';
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
                
                // For demo purposes, we'll use mock authentication
                const mockUsers = {
                    'admin@hospital.org': { role: 'system_admin', name: 'System Administrator' },
                    'head@hospital.org': { role: 'department_head', name: 'Department Head' },
                    'manager@hospital.org': { role: 'resident_manager', name: 'Resident Manager' },
                    'doctor@hospital.org': { role: 'viewing_doctor', name: 'Viewing Doctor' }
                };
                
                let userData;
                
                if (email in mockUsers && password === 'password123') {
                    userData = {
                        id: generateUUID(),
                        email: email,
                        full_name: mockUsers[email].name,
                        user_role: mockUsers[email].role,
                        account_status: 'active'
                    };
                } else {
                    // Create new user for demo
                    userData = {
                        id: generateUUID(),
                        email: email,
                        full_name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        user_role: selectedRole,
                        account_status: 'active'
                    };
                    
                    // Save to database
                    await supabaseClient.from('app_users').insert([userData]);
                }
                
                currentUser.value = userData;
                initializePermissions(userData.user_role);
                
                // Load user-specific data
                await loadCurrentUserProfile();
                await loadUserNotifications();
                
                showToast(
                    'Login Successful',
                    `Welcome ${userData.full_name}!`,
                    'success'
                );
                
                logAudit('LOGIN_SUCCESS', `User logged in as ${userData.user_role}`, 'auth', userData.id);
                
                await loadInitialData();
                
                // Set initial view based on permissions
                if (hasPermission('daily_operations', 'read')) {
                    currentView.value = 'daily_operations';
                } else if (hasPermission('medical_staff', 'read')) {
                    currentView.value = 'medical_staff';
                } else {
                    currentView.value = 'daily_operations';
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showToast(
                    'Login Failed',
                    error.message || 'Invalid credentials',
                    'error'
                );
                logAudit('LOGIN_FAILED', `Failed login attempt: ${error.message}`, 'auth');
            } finally {
                loading.value = false;
            }
        };

        const handleLogout = async () => {
            try {
                logAudit('LOGOUT', 'User logged out', 'auth');
                currentUser.value = null;
                currentView.value = 'login';
                userMenuOpen.value = false;
                showToast('Logged Out', 'You have been successfully logged out', 'info');
            } catch (error) {
                console.error('Logout error:', error);
            }
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
                    loadSystemSettings()
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
                    case 'medical_staff':
                        await loadMedicalStaff();
                        break;
                    case 'training_units':
                        await loadTrainingUnits();
                        break;
                    case 'daily_operations':
                        await Promise.all([
                            loadOnCallSchedule(),
                            loadAnnouncements()
                        ]);
                        break;
                    case 'audit_logs':
                        await loadAuditLogs();
                        break;
                    case 'leave_requests':
                        await loadLeaveRequests();
                        break;
                    case 'oncall_schedule':
                        await loadOnCallSchedule();
                        break;
                    case 'resident_rotations':
                        await loadResidentRotations();
                        break;
                    case 'system_settings':
                        await loadSystemSettings();
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
                // For demo, create mock data
                medicalStaff.value = [
                    {
                        id: '1',
                        full_name: 'Dr. Sarah Chen',
                        staff_type: 'attending_physician',
                        staff_id: 'ATT-001',
                        employment_status: 'active',
                        can_supervise_residents: true,
                        primary_clinic: 'Pulmonary Unit',
                        professional_email: 's.chen@hospital.org',
                        resident_category: null,
                        training_year: null
                    },
                    {
                        id: '2',
                        full_name: 'Dr. Michael Rodriguez',
                        staff_type: 'medical_resident',
                        staff_id: 'RES-001',
                        employment_status: 'active',
                        can_supervise_residents: false,
                        primary_clinic: 'ICU',
                        professional_email: 'm.rodriguez@hospital.org',
                        resident_category: 'pgy3',
                        training_year: 2024
                    }
                ];
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
                // Mock data
                trainingUnits.value = [
                    {
                        id: '1',
                        unit_name: 'Pulmonary Unit',
                        unit_description: 'Specializes in pulmonary diseases and critical care',
                        unit_status: 'active',
                        maximum_residents: 8,
                        current_residents: 6,
                        specialty: 'Pulmonology'
                    },
                    {
                        id: '2',
                        unit_name: 'ICU',
                        unit_description: 'Intensive Care Unit for critical patients',
                        unit_status: 'active',
                        maximum_residents: 12,
                        current_residents: 9,
                        specialty: 'Critical Care'
                    }
                ];
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
                console.log('🔄 Loading on-call schedule...');
                
                const { data, error } = await supabaseClient
                    .from('oncall_schedule')
                    .select('*')
                    .order('duty_date', { ascending: true });
                
                if (error) {
                    console.error('❌ Error loading on-call schedule:', error);
                    throw error;
                }
                
                console.log('✅ Loaded on-call schedule data:', data);
                onCallSchedule.value = data || [];
                
            } catch (error) {
                console.error('❌ Failed to load on-call schedule:', error);
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

        const loadSystemRoles = () => {
            systemRoles.value = Object.entries(PermissionSystem.roles).map(([id, role]) => ({
                id,
                ...role
            }));
        };

        const loadSystemSettings = async () => {
            try {
                systemSettings.value = {
                    hospital_name: 'PneumoCare Hospital',
                    department_name: 'Pulmonary Medicine',
                    max_residents_per_unit: 10,
                    enable_audit_logging: true,
                    require_mfa: false,
                    maintenance_mode: false,
                    email_notifications: true,
                    sms_alerts: false
                };
            } catch (error) {
                console.error('Error loading system settings:', error);
                systemSettings.value = {};
            }
        };

        const loadCurrentUserProfile = async () => {
            if (!currentUser.value) return;
            
            try {
                if (!currentUser.value.phone) {
                    currentUser.value.phone = '+1 (555) 123-4567';
                }
                if (!currentUser.value.department) {
                    currentUser.value.department = 'Pulmonary Medicine';
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
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

        // ============ MEDICAL STAFF CRUD ============
        const showAddMedicalStaffModal = () => {
            if (!hasPermission('medical_staff', 'create')) {
                showToast('Permission Denied', 'You need create permission to add medical staff', 'permission');
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
            
            logAudit('STAFF_MODAL_OPEN', 'Opened add medical staff modal', 'medical_staff');
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
            
            logAudit('STAFF_EDIT', `Editing staff member: ${staff.full_name}`, 'medical_staff', staff.id);
        };

        const saveMedicalStaff = async () => {
            if (!hasPermission('medical_staff', medicalStaffModal.value.mode === 'add' ? 'create' : 'update')) {
                showToast('Permission Denied', 'Insufficient permissions', 'permission');
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
                    showToast('Success', 'Medical staff added successfully', 'success');
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
                    
                    showToast('Success', 'Medical staff updated successfully', 'success');
                    logAudit('STAFF_UPDATE', `Updated: ${data.full_name}`, 'medical_staff', data.id);
                }
                
                medicalStaffModal.value.show = false;
            } catch (error) {
                console.error('Error saving medical staff:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const deleteMedicalStaff = async (staff) => {
            if (!hasPermission('medical_staff', 'delete')) {
                showToast('Permission Denied', 'You need delete permission to remove medical staff', 'permission');
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
                
                showToast('Deleted', `${staff.full_name} has been removed`, 'success');
                logAudit('STAFF_DELETE', `Deleted: ${staff.full_name}`, 'medical_staff', staff.id);
            } catch (error) {
                console.error('Error deleting medical staff:', error);
                showToast('Delete Failed', error.message, 'error');
            }
        };

        // ============ ANNOUNCEMENTS MODAL FUNCTIONS ============
        const showAddAnnouncementModal = () => {
            if (!hasPermission('announcements', 'create')) {
                showToast('Permission Denied', 'Need create permission', 'permission');
                return;
            }
            
            const today = new Date().toISOString().split('T')[0];
            
            announcementModal.value = {
                show: true,
                mode: 'add',
                announcement: null,
                form: {
                    announcement_title: '',
                    announcement_content: '',
                    publish_start_date: today,
                    publish_end_date: '',
                    priority_level: 'medium',
                    target_audience: 'all'
                }
            };
        };

        const saveAnnouncement = async () => {
            if (!hasPermission('announcements', announcementModal.value.mode === 'add' ? 'create' : 'update')) {
                showToast('Permission Denied', 'Insufficient permissions', 'permission');
                return;
            }
            
            saving.value = true;
            try {
                if (!announcementModal.value.form.announcement_title.trim()) {
                    throw new Error('Title is required');
                }
                if (!announcementModal.value.form.announcement_content.trim()) {
                    throw new Error('Content is required');
                }
                if (!announcementModal.value.form.publish_start_date) {
                    throw new Error('Publish date is required');
                }
                
                const announcementData = {
                    announcement_title: announcementModal.value.form.announcement_title,
                    announcement_content: announcementModal.value.form.announcement_content,
                    publish_start_date: announcementModal.value.form.publish_start_date,
                    publish_end_date: announcementModal.value.form.publish_end_date || null,
                    priority_level: announcementModal.value.form.priority_level,
                    target_audience: announcementModal.value.form.target_audience,
                    created_by: currentUser.value?.full_name,
                    updated_at: new Date().toISOString()
                };
                
                let result;
                
                if (announcementModal.value.mode === 'add') {
                    const { data, error } = await supabaseClient
                        .from('department_announcements')
                        .insert([{
                            ...announcementData,
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    result = data;
                    
                    announcements.value.unshift(result);
                    showToast('Published', 'Announcement published successfully', 'success');
                    logAudit('ANNOUNCEMENT_CREATE', `Published: ${result.announcement_title}`, 'announcements', result.id);
                    
                } else {
                    const { data, error } = await supabaseClient
                        .from('department_announcements')
                        .update(announcementData)
                        .eq('id', announcementModal.value.announcement.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    result = data;
                    
                    const index = announcements.value.findIndex(a => a.id === result.id);
                    if (index !== -1) announcements.value[index] = result;
                    
                    showToast('Updated', 'Announcement updated successfully', 'success');
                    logAudit('ANNOUNCEMENT_UPDATE', `Updated: ${result.announcement_title}`, 'announcements', result.id);
                }
                
                announcementModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving announcement:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        // ============ LEAVE REQUESTS MODAL FUNCTIONS ============
        const showAddLeaveRequestModal = () => {
            if (!hasPermission('leave_requests', 'create')) {
                showToast('Permission Denied', 'Need create permission', 'permission');
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
            leaveRequestModal.value = {
                show: true,
                mode: 'review',
                request: request,
                form: {
                    start_date: request.start_date,
                    end_date: request.end_date,
                    leave_type: request.leave_type,
                    reason: request.reason,
                    status: request.status,
                    approver_notes: request.approver_notes || ''
                }
            };
        };

        const approveLeaveRequest = async (request) => {
            if (!hasPermission('leave_requests', 'approve')) {
                showToast('Permission Denied', 'Need approve permission', 'permission');
                return;
            }
            
            if (!confirm(`Approve leave request for ${request.staff_name}?`)) return;
            
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
                
                showToast('Approved', `Leave request approved`, 'success');
                logAudit('LEAVE_APPROVE', `Approved leave request for ${request.staff_name}`, 'leave_requests', request.id);
                
            } catch (error) {
                console.error('Error approving leave:', error);
                showToast('Approval Failed', error.message, 'error');
            }
        };

        const rejectLeaveRequest = async (request) => {
            if (!hasPermission('leave_requests', 'reject')) {
                showToast('Permission Denied', 'Need reject permission', 'permission');
                return;
            }
            
            if (!confirm(`Reject leave request for ${request.staff_name}?`)) return;
            
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
                
                showToast('Rejected', `Leave request rejected`, 'error');
                logAudit('LEAVE_REJECT', `Rejected leave request for ${request.staff_name}`, 'leave_requests', request.id);
                
            } catch (error) {
                console.error('Error rejecting leave:', error);
                showToast('Rejection Failed', error.message, 'error');
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
                    showToast('Success', 'Leave request submitted', 'success');
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
                    
                    showToast('Success', 'Leave request updated', 'success');
                    logAudit('LEAVE_UPDATE', `Updated leave request status to ${data.status}`, 'leave_requests', data.id);
                }
                
                leaveRequestModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving leave request:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        // ============ RESIDENT ROTATIONS MODAL FUNCTIONS ============
        const showAddRotationModal = () => {
            if (!hasPermission('resident_rotations', 'create')) {
                showToast('Permission Denied', 'Need create permission', 'permission');
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
                    rotation_start_date: rotation.rotation_start_date,
                    rotation_end_date: rotation.rotation_end_date,
                    rotation_category: rotation.rotation_category,
                    rotation_status: rotation.rotation_status,
                    clinical_notes: rotation.clinical_notes || '',
                    supervisor_evaluation: rotation.supervisor_evaluation || ''
                }
            };
        };

        const saveRotation = async () => {
            const permissionNeeded = rotationModal.value.mode === 'add' ? 'create' : 'update';
            if (!hasPermission('resident_rotations', permissionNeeded)) {
                showToast('Permission Denied', 'Insufficient permissions', 'permission');
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
                    showToast('Success', 'Rotation scheduled successfully', 'success');
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
                    
                    showToast('Success', 'Rotation updated successfully', 'success');
                    logAudit('ROTATION_UPDATE', `Updated rotation ${rotationData.rotation_id}`, 'resident_rotations', result.id);
                }
                
                rotationModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving rotation:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const deleteRotation = async (rotation) => {
            if (!hasPermission('resident_rotations', 'delete')) {
                showToast('Permission Denied', 'Need delete permission', 'permission');
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
                
                showToast('Deleted', `Rotation ${rotation.rotation_id} has been removed`, 'success');
                logAudit('ROTATION_DELETE', `Deleted rotation: ${rotation.rotation_id}`, 'resident_rotations', rotation.id);
            } catch (error) {
                console.error('Error deleting rotation:', error);
                showToast('Delete Failed', error.message, 'error');
            }
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
            if (!hasPermission('training_units', trainingUnitModal.value.mode === 'add' ? 'create' : 'update')) {
                showToast('Permission Denied', 'Insufficient permissions', 'permission');
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
                    showToast('Success', 'Training unit added', 'success');
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
                    showToast('Success', 'Training unit updated', 'success');
                    logAudit('TRAINING_UNIT_UPDATE', `Updated unit: ${unitData.unit_name}`, 'training_units', data.id);
                }
                
                trainingUnitModal.value.show = false;
            } catch (error) {
                console.error('Error saving training unit:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        // ============ ON-CALL SCHEDULE FUNCTIONS ============
        const showAddOnCallModal = () => {
            if (!hasPermission('oncall_schedule', 'create')) {
                showToast('Permission Denied', 'Need create permission', 'permission');
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

        const editOnCallSchedule = (day) => {
            if (!hasPermission('oncall_schedule', 'update')) {
                showToast('Permission Denied', 'Need update permission', 'permission');
                return;
            }
            
            if (!day.schedule) {
                onCallModal.value = {
                    show: true,
                    mode: 'add',
                    schedule: null,
                    form: {
                        duty_date: day.date,
                        schedule_id: `ONCALL-${day.date.replace(/-/g, '')}-001`,
                        shift_type: 'backup_call',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        start_time: '08:00',
                        end_time: '20:00',
                        coverage_notes: ''
                    }
                };
                return;
            }
            
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
        };

        const saveOnCallSchedule = async () => {
            if (!hasPermission('oncall_schedule', onCallModal.value.mode === 'add' ? 'create' : 'update')) {
                showToast('Permission Denied', 'Insufficient permissions', 'permission');
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
                    showToast('Success', 'On-call schedule created', 'success');
                    
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
                    
                    showToast('Success', 'On-call schedule updated', 'success');
                }
                
                onCallModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving on-call schedule:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        const overrideOnCall = (day) => {
            if (!hasPermission('oncall_schedule', 'override')) {
                showToast('Permission Denied', 'Need override permission', 'permission');
                return;
            }
            
            if (!confirm(`Emergency override for ${formatDate(day.date)}?`)) return;
            
            onCallModal.value = {
                show: true,
                mode: 'add',
                schedule: null,
                form: {
                    duty_date: day.date,
                    schedule_id: `EMERGENCY-${day.date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
                    shift_type: 'backup_call',
                    primary_physician_id: '',
                    backup_physician_id: '',
                    start_time: '00:00',
                    end_time: '23:59',
                    coverage_notes: 'EMERGENCY OVERRIDE'
                }
            };
        };

        // ============ QUICK PLACEMENT MODAL FUNCTIONS ============
        const showQuickPlacementModal = () => {
            if (!hasPermission('placements', 'create')) {
                showToast('Permission Denied', 'Need create permission for placements', 'permission');
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
                showToast('Permission Denied', 'Need create permission', 'permission');
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
                
                showToast('Success', 'Resident placed successfully', 'success');
                logAudit('QUICK_PLACEMENT', `Quick placement created for resident`, 'placements', data.id);
                
                quickPlacementModal.value.show = false;
                
            } catch (error) {
                console.error('Error saving quick placement:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        // ============ SYSTEM SETTINGS FUNCTIONS ============
        const showSystemSettingsModal = () => {
            if (!hasPermission('system', 'read')) {
                showToast('Permission Denied', 'Need read permission for system settings', 'permission');
                return;
            }
            
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
                logAudit('SETTINGS_UPDATE', 'Updated system settings', 'system');
                
                systemSettingsModal.value.show = false;
            } catch (error) {
                console.error('Error saving system settings:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        // ============ USER PROFILE FUNCTIONS ============
        const showUserProfileModal = () => {
            userProfileModal.value = {
                show: true,
                form: {
                    full_name: currentUser.value?.full_name || '',
                    email: currentUser.value?.email || '',
                    phone: currentUser.value?.phone || '',
                    department: currentUser.value?.department || '',
                    notifications_enabled: true
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
                
                showToast('Profile Updated', 'Your profile has been updated', 'success');
                logAudit('PROFILE_UPDATE', 'Updated user profile', 'user_profile');
                
                userProfileModal.value.show = false;
            } catch (error) {
                console.error('Error saving profile:', error);
                showToast('Save Failed', error.message, 'error');
            } finally {
                saving.value = false;
            }
        };

        // ============ IMPORT/EXPORT FUNCTIONS ============
        const exportAuditLogs = () => {
            if (!hasPermission('audit', 'export')) {
                showToast('Permission Denied', 'Need export permission', 'permission');
                return;
            }
            
            showToast('Export', 'Export functionality would open here', 'info');
        };

        const handleAdvancedSearch = () => {
            logAudit('SEARCH', `Searched for: ${searchQuery.value}`, 'system');
        };

        const showUserProfile = () => {
            userMenuOpen.value = false;
            showUserProfileModal();
        };

        const assignResidentsToUnit = (unit) => {
            showToast('Info', `Assigning residents to ${unit.unit_name}`, 'info');
        };

        // ============ NOTIFICATION FUNCTIONS ============
        const markAllNotificationsAsRead = () => {
            userNotifications.value.forEach(n => n.read = true);
            showToast('Notifications Cleared', 'All notifications marked as read', 'success');
        };

        // ============ ACTION HANDLERS ============
        const loadStaffDailyActivities = async (staffId) => {
            expandedStaffId.value = expandedStaffId.value === staffId ? null : staffId;
            
            if (expandedStaffId.value === staffId) {
                const today = new Date().toISOString().split('T')[0];
                
                const { data: assignments } = await supabaseClient
                    .from('daily_assignments')
                    .select('*')
                    .eq('staff_id', staffId)
                    .eq('assignment_date', today);
                
                const { data: oncall } = await supabaseClient
                    .from('oncall_schedule')
                    .select('*')
                    .eq('primary_physician_id', staffId)
                    .gte('duty_date', today)
                    .order('duty_date', { ascending: true })
                    .limit(1);
                
                staffDailyActivities.value[staffId] = [
                    ...(assignments || []).map(a => ({
                        type: 'assignment',
                        title: a.assignment_type,
                        time: `${a.start_time.slice(0,5)}-${a.end_time.slice(0,5)}`,
                        location: a.location_name
                    })),
                    ...(oncall || []).map(o => ({
                        type: 'oncall',
                        title: 'On-call Duty',
                        time: `${o.start_time.slice(0,5)}-${o.end_time.slice(0,5)}`,
                        location: 'Hospital-wide'
                    }))
                ];
            }
        };

        const quickAssignToUnit = (alert) => {
            if (!hasPermission('placements', 'create')) {
                showToast('Permission Denied', 'You need create permission to assign residents', 'permission');
                return;
            }
            
            showToast('Assign', `Assigning residents to ${alert.unit_name}`, 'info');
            logAudit('QUICK_ASSIGN', `Quick assigning to unit: ${alert.unit_name}`, 'placements', alert.id);
        };

        // ============ INITIALIZATION ============
        onMounted(() => {
            // Check for existing session
            supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    console.log('Existing session found');
                }
            }).catch(error => {
                console.error('Error getting session:', error);
            });
            
            // Load system roles for permission manager
            loadSystemRoles();
        });

        // ============ RETURN ALL REACTIVE PROPERTIES ============
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
            searchQuery,
            permissionFilter,
            userMenuOpen,
            availableAttendings,
            medicalStaffModal,
            announcementModal,
            onCallModal,
            leaveRequestModal,
            trainingUnitModal,
            rotationModal,
            quickPlacementModal,
            systemSettingsModal,
            userProfileModal,
            importExportModal,
            medicalStaff,
            trainingUnits,
            residentRotations,
            dailyAssignments,
            leaveRequests,
            onCallSchedule,
            announcements,
            auditLogs,
            systemRoles,
            systemSettings,
            userNotifications,
            emergencyContacts,
            systemStats,
            staffSearch,
            staffFilter,
            rotationFilter,
            toasts,
            permissionResources,
            
            // Computed
            stats,
            unreadAnnouncements,
            filteredMedicalStaff,
            todaysOnCall,
            coverageAlerts,
            emergencyAlerts,
            nextSevenDays,
            filteredRotations,
            availableResidents,
            unreadNotifications,
            availablePhysicians,
            activeTrainingUnits,
            
            // Permission functions
            hasPermission,
            hasAnyPermission,
            getUserPermissionLevel,
            getResourcePermissionLevel,
            getPermissionDescription,
            formatActionName,
            userPermissions,
            togglePermission,
            savePermissionChanges,
            
            // Helper functions
            getPhysicianName,
            switchView,
            getCurrentTitle,
            getCurrentSubtitle,
            getSearchPlaceholder,
            togglePermissionManager,
            toggleUserMenu,
            getDayStatus,
            handleAdvancedLogin,
            handleLogout,
            getInitials,
            formatDate,
            formatDateTime,
            formatTimeRange,
            getUserRoleDisplay,
            formatStaffType,
            getStaffTypeClass,
            getAuditIcon,
            formatResidentCategory,
            formatEmploymentStatus,
            
            // Data functions
            getResidentName,
            getTrainingUnitName,
            getAttendingName,
            getAssignedResidents,
            formatRotationCategory,
            getRotationCategoryClass,
            formatDateShort,
            
            // Modal functions
            showAddMedicalStaffModal,
            editMedicalStaff,
            saveMedicalStaff,
            deleteMedicalStaff,
            showAddAnnouncementModal,
            saveAnnouncement,
            showAddOnCallModal,
            editOnCallSchedule,
            saveOnCallSchedule,
            overrideOnCall,
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
            saveRotation,
            deleteRotation,
            showQuickPlacementModal,
            saveQuickPlacement,
            showSystemSettingsModal,
            saveSystemSettings,
            showUserProfileModal,
            saveUserProfile,
            
            // Other functions
            exportAuditLogs,
            handleAdvancedSearch,
            showUserProfile,
            loadStaffDailyActivities,
            quickAssignToUnit,
            markAllNotificationsAsRead,
            
            // UI functions
            toggleAnnouncementsPanel,
            announcementsPanel,
            
            // Utility functions
            showToast,
            removeToast
        };
    }
});

// Mount the app
app.mount('#app');

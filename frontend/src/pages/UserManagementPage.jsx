import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import { getAllUsers, updateUserRole, deleteUser, createUserByAdmin } from '../api/auth.api';
import Navbar from '../components/Layout/Navbar';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Avatar from '../UI/Avatar';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'developer',
  });
  const [newRole, setNewRole] = useState('developer');
  const [actionLoading, setActionLoading] = useState(false);

  // Access Control: Only admin should see this page
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast.error('Access Denied: Only Admins can manage users');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res.status === 'success') {
        setUsers(res.data.users || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter & Search logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Role style configuration
  const roleStyles = {
    admin: {
      bg: 'bg-error-container text-on-error-container border-error/20 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/30',
      label: 'Admin',
    },
    project_manager: {
      bg: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff] dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/30',
      label: 'Project Manager',
    },
    developer: {
      bg: 'bg-secondary-fixed text-secondary border-secondary/20 dark:bg-indigo-950/45 dark:text-indigo-300 dark:border-indigo-900/30',
      label: 'Developer',
    },
    client: {
      bg: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
      label: 'Client',
    },
  };

  // Actions
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.username || !inviteForm.email || !inviteForm.password) {
      return toast.error('Please fill in all fields');
    }
    setActionLoading(true);
    try {
      const res = await createUserByAdmin(inviteForm);
      if (res.status === 'success') {
        toast.success(`Successfully invited/created user "${inviteForm.username}"`);
        setShowInviteModal(false);
        setInviteForm({ username: '', email: '', password: '', role: 'developer' });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await updateUserRole(selectedUser._id, newRole);
      if (res.status === 'success') {
        toast.success(`Successfully updated role for ${selectedUser.username}`);
        setShowRoleModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    if (selectedUser._id === currentUser?._id) {
      return toast.error('You cannot delete your own account from here');
    }
    setActionLoading(true);
    try {
      const res = await deleteUser(selectedUser._id);
      if (res.status === 'success') {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
      <Navbar />

      <div className="flex flex-1 pt-16 h-full">
        <DashboardSidebar />

        <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary dark:text-white">User Management</h2>
              <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mt-xs">
                Manage system access, roles, and global identities.
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-secondary text-on-secondary px-lg py-sm rounded-lg font-body-sm text-body-sm font-medium hover:bg-secondary-container transition-colors shadow-sm flex items-center gap-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Invite User
            </button>
          </div>

          {/* Controls Card */}
          <div className="flex flex-col gap-lg">
            <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-lg shadow-sm border border-outline-variant dark:border-slate-700 flex flex-col sm:flex-row gap-md justify-between items-center">
              <div className="relative w-full sm:max-w-md rounded-lg">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-xl pr-md py-sm bg-transparent border border-outline-variant dark:border-slate-700 rounded-lg font-body-sm text-body-sm focus:border-secondary dark:focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-on-surface-variant dark:placeholder:text-slate-400 text-on-surface dark:text-white"
                />
              </div>

              <div className="flex items-center gap-sm w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full appearance-none bg-transparent border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm pr-xl font-body-sm text-body-sm focus:border-secondary dark:focus:border-indigo-500 focus:outline-none transition-shadow cursor-pointer text-on-surface dark:text-white dark:bg-slate-800"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="developer">Developer</option>
                    <option value="client">Client</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-[20px] pointer-events-none">
                    expand_more
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                  className="p-sm border border-outline-variant dark:border-slate-700 rounded-lg text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-700 transition-colors bg-surface-container-lowest dark:bg-slate-800"
                  title="Clear Filters"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                </button>
              </div>
            </div>

            {/* Data Table Card */}
            <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl shadow-sm border border-outline-variant dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-bright dark:bg-slate-900/60 border-b border-outline-variant dark:border-slate-700">
                      <th className="py-md px-lg font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase tracking-wider w-[25%]">
                        User
                      </th>
                      <th className="py-md px-lg font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase tracking-wider w-[25%]">
                        Email
                      </th>
                      <th className="py-md px-lg font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase tracking-wider w-[15%] text-center">
                        Workspaces
                      </th>
                      <th className="py-md px-lg font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase tracking-wider w-[20%]">
                        Active Role
                      </th>
                      <th className="py-md px-lg font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase tracking-wider w-[15%] text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant dark:divide-slate-700">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="h-[72px] animate-pulse">
                          <td className="py-sm px-lg">
                            <div className="flex items-center gap-md">
                              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                          </td>
                          <td className="py-sm px-lg">
                            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                          </td>
                          <td className="py-sm px-lg">
                            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                          </td>
                          <td className="py-sm px-lg">
                            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                          </td>
                          <td className="py-sm px-lg text-right">
                            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-xl text-center text-on-surface-variant dark:text-slate-400 font-body-md">
                          No users found matching filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => {
                        const styleCfg = roleStyles[user.role] || roleStyles.developer;
                        return (
                          <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors h-[72px]">
                            <td className="py-sm px-lg">
                              <div className="flex items-center gap-md">
                                <Avatar user={user} className="w-10 h-10 rounded-full shrink-0" />
                                <p className="font-body-md text-body-md font-medium text-primary dark:text-white">
                                  {user.username}
                                </p>
                              </div>
                            </td>
                            <td className="py-sm px-lg font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300">
                              {user.email}
                            </td>
                            <td className="py-sm px-lg text-center font-body-sm text-body-sm text-on-surface dark:text-slate-200">
                              {user.workspaceCount ?? 0}
                            </td>
                            <td className="py-sm px-lg">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleCfg.bg}`}>
                                {styleCfg.label}
                              </span>
                            </td>
                            <td className="py-sm px-lg text-right">
                              <div className="flex items-center justify-end gap-xs">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setNewRole(user.role);
                                    setShowRoleModal(true);
                                  }}
                                  className="text-on-surface-variant dark:text-slate-400 hover:text-secondary dark:hover:text-indigo-400 p-xs rounded hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
                                  title="Change Role"
                                >
                                  <span className="material-symbols-outlined text-[20px]">published_with_changes</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-on-surface-variant dark:text-slate-400 hover:text-error p-xs rounded hover:bg-error-container/20 dark:hover:bg-red-950/20 transition-colors"
                                  title="Delete User"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-lg py-md border-t border-outline-variant dark:border-slate-700 bg-surface-bright dark:bg-slate-900/60 flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                  Showing {totalItems === 0 ? 0 : startIndex + 1} to{' '}
                  {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} users
                </span>
                <div className="flex gap-xs">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-sm py-xs border border-outline-variant dark:border-slate-700 rounded bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 disabled:opacity-50 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-md py-xs border border-outline-variant dark:border-slate-700 rounded text-body-sm font-body-sm transition-all ${
                        currentPage === i + 1
                          ? 'bg-secondary text-white border-secondary dark:bg-indigo-600 dark:border-indigo-600'
                          : 'bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-sm py-xs border border-outline-variant dark:border-slate-700 rounded bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 disabled:opacity-50 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-title-md text-title-md text-primary dark:text-white">Invite / Create New User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-md">
              <div>
                <label className="block font-body-sm text-on-surface-variant dark:text-slate-350 mb-xs">Username</label>
                <input
                  type="text"
                  required
                  value={inviteForm.username}
                  onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                  placeholder="e.g. sarahjenkins"
                  className="w-full border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm bg-transparent dark:text-white focus:border-secondary dark:focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-body-sm text-on-surface-variant dark:text-slate-350 mb-xs">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="sarah.j@company.com"
                  className="w-full border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm bg-transparent dark:text-white focus:border-secondary dark:focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-body-sm text-on-surface-variant dark:text-slate-350 mb-xs">Password</label>
                <input
                  type="password"
                  required
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm bg-transparent dark:text-white focus:border-secondary dark:focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-body-sm text-on-surface-variant dark:text-slate-350 mb-xs">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm bg-transparent dark:text-white dark:bg-slate-800 focus:border-secondary dark:focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="developer">Developer</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div className="flex gap-md justify-end pt-md">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-lg py-sm border border-outline-variant dark:border-slate-700 rounded-lg font-medium text-body-sm text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-lg py-sm bg-secondary text-white dark:bg-indigo-600 rounded-lg font-medium text-body-sm hover:opacity-90 flex items-center gap-xs"
                >
                  {actionLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content dark:bg-slate-800 dark:border-slate-700">
            <h3 className="font-title-md text-title-md text-primary dark:text-white mb-sm">
              Change System Role
            </h3>
            <p className="font-body-sm text-on-surface-variant dark:text-slate-400 mb-md">
              Update the global permissions for user <strong>{selectedUser.username}</strong> ({selectedUser.email}).
            </p>

            <div className="mb-lg">
              <label className="block font-body-sm text-on-surface-variant dark:text-slate-350 mb-xs">Select Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-outline-variant dark:border-slate-700 rounded-lg px-md py-sm bg-transparent dark:text-white dark:bg-slate-800 focus:border-secondary dark:focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="developer">Developer</option>
                <option value="client">Client</option>
              </select>
            </div>

            <div className="flex gap-md justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-lg py-sm border border-outline-variant dark:border-slate-700 rounded-lg font-medium text-body-sm text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                disabled={actionLoading}
                className="px-lg py-sm bg-secondary text-white dark:bg-indigo-600 rounded-lg font-medium text-body-sm hover:opacity-90 flex items-center gap-xs"
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content dark:bg-slate-800 dark:border-slate-700 border-error/30">
            <h3 className="font-title-md text-title-md text-error mb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-error">warning</span>
              Delete User Account
            </h3>
            <p className="font-body-sm text-on-surface-variant dark:text-slate-400 mb-md">
              Are you sure you want to delete the user <strong>{selectedUser.username}</strong>? This action is permanent and will revoke all access immediately.
            </p>

            <div className="flex gap-md justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-lg py-sm border border-outline-variant dark:border-slate-700 rounded-lg font-medium text-body-sm text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-lg py-sm bg-error text-white rounded-lg font-medium text-body-sm hover:opacity-90 flex items-center gap-xs"
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

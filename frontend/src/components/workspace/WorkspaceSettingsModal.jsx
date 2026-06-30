import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../../UI/Avatar';
import { getMembers, updateMemberRole, removeMember, updateWorkspace } from '../../api/workspace.api';
import { getRoleDisplayName } from '../../utils/roleDisplay';
import useAuthStore from '../../store/authstore';
import Modal from '../common/Modal';

const WorkspaceSettingsModal = ({ workspace, onClose, onWorkspaceUpdated }) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'members'

  // General Info States
  const [name, setName] = useState(workspace.name || '');
  const [description, setDescription] = useState(workspace.description || '');
  const [savingInfo, setSavingInfo] = useState(false);

  const currentUser = useAuthStore(s => s.user);
  const isActualAdmin = workspace.Admin === currentUser?._id || workspace.Admin?._id === currentUser?._id || currentUser?.role === 'admin';

  // Members States
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await getMembers(workspace._id);
      setMembers(res.data?.members || []);
    } catch (err) {
      toast.error('Failed to load workspace members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingInfo(true);
    try {
      const res = await updateWorkspace(workspace._id, {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success('Workspace updated successfully');
      onWorkspaceUpdated(res.data?.workspace);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update workspace');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    setUpdatingMemberId(memberUserId);
    try {
      // Find member subdocument ID
      const memberObj = members.find(m => m.user?._id === memberUserId || m.user === memberUserId);
      if (!memberObj) return;

      const res = await updateMemberRole(workspace._id, memberObj._id, { role: newRole });
      toast.success('Member role updated');

      // Update local members list
      setMembers(prev => prev.map(m => m._id === memberObj._id ? { ...m, role: newRole } : m));

      // Notify parent to refresh workspace data
      const updatedMembers = workspace.members.map(m => m._id === memberObj._id ? { ...m, role: newRole } : m);
      onWorkspaceUpdated({ ...workspace, members: updatedMembers });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    const memberObj = members.find(m => m.user?._id === memberUserId || m.user === memberUserId);
    if (!memberObj) return;

    if (!confirm(`Are you sure you want to remove ${memberObj.user?.username || 'this member'} from the workspace?`)) return;

    setUpdatingMemberId(memberUserId);
    try {
      await removeMember(workspace._id, memberObj._id);
      toast.success('Member removed successfully');

      // Update local members list
      setMembers(prev => prev.filter(m => m._id !== memberObj._id));

      // Notify parent to refresh workspace data
      const updatedMembers = workspace.members.filter(m => m._id !== memberObj._id);
      onWorkspaceUpdated({ ...workspace, members: updatedMembers });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const AdminId = workspace.Admin?._id || workspace.Admin;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      maxWidth="max-w-[682px]" 
      bodyClassName="p-0"
    >

        {/* Header */}
        <header className="p-6 pb-4 flex justify-between items-start">
          <div className="flex gap-3">
            {/* Settings Icon Container */}
            <div className="mt-1 text-[#8b8cf1] dark:text-[#a5a6ff]">
              <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Workspace Settings</h1>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Configure parameters and membership for {workspace.name}</p>
            </div>
          </div>
          {/* Close Button */}
          <button aria-label="Close modal" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors">
            <svg fill="none" height="20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Navigation Tabs */}
        <nav className="border-b border-slate-100 dark:border-slate-700 px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-3 text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'general'
                  ? 'border-b-2 border-[#8b8cf1] text-[#8b8cf1] dark:border-[#a5a6ff] dark:text-[#a5a6ff]'
                  : 'border-b-2 border-transparent text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="16" y2="12"></line>
                <line x1="12" x2="12.01" y1="8" y2="8"></line>
              </svg>
              General Details
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'members'
                  ? 'border-b-2 border-[#8b8cf1] text-[#8b8cf1] dark:border-[#a5a6ff] dark:text-[#a5a6ff]'
                  : 'border-b-2 border-transparent text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Members ({workspace.members?.length || 0})
            </button>
          </div>
        </nav>

        {/* Content Section */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800">

          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveInfo} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3" htmlFor="workspace-name">
                  Workspace Name
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Operations Hub"
                  required
                  disabled={!isActualAdmin}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#8b8cf1] focus:border-[#8b8cf1] transition-colors outline-none h-[56px] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Summarize the core operational workflows managed in this workspace..."
                  rows={5}
                  disabled={!isActualAdmin}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#8b8cf1] focus:border-[#8b8cf1] transition-colors outline-none resize-none min-h-[140px] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Bottom Divider */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6"></div>

              {/* Footer Actions */}
              <footer className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2.5 text-slate-650 dark:text-slate-350 font-bold text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                >
                  {isActualAdmin ? 'Cancel' : 'Close'}
                </button>
                {isActualAdmin && (
                  <button
                    type="submit"
                    disabled={savingInfo || !name.trim() || (name.trim() === workspace.name && description.trim() === (workspace.description || ''))}
                    className="px-8 py-2.5 bg-[#8b8cf1] hover:bg-[#7a7be0] text-white font-bold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingInfo ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Save Changes'}
                  </button>
                )}
              </footer>
            </form>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-100 dark:border-slate-950 border-t-[#8b8cf1] animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center py-12 text-sm text-slate-400 dark:text-slate-500 font-semibold">No members in this workspace</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {members.map(m => {
                    const memberUser = m.user;
                    if (!memberUser) return null;
                    const isAdmin = memberUser._id === AdminId;
                    const isUpdating = updatingMemberId === memberUser._id;

                    return (
                      <div key={m._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <Avatar name={memberUser.username || '?'} avatar={memberUser.avatar} size={36} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                              {memberUser.username}
                              {isAdmin && (
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                  {getRoleDisplayName(memberUser.role || m.role)}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{memberUser.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {isAdmin ? (
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                              Full Access
                            </span>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                                {getRoleDisplayName(memberUser.role || m.role)}
                              </span>

                              {isActualAdmin && (
                                <button
                                  onClick={() => handleRemoveMember(memberUser._id)}
                                  disabled={isUpdating}
                                  className="w-9 h-9 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-transparent transition-all disabled:opacity-50"
                                  title="Remove member"
                                >
                                  <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" x2="10" y1="11" y2="17"></line>
                                    <line x1="14" x2="14" y1="11" y2="17"></line>
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Divider */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6"></div>

              {/* Footer Actions */}
              <footer className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2.5 bg-[#8b8cf1] hover:bg-[#7a7be0] text-white font-bold text-sm rounded-lg shadow-sm transition-colors"
                >
                  Close
                </button>
              </footer>
            </div>
          )}

        </div>

    </Modal>
  );
};

export default WorkspaceSettingsModal;
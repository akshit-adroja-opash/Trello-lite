import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../../UI/Avatar';
import { getMembers, updateMemberRole, removeMember, updateWorkspace } from '../../api/workspace.api';
import { getRoleDisplayName } from '../../utils/roleDisplay';

const WorkspaceSettingsModal = ({ workspace, onClose, onWorkspaceUpdated }) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'members'
  
  // General Info States
  const [name, setName] = useState(workspace.name || '');
  const [description, setDescription] = useState(workspace.description || '');
  const [savingInfo, setSavingInfo] = useState(false);

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

  const ownerId = workspace.owner?._id || workspace.owner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-6 transition-all overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">settings</span>
              Workspace Settings
            </h2>
            <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">Configure parameters and membership for {workspace.name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-700 px-8 bg-white dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'general' ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
            General Details
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'members' ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Members ({workspace.members?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveInfo} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Operations Hub"
                  required
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Summarize the core operational workflows managed in this workspace..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-6 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInfo || !name.trim() || (name.trim() === workspace.name && description.trim() === (workspace.description || ''))}
                  className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {savingInfo ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Members Settings Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center py-12 text-sm text-slate-400 dark:text-slate-500 font-semibold">No members in this workspace</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {members.map(m => {
                    const memberUser = m.user;
                    if (!memberUser) return null;
                    const isOwner = memberUser._id === ownerId;
                    const isUpdating = updatingMemberId === memberUser._id;

                    return (
                      <div key={m._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <Avatar name={memberUser.username || '?'} avatar={memberUser.avatar} size={36} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                              {memberUser.username}
                              {isOwner && (
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                  Owner
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">{memberUser.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 self-end sm:self-auto">
                          {isOwner ? (
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                              Full Access
                            </span>
                          ) : (
                            <>
                              <select
                                value={m.role}
                                onChange={e => handleRoleChange(memberUser._id, e.target.value)}
                                disabled={isUpdating}
                                className="h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer disabled:opacity-50"
                              >
                                <option value="client">Client</option>
                                <option value="developer">Developer</option>
                                <option value="project_manager">Project Manager</option>
                                <option value="admin">Project Manager (Admin)</option>
                              </select>

                              <button
                                onClick={() => handleRemoveMember(memberUser._id)}
                                disabled={isUpdating}
                                className="w-9 h-9 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-transparent transition-all disabled:opacity-50"
                                title="Remove member"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default WorkspaceSettingsModal;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Navbar from '../components/Layout/Navbar';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/preferences.api';
import useWorkspaceStore from '../store/workspaceStore';

const NOTIFICATION_TYPES = [
  {
    type: 'TASK_ASSIGN',
    label: 'Task Assignments',
    description: 'When someone assigns a task to you',
    icon: 'assignment_ind',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
  },
  {
    type: 'BOARD_COMMENT',
    label: 'Board Comments',
    description: 'When someone comments on a card in your board',
    icon: 'chat_bubble_outline',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
  },
  {
    type: 'CARD_UPDATE',
    label: 'Card Updates',
    description: 'When a card you\'re involved with is modified',
    icon: 'edit_note',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
  },
  {
    type: 'WORKSPACE_INVITE',
    label: 'Workspace Invitations',
    description: 'When you\'re invited to join a workspace',
    icon: 'person_add',
    color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
  },
  {
    type: 'WORKSPACE_REMOVE',
    label: 'Workspace Removals',
    description: 'When you\'re removed from a workspace',
    icon: 'person_remove',
    color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400'
  },
  {
    type: 'TASK_ACTION',
    label: 'Task Actions',
    description: 'When actions are taken on your tasks (moved, blocked, etc.)',
    icon: 'swap_horiz',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
  },
  {
    type: 'MENTION',
    label: 'Mentions',
    description: 'When someone mentions you in a comment',
    icon: 'alternate_email',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
  }
];

const Toggle = ({ checked, onChange, colorTheme = 'blue' }) => {
  const themes = {
    blue: {
      bg: 'bg-[#0058be] dark:bg-blue-600',
      border: 'border-[#0058be] dark:border-blue-600',
      text: 'text-[#0058be] dark:text-blue-600',
      uncheckBg: 'bg-slate-200 dark:bg-slate-700',
      uncheckBorder: 'border-slate-300 dark:border-slate-600',
    },
    emerald: {
      bg: 'bg-[#009668] dark:bg-emerald-600',
      border: 'border-[#009668] dark:border-emerald-600',
      text: 'text-[#009668] dark:text-emerald-600',
      uncheckBg: 'bg-slate-200 dark:bg-slate-700',
      uncheckBorder: 'border-slate-300 dark:border-slate-600',
    },
    amber: {
      bg: 'bg-[#d97706] dark:bg-amber-600',
      border: 'border-[#d97706] dark:border-amber-600',
      text: 'text-[#d97706] dark:text-amber-600',
      uncheckBg: 'bg-slate-200 dark:bg-slate-700',
      uncheckBorder: 'border-slate-300 dark:border-slate-600',
    }
  };
  
  const theme = themes[colorTheme] || themes.blue;

  return (
    <button
      type="button"
      onClick={onChange}
      className="relative flex items-center justify-center w-12 h-6 mr-2 align-middle select-none transition-all duration-200 ease-in outline-none shrink-0"
    >
      <span className={`absolute left-0 block w-6 h-6 rounded-full bg-white border-4 z-10 transition-transform duration-200 ease-in-out shadow-sm flex items-center justify-center ${checked ? `translate-x-6 ${theme.border}` : `translate-x-0 ${theme.uncheckBorder}`}`}>
         {checked && (
             <svg className={`w-3 h-3 ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
             </svg>
         )}
      </span>
      <span className={`block w-full h-full rounded-full transition-colors duration-200 ease-in-out ${checked ? theme.bg : theme.uncheckBg}`} />
    </button>
  );
};

const NotificationSettingsPage = () => {
  const [mutedTypes, setMutedTypes] = useState([]);
  const [mutedBoards, setMutedBoards] = useState([]);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Original values for change detection
  const [original, setOriginal] = useState({ mutedTypes: [], mutedBoards: [], emailEnabled: true });

  const { fetchWorkspacesAndBoards, boardsByWorkspace } = useWorkspaceStore();
  const allBoards = Object.values(boardsByWorkspace).flat();

  useEffect(() => {
    const load = async () => {
      try {
        const [prefsData] = await Promise.all([
          getNotificationPreferences(),
          fetchWorkspacesAndBoards()
        ]);
        const prefs = prefsData.notifications || {};
        const mt = prefs.mutedTypes || [];
        const mb = (prefs.mutedBoards || []).map(id => id.toString());
        const ee = prefs.emailEnabled !== false;
        setMutedTypes(mt);
        setMutedBoards(mb);
        setEmailEnabled(ee);
        setOriginal({ mutedTypes: mt, mutedBoards: mb, emailEnabled: ee });
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
        toast.error('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWorkspacesAndBoards]);

  // Detect changes
  useEffect(() => {
    const typesChanged = JSON.stringify([...mutedTypes].sort()) !== JSON.stringify([...original.mutedTypes].sort());
    const boardsChanged = JSON.stringify([...mutedBoards].sort()) !== JSON.stringify([...original.mutedBoards].sort());
    const emailChanged = emailEnabled !== original.emailEnabled;
    setHasChanges(typesChanged || boardsChanged || emailChanged);
  }, [mutedTypes, mutedBoards, emailEnabled, original]);

  const toggleType = (type) => {
    setMutedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleBoard = (boardId) => {
    const id = boardId.toString();
    setMutedBoards(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateNotificationPreferences({ mutedTypes, mutedBoards, emailEnabled });
      const prefs = result.data?.notifications || {};
      const mt = prefs.mutedTypes || mutedTypes;
      const mb = (prefs.mutedBoards || mutedBoards).map(id => id.toString());
      const ee = prefs.emailEnabled !== false;
      setOriginal({ mutedTypes: mt, mutedBoards: mb, emailEnabled: ee });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = NOTIFICATION_TYPES.length - mutedTypes.length;
  const mutedBoardCount = mutedBoards.length;

  return (
    <div className="flex min-h-screen bg-[#f7f9fb] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <DashboardSidebar />
      <Navbar />

      <main className="ml-0 lg:ml-[280px] pt-16 min-h-screen w-full flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-10 pb-24">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-8">
            <ol className="inline-flex items-center gap-2">
              <li className="inline-flex items-center">
                <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" to="/dashboard">Dashboard</Link>
              </li>
              <li><span className="material-symbols-outlined text-[16px]">chevron_right</span></li>
              <li aria-current="page"><span className="text-slate-900 dark:text-slate-200 font-medium">Settings</span></li>
            </ol>
          </nav>

          {/* Header Section */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#2170e4]/10 flex items-center justify-center text-[#2170e4] shrink-0 shadow-sm border border-[#2170e4]/20">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Notification Settings</h2>
              <p className="text-base text-slate-600 dark:text-slate-400">Control which notifications you receive and how they are delivered.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-indigo-200 dark:border-indigo-950 border-t-[#0058be] dark:border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading preferences...</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="text-[#0058be] dark:text-blue-400 text-3xl font-bold leading-none mb-3">{enabledCount}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Types enabled</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="text-rose-600 dark:text-rose-400 text-3xl font-bold leading-none mb-3">{mutedBoardCount}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Boards muted</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="text-emerald-600 dark:text-emerald-400 text-3xl font-bold leading-none mb-3">{emailEnabled ? 'On' : 'Off'}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Email alerts</div>
                </div>
              </div>

              {/* Notification Types Section */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                  <h3 className="text-xl font-semibold">Notification Types</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Toggle off any notification type you don't want to receive. Muted notifications won't appear in your notification bell.</p>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                  {NOTIFICATION_TYPES.map((nt) => {
                    const isEnabled = !mutedTypes.includes(nt.type);
                    return (
                      <div
                        key={nt.type}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors group cursor-pointer"
                        onClick={() => toggleType(nt.type)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${nt.color}`}>
                            <span className="material-symbols-outlined text-[20px]">{nt.icon}</span>
                          </div>
                          <div>
                            <div className={`text-base font-medium text-slate-900 dark:text-white transition-colors ${nt.hoverText}`}>{nt.label}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{nt.description}</div>
                          </div>
                        </div>
                        <Toggle checked={isEnabled} onChange={() => toggleType(nt.type)} colorTheme={nt.type.includes('WORKSPACE') && !nt.type.includes('REMOVE') ? 'emerald' : 'blue'} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Email Notifications Toggle */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-500">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                  <h3 className="text-xl font-semibold">Email Notifications</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-4">
                  <div 
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors group cursor-pointer"
                    onClick={() => setEmailEnabled(prev => !prev)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                        <span className="material-symbols-outlined text-[20px]">mark_email_unread</span>
                      </div>
                      <div>
                        <div className="text-base font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Email Digest</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Receive email notifications for important updates</div>
                      </div>
                    </div>
                    <Toggle checked={emailEnabled} onChange={() => setEmailEnabled(prev => !prev)} colorTheme="emerald" />
                  </div>
                </div>
              </div>

              {/* Muted Boards Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                  <h3 className="text-xl font-semibold">Board Notifications</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Mute notifications from specific boards. You'll still see activity when you open the board, but won't receive push notifications.</p>

                {allBoards.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">view_kanban</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No boards found. Join a workspace to see boards here.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                    {allBoards.map((board) => {
                      const isMuted = mutedBoards.includes(board._id.toString());
                      return (
                        <div
                          key={board._id}
                          className="p-4 pl-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors group cursor-pointer"
                          onClick={() => toggleBoard(board._id)}
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-base font-medium text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{board.name}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                {isMuted ? (
                                  <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-[16px]">notifications_off</span> Muted
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">notifications_active</span> Receiving notifications
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Toggle checked={!isMuted} onChange={() => toggleBoard(board._id)} colorTheme="amber" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className={`sticky bottom-6 transition-all duration-300 ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-800 dark:border-slate-700 shadow-xl shadow-slate-900/20">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-amber-400 text-lg">info</span>
                    <span className="text-white font-medium">You have unsaved changes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setMutedTypes(original.mutedTypes);
                        setMutedBoards(original.mutedBoards);
                        setEmailEnabled(original.emailEnabled);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#0058be] hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationSettingsPage;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import useWorkspaceStore from '../store/workspaceStore';
import { createWorkspace, deleteWorkspace, inviteMember, getOverdueCount } from '../api/workspace.api';
import { createBoard, deleteBoard } from '../api/board.api';
import { getDevelopers } from '../api/auth.api';
import Avatar from '../UI/Avatar';
import WorkspaceSettingsModal from '../components/workspace/WorkspaceSettingsModal';
import Navbar from '../components/Layout/Navbar';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import AdminDashboardPanel from '../components/Dashboard/AdminDashboardPanel';
import ProjectManagerDashboardPanel from '../components/Dashboard/ProjectManagerDashboardPanel';
import DeveloperDashboardPanel from '../components/Dashboard/DeveloperDashboardPanel';
import ClientDashboardPanel from '../components/Dashboard/ClientDashboardPanel';

const BOARD_COLORS = [
  'linear-gradient(135deg, #005f73 0%, #0a9396 100%)',
  'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
  'linear-gradient(135deg, #3f37c9 0%, #480ca8 100%)',
  'linear-gradient(180deg, #D44D4D 0%, #8C2222 100%)',
  'linear-gradient(180deg, #D69E2E 0%, #975A16 100%)',
  'linear-gradient(180deg, #38B2AC 0%, #234E52 100%)'
];

const BOARD_WALLPAPERS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC1i5fjseQCfG4niYiPxCzhZD8Hc-LEY-cxV3kUkzJDaCTDVdckufRHZ3QoM2qOb_8qjLfbDmDjBYKKjgLVU5ZoHbWX3odoio3aR11LOfBUYdRE_ovJ01KcK4Jp3hiDky2I_Rs8ktUYp2sj_uPJ-G4g3HcF7jmuWqdDm1GnX3_yn3Av11GUDo0UGMCiTe2OhnZJGhXOdY_v22V1GwJqCVE37HWETLMk0wr5wRb3kgid-cDodEah2FBSjZgvBuveaBZGRHTd8PE4Hv4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCaULM4vsaEJfc_9MxHuJtf84ANjItmdqPH2Z53tfiz9WNZmVnUU1oLw2AQqYB-IC9kTjAHhXgEzn4353ZYDvhd7PWfzBoH_MoF5-c74gkGntBqQQT1kcJUFK4lkB3WDULgW1k5XkbM2S4-Q2SFR0X3civoEdowEm5qoZhcxufukYd_1pgjHzX5Ec6Ya0jIB4QjasEZ8Q9N9xVsNnZYKOGhDQWwkxmKLrLIpCCwPGjO18E3qVLh_EZUMgkd5lbD3AyeeuMpU0WSJQs',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBaOFw_CKRYhyArL6ifoMbG-KasP1zmdS6FC475IVA38Uf90O-D6VRbgknHd_IJ3zatzdCjrtuVVMWn_PRPQR4s0R44VjAw3TP5S0FrBphhLltfkVCEoAvBskP8PB9SIQRH6LjniJjNb5BdF5mAyJWyOZ3PSfJP3x0p9GEclbbUOgN0JJ4nIU0MxGhbfy-rwkiJr9NvLJj_jUeSeu9zPLcNeVZVqNbGDhJcxqo2mX59pgbZEH2XTK9nC1bBsQamvQ7iMtVh8i1_he8'
];

import Modal from '../components/common/Modal';

const DashboardPage = () => {
  const {
    workspaces,
    boardsByWorkspace,
    loading,
    fetchWorkspacesAndBoards,
    addWorkspace,
    removeWorkspace,
    updateWorkspace,
    addBoard,
    removeBoard
  } = useWorkspaceStore();

  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');

  const [showCreateBoard, setShowCreateBoard] = useState(null);
  const [boardName, setBoardName] = useState('');
  const [boardColor, setBoardColor] = useState(BOARD_COLORS[0]);

  const [showInvite, setShowInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('client');

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [settingOpen, setSettingOpen] = useState(false);
  const [overdueCounts, setOverdueCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAuthStore(s => s.user);
  const [developers, setDevelopers] = useState([]);

  const boards = Object.values(boardsByWorkspace).flat();
  const starredBoards = boards.filter((board) => board.isStarred);

  useEffect(() => {
    if (showInvite) {
      const fetchDevs = async () => {
        try {
          const res = await getDevelopers();
          setDevelopers(res.data?.developers || []);
        } catch (err) {
          console.error('Failed to load registered users', err);
        }
      };
      if (user?.role === 'admin' || user?.role === 'project_manager') {
        fetchDevs();
      }
    } else {
      setDevelopers([]);
    }
  }, [showInvite, user]);

  useEffect(() => {
    const loadOverdueCounts = async () => {
      try {
        await fetchWorkspacesAndBoards(true);
        const wsList = useWorkspaceStore.getState().workspaces;
        const overdueMap = {};
        await Promise.all(
          wsList.map(async (ws) => {
            try {
              const countRes = await getOverdueCount(ws._id);
              overdueMap[ws._id] = countRes.data?.overdueCount || 0;
            } catch (err) {
              console.error('Failed to load overdue count for workspace', ws._id, err);
              overdueMap[ws._id] = 0;
            }
          })
        );
        setOverdueCounts(overdueMap);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };
    loadOverdueCounts();
  }, [fetchWorkspacesAndBoards, user?._id]);

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) return;
    try {
      const res = await createWorkspace({ name: wsName.trim(), description: wsDesc });
      const ws = res.data?.workspace;
      addWorkspace(ws);
      setOverdueCounts(p => ({ ...p, [ws._id]: 0 }));
      setWsName(''); setWsDesc(''); setShowCreateWs(false);
      toast.success('Workspace created successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create workspace'); }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    try {
      const res = await createBoard({ name: boardName.trim(), workspaceId: showCreateBoard, background: boardColor });
      const board = res.data?.board;
      addBoard(showCreateBoard, board);
      setBoardName(''); setBoardColor(BOARD_COLORS[0]); setShowCreateBoard(null);
      toast.success('Board created successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create board'); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await inviteMember(showInvite, { email: inviteEmail.trim(), role: inviteRole });
      const updatedWs = res.data?.workspace;
      if (updatedWs) {
        updateWorkspace(updatedWs._id, updatedWs);
      }
      setInviteEmail(''); setInviteRole('client'); setShowInvite(null);
      toast.success('Invitation sent');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send invite'); }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;
    try {
      await deleteWorkspace(workspaceId);
      removeWorkspace(workspaceId);
      toast.success('Workspace deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const handleDeleteBoard = async (boardId, workspaceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this board? All lists and cards within it will be permanently deleted.')) return;
    try {
      await deleteBoard(boardId);
      removeBoard(workspaceId, boardId);
      toast.success('Board deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board');
    }
  };

  const openWorkspaceSettings = (workspace) => {
    setSelectedWorkspace(workspace);
    setSettingOpen(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse absolute" />
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200 selection:bg-secondary-fixed">

      {/* Left Sidebar Layout */}
      <DashboardSidebar
        currentWorkspace={selectedWorkspace}
        openWorkspaceSettings={openWorkspaceSettings}
        boards={boards}
      />

      {/* Top Navigation Bar */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content Canvas */}
      <main className="ml-0 lg:ml-[280px] pt-16 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10">

          {/* Role-Aware Dashboard Panel */}
          {user?.role === 'admin' && <div className="mb-xl"><AdminDashboardPanel /></div>}
          {user?.role === 'project_manager' && <div className="mb-xl"><ProjectManagerDashboardPanel /></div>}
          {user?.role === 'developer' && <div className="mb-xl"><DeveloperDashboardPanel /></div>}
          {user?.role === 'client' && <div className="mb-xl"><ClientDashboardPanel /></div>}

          {/* Workspaces Section */}
          <div className="flex justify-between items-center mb-md gap-3">
            <h3 className="font-title-md text-title-md text-primary dark:text-white">My Workspaces</h3>
            {user?.role !== 'developer' && user?.role !== 'client' && (
              <button onClick={() => setShowCreateWs(true)}
                className="bg-secondary text-on-secondary px-3.5 py-2 rounded-lg font-body-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Workspace
              </button>
            )}
          </div>

          {/* Empty State */}
          {workspaces.length === 0 && (
            <div className="text-center py-20 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-surface-variant dark:border-slate-700 shadow-sm max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-5 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-3xl">workspaces</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No workspaces found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mb-6">Get started by building a fresh workspace hub to separate your operational workflows.</p>
              {user?.role !== 'developer' && user?.role !== 'client' && (
                <button onClick={() => setShowCreateWs(true)} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm">
                  Create your first Workspace
                </button>
              )}
            </div>
          )}


          {/* Workspaces List */}
          <section className="space-y-8">
            {workspaces
              .filter(ws => {
                const wsMatches = ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()));
                const boards = boardsByWorkspace[ws._id] || [];
                const boardMatches = boards.some(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
                return wsMatches || boardMatches;
              })
              .map(ws => {
                const isWsAdmin = user?.role !== 'client' && (ws.Admin === user?._id || ws.Admin?._id === user?._id || user?.role === 'admin' || user?.role === 'project_manager');
                const isActualAdmin = user?.role !== 'client' && (ws.Admin === user?._id || ws.Admin?._id === user?._id || user?.role === 'admin');
                const boards = (boardsByWorkspace[ws._id] || []).filter(b =>
                  b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ws.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <div key={ws._id} className="tonal-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-outline-variant dark:border-slate-700 dark:bg-slate-800/40 overflow-hidden mb-6 sm:mb-8">

                    {/* Workspace Meta Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
                      <div className="flex justify-between items-start w-full md:w-auto gap-2">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary-fixed-dim text-on-primary-fixed text-xl sm:text-2xl font-black border border-outline-variant dark:border-slate-700 flex items-center justify-center shrink-0">
                            {ws.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-headline-lg text-lg sm:text-headline-sm text-primary dark:text-white">{ws.name}</span>
                              {overdueCounts[ws._id] > 0 && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 text-[11.5px] font-bold px-2 py-0.5 rounded-full select-none shadow-sm animate-pulse">
                                  <span className="material-symbols-outlined text-[13px] text-rose-500">alarm</span>
                                  {overdueCounts[ws._id]} Overdue
                                </span>
                              )}
                            </div>
                            {ws.description && <p className="font-body-md text-sm sm:text-base text-on-primary-container dark:text-slate-400 mb-1">{ws.description}</p>}
                            <div className="flex items-center gap-1.5 text-on-primary-container dark:text-slate-400">
                              <span className="material-symbols-outlined text-[18px]">link</span>
                              <span className="font-body-sm font-semibold">{ws.members?.length || 1} members</span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile-only Top Right Corner Action Buttons */}
                        <div className="flex md:hidden gap-1.5 items-center shrink-0">
                          {isWsAdmin && (
                            <button onClick={() => openWorkspaceSettings(ws)} className="flex items-center justify-center p-2 bg-surface-container-low dark:bg-slate-700 text-on-surface-variant dark:text-slate-200 rounded-xl border border-outline-variant dark:border-slate-600 hover:bg-surface-container-high dark:hover:bg-slate-650 transition-colors shadow-xs" title="Workspace Settings">
                              <span className="material-symbols-outlined text-[18px]">settings</span>
                            </button>
                          )}
                          {isActualAdmin && (
                            <button onClick={() => handleDeleteWorkspace(ws._id)} className="flex items-center justify-center p-2 text-error hover:bg-error-container hover:text-on-error-container rounded-xl transition-all shadow-xs" title="Delete Workspace">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap w-full md:w-auto items-center pt-1 md:pt-0">
                        {isWsAdmin && (
                          <button onClick={() => setShowInvite(ws._id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-surface-container-low dark:bg-slate-700 text-on-surface-variant dark:text-slate-200 rounded-xl border border-outline-variant dark:border-slate-600 hover:bg-surface-container-high dark:hover:bg-slate-650 transition-colors font-body-sm font-semibold whitespace-nowrap shadow-xs">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>Invite Members</span>
                          </button>
                        )}
                        {isWsAdmin && (
                          <button onClick={() => setShowCreateBoard(ws._id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-secondary text-white rounded-xl border border-secondary hover:opacity-90 transition-opacity font-body-sm font-semibold whitespace-nowrap shadow-xs">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>Add Board</span>
                          </button>
                        )}
                        {isWsAdmin && (
                          <button onClick={() => openWorkspaceSettings(ws)} className="hidden md:flex shrink-0 items-center justify-center p-2 bg-surface-container-low dark:bg-slate-700 text-on-surface-variant dark:text-slate-200 rounded-xl border border-outline-variant dark:border-slate-600 hover:bg-surface-container-high dark:hover:bg-slate-650 transition-colors shadow-xs" title="Workspace Settings">
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                          </button>
                        )}
                        {isActualAdmin && (
                          <button onClick={() => handleDeleteWorkspace(ws._id)} className="hidden md:flex shrink-0 items-center justify-center p-2 text-error hover:bg-error-container hover:text-on-error-container rounded-xl transition-all shadow-xs" title="Delete Workspace">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Members Strip */}
                    {ws.members && ws.members.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-y border-outline-variant/30 py-3.5 mb-6 sm:mb-8">
                        <span className="font-label-caps text-xs text-outline dark:text-slate-400 mr-1 font-semibold w-full sm:w-auto mb-1 sm:mb-0">MEMBERS:</span>
                        {ws.members.map(member => (
                          <div key={member._id} className="flex items-center gap-1.5 bg-surface-container-low dark:bg-slate-700/80 border border-outline-variant dark:border-slate-600 px-2.5 py-1 rounded-full shadow-2xs max-w-full">
                            <Avatar name={member.user?.username} avatar={member.user?.avatar} size={22} />
                            <span className="font-body-sm text-xs sm:text-sm font-semibold text-on-surface dark:text-slate-200 truncate max-w-[110px] sm:max-w-none">{member.user?.username || member.user?.email}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Boards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {boards.map((board, index) => {
                        const isBoardAdmin = board.Admin === user?._id || board.Admin?._id === user?._id || user?.role === 'admin' || user?.role === 'project_manager';
                        return (
                          <Link key={board._id} to={`/board/${board._id}`}
                            className="relative h-44 rounded-xl overflow-hidden group cursor-pointer border border-outline-variant dark:border-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md block"
                          >
                            <div className="absolute inset-0" style={{ background: board.background || BOARD_COLORS[index % BOARD_COLORS.length] }}></div>
                            {BOARD_WALLPAPERS[index % BOARD_WALLPAPERS.length] && (
                              <img className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 transition-transform group-hover:scale-110"
                                src={BOARD_WALLPAPERS[index % BOARD_WALLPAPERS.length]}
                                alt=""
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                            {isBoardAdmin && (
                              <button
                                onClick={(e) => handleDeleteBoard(board._id, ws._id, e)}
                                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-rose-600 text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
                                title="Delete Board"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}

                            <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/60 to-transparent">
                              <span className="text-white font-headline-lg text-headline-lg drop-shadow">{board.name}</span>
                            </div>
                          </Link>
                        );
                      })}

                      {isWsAdmin && (
                        <button
                          onClick={() => setShowCreateBoard(ws._id)}
                          className="h-44 rounded-xl border-2 border-dashed border-outline-variant dark:border-slate-700 flex flex-col items-center justify-center gap-sm text-outline dark:text-slate-400 hover:border-secondary hover:text-secondary dark:hover:text-indigo-400 hover:bg-secondary-fixed/20 dark:hover:bg-slate-750/30 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[32px]">add</span>
                          </div>
                          <span className="font-body-md font-semibold">Create New Board</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
          </section>

        </div>
      </main>

      {/* MODALS */}
      <Modal isOpen={showCreateWs} title="Create Workspace" onClose={() => setShowCreateWs(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Workspace Name</label>
              <input value={wsName} onChange={e => setWsName(e.target.value)}
                placeholder="e.g. Engineering, Marketing Automation" autoFocus
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description <span className="text-slate-300 dark:text-slate-650 lowercase font-normal">(optional)</span></label>
              <input value={wsDesc} onChange={e => setWsDesc(e.target.value)}
                placeholder="Briefly summarize operations inside this hub..."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateWorkspace} disabled={!wsName.trim()}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all">Create Hub</button>
              <button onClick={() => setShowCreateWs(false)}
                className="flex-1 h-11 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
      </Modal>

      <Modal isOpen={!!showCreateBoard} title="Create Board" onClose={() => setShowCreateBoard(null)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="h-20 rounded-xl flex items-end p-4 relative overflow-hidden transition-all shadow-inner" style={{ background: boardColor }}>
              <div className="absolute inset-0 bg-black/20" />
              <span className="text-white font-bold text-sm tracking-wide z-10 drop-shadow">{boardName.trim() || 'Untitled Board Theme'}</span>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Board Name</label>
              <input value={boardName} onChange={e => setBoardName(e.target.value)}
                placeholder="e.g. Q3 Sprint Backlog" autoFocus
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Select Visual Wallpaper Theme</label>
              <div className="grid grid-cols-4 gap-2.5">
                {BOARD_COLORS.map(c => (
                  <button key={c} onClick={() => setBoardColor(c)}
                    className={`h-9 rounded-xl border-2 transition-all relative ${boardColor === c ? 'border-indigo-600 scale-105 shadow-md shadow-indigo-100' : 'border-transparent hover:scale-102'}`}
                    style={{ background: c }}>
                    {boardColor === c && (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-sm">
                        <span className="material-symbols-outlined text-sm">check</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateBoard} disabled={!boardName.trim()}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all">Launch Board</button>
              <button onClick={() => setShowCreateBoard(null)}
                className="flex-1 h-11 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
      </Modal>

      <Modal isOpen={!!showInvite} title="Invite Member to Workspace" onClose={() => setShowInvite(null)} maxWidth="max-w-md">
          <div className="space-y-4">
            {developers.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Available Users</label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                  {developers.map(dev => (
                    <button
                      key={dev._id}
                      type="button"
                      onClick={() => {
                        setInviteEmail(dev.email);
                        setInviteRole(dev.role || 'client');
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs border transition-all ${inviteEmail === dev.email
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                    >
                      <Avatar name={dev.username} avatar={dev.avatar} size={20} />
                      <span>{dev.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                type="email" placeholder="Trellolite@gmail.com" autoFocus
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer">
                <option value="client">Client</option>
                <option value="developer">Developer</option>
                <option value="project_manager">Project Manager</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleInvite} disabled={!inviteEmail.trim()}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all">Send Invitation</button>
              <button onClick={() => setShowInvite(null)}
                className="flex-1 h-11 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
      </Modal>

      {settingOpen && selectedWorkspace && (
        <WorkspaceSettingsModal
          workspace={selectedWorkspace}
          onClose={() => { setSettingOpen(false); setSelectedWorkspace(null); }}
          onWorkspaceUpdated={(updatedWs) => {
            setWorkspaces(p => p.map(w => w._id === updatedWs._id ? { ...w, ...updatedWs } : w));
            if (selectedWorkspace._id === updatedWs._id) {
              setSelectedWorkspace(updatedWs);
            }
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
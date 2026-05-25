import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import useSidebarStore from '../store/sidebarStore';
import { createWorkspace, deleteWorkspace, getWorkspaces, inviteMember, getOverdueCount } from '../api/workspace.api';
import { createBoard, getBoardsByWorkspace, deleteBoard, toggleStarBoard } from '../api/board.api';
import { getDevelopers } from '../api/auth.api';
import Avatar from '../UI/Avatar';
import { getRoleDisplayName } from '../utils/roleDisplay';
import WorkspaceSettingsModal from '../components/workspace/WorkspaceSettingsModal';
import Navbar from '../components/Layout/Navbar';
import DashboardSidebar from '../components/Layout/DashboardSidebar';

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

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 transition-all" onClick={onClose}>
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const DashboardPage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState({});
  const [loading, setLoading] = useState(true);

  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');

  const [showCreateBoard, setShowCreateBoard] = useState(null);
  const [boardName, setBoardName] = useState('');
  const [boardColor, setBoardColor] = useState(BOARD_COLORS[0]);

  const [showInvite, setShowInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [settingOpen, setSettingOpen] = useState(false);
  const [overdueCounts, setOverdueCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const isSidebarOpen = useSidebarStore(s => s.isOpen);
  const toggleSidebar = useSidebarStore(s => s.toggle);
  const closeSidebar = useSidebarStore(s => s.close);

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
          console.error('Failed to load registered developers', err);
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
    const load = async () => {
      setLoading(true);
      try {
        const wsRes = await getWorkspaces();
        const wsList = wsRes.data?.workspaces || [];
        setWorkspaces(wsList);
        const map = {};
        const overdueMap = {};
        await Promise.all(wsList.map(async ws => {
          const bRes = await getBoardsByWorkspace(ws._id);
          map[ws._id] = bRes.data?.boards || [];
          try {
            const countRes = await getOverdueCount(ws._id);
            overdueMap[ws._id] = countRes.data?.overdueCount || 0;
          } catch (err) {
            console.error('Failed to load overdue count for workspace', ws._id, err);
            overdueMap[ws._id] = 0;
          }
        }));
        setBoardsByWorkspace(map);
        setOverdueCounts(overdueMap);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) return;
    try {
      const res = await createWorkspace({ name: wsName.trim(), description: wsDesc });
      const ws = res.data?.workspace;
      setWorkspaces(p => [ws, ...p]);
      setBoardsByWorkspace(p => ({ ...p, [ws._id]: [] }));
      setOverdueCounts(p => ({ ...p, [ws._id]: 0 }));
      setWsName(''); setWsDesc(''); setShowCreateWs(false);
      toast.success('Workspace created successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create workspace'); }
  };

  const handleToggleStar = async (boardId, currentStarred) => {
    try {
        await toggleStarBoard(boardId);

        // find which workspace contains this board
        let foundWorkspaceId = null;
        for (const [wsId, boardsList] of Object.entries(boardsByWorkspace)) {
            if (boardsList.some(b => b._id === boardId)) {
                foundWorkspaceId = wsId;
                break;
            }
        }

        if (foundWorkspaceId) {
            setBoardsByWorkspace(prev => ({
                ...prev,
                [foundWorkspaceId]: prev[foundWorkspaceId].map(b =>
                    b._id === boardId
                        ? { ...b, isStarred: !currentStarred }
                        : b
                )
            }));
        }

        toast.success(currentStarred ? "Board unfavorited" : "Board favorited");

    } catch (err) {
        console.error(err);
        toast.error("Failed to update favorite status");
    }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    try {
      const res = await createBoard({ name: boardName.trim(), workspaceId: showCreateBoard, background: boardColor });
      const board = res.data?.board;
      setBoardsByWorkspace(p => ({ ...p, [showCreateBoard]: [...(p[showCreateBoard] || []), board] }));
      setBoardName(''); setBoardColor(BOARD_COLORS[0]); setShowCreateBoard(null);
      toast.success('Board created successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create board'); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(showInvite, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail(''); setInviteRole('viewer'); setShowInvite(null);
      toast.success('Invitation sent');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send invite'); }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;
    try {
      await deleteWorkspace(workspaceId);
      setWorkspaces(p => p.filter(ws => ws._id !== workspaceId));
      setBoardsByWorkspace(p => {
        const next = { ...p };
        delete next[workspaceId];
        return next;
      });
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
      setBoardsByWorkspace(p => ({
        ...p,
        [workspaceId]: (p[workspaceId] || []).filter(b => b._id !== boardId)
      }));
      toast.success('Board deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board');
    }
  };

  const openWorkspaceSettings = (workspace) => {
    setSelectedWorkspace(workspace);
    setSettingOpen(true);
  }

  const handleLogout = async () => { await logout(); navigate('/login'); };

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
        <div className="max-w-[1400px] mx-auto p-6 lg:p-10">
          
          {/* Page Header */}
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-headline-lg text-3xl font-bold text-primary dark:text-white mb-1">My Workspaces</h2>
              <p className="font-body-md text-on-primary-container dark:text-slate-400 max-w-2xl">Collaborate, manage workflows, and track pipeline metrics across teams.</p>
            </div>
            {user?.role !== 'developer' && (
              <button onClick={() => setShowCreateWs(true)} className="bg-secondary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-secondary/10">
                <span className="material-symbols-outlined">add</span>
                Create Workspace
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
              {user?.role !== 'developer' && (
                <button onClick={() => setShowCreateWs(true)} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm">
                  Create your first Workspace
                </button>
              )}
            </div>
          )}

          {starredBoards.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.54 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.785.57-1.84-.196-1.54-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                </svg>

                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Starred Boards
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {starredBoards.map((board) => (
                  <Link
                    key={board._id}
                    to={`/board/${board._id}`}
                    className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {board.name}
                      </h3>

                      <svg
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.54 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.785.57-1.84-.196-1.54-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                      </svg>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Quick access board
                    </p>
                  </Link>
                ))}
              </div>
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
                const isWsOwner = ws.owner === user?._id || ws.owner?._id === user?._id;
                const boards = (boardsByWorkspace[ws._id] || []).filter(b => 
                  b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ws.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                return (
                  <div key={ws._id} className="tonal-card rounded-3xl p-8 border border-outline-variant dark:border-slate-700 dark:bg-slate-800/40 overflow-hidden mb-8">
                    
                    {/* Workspace Meta Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary-fixed-dim text-on-primary-fixed text-2xl font-black border border-outline-variant dark:border-slate-700 flex items-center justify-center">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-headline-lg text-headline-sm text-primary dark:text-white">{ws.name}</span>
                            {overdueCounts[ws._id] > 0 && (
                              <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 text-[11.5px] font-bold px-2 py-0.5 rounded-full select-none shadow-sm animate-pulse">
                                <span className="material-symbols-outlined text-[13px] text-rose-500">alarm</span>
                                {overdueCounts[ws._id]} Overdue
                              </span>
                            )}
                          </div>
                          {ws.description && <p className="font-body-md text-on-primary-container dark:text-slate-400 mb-1">{ws.description}</p>}
                          <div className="flex items-center gap-1.5 text-on-primary-container dark:text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">link</span>
                            <span className="font-body-sm font-semibold">{ws.members?.length || 1} members</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap w-full md:w-auto">
                        {isWsOwner && (
                          <button onClick={() => openWorkspaceSettings(ws)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-surface-container-low dark:bg-slate-700 text-on-surface-variant dark:text-slate-200 rounded-lg border border-outline-variant dark:border-slate-600 hover:bg-surface-container-high dark:hover:bg-slate-650 transition-colors font-body-sm font-semibold">
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                            <span>Settings</span>
                          </button>
                        )}
                        {isWsOwner && (
                          <button onClick={() => setShowInvite(ws._id)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-surface-container-low dark:bg-slate-700 text-on-surface-variant dark:text-slate-200 rounded-lg border border-outline-variant dark:border-slate-600 hover:bg-surface-container-high dark:hover:bg-slate-650 transition-colors font-body-sm font-semibold">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>Invite Members</span>
                          </button>
                        )}
                        {isWsOwner && (
                          <button onClick={() => setShowCreateBoard(ws._id)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-secondary text-white rounded-lg border border-secondary hover:opacity-90 transition-opacity font-body-sm font-semibold">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>Add Board</span>
                          </button>
                        )}
                        {isWsOwner && (
                          <button onClick={() => handleDeleteWorkspace(ws._id)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-all font-body-sm font-semibold">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Members Strip */}
                    {ws.members && ws.members.length > 0 && (
                      <div className="flex flex-wrap items-center gap-4 border-y border-outline-variant/30 py-4 mb-8">
                        <span className="font-label-caps text-label-caps text-outline dark:text-slate-400 mr-2">MEMBERS:</span>
                        {ws.members.map(member => (
                          <div key={member._id} className="flex items-center gap-1 bg-surface-container-low dark:bg-slate-700 border border-outline-variant dark:border-slate-600 px-2 py-1 rounded-full shadow-sm">
                            <Avatar name={member.user?.username} avatar={member.user?.avatar} size={24} />
                            <span className="font-body-sm font-semibold text-on-surface dark:text-slate-200">{member.user?.username || member.user?.email}</span>
                            <span className="font-label-caps text-[10px] bg-secondary-fixed-dim text-on-secondary-fixed-variant dark:text-slate-900 px-1.5 py-0.5 rounded-full uppercase ml-1">
                              {getRoleDisplayName(member.role)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Boards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {boards.map((board, index) => {
                        const isBoardOwner = board.owner === user?._id || board.owner?._id === user?._id;
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
                            
                            {isBoardOwner && (
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

                      {isWsOwner && (
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
      {showCreateWs && (
        <Modal title="Create Workspace" onClose={() => setShowCreateWs(false)}>
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
      )}

      {showCreateBoard && (
        <Modal title="Create Board" onClose={() => setShowCreateBoard(null)}>
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
      )}

      {showInvite && (
        <Modal title="Invite Member to Workspace" onClose={() => setShowInvite(null)}>
          <div className="space-y-4">
            {developers.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Registered Developers</label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                  {developers.map(dev => (
                    <button
                      key={dev._id}
                      type="button"
                      onClick={() => {
                        setInviteEmail(dev.email);
                        setInviteRole('developer');
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                        inviteEmail === dev.email
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
                type="email" placeholder="colleague@company.com" autoFocus
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
      )}

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
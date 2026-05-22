import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import { createWorkspace, deleteWorkspace, getWorkspaces, inviteMember, getOverdueCount } from '../api/workspace.api';
import { createBoard, getBoardsByWorkspace } from '../api/board.api';
import Avatar from '../UI/Avatar';
import { getRoleDisplayName } from '../utils/roleDisplay';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Navbar from '../components/Layout/Navbar';
import WorkspaceSettingsModal from '../components/workspace/WorkspaceSettingsModal';

const BOARD_COLORS = [
  'linear-gradient(180deg, #5A5EE0 0%, #3031B7 100%)', 
  'linear-gradient(180deg, #0075A7 0%, #004C6E 100%)', 
  'linear-gradient(180deg, #D94670 0%, #8A1A40 100%)', 
  'linear-gradient(180deg, #D44D4D 0%, #8C2222 100%)', 
  'linear-gradient(180deg, #D69E2E 0%, #975A16 100%)', 
  'linear-gradient(180deg, #38B2AC 0%, #234E52 100%)'
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

  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
      
      {/* TopAppBar */}
      <Navbar />

      {/* Main Container wrapper */}
      <div className="flex flex-1 pt-16 h-full">
        
        {/* Left Fixed Sidebar */}
        <DashboardSidebar />

        {/* Content Canvas */}
        <main className="flex-1 ml-0 md:ml-sidebar-width p-6 md:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-headline-xl font-headline-xl text-on-surface dark:text-white mb-2">My Workspaces</h1>
              <p className="text-body-lg font-body-lg text-on-surface-variant dark:text-slate-350">Collaborate, manage workflows, and track pipeline metrics across teams.</p>
            </div>
            {user?.role !== 'developer' && (
              <button onClick={() => setShowCreateWs(true)} className="bg-primary-container text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] font-label-md font-semibold self-start md:self-auto shadow-sm transition-all duration-200">
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

          {/* Workspaces List */}
          <section className="space-y-8">
            {workspaces.map(ws => {
              const isWsOwner = ws.owner === user?._id || ws.owner?._id === user?._id;
              return (
                <div key={ws._id} className="bg-surface-container-lowest dark:bg-slate-800/40 rounded-xl border border-surface-variant dark:border-slate-700 shadow-sm overflow-hidden mb-8">
                  
                  {/* Workspace Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-headline-md font-bold text-xl shadow-sm">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{ws.name}</h3>
                          {overdueCounts[ws._id] > 0 && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 text-[11.5px] font-bold px-2 py-0.5 rounded-full select-none shadow-sm">
                              <span className="material-symbols-outlined text-[13px] text-rose-500">alarm</span>
                              {overdueCounts[ws._id]} Overdue
                            </span>
                          )}
                        </div>
                        {ws.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{ws.description}</p>}
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">link</span>
                          <span>{ws.members?.length || 1} members</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      {isWsOwner && (
                        <button onClick={() => openWorkspaceSettings(ws)} className="flex-1 sm:flex-none h-10 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-150 transition-all border border-slate-200/50 dark:border-slate-600/40">
                          <span className="material-symbols-outlined text-[18px]">settings</span>
                          Settings
                        </button>
                      )}
                      {isWsOwner && (
                        <button onClick={() => setShowInvite(ws._id)} className="flex-1 sm:flex-none h-10 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-150 transition-all border border-slate-200/50 dark:border-slate-600/40">
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                          Invite Members
                        </button>
                      )}
                      {isWsOwner && (
                        <button onClick={() => setShowCreateBoard(ws._id)} className="flex-1 sm:flex-none h-10 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 duration-150 transition-all">
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          Add Board
                        </button>
                      )}
                      {isWsOwner && (
                        <button onClick={() => handleDeleteWorkspace(ws._id)} className="flex-1 sm:flex-none h-10 px-4 border border-rose-200 dark:border-rose-900/60 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 duration-150 transition-all">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Members Strip */}
                  {ws.members && ws.members.length > 0 && (
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/20 flex flex-wrap items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Members:</span>
                      {ws.members.map(member => (
                        <div key={member._id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm">
                          <Avatar name={member.user?.username || member.user?.email || '?'} size={20} />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{member.user?.username || member.user?.email}</span>
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full ml-1 uppercase border border-indigo-100/40 dark:border-indigo-900/30">
                            {getRoleDisplayName(member.role)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Boards Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(boardsByWorkspace[ws._id] || []).map((board, index) => (
                        <Link key={board._id} to={`/board/${board._id}`}
                          className="block h-32 rounded-2xl p-4 flex flex-col justify-end hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group relative overflow-hidden shadow-sm hover:shadow-md"
                          style={{ background: board.background || BOARD_COLORS[index % BOARD_COLORS.length] }}>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-0"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-0" />
                          <h4 className="text-white font-headline-md font-bold text-lg relative z-10 drop-shadow-md group-hover:underline decoration-white/60 underline-offset-4">{board.name}</h4>
                        </Link>
                      ))}

                      {isWsOwner && (
                        <button 
                          onClick={() => setShowCreateBoard(ws._id)} 
                          className="h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/60 hover:border-indigo-500 dark:hover:border-indigo-500 flex flex-col items-center justify-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200 group"
                        >
                          <span className="material-symbols-outlined text-[28px] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">add_circle</span>
                          <span className="text-sm font-semibold tracking-wide">Create New Board</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </section>

        </main>
      </div>

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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description <span className="text-slate-300 dark:text-slate-600 lowercase font-normal">(optional)</span></label>
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
                className="flex-1 h-11 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Invite Member to Workspace" onClose={() => setShowInvite(null)}>
          <div className="space-y-4">
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
                className="flex-1 h-11 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
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
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import { createWorkspace, deleteWorkspace, getWorkspaces, inviteMember } from '../api/workspace.api';
import { createBoard, getBoardsByWorkspace } from '../api/board.api';
import Avatar from '../UI/Avatar';

const BOARD_COLORS = [
  'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', 
  'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', 
  'linear-gradient(135deg, #10B981 0%, #34D399 100%)', 
  'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', 
  'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', 
  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', 
  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
  'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)'
];

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 transition-all" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l12 12M13 1L1 13" /></svg>
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
        await Promise.all(wsList.map(async ws => {
          const bRes = await getBoardsByWorkspace(ws._id);
          map[ws._id] = bRes.data?.boards || [];
        }));
        setBoardsByWorkspace(map);
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

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 animate-pulse absolute" />
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-600 antialiased font-sans">
      <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="18" rx="2" fill="white" />
              <rect x="14" y="3" width="7" height="11" rx="2" fill="white" opacity="0.7" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Trello<span className="text-indigo-600 font-medium">lite</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-50 pl-2 pr-3 py-1.5 rounded-full border border-slate-100">
            <Avatar name={user?.username || '?'} size={28} className="shadow-inner" />
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.username}</span>
          </div>
          <button onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-xl px-4 py-2 transition-all duration-200 shadow-sm">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Workspaces</h1>
            <p className="text-slate-500 mt-1">Collaborate, manage workflows, and track pipeline metrics</p>
          </div>
          <button onClick={() => setShowCreateWs(true)}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-indigo-100 hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5 flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Workspace
          </button>
        </div>

        {workspaces.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-150 shadow-sm max-w-xl mx-auto mt-8 p-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5 text-indigo-600 shadow-inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="2" />
                <rect x="14" y="3" width="7" height="11" rx="2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No workspaces found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Get started by building a fresh workspace hub to separate your operational workflows.</p>
            <button onClick={() => setShowCreateWs(true)} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm">
              Create your first Workspace
            </button>
          </div>
        )}

        {workspaces.map(ws => {
          const isWsOwner = ws.owner === user?._id || ws.owner?._id === user?._id;
          return (
          <div key={ws._id} className="mb-12 bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-150">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-base shadow-sm">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">{ws.name}</h2>
                  {ws.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{ws.description}</p>}
                  <div className="inline-flex items-center gap-1.5 mt-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5l-7.5-7.5M19.5 12l-7.5-7.5" /></svg>
                    <span>{ws.members?.length || 1} members</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {isWsOwner && (
                <button onClick={() => setShowInvite(ws._id)}
                  className="text-xs font-semibold border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019 21c-2.307 0-4.484-.633-6.351-1.766z" /></svg>
                  Invite Members
                </button>
                )}
                {isWsOwner && (
                <button onClick={() => setShowCreateBoard(ws._id)}
                  className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Board
                </button>
                )}
                {isWsOwner && (
                <button onClick={() => handleDeleteWorkspace(ws._id)}
                  className="text-xs font-semibold border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  title="Delete Workspace">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.34 9m-4.78 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-1.8c0-.621-.504-1.125-1.125-1.125h-2.25c-.621 0-1.125.504-1.125 1.125v1.8m6.75 0a48.108 48.108 0 00-3.478-.397m-12 .562a48.11 48.11 0 013.478-.397" />
                  </svg>
                  <span>Delete</span>
                </button>
                )}
              </div>
            </div>

            {ws.members && ws.members.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2">Members:</span>
                {ws.members.map(member => (
                  <div key={member._id} className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1" title={member.user?.username || member.user?.email}>
                    <Avatar name={member.user?.username || member.user?.email || '?'} size={20} />
                    <span className="text-xs font-medium text-slate-700">{member.user?.email}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase ml-1 px-1.5 py-0.5 bg-slate-200/50 rounded-md">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(boardsByWorkspace[ws._id] || []).map(board => (
                <Link key={board._id} to={`/board/${board._id}`}
                  className="h-28 rounded-xl flex items-end p-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                  style={{ background: board.background || 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <span className="text-white font-bold text-sm tracking-wide z-10 drop-shadow-sm group-hover:underline decoration-white/60 underline-offset-4">{board.name}</span>
                </Link>
              ))}
              {isWsOwner && (
              <button onClick={() => setShowCreateBoard(ws._id)}
                className="h-28 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all duration-200 gap-1.5 group">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                  <span className="text-xl font-medium leading-none text-slate-500 group-hover:text-indigo-600">+</span>
                </div>
                <span className="text-xs font-bold tracking-wide">Create New Board</span>
              </button>
              )}
            </div>
          </div>
          );
        })}
      </main>

      {showCreateWs && (
        <Modal title="Create Workspace" onClose={() => setShowCreateWs(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Workspace Name</label>
              <input value={wsName} onChange={e => setWsName(e.target.value)}
                placeholder="e.g. Engineering, Marketing Automation" autoFocus
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description <span className="text-slate-300 lowercase font-normal">(optional)</span></label>
              <input value={wsDesc} onChange={e => setWsDesc(e.target.value)}
                placeholder="Briefly summarize operations inside this hub..."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateWorkspace} disabled={!wsName.trim()}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all">Create Hub</button>
              <button onClick={() => setShowCreateWs(false)}
                className="flex-1 h-11 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Board Name</label>
              <input value={boardName} onChange={e => setBoardName(e.target.value)}
                placeholder="e.g. Q3 Sprint Backlog" autoFocus
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Visual Wallpaper Theme</label>
              <div className="grid grid-cols-4 gap-2.5">
                {BOARD_COLORS.map(c => (
                  <button key={c} onClick={() => setBoardColor(c)}
                    className={`h-9 rounded-xl border-2 transition-all relative ${boardColor === c ? 'border-indigo-600 scale-105 shadow-md shadow-indigo-100' : 'border-transparent hover:scale-102'}`}
                    style={{ background: c }}>
                    {boardColor === c && (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-sm">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
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
                className="flex-1 h-11 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Invite Member to Workspace" onClose={() => setShowInvite(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                type="email" placeholder="colleague@company.com" autoFocus
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer">
                <option value="viewer">Viewer (Client)</option>
                <option value="editor">Editor (Developer)</option>
                <option value="admin">Admin (Project Manager)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleInvite} disabled={!inviteEmail.trim()}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all">Send Invitation</button>
              <button onClick={() => setShowInvite(null)}
                className="flex-1 h-11 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
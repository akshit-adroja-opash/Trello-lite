import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authstore';
import { createWorkspace, getWorkspaces, inviteMember } from '../api/workspace.api';
import { createBoard, getBoardsByWorkspace } from '../api/board.api';
import Avatar from '../UI/Avatar';

const BOARD_COLORS = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-4" onClick={onClose}>
    <div className="bg-surface rounded-2xl shadow-lg border border-outline-variant w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-on-surface">{title}</h2>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-lg leading-none">✕</button>
      </div>
      {children}
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
      toast.success('Workspace created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    try {
      const res = await createBoard({ name: boardName.trim(), workspaceId: showCreateBoard, background: boardColor });
      const board = res.data?.board;
      setBoardsByWorkspace(p => ({ ...p, [showCreateBoard]: [...(p[showCreateBoard] || []), board] }));
      setBoardName(''); setBoardColor(BOARD_COLORS[0]); setShowCreateBoard(null);
      toast.success('Board created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(showInvite, { email: inviteEmail.trim() });
      setInviteEmail(''); setShowInvite(null);
      toast.success('Member invited');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Nav ── */}
      <header className="h-14 bg-surface border-b border-outline-variant sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="18" rx="2" fill="white"/>
              <rect x="14" y="3" width="7" height="11" rx="2" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span className="font-bold text-on-surface">Trello-lite</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={user?.username || '?'} size={32} />
          <span className="text-sm text-on-surface-variant hidden sm:block">{user?.username}</span>
          <button onClick={handleLogout}
            className="text-sm text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg px-3 py-1.5 hover:bg-surface-raised transition">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">My Workspaces</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage your boards and teams</p>
          </div>
          <button onClick={() => setShowCreateWs(true)}
            className="bg-primary hover:bg-primary-dark text-on-primary text-sm font-semibold px-4 py-2 rounded-xl transition hover:shadow-lg">
            + New Workspace
          </button>
        </div>

        {workspaces.length === 0 && (
          <div className="text-center py-20 bg-surface rounded-2xl border border-outline-variant">
            <div className="w-14 h-14 rounded-2xl bg-primary-bg flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="18" rx="2" fill="#4F46E5"/>
                <rect x="14" y="3" width="7" height="11" rx="2" fill="#818CF8"/>
              </svg>
            </div>
            <p className="font-semibold text-on-surface mb-1">No workspaces yet</p>
            <p className="text-sm text-on-surface-variant">Create a workspace to get started</p>
          </div>
        )}

        {workspaces.map(ws => (
          <div key={ws._id} className="mb-10">
            {/* Workspace header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center font-bold text-primary text-sm">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-on-surface leading-tight">{ws.name}</h2>
                  <p className="text-xs text-on-surface-variant">{ws.members?.length || 0} members</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowInvite(ws._id)}
                  className="text-xs font-medium border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-raised px-3 py-1.5 rounded-lg transition">
                  Invite
                </button>
                <button onClick={() => setShowCreateBoard(ws._id)}
                  className="text-xs font-semibold bg-primary hover:bg-primary-dark text-on-primary px-3 py-1.5 rounded-lg transition">
                  + Board
                </button>
              </div>
            </div>

            {/* Boards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(boardsByWorkspace[ws._id] || []).map(board => (
                <Link key={board._id} to={`/board/${board._id}`}
                  className="h-24 rounded-xl flex items-end p-3 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 group"
                  style={{ background: board.background || '#4F46E5' }}>
                  <span className="text-white font-semibold text-sm drop-shadow-sm group-hover:underline">{board.name}</span>
                </Link>
              ))}
              <button onClick={() => setShowCreateBoard(ws._id)}
                className="h-24 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-bg transition-all gap-1">
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs font-medium">New board</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* ── Create Workspace Modal ── */}
      {showCreateWs && (
        <Modal title="New Workspace" onClose={() => setShowCreateWs(false)}>
          <div className="space-y-3">
            <input value={wsName} onChange={e => setWsName(e.target.value)}
              placeholder="Workspace name" autoFocus
              className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface-raised text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input value={wsDesc} onChange={e => setWsDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface-raised text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <div className="flex gap-2 pt-1">
              <button onClick={handleCreateWorkspace}
                className="flex-1 h-10 bg-primary hover:bg-primary-dark text-on-primary text-sm font-semibold rounded-xl transition">Create</button>
              <button onClick={() => setShowCreateWs(false)}
                className="flex-1 h-10 border border-outline-variant text-on-surface-variant text-sm rounded-xl hover:bg-surface-raised transition">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create Board Modal ── */}
      {showCreateBoard && (
        <Modal title="New Board" onClose={() => setShowCreateBoard(null)}>
          <div className="space-y-3">
            <div className="h-16 rounded-xl flex items-end p-3 transition-all" style={{ background: boardColor }}>
              <span className="text-white font-semibold text-sm drop-shadow">{boardName || 'Board name'}</span>
            </div>
            <input value={boardName} onChange={e => setBoardName(e.target.value)}
              placeholder="Board name" autoFocus
              className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface-raised text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map(c => (
                <button key={c} onClick={() => setBoardColor(c)}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform ${boardColor === c ? 'border-on-surface scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleCreateBoard}
                className="flex-1 h-10 bg-primary hover:bg-primary-dark text-on-primary text-sm font-semibold rounded-xl transition">Create</button>
              <button onClick={() => setShowCreateBoard(null)}
                className="flex-1 h-10 border border-outline-variant text-on-surface-variant text-sm rounded-xl hover:bg-surface-raised transition">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Invite Modal ── */}
      {showInvite && (
        <Modal title="Invite Member" onClose={() => setShowInvite(null)}>
          <div className="space-y-3">
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              type="email" placeholder="colleague@company.com" autoFocus
              className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface-raised text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <div className="flex gap-2 pt-1">
              <button onClick={handleInvite}
                className="flex-1 h-10 bg-primary hover:bg-primary-dark text-on-primary text-sm font-semibold rounded-xl transition">Send invite</button>
              <button onClick={() => setShowInvite(null)}
                className="flex-1 h-10 border border-outline-variant text-on-surface-variant text-sm rounded-xl hover:bg-surface-raised transition">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;

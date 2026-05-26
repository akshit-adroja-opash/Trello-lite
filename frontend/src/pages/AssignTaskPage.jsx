import { useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import { getWorkspaces, getMembers } from "../api/workspace.api";
import { getBoardsByWorkspace, getBoardMembers } from "../api/board.api";
import { getColumnsByBoard } from "../api/column.api";
import { getCardsByColumn, updateCard } from "../api/card.api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authstore";

const AssignTaskPage = () => {
    const user = useAuthStore(s => s.user);
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const [boards, setBoards] = useState([]);
    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [boardMembers, setBoardMembers] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Modal state
    const [editingCard, setEditingCard] = useState(null);
    const [tempAssignees, setTempAssignees] = useState([]);
    const [onlyShowAssigned, setOnlyShowAssigned] = useState(true);

    // Fetch workspaces on mount
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await getWorkspaces();
                const wsList = res.data?.workspaces || [];
                setWorkspaces(wsList);
                if (wsList.length > 0) {
                    setSelectedWorkspaceId(wsList[0]._id);
                }
            } catch (err) {
                toast.error("Failed to load workspaces");
            } finally {
                setLoading(false);
            }
        };
        fetchWorkspaces();
    }, []);

    // Fetch boards when workspace changes
    useEffect(() => {
        if (!selectedWorkspaceId) {
            setBoards([]);
            setSelectedBoardId("");
            return;
        }
        const fetchBoards = async () => {
            try {
                const res = await getBoardsByWorkspace(selectedWorkspaceId);
                const boardsList = res.data?.boards || [];
                setBoards(boardsList);
                if (boardsList.length > 0) {
                    setSelectedBoardId(boardsList[0]._id);
                } else {
                    setSelectedBoardId("");
                }
            } catch (err) {
                toast.error("Failed to load boards");
            }
        };
        fetchBoards();
    }, [selectedWorkspaceId]);

    // Fetch board members and cards when board changes
    useEffect(() => {
        if (!selectedBoardId) {
            setBoardMembers([]);
            setCards([]);
            return;
        }
        const fetchBoardData = async () => {
            try {
                // Fetch workspace members instead of board members to include all invited users
                const memRes = await getMembers(selectedWorkspaceId);
                const members = memRes.data?.members || memRes.members || [];
                // Format members to only extract user object and role, excluding admins
                const membersList = members
                    .map(m => ({
                        _id: m.user?._id || m.user,
                        username: m.user?.username || "Unknown",
                        email: m.user?.email || "",
                        avatar: m.user?.avatar || "",
                        role: m.role
                    }))
                    .filter(m => m.role !== 'admin');
                setBoardMembers(membersList);

                // Fetch columns and cards
                const colRes = await getColumnsByBoard(selectedBoardId);
                const columns = colRes.data?.columns || [];

                const allCards = [];
                await Promise.all(columns.map(async (col) => {
                    const cardRes = await getCardsByColumn(col._id);
                    const colCards = cardRes.data?.cards || [];
                    colCards.forEach(c => {
                        allCards.push({
                            ...c,
                            columnName: col.name
                        });
                    });
                }));
                setCards(allCards);
            } catch (err) {
                toast.error("Failed to load board tasks or members");
            }
        };
        fetchBoardData();
    }, [selectedBoardId]);

    const handleOpenEditModal = (card) => {
        setEditingCard(card);
        const currentAssignees = (card.assignees || []).map(a => a._id || a);
        setTempAssignees(currentAssignees);
    };

    const handleCloseEditModal = () => {
        setEditingCard(null);
        setTempAssignees([]);
    };

    const handleTempAssigneeToggle = (memberId) => {
        setTempAssignees(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const handleSaveEditAssignment = async () => {
        if (!editingCard) return;

        setUpdating(true);
        try {
            const res = await updateCard(editingCard._id, {
                assignees: tempAssignees,
                version: editingCard.version
            });
            if (res.status === "success") {
                toast.success("Task assignees updated successfully");
                
                // Update local cards state
                setCards(prev => prev.map(c => {
                    if (c._id === editingCard._id) {
                        return {
                            ...c,
                            assignees: boardMembers.filter(m => tempAssignees.includes(m._id)),
                            version: (c.version || 0) + 1
                        };
                    }
                    return c;
                }));
                
                handleCloseEditModal();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update assignment");
        } finally {
            setUpdating(false);
        }
    };

    const activeWorkspace = workspaces.find(w => w._id === selectedWorkspaceId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface dark:bg-slate-900 transition-colors duration-200">
                <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse absolute" />
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    const assignedCards = cards.filter(c => c.assignees && c.assignees.length > 0);
    const filteredCards = onlyShowAssigned ? assignedCards : cards;

    return (
        <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
            <Navbar />

            <div className="flex flex-1 pt-16 h-full">
                <DashboardSidebar currentWorkspace={activeWorkspace} />

                <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
                        <div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1">
                                Assign Task
                            </h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">
                                Assign boards' tasks to members and contributors
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Selector Area */}
                        <div className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Workspace dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                        Select Workspace
                                    </label>
                                    <select
                                        value={selectedWorkspaceId}
                                        onChange={e => setSelectedWorkspaceId(e.target.value)}
                                        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-850 border border-slate-205 dark:border-slate-700 rounded-lg text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
                                    >
                                        <option value="">-- Choose Workspace --</option>
                                        {workspaces.map(ws => (
                                            <option key={ws._id} value={ws._id}>
                                                {ws.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Board dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                        Select Board
                                    </label>
                                    <select
                                        value={selectedBoardId}
                                        onChange={e => setSelectedBoardId(e.target.value)}
                                        disabled={!selectedWorkspaceId}
                                        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-850 border border-slate-205 dark:border-slate-700 rounded-lg text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 text-sm cursor-pointer"
                                    >
                                        <option value="">-- Choose Board --</option>
                                        {boards.map(b => (
                                            <option key={b._id} value={b._id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tasks Table Area */}
                        {selectedBoardId && (
                            <div className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-500">assignment</span>
                                        Tasks List ({filteredCards.length})
                                    </h3>
                                    
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-550 dark:text-slate-400 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={onlyShowAssigned} 
                                            onChange={(e) => setOnlyShowAssigned(e.target.checked)}
                                            className="w-4 h-4 accent-indigo-600 bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 rounded cursor-pointer"
                                        />
                                        Show only assigned tasks
                                    </label>
                                </div>

                                {filteredCards.length === 0 ? (
                                    <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                        <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">assignment_late</span>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No tasks found matching current filters.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-700/80 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                                                    <th className="pb-3 pl-4">Task Title</th>
                                                    <th className="pb-3">Column</th>
                                                    <th className="pb-3">Assigned Members</th>
                                                    <th className="pb-3 pr-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                {filteredCards.map((card) => (
                                                    <tr key={card._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                                        <td className="py-4 pl-4 font-semibold text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                                            {card.title}
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                                                                {card.columnName}
                                                            </span>
                                                        </td>
                                                        <td className="py-4">
                                                            {card.assignees?.length === 0 ? (
                                                                <span className="text-xs text-slate-400 italic">Unassigned</span>
                                                            ) : (
                                                                <div className="flex -space-x-1.5 overflow-hidden">
                                                                    {card.assignees?.map((a) => (
                                                                        <div 
                                                                            key={a._id} 
                                                                            className="inline-block ring-2 ring-white dark:ring-slate-800 rounded-full"
                                                                            title={a.username}
                                                                        >
                                                                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px]">
                                                                                {a.username?.[0]?.toUpperCase()}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 pr-4 text-right">
                                                            <button
                                                                onClick={() => handleOpenEditModal(card)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">edit</span>
                                                                Edit Assignees
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Edit Assignees Modal */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-6" onClick={handleCloseEditModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
                        <header className="p-6 pb-4 flex justify-between items-start border-b border-slate-100 dark:border-slate-700/80">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Edit Task Assignees</h3>
                                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 truncate max-w-sm">For task: "{editingCard.title}"</p>
                            </div>
                            <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        
                        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                            <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                                Select Assignees
                            </label>
                            {boardMembers.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No board members found.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {boardMembers.map(member => {
                                        const isChecked = tempAssignees.includes(member._id);
                                        return (
                                            <label
                                                key={member._id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-all ${isChecked
                                                        ? "border-indigo-500 bg-indigo-500/5 dark:border-indigo-550 dark:bg-indigo-950/20"
                                                        : "border-slate-200 dark:border-slate-700"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleTempAssigneeToggle(member._id)}
                                                    className="rounded border-slate-350 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                />
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-750 dark:text-indigo-300 font-bold shrink-0 text-sm">
                                                    {member.username?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold truncate text-slate-850 dark:text-white">
                                                        {member.username}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                        {member.role || "Member"}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <footer className="p-6 border-t border-slate-100 dark:border-slate-700/80 flex justify-end gap-3 bg-slate-50/40 dark:bg-slate-850/40">
                            <button
                                onClick={handleCloseEditModal}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEditAssignment}
                                disabled={updating}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {updating ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignTaskPage;

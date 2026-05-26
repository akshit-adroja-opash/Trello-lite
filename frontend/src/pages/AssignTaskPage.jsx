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
    const [selectedCardId, setSelectedCardId] = useState("");
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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
            setSelectedCardId("");
            return;
        }
        const fetchBoardData = async () => {
            try {
                // Fetch workspace members instead of board members to include all invited users
                const memRes = await getMembers(selectedWorkspaceId);
                const members = memRes.data?.members || memRes.members || [];
                // Format members to only extract user object and role
                const membersList = members.map(m => ({
                    _id: m.user?._id || m.user,
                    username: m.user?.username || "Unknown",
                    email: m.user?.email || "",
                    avatar: m.user?.avatar || "",
                    role: m.role
                }));
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
                if (allCards.length > 0) {
                    setSelectedCardId(allCards[0]._id);
                } else {
                    setSelectedCardId("");
                }
            } catch (err) {
                toast.error("Failed to load board tasks or members");
            }
        };
        fetchBoardData();
    }, [selectedBoardId]);

    // Set selected assignees when card changes
    useEffect(() => {
        if (!selectedCardId || cards.length === 0) {
            setSelectedAssignees([]);
            return;
        }
        const currentCard = cards.find(c => c._id === selectedCardId);
        if (currentCard) {
            const currentAssigneeIds = (currentCard.assignees || []).map(a => a._id || a);
            setSelectedAssignees(currentAssigneeIds);
        }
    }, [selectedCardId, cards]);

    const handleAssigneeToggle = (memberId) => {
        setSelectedAssignees(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const handleSaveAssignment = async (e) => {
        e.preventDefault();
        if (!selectedCardId) return;

        setUpdating(true);
        try {
            const currentCard = cards.find(c => c._id === selectedCardId);
            const res = await updateCard(selectedCardId, {
                assignees: selectedAssignees,
                version: currentCard?.version
            });
            if (res.status === "success") {
                toast.success("Task assigned successfully");
                // Update local cards state
                setCards(prev => prev.map(c => {
                    if (c._id === selectedCardId) {
                        return {
                            ...c,
                            assignees: boardMembers.filter(m => selectedAssignees.includes(m._id)),
                            version: (c.version || 0) + 1
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to assign task");
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

    const selectedCard = cards.find(c => c._id === selectedCardId);

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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* FORM CARD */}
                        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm flex flex-col">
                            <form onSubmit={handleSaveAssignment} className="space-y-6">
                                {/* Workspace dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-on-surface dark:text-slate-300">
                                        Select Workspace
                                    </label>
                                    <select
                                        value={selectedWorkspaceId}
                                        onChange={e => setSelectedWorkspaceId(e.target.value)}
                                        className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-850 border border-outline-variant dark:border-slate-700 rounded-lg text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
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
                                    <label className="block text-sm font-semibold mb-2 text-on-surface dark:text-slate-300">
                                        Select Board
                                    </label>
                                    <select
                                        value={selectedBoardId}
                                        onChange={e => setSelectedBoardId(e.target.value)}
                                        disabled={!selectedWorkspaceId}
                                        className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-850 border border-outline-variant dark:border-slate-700 rounded-lg text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all disabled:opacity-50"
                                    >
                                        <option value="">-- Choose Board --</option>
                                        {boards.map(b => (
                                            <option key={b._id} value={b._id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Task / Card dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-on-surface dark:text-slate-300">
                                        Select Task
                                    </label>
                                    <select
                                        value={selectedCardId}
                                        onChange={e => setSelectedCardId(e.target.value)}
                                        disabled={!selectedBoardId || cards.length === 0}
                                        className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-850 border border-outline-variant dark:border-slate-700 rounded-lg text-on-surface dark:text-white outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all disabled:opacity-50"
                                    >
                                        {cards.length === 0 ? (
                                            <option value="">No tasks available in this board</option>
                                        ) : (
                                            <>
                                                <option value="">-- Choose Task --</option>
                                                {cards.map(c => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.title} ({c.columnName})
                                                    </option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Assignees checkboxes list */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-on-surface dark:text-slate-300">
                                        Assign Members
                                    </label>
                                    {boardMembers.length === 0 ? (
                                        <p className="text-sm text-slate-400 dark:text-slate-505 italic">
                                            No members found for this board
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 border border-outline-variant/50 dark:border-slate-700 rounded-lg bg-surface-container-lowest dark:bg-slate-900">
                                            {boardMembers.map(member => {
                                                const isChecked = selectedAssignees.includes(member._id);
                                                return (
                                                    <label
                                                        key={member._id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all ${isChecked
                                                                ? "border-secondary bg-secondary/5 dark:border-indigo-500 dark:bg-indigo-950/20"
                                                                : "border-outline-variant/30 dark:border-slate-800"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleAssigneeToggle(member._id)}
                                                            disabled={!selectedCardId}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                        />
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shrink-0 text-sm">
                                                            {member.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate text-on-surface dark:text-white">
                                                                {member.username}
                                                            </p>
                                                            <p className="text-xs text-on-surface-variant dark:text-slate-450 truncate">
                                                                {member.role || "Member"}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating || !selectedCardId}
                                    className="w-full bg-secondary text-on-secondary py-2.5 rounded-lg font-semibold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updating ? (
                                        <>
                                            <div className="w-5 h-5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                                            <span>Updating Assignment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                                            <span>Save Assignment</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* CARD PREVIEW / INFO SIDEBAR */}
                        <div className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="font-title-md text-title-md text-on-surface dark:text-white mb-4">
                                    Task Preview
                                </h3>

                                {selectedCard ? (
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-label-caps text-on-surface-variant dark:text-slate-400">Title</span>
                                            <p className="text-base font-bold text-on-surface dark:text-white mt-0.5">
                                                {selectedCard.title}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-label-caps text-on-surface-variant dark:text-slate-400">Column</span>
                                            <p className="text-sm font-semibold text-secondary dark:text-indigo-400 mt-0.5">
                                                {selectedCard.columnName}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-label-caps text-on-surface-variant dark:text-slate-400">Current Assignees</span>
                                            {selectedCard.assignees?.length === 0 ? (
                                                <p className="text-sm text-slate-450 italic mt-0.5">No one assigned yet</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {selectedCard.assignees?.map(a => (
                                                        <div key={a._id} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-xs font-semibold text-slate-800 dark:text-white">
                                                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                                                                {a.username?.[0]?.toUpperCase()}
                                                            </div>
                                                            <span>{a.username}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 opacity-50">
                                        <span className="material-symbols-outlined text-[48px]">assignment</span>
                                        <p className="text-sm mt-2">Select a task to view details</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 border-t border-outline-variant/30 dark:border-slate-800 pt-4">
                                <p className="text-xs text-on-surface-variant dark:text-slate-455 leading-relaxed">
                                    💡 As an Admin or Developer, you can select any task within the active board and assign multiple team members to collaborate on it.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AssignTaskPage;

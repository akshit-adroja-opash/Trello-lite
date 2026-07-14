import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMembers } from "../api/workspace.api";
import { getColumnsByBoard } from "../api/column.api";
import { getCardsByColumn, updateCard, getBoardTemplates } from "../api/card.api";
import Navbar from "../components/Layout/Navbar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import useWorkspaceStore from "../store/workspaceStore";

const AssignTaskPage = () => {

    const { workspaces, boardsByWorkspace, fetchWorkspacesAndBoards } = useWorkspaceStore();
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const boards = selectedWorkspaceId ? (boardsByWorkspace[selectedWorkspaceId] || []) : [];
    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [boardMembers, setBoardMembers] = useState([]);
    const [cards, setCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState("");

    // Form fields
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState("medium");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Fetch workspaces on mount
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchWorkspacesAndBoards();
            setLoading(false);
        };
        init();
    }, [fetchWorkspacesAndBoards]);

    useEffect(() => {
        if (workspaces.length > 0 && !selectedWorkspaceId) {
            setSelectedWorkspaceId(workspaces[0]._id);
        }
    }, [workspaces, selectedWorkspaceId]);

    // Fetch members and cards when board changes
    useEffect(() => {
        if (!selectedBoardId) {
            setBoardMembers([]);
            setCards([]);
            setSelectedCardId("");
            setSelectedAssignees([]);
            setDueDate("");
            setPriority("medium");
            return;
        }
        const fetchBoardData = async () => {
            try {
                // Fetch workspace members to include all invited users
                const memRes = await getMembers(selectedWorkspaceId);
                const members = memRes.data?.members || memRes.members || [];
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
                            columnName: col.name,
                            isTemplate: false
                        });
                    });
                }));

                // Fetch templates
                let templates = [];
                try {
                    const templateRes = await getBoardTemplates(selectedBoardId);
                    templates = templateRes.data?.templates || templateRes.templates || [];
                    templates = templates.map(t => ({
                        ...t,
                        isTemplate: true
                    }));
                } catch (tErr) {
                    console.error("Failed to fetch templates", tErr);
                }

                setCards([...templates, ...allCards]);
                setSelectedCardId("");
                setSelectedAssignees([]);
                setDueDate("");
                setPriority("medium");
            } catch {
                toast.error("Failed to load board tasks or members");
            }
        };
        fetchBoardData();
    }, [selectedBoardId, selectedWorkspaceId]);

    const handleCardChange = (cardId) => {
        setSelectedCardId(cardId);
        if (!cardId) {
            setSelectedAssignees([]);
            setDueDate("");
            setPriority("medium");
            return;
        }
        const card = cards.find(c => c._id === cardId);
        if (card) {
            setSelectedAssignees((card.assignees || []).map(a => a._id || a));
            if (card.dueDate) {
                const d = new Date(card.dueDate);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setDueDate(`${year}-${month}-${day}`);
            } else {
                setDueDate("");
            }
            setPriority(card.priority || "medium");
        }
    };

    const handleAddAssignee = (memberId) => {
        if (!selectedAssignees.includes(memberId)) {
            setSelectedAssignees(prev => [...prev, memberId]);
        }
    };

    const handleRemoveAssignee = (memberId) => {
        setSelectedAssignees(prev => prev.filter(id => id !== memberId));
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        if (!selectedCardId) {
            toast.error("Please select a card/task first");
            return;
        }

        const card = cards.find(c => c._id === selectedCardId);
        if (!card) return;

        setUpdating(true);
        try {
            const res = await updateCard(selectedCardId, {
                assignees: selectedAssignees,
                dueDate: dueDate || null,
                priority,
                version: card.version
            });
            if (res.status === "success" || res.data) {
                toast.success("Task assigned successfully");

                // Update local state
                setCards(prev => prev.map(c => {
                    if (c._id === selectedCardId) {
                        const updatedCard = res.data?.card || res.card || c;
                        return {
                            ...c,
                            assignees: boardMembers.filter(m => selectedAssignees.includes(m._id)),
                            dueDate: updatedCard.dueDate,
                            priority: updatedCard.priority,
                            version: updatedCard.version
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update assignment");
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        setSelectedCardId("");
        setSelectedAssignees([]);
        setDueDate("");
        setPriority("medium");
        setSearchTerm("");
    };

    const getRoleDetails = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return {
                    bgClass: 'bg-red-50 dark:bg-red-950/20',
                    borderClass: 'border-red-200 dark:border-red-900/40',
                    textClass: 'text-red-900 dark:text-red-400',
                    badgeTextClass: 'text-red-600 font-bold',
                    avatarBg: 'bg-red-500',
                    avatarText: 'text-white',
                    roleLabel: 'Admin',
                    abbr: 'A'
                };
            case 'project_manager':
            case 'pm':
                return {
                    bgClass: 'bg-purple-50 dark:bg-purple-950/20',
                    borderClass: 'border-purple-200 dark:border-purple-900/40',
                    textClass: 'text-purple-900 dark:text-purple-400',
                    badgeTextClass: 'text-purple-600 font-bold',
                    avatarBg: 'bg-purple-100 border border-purple-200 text-purple-700',
                    avatarText: 'text-purple-700',
                    roleLabel: 'Project Manager',
                    abbr: 'PM'
                };
            case 'developer':
            case 'dev':
                return {
                    bgClass: 'bg-blue-50 dark:bg-blue-950/20',
                    borderClass: 'border-blue-200 dark:border-blue-900/40',
                    textClass: 'text-blue-900 dark:text-blue-400',
                    badgeTextClass: 'text-secondary dark:text-secondary-fixed font-bold',
                    avatarBg: 'bg-secondary/10 border border-secondary/20 text-secondary',
                    avatarText: 'text-secondary',
                    roleLabel: 'Developer',
                    abbr: 'DEV'
                };
            case 'client':
                return {
                    bgClass: 'bg-green-50 dark:bg-green-950/20',
                    borderClass: 'border-green-200 dark:border-green-900/40',
                    textClass: 'text-green-900 dark:text-green-400',
                    badgeTextClass: 'text-green-600 font-bold',
                    avatarBg: 'bg-green-500',
                    avatarText: 'text-white',
                    roleLabel: 'Client',
                    abbr: 'C'
                };
            default:
                return {
                    bgClass: 'bg-slate-50 dark:bg-slate-800',
                    borderClass: 'border-slate-200 dark:border-slate-700',
                    textClass: 'text-slate-900 dark:text-slate-350',
                    badgeTextClass: 'text-slate-500 font-bold',
                    avatarBg: 'bg-slate-100 border border-slate-200 text-slate-700',
                    avatarText: 'text-slate-700',
                    roleLabel: role || 'Member',
                    abbr: (role || 'M').substring(0, 2).toUpperCase()
                };
        }
    };

    const selectStyle = {
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1rem center",
        backgroundSize: "1em",
    };

    // Filter available assignees based on search input
    const filteredMembers = boardMembers.filter(m =>
        !selectedAssignees.includes(m._id) &&
        m.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const activeWorkspace = workspaces.find(w => w._id === selectedWorkspaceId);

    return (
        <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
            <Navbar />

            <div className="flex flex-1 pt-16 h-full">
                <DashboardSidebar currentWorkspace={activeWorkspace} />

                <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full flex flex-col justify-start items-center">
                    <div className="w-full max-w-[1440px]">
                        {/* Header Section */}
                        <div className="mb-xl">
                            <h2 className="font-display-xl text-display-xl text-primary dark:text-white mb-xs">Command Center</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Dispatch items and assign responsibilities across workspaces.</p>
                        </div>

                    {/* Form Layout */}
                    <form onSubmit={handleAssignTask} className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl shadow-sm border border-outline-variant dark:border-slate-700 p-lg lg:p-xl space-y-xl">
                        {/* Section 1: Location */}
                        <div className="space-y-md">
                            <h3 className="font-title-md text-title-md text-on-surface dark:text-white border-b border-surface-container dark:border-slate-800 pb-sm">Task Destination</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
                                {/* Select Workspace */}
                                <div className="space-y-sm">
                                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400" htmlFor="workspace">SELECT WORKSPACE</label>
                                    <div className="relative input-focus-ring rounded-lg transition-all duration-200">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-[20px]">domain</span>
                                        <select
                                            className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg py-[10px] pl-10 pr-10 font-body-md text-body-md text-on-surface dark:text-white focus:outline-none focus:border-transparent cursor-pointer"
                                            id="workspace"
                                            value={selectedWorkspaceId}
                                            onChange={e => setSelectedWorkspaceId(e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option disabled value="">Choose a workspace</option>
                                            {workspaces.map(ws => (
                                                <option key={ws._id} value={ws._id}>{ws.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Select Board */}
                                <div className="space-y-sm">
                                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400" htmlFor="board">SELECT BOARD</label>
                                    <div className="relative input-focus-ring rounded-lg transition-all duration-200">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-[20px]">view_kanban</span>
                                        <select
                                            className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg py-[10px] pl-10 pr-10 font-body-md text-body-md text-on-surface dark:text-white focus:outline-none focus:border-transparent cursor-pointer disabled:opacity-50"
                                            id="board"
                                            value={selectedBoardId}
                                            onChange={e => setSelectedBoardId(e.target.value)}
                                            disabled={!selectedWorkspaceId}
                                            style={selectStyle}
                                        >
                                            <option value="">Choose a board</option>
                                            {boards.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Select Task */}
                                <div className="space-y-sm md:col-span-2 xl:col-span-1">
                                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400" htmlFor="task">SELECT CARD/TASK</label>
                                    <div className="relative input-focus-ring rounded-lg transition-all duration-200">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-[20px]">task</span>
                                        <select
                                            className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg py-[10px] pl-10 pr-10 font-body-md text-body-md text-on-surface dark:text-white focus:outline-none focus:border-transparent cursor-pointer disabled:opacity-50"
                                            id="task"
                                            value={selectedCardId}
                                            onChange={e => handleCardChange(e.target.value)}
                                            disabled={!selectedBoardId}
                                            style={selectStyle}
                                        >
                                            <option value="">Choose a template or enter task name...</option>
                                            {cards.map(card => (
                                                <option key={card._id} value={card._id}>
                                                    {card.isTemplate ? `[Template] ${card.title}` : card.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Assignment & Details */}
                        <div className="space-y-md pt-md">
                            <h3 className="font-title-md text-title-md text-on-surface dark:text-white border-b border-surface-container dark:border-slate-800 pb-sm">Assignment Details</h3>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
                                {/* Assignees (Simulated Multi-select) */}
                                <div className="space-y-sm">
                                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">ASSIGNEES</label>
                                    <div className="bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg p-sm input-focus-ring min-h-[160px] flex flex-col">
                                        {/* Search input */}
                                        <div className="relative mb-sm">
                                            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-[18px]">search</span>
                                            <input
                                                className="w-full bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded py-1 pl-8 pr-2 text-sm focus:outline-none dark:text-white"
                                                placeholder="Search team members..."
                                                type="text"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        {/* Selected Chips Area */}
                                        <div className="flex flex-wrap gap-xs mb-sm">
                                            {selectedAssignees.length === 0 ? (
                                                <span className="text-xs text-on-surface-variant dark:text-slate-500 italic p-1">No assignees selected yet.</span>
                                            ) : (
                                                selectedAssignees.map(id => {
                                                    const member = boardMembers.find(m => m._id === id);
                                                    if (!member) return null;
                                                    const roleDetails = getRoleDetails(member.role);
                                                    return (
                                                        <div key={id} className={`inline-flex items-center gap-xs border rounded-full px-2 py-1 ${roleDetails.bgClass} ${roleDetails.borderClass}`}>
                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${roleDetails.avatarBg} ${roleDetails.avatarText}`}>
                                                                {roleDetails.abbr}
                                                            </div>
                                                            <span className={`text-xs font-medium ${roleDetails.textClass}`}>{member.username}</span>
                                                            <button
                                                                className={`hover:opacity-100 ml-1 transition-opacity ${roleDetails.textClass} opacity-60`}
                                                                type="button"
                                                                onClick={() => handleRemoveAssignee(id)}
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {/* List of options */}
                                        <div className="flex-1 overflow-y-auto max-h-[140px] space-y-xs pt-xs border-t border-surface-container dark:border-slate-850">
                                            {filteredMembers.length === 0 ? (
                                                <div className="text-center text-xs text-on-surface-variant dark:text-slate-500 py-4">
                                                    {!selectedBoardId ? "Choose a board first to see members" : "No other members available"}
                                                </div>
                                            ) : (
                                                filteredMembers.map(member => {
                                                    const roleDetails = getRoleDetails(member.role);
                                                    return (
                                                        <div
                                                            key={member._id}
                                                            onClick={() => handleAddAssignee(member._id)}
                                                            className="flex items-center justify-between p-xs hover:bg-surface-container dark:hover:bg-slate-850 rounded cursor-pointer transition-colors"
                                                        >
                                                            <div className="flex items-center gap-sm">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${roleDetails.avatarBg} ${roleDetails.avatarText}`}>
                                                                    {roleDetails.abbr}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm text-on-surface dark:text-white">{member.username}</span>
                                                                    <span className={`text-[10px] capitalize font-bold ${roleDetails.badgeTextClass}`}>{roleDetails.roleLabel}</span>
                                                                </div>
                                                            </div>
                                                            <span className="material-symbols-outlined text-outline dark:text-slate-500 text-[16px]">add</span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">Roles: <span className="text-red-600 dark:text-red-400 font-bold">Admin</span>, <span className="text-purple-600 dark:text-purple-400 font-bold">PM</span>, <span className="text-secondary dark:text-secondary-fixed font-bold">Developer</span>, <span className="text-green-600 dark:text-green-400 font-bold">Client</span></p>
                                </div>

                                {/* Date & Priority */}
                                <div className="space-y-lg">
                                    {/* Date Picker */}
                                    <div className="space-y-sm">
                                        <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400" htmlFor="due-date">DUE DATE</label>
                                        <div className="relative input-focus-ring rounded-lg transition-all duration-200">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-[20px]">calendar_today</span>
                                            <input
                                                className="w-full bg-surface dark:bg-slate-900 border border-outline-variant dark:border-slate-700 rounded-lg py-[10px] pl-10 pr-3 font-body-md text-body-md text-on-surface dark:text-white focus:outline-none focus:border-transparent cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                                                id="due-date"
                                                type="date"
                                                value={dueDate}
                                                onChange={e => setDueDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {/* Priority Level */}
                                    <div className="space-y-sm">
                                        <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">PRIORITY LEVEL</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                                            <label className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    name="priority"
                                                    type="radio"
                                                    value="low"
                                                    checked={priority === "low"}
                                                    onChange={e => setPriority(e.target.value)}
                                                />
                                                <div className="flex items-center justify-center gap-1 py-2 px-2 border border-outline-variant dark:border-slate-700 rounded-lg peer-checked:bg-surface-container-high dark:peer-checked:bg-slate-800 peer-checked:border-on-surface-variant dark:peer-checked:border-slate-400 transition-colors hover:bg-surface dark:hover:bg-slate-850 text-xs sm:text-sm font-medium text-on-surface dark:text-slate-300 whitespace-nowrap">
                                                    <span className="material-symbols-outlined text-[16px] text-outline dark:text-slate-500 shrink-0">arrow_downward</span>
                                                    <span>Low</span>
                                                </div>
                                            </label>
                                            <label className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    name="priority"
                                                    type="radio"
                                                    value="medium"
                                                    checked={priority === "medium"}
                                                    onChange={e => setPriority(e.target.value)}
                                                />
                                                <div className="flex items-center justify-center gap-1 py-2 px-2 border border-outline-variant dark:border-slate-700 rounded-lg peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950/20 peer-checked:border-secondary dark:peer-checked:border-indigo-500 peer-checked:text-secondary dark:peer-checked:text-indigo-400 transition-colors hover:bg-surface dark:hover:bg-slate-850 text-xs sm:text-sm font-medium text-on-surface dark:text-slate-300 whitespace-nowrap">
                                                    <span className="material-symbols-outlined text-[16px] text-secondary dark:text-indigo-550 shrink-0">remove</span>
                                                    <span>Medium</span>
                                                </div>
                                            </label>
                                            <label className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    name="priority"
                                                    type="radio"
                                                    value="high"
                                                    checked={priority === "high"}
                                                    onChange={e => setPriority(e.target.value)}
                                                />
                                                <div className="flex items-center justify-center gap-1 py-2 px-2 border border-outline-variant dark:border-slate-700 rounded-lg peer-checked:bg-orange-50 dark:peer-checked:bg-orange-950/20 peer-checked:border-orange-500 dark:peer-checked:border-orange-600 peer-checked:text-orange-700 dark:peer-checked:text-orange-400 transition-colors hover:bg-surface dark:hover:bg-slate-850 text-xs sm:text-sm font-medium text-on-surface dark:text-slate-300 whitespace-nowrap">
                                                    <span className="material-symbols-outlined text-[16px] text-orange-500 shrink-0">arrow_upward</span>
                                                    <span>High</span>
                                                </div>
                                            </label>
                                            <label className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    name="priority"
                                                    type="radio"
                                                    value="urgent"
                                                    checked={priority === "urgent" || priority === "critical"}
                                                    onChange={e => setPriority(e.target.value)}
                                                />
                                                <div className="flex items-center justify-center gap-1 py-2 px-2 border border-outline-variant dark:border-slate-700 rounded-lg peer-checked:bg-red-50 dark:peer-checked:bg-red-950/20 peer-checked:border-error dark:peer-checked:border-red-600 peer-checked:text-error dark:peer-checked:text-red-400 transition-colors hover:bg-surface dark:hover:bg-slate-850 text-xs sm:text-sm font-medium text-on-surface dark:text-slate-300 whitespace-nowrap">
                                                    <span className="material-symbols-outlined text-[16px] text-error dark:text-red-500 shrink-0">warning</span>
                                                    <span>Critical</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="pt-lg border-t border-outline-variant/50 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-md">
                            <button
                                className="px-lg py-sm font-body-md text-body-md font-medium text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-outline-variant dark:hover:border-slate-750 text-center"
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className={`group relative px-xl py-sm bg-secondary hover:bg-secondary-container text-on-secondary font-body-md text-body-md font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-secondary flex items-center justify-center gap-sm overflow-hidden capitalize tracking-wider ${updating ? 'is-loading' : ''}`}
                                style={{ backgroundColor: "#0058be" }}
                                type="submit"
                                disabled={updating}
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                                <span>Assign Task</span>
                                {updating && (
                                    <div className="absolute inset-0 bg-secondary flex items-center justify-center transition-opacity">
                                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AssignTaskPage;

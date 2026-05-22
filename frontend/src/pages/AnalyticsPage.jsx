import { useEffect, useState } from "react";
import { getWorkspaceAnalytics } from "../api/analytics.api";
import { getWorkspaces } from "../api/workspace.api";
import Navbar from "../components/Layout/Navbar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import toast from "react-hot-toast";

import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

import CountUp from "react-countup";
import { motion } from "framer-motion";

const CountUpComponent = typeof CountUp === 'function' ? CountUp : (CountUp.default || CountUp);

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981"];

const AnalyticsPage = () => {
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);

    // Load workspaces on mount
    useEffect(() => {
        const loadWorkspaces = async () => {
            try {
                const res = await getWorkspaces();
                const wsList = res.data?.workspaces || [];
                setWorkspaces(wsList);
                if (wsList.length > 0) {
                    setSelectedWorkspaceId(wsList[0]._id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                toast.error("Failed to load workspaces");
                setLoading(false);
            }
        };
        loadWorkspaces();
    }, []);

    // Load analytics when selected workspace changes
    useEffect(() => {
        if (!selectedWorkspaceId) return;

        const fetchAnalytics = async () => {
            setLoadingData(true);
            try {
                const data = await getWorkspaceAnalytics(selectedWorkspaceId);
                if (data && data.success) {
                    setAnalytics(data.analytics);
                } else {
                    setAnalytics(null);
                }
            } catch (error) {
                console.error(error);
                setAnalytics(null);
            } finally {
                setLoadingData(false);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedWorkspaceId]);

    const activeWorkspace = workspaces.find(w => w._id === selectedWorkspaceId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
                <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse absolute" />
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
            {/* Header */}
            <Navbar />

            {/* Main Container */}
            <div className="flex flex-1 pt-16 h-full">
                {/* Left Fixed Sidebar */}
                <DashboardSidebar currentWorkspace={activeWorkspace} />

                {/* Content Canvas */}
                <main className="flex-1 ml-0 md:ml-sidebar-width p-6 md:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
                    
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-850 dark:text-white tracking-tight">
                                Workspace Analytics
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                Real-time productivity insights and performance trends
                            </p>
                        </div>

                        {workspaces.length > 0 && (
                            <div className="flex items-center gap-2.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace:</label>
                                <select
                                    value={selectedWorkspaceId}
                                    onChange={e => setSelectedWorkspaceId(e.target.value)}
                                    className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer shadow-sm"
                                >
                                    {workspaces.map(ws => (
                                        <option key={ws._id} value={ws._id}>
                                            {ws.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {workspaces.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-650 text-5xl mb-4">
                                bar_chart
                            </span>
                            <p className="text-slate-800 dark:text-white font-bold text-lg mb-1">No workspaces found</p>
                            <p className="text-slate-400 text-sm">Create a workspace to view performance analytics.</p>
                        </div>
                    ) : loadingData || !analytics ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin mb-3" />
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Fetching workspace statistics...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* KPI CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <KpiCard
                                    title="Total Cards"
                                    value={analytics.kpis?.totalCards || 0}
                                    icon="analytics"
                                    colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                                />
                                <KpiCard
                                    title="Completed Tasks"
                                    value={analytics.kpis?.completedTasks || 0}
                                    icon="check_circle"
                                    colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                                />
                                <KpiCard
                                    title="Completion Rate"
                                    value={analytics.kpis?.completedRatio || 0}
                                    suffix="%"
                                    icon="trending_up"
                                    colorClass="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
                                />
                                <KpiCard
                                    title="Overdue Tasks"
                                    value={analytics.kpis?.overdueTasks || 0}
                                    icon="alarm"
                                    colorClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                                />
                            </div>

                            {/* CHARTS GRID */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                
                                {/* WORKLOAD */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700/50 shadow-sm flex flex-col">
                                    <div className="mb-6">
                                        <h2 className="text-base font-bold text-slate-800 dark:text-white">
                                            Workload Distribution
                                        </h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            Tasks assigned to each workspace contributor
                                        </p>
                                    </div>
                                    <div className="flex-1 min-h-[300px]">
                                        {analytics.workloadStats?.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold py-20">
                                                No tasks assigned to workspace members yet.
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={analytics.workloadStats}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                                                    <XAxis dataKey="username" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                    <Bar
                                                        dataKey="cardCount"
                                                        fill="#6366F1"
                                                        radius={[6, 6, 0, 0]}
                                                        maxBarSize={45}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* STATUS DISTRIBUTION */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700/50 shadow-sm flex flex-col">
                                    <div className="mb-6">
                                        <h2 className="text-base font-bold text-slate-800 dark:text-white">
                                            Task Status Distribution
                                        </h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            Aggregated summary of cards across workflow lists
                                        </p>
                                    </div>
                                    <div className="flex-1 min-h-[300px] flex items-center justify-center">
                                        {analytics.statusDistribution?.length === 0 || analytics.statusDistribution?.every(d => d.cardCount === 0) ? (
                                            <div className="text-xs text-slate-400 font-semibold py-20">
                                                No tasks found in columns.
                                            </div>
                                        ) : (
                                            <div className="w-full flex flex-col md:flex-row items-center justify-around gap-4">
                                                <div className="w-48 h-48">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={analytics.statusDistribution}
                                                                dataKey="cardCount"
                                                                nameKey="title"
                                                                outerRadius={80}
                                                                innerRadius={50}
                                                                paddingAngle={3}
                                                            >
                                                                {analytics.statusDistribution.map((entry, index) => (
                                                                    <Cell
                                                                        key={index}
                                                                        fill={COLORS[index % COLORS.length]}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                <div className="flex flex-col gap-2 shrink-0">
                                                    {analytics.statusDistribution.map((entry, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                            <span className="text-xs font-semibold text-slate-650 dark:text-slate-300">{entry.title}:</span>
                                                            <span className="text-xs font-bold text-slate-800 dark:text-white">{entry.cardCount} cards</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PRODUCTIVITY TIMELINE */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700/50 shadow-sm xl:col-span-2 flex flex-col">
                                    <div className="mb-6">
                                        <h2 className="text-base font-bold text-slate-800 dark:text-white">
                                            Productivity Timeline
                                        </h2>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            Completed task output trends observed over the last 30 days
                                        </p>
                                    </div>
                                    <div className="flex-1 min-h-[300px]">
                                        {analytics.productivityTimeline?.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold py-24">
                                                No tasks marked completed in the last 30 days.
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={320}>
                                                <LineChart data={analytics.productivityTimeline}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                                                    <XAxis dataKey="_id" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="completed"
                                                        stroke="#8B5CF6"
                                                        strokeWidth={3}
                                                        dot={{ r: 4, strokeWidth: 1 }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, suffix = "", icon, colorClass }) => {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            className="bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm flex items-center justify-between"
        >
            <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    {title}
                </p>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
                    <CountUpComponent end={value} duration={1.5} />
                    {suffix}
                </h2>
            </div>
            {icon && (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <span className="material-symbols-outlined text-[24px]">
                        {icon}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default AnalyticsPage;
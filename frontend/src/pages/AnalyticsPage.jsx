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

// Color codes corresponding to status types in the dashboard (indigo, purple, pink, emerald)
const STATUS_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#22c55e"];

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
            <div className="flex items-center justify-center h-screen bg-surface dark:bg-slate-900 transition-colors duration-200">
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
                <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
                    
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
                        <div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1">
                                Workspace Analytics
                            </h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">
                                Real-time productivity insights and performance trends
                            </p>
                        </div>

                        {workspaces.length > 0 && (
                            <div className="flex items-center gap-2.5">
                                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400">WORKSPACE:</span>
                                <div className="relative">
                                    <select
                                        value={selectedWorkspaceId}
                                        onChange={e => setSelectedWorkspaceId(e.target.value)}
                                        className="appearance-none flex items-center gap-2 pl-3 pr-10 py-1.5 bg-white dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg font-body-sm text-on-surface dark:text-white cursor-pointer shadow-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                                    >
                                        {workspaces.map(ws => (
                                            <option key={ws._id} value={ws._id}>
                                                {ws.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant dark:text-slate-400 flex items-center">
                                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {workspaces.length === 0 ? (
                        <div className="text-center py-20 bg-surface-container-lowest dark:bg-slate-800/40 rounded-2xl border border-outline-variant/30 shadow-sm max-w-xl mx-auto">
                            <span className="material-symbols-outlined text-slate-350 dark:text-slate-600 text-[48px] mb-4">
                                bar_chart
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No workspaces found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Create a workspace to view performance analytics.</p>
                        </div>
                    ) : loadingData || !analytics ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin mb-3" />
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium animate-pulse">Fetching workspace statistics...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            
                            {/* SUMMARY KPI CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard
                                    title="Total Cards"
                                    value={analytics.kpis?.totalCards || 0}
                                    icon="bar_chart_4_bars"
                                    colorClass="bg-secondary-fixed dark:bg-indigo-950/40"
                                    iconColorClass="text-secondary dark:text-indigo-400"
                                />
                                <KpiCard
                                    title="Completed Tasks"
                                    value={analytics.kpis?.completedTasks || 0}
                                    icon="check_circle"
                                    colorClass="bg-tertiary-fixed dark:bg-emerald-950/40"
                                    iconColorClass="text-on-tertiary-container dark:text-emerald-450"
                                />
                                <KpiCard
                                    title="Completion Rate"
                                    value={analytics.kpis?.completedRatio || 0}
                                    suffix="%"
                                    icon="trending_up"
                                    colorClass="bg-primary-fixed dark:bg-purple-950/40"
                                    iconColorClass="text-primary-container dark:text-purple-400"
                                />
                                <KpiCard
                                    title="Overdue Tasks"
                                    value={analytics.kpis?.overdueTasks || 0}
                                    icon="timer"
                                    colorClass="bg-error-container dark:bg-rose-950/40"
                                    iconColorClass="text-error dark:text-rose-455"
                                />
                            </div>

                            {/* CHARTS GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* WORKLOAD */}
                                <div className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm flex flex-col min-h-[400px]">
                                    <div className="mb-6">
                                        <h3 className="font-title-md text-title-md text-on-surface dark:text-white">
                                            Workload Distribution
                                        </h3>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-0.5">
                                            Tasks assigned to each workspace contributor
                                        </p>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-h-[280px]">
                                        {analytics.workloadStats?.length === 0 ? (
                                            <div className="text-center py-10 opacity-60">
                                                <span className="material-symbols-outlined text-[48px] text-slate-350 dark:text-slate-600 mb-2">group</span>
                                                <p className="font-body-md text-on-surface-variant dark:text-slate-400">No tasks assigned to workspace members yet.</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={analytics.workloadStats}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                                                    <XAxis dataKey="username" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <Tooltip cursor={{ fill: 'rgba(0, 88, 190, 0.04)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                    <Bar
                                                        dataKey="cardCount"
                                                        fill="#0058be"
                                                        radius={[4, 4, 0, 0]}
                                                        maxBarSize={40}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* STATUS DISTRIBUTION */}
                                <div className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm flex flex-col min-h-[400px]">
                                    <div className="mb-6">
                                        <h3 className="font-title-md text-title-md text-on-surface dark:text-white">
                                            Task Status Distribution
                                        </h3>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-0.5">
                                            Aggregated summary of cards across workflow lists
                                        </p>
                                    </div>
                                    <div className="flex-grow flex flex-col sm:flex-row items-center justify-around gap-6 min-h-[280px]">
                                        {analytics.statusDistribution?.length === 0 || analytics.statusDistribution?.every(d => d.cardCount === 0) ? (
                                            <div className="text-center py-10 opacity-60">
                                                <span className="material-symbols-outlined text-[48px] text-slate-350 dark:text-slate-600 mb-2">donut_large</span>
                                                <p className="font-body-sm text-on-surface-variant dark:text-slate-400">No tasks found in columns.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-44 h-44 shrink-0">
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
                                                                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                <div className="flex flex-col gap-3 shrink-0">
                                                    {analytics.statusDistribution.map((entry, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[idx % STATUS_COLORS.length] }} />
                                                            <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                                                                {entry.title}: <strong className="text-on-surface dark:text-white font-bold">{entry.cardCount} cards</strong>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* PRODUCTIVITY TIMELINE */}
                                <div className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm lg:col-span-2 flex flex-col">
                                    <div className="mb-6">
                                        <h3 className="font-title-md text-title-md text-on-surface dark:text-white">
                                            Productivity Timeline
                                        </h3>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-0.5">
                                            Completed task output trends observed over the last 30 days
                                        </p>
                                    </div>
                                    <div className="flex-grow min-h-[300px]">
                                        {analytics.productivityTimeline?.length === 0 ? (
                                            <div className="text-center py-20 opacity-60">
                                                <span className="material-symbols-outlined text-[48px] text-slate-350 dark:text-slate-600 mb-2">timeline</span>
                                                <p className="font-body-md text-on-surface-variant dark:text-slate-400">No tasks marked completed in the last 30 days.</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={analytics.productivityTimeline}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                                                    <XAxis dataKey="_id" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="completed"
                                                        stroke="#0058be"
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

const KpiCard = ({ title, value, suffix = "", icon, colorClass, iconColorClass }) => {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            className="glass-card p-6 rounded-xl border border-outline-variant/50 dark:border-slate-700 bg-white/95 dark:bg-slate-800/90 backdrop-blur shadow-sm flex justify-between items-start transition-all duration-200"
        >
            <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-405 uppercase tracking-wider">
                    {title}
                </span>
                <p className="font-display-xl text-display-xl mt-1 text-on-surface dark:text-white">
                    <CountUpComponent end={value} duration={1.5} />
                    {suffix}
                </p>
            </div>
            {icon && (
                <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <span className={`material-symbols-outlined ${iconColorClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {icon}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default AnalyticsPage;
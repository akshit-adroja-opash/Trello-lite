import { useEffect, useState } from "react";
import { getWorkspaceAnalytics } from "../api/analytics.api";
import Navbar from "../components/Layout/Navbar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import toast from "react-hot-toast";
import useThemeStore from "../store/themeStore";
import CountUp from "react-countup";
import CustomSelect from "../components/common/CustomSelect";
import useWorkspaceStore from "../store/workspaceStore";

const CountUpComponent = typeof CountUp === 'function' ? CountUp : (CountUp.default || CountUp);

const AnalyticsPage = () => {
    const { workspaces, fetchWorkspacesAndBoards } = useWorkspaceStore();
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const darkMode = useThemeStore(s => s.darkMode);

    // Load workspaces on mount
    useEffect(() => {
        const init = async () => {
            await fetchWorkspacesAndBoards();
            const wsList = useWorkspaceStore.getState().workspaces;
            if (wsList.length > 0 && !selectedWorkspaceId) {
                setSelectedWorkspaceId(wsList[0]._id);
            } else if (wsList.length === 0) {
                setLoading(false);
            }
        };
        init();
    }, [fetchWorkspacesAndBoards, selectedWorkspaceId]);

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
                    <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    // Helper data mapping for metrics
    const kpis = analytics?.kpis || {};
    const totalCards = kpis.totalCards || 0;
    const completedRatio = kpis.completedRatio || 0;
    const activeBlockers = kpis.activeBlockers || 0;
    const avgLeadTime = kpis.avgLeadTime || 0;

    // 1. Workload Distribution
    const workloadList = analytics?.workloadStats || [];

    // 2. Efficiency Radial Meter Calculations
    const efficiencyPercent = completedRatio;
    const circumference = 251.2;
    const dashOffset = circumference - (efficiencyPercent / 100) * circumference;
    const efficiencyLabel = efficiencyPercent >= 80 ? "EXCELLENT" : efficiencyPercent >= 60 ? "GOOD" : "NEEDS FOCUS";

    // 3. Pipeline counts
    const backlogCount = analytics?.statusDistribution?.find(d => /backlog|todo|to do/i.test(d.title))?.cardCount || 0;
    const progressCount = analytics?.statusDistribution?.find(d => /progress|doing|active/i.test(d.title))?.cardCount || 0;
    const reviewCount = analytics?.statusDistribution?.find(d => /review|test/i.test(d.title))?.cardCount || 0;
    const blockedCountVal = activeBlockers || 0;
    const completedCount = analytics?.statusDistribution?.find(d => /done|complete/i.test(d.title))?.cardCount || 0;
    const maxCount = Math.max(backlogCount, progressCount, reviewCount, blockedCountVal, completedCount, 1);

    // 4. Role Performance
    const rolePerformanceList = analytics?.rolePerformance || [];

    const getRoleName = (role) => {
        if (role === "admin") return "Admin";
        if (role === "project_manager") return "Project Manager";
        if (role === "developer") return "Developer";
        if (role === "client") return "Client";
        return role;
    };

    const getRoleBgColor = (role) => {
        if (role === "admin") return "bg-admin-role";
        if (role === "project_manager") return "bg-pm-role";
        if (role === "developer") return "bg-dev-role";
        return "bg-client-role";
    };

    return (
        <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
            <Navbar />

            <div className="flex flex-1 pt-16 h-full">
                <DashboardSidebar currentWorkspace={activeWorkspace} />

                <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full flex flex-col justify-start items-center animate-in fade-in duration-300">
                    <div className="w-full max-w-[1440px]">
                    
                    {/* Page Header & Controls */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="font-display-xl text-[48px] font-bold text-on-background dark:text-white leading-[56px] tracking-tight mb-1">
                                Analytics Overview
                            </h1>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">
                                Deep-dive tracking and performance metrics for your organization.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {workspaces.length > 0 && (
                                <CustomSelect
                                    value={selectedWorkspaceId}
                                    onChange={setSelectedWorkspaceId}
                                    options={workspaces.map(ws => ({ value: ws._id, label: ws.name }))}
                                    icon="workspaces"
                                    placeholder="Select Workspace"
                                />
                            )}
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 text-body-sm font-medium text-on-surface dark:text-white rounded-lg hover:border-secondary hover:ring-1 hover:ring-secondary/50 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-slate-400">calendar_month</span>
                                Last 30 Days
                            </button>
                        </div>
                    </div>

                    {workspaces.length === 0 ? (
                        <div className="text-center py-20 bg-surface-container-lowest dark:bg-slate-800/40 rounded-xl border border-outline-variant/30 dark:border-slate-700 shadow-sm max-w-xl mx-auto">
                            <span className="material-symbols-outlined text-slate-350 dark:text-slate-600 text-[48px] mb-4">
                                bar_chart
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No workspaces found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Create a workspace to view performance analytics.</p>
                        </div>
                    ) : loadingData || !analytics ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-secondary animate-spin mb-3" />
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium animate-pulse">Fetching workspace statistics...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* KPI Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard
                                    title="Total Tasks"
                                    value={totalCards}
                                    icon="task"
                                    iconColor="text-secondary dark:text-blue-400"
                                    trendValue={kpis.trends?.totalCards !== undefined && kpis.trends.totalCards !== 0 ? `${Math.abs(kpis.trends.totalCards)}%` : null}
                                    trendType={kpis.trends?.totalCards >= 0 ? "up" : "down"}
                                />
                                <KpiCard
                                    title="Completion Rate"
                                    value={completedRatio}
                                    suffix="%"
                                    icon="check_circle"
                                    iconColor="text-status-completed"
                                    trendValue={kpis.trends?.completionRate !== undefined && kpis.trends.completionRate !== 0 ? `${Math.abs(kpis.trends.completionRate)}%` : null}
                                    trendType={kpis.trends?.completionRate >= 0 ? "up" : "down"}
                                />
                                <KpiCard
                                    title="Active Blockers"
                                    value={blockedCountVal}
                                    icon="block"
                                    iconColor="text-status-blocked"
                                    trendValue={kpis.trends?.activeBlockers !== undefined && kpis.trends.activeBlockers !== 0 ? `${Math.abs(kpis.trends.activeBlockers)}` : null}
                                    trendType={kpis.trends?.activeBlockers >= 0 ? "up" : "down"}
                                />
                                <KpiCard
                                    title="Avg Lead Time"
                                    value={avgLeadTime}
                                    suffix="d"
                                    icon="timer"
                                    iconColor="text-pm-role"
                                    trendValue={kpis.trends?.avgLeadTime !== undefined && kpis.trends.avgLeadTime !== 0 ? `${Math.abs(kpis.trends.avgLeadTime)}d` : null}
                                    trendType={kpis.trends?.avgLeadTime >= 0 ? "up" : "down"}
                                />
                            </div>

                            {/* Main Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                
                                {/* Workload Distribution (Bento Large) */}
                                <div className="lg:col-span-8 bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-lg border border-outline-variant dark:border-slate-700 shadow-soft flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-title-md text-[20px] font-bold text-on-surface dark:text-white">
                                                Workload Distribution
                                            </h3>
                                            <button className="text-on-surface-variant dark:text-slate-400 hover:text-secondary transition-colors">
                                                <span className="material-symbols-outlined">more_horiz</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {workloadList.length === 0 ? (
                                                <p className="font-body-sm text-on-surface-variant dark:text-slate-400 py-4 text-center">No workload data available.</p>
                                            ) : (
                                                workloadList.map((dev, idx) => {
                                                    const total = dev.totalCount || 1;
                                                    const completedPct = ((dev.completedCount || 0) / total) * 100;
                                                    const progressPct = ((dev.progressCount || 0) / total) * 100;
                                                    const reviewPct = ((dev.reviewCount || 0) / total) * 100;
                                                    const blockedPct = ((dev.blockedCount || 0) / total) * 100;

                                                    return (
                                                        <div key={idx} className="flex items-center gap-4">
                                                            {dev.avatar ? (
                                                                <img alt={dev.username} className="w-8 h-8 rounded-full object-cover shrink-0" src={dev.avatar} />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                                    {dev.username?.[0]?.toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="w-32 font-body-sm font-medium truncate dark:text-slate-300">
                                                                {dev.username}
                                                            </div>
                                                            <div className="flex-1 h-4 bg-surface-container dark:bg-slate-750 rounded-full overflow-hidden flex">
                                                                {completedPct > 0 && <div className="h-full bg-status-completed" style={{ width: `${completedPct}%` }} title={`Completed: ${Math.round(completedPct)}%`} />}
                                                                {progressPct > 0 && <div className="h-full bg-status-progress" style={{ width: `${progressPct}%` }} title={`In Progress: ${Math.round(progressPct)}%`} />}
                                                                {reviewPct > 0 && <div className="h-full bg-status-review" style={{ width: `${reviewPct}%` }} title={`Review: ${Math.round(reviewPct)}%`} />}
                                                                {blockedPct > 0 && <div className="h-full bg-status-blocked" style={{ width: `${blockedPct}%` }} title={`Blocked: ${Math.round(blockedPct)}%`} />}
                                                            </div>
                                                            <div className="w-12 text-right font-body-sm text-on-surface-variant dark:text-slate-400">
                                                                {Math.round(total)}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-outline-variant dark:border-slate-700 flex flex-wrap gap-4">
                                        <div className="flex items-center gap-1.5 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                                            <span className="w-3 h-3 rounded-full bg-status-completed"></span> Completed
                                        </div>
                                        <div className="flex items-center gap-1.5 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                                            <span className="w-3 h-3 rounded-full bg-status-progress"></span> In Progress
                                        </div>
                                        <div className="flex items-center gap-1.5 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                                            <span className="w-3 h-3 rounded-full bg-status-review"></span> Review
                                        </div>
                                        <div className="flex items-center gap-1.5 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                                            <span className="w-3 h-3 rounded-full bg-status-blocked"></span> Blocked
                                        </div>
                                    </div>
                                </div>

                                {/* Efficiency Meter (Radial) */}
                                <div className="lg:col-span-4 bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-lg border border-outline-variant dark:border-slate-700 shadow-soft flex flex-col items-center justify-between text-center min-h-[360px]">
                                    <div className="w-full flex justify-between items-center mb-6">
                                        <h3 className="font-title-md text-[20px] font-bold text-on-surface dark:text-white">
                                            Efficiency Score
                                        </h3>
                                        <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">info</span>
                                    </div>
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" fill="transparent" r="40" stroke={darkMode ? "#1e293b" : "#F1F5F9"} strokeWidth="8"></circle>
                                            <circle
                                                className="transition-all duration-1000 ease-out"
                                                cx="50"
                                                cy="50"
                                                fill="transparent"
                                                r="40"
                                                stroke="#0058be"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={dashOffset}
                                                strokeWidth="8"
                                            ></circle>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="font-display-xl text-[40px] font-bold text-on-surface dark:text-white">
                                                <CountUpComponent end={efficiencyPercent} duration={1.5} />
                                                <span className="text-[20px] text-on-surface-variant dark:text-slate-400">%</span>
                                            </span>
                                            <span className="font-label-caps text-[12px] font-semibold text-status-completed tracking-wider">
                                                {efficiencyLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 max-w-[200px] mt-4">
                                        Based on cycle time, throughput, and bug resolution rates over 30 days.
                                    </p>
                                </div>

                                {/* Task Status Distribution (Pipeline Chart) */}
                                <div className="lg:col-span-12 bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-lg border border-outline-variant dark:border-slate-700 shadow-soft">
                                    <h3 className="font-title-md text-[20px] font-bold text-on-surface dark:text-white mb-6">
                                        Task Pipeline Distribution
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <PipelineRow label="BACKLOG" count={backlogCount} maxCount={maxCount} colorClass="bg-status-backlog" />
                                        <PipelineRow label="IN PROGRESS" count={progressCount} maxCount={maxCount} colorClass="bg-status-progress" />
                                        <PipelineRow label="CODE REVIEW" count={reviewCount} maxCount={maxCount} colorClass="bg-status-review" />
                                        <PipelineRow label="BLOCKED" count={blockedCountVal} maxCount={maxCount} colorClass="bg-status-blocked" />
                                        <PipelineRow label="COMPLETED" count={completedCount} maxCount={maxCount} colorClass="bg-status-completed" />
                                    </div>
                                </div>

                                {/* Role Performance Summary Table */}
                                <div className="lg:col-span-12 bg-surface-container-lowest dark:bg-slate-800 rounded-lg border border-outline-variant dark:border-slate-700 shadow-soft overflow-hidden mt-4">
                                    <div className="p-6 border-b border-outline-variant dark:border-slate-700">
                                        <h3 className="font-title-md text-[20px] font-bold text-on-surface dark:text-white">
                                            Role Performance Summary
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-surface-container-low dark:bg-slate-900/60 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 border-b border-outline-variant dark:border-slate-700 uppercase tracking-wider">
                                                    <th className="p-4 font-semibold">Role</th>
                                                    <th className="p-4 font-semibold">Active Members</th>
                                                    <th className="p-4 font-semibold">Tasks Assigned</th>
                                                    <th className="p-4 font-semibold">Avg Completion</th>
                                                    <th className="p-4 font-semibold text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-body-sm text-on-surface dark:text-slate-350">
                                                {rolePerformanceList.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-outline-variant/30 dark:border-slate-700/50 hover:bg-surface-container-low/30 dark:hover:bg-slate-900/30 transition-colors h-[56px]">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-3 h-3 rounded-full ${getRoleBgColor(row.role)}`}></span>
                                                                <span className="font-semibold text-on-surface dark:text-white">
                                                                    {getRoleName(row.role)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">{row.activeMembers}</td>
                                                        <td className="p-4">{row.tasksAssigned}</td>
                                                        <td className="p-4">{row.avgCompletion}</td>
                                                        <td className="p-4 text-right">
                                                            <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wide uppercase ${row.status === "Optimal" ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 dark:bg-red-500/20'}`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Sub-components
const KpiCard = ({ title, value, suffix = "", icon, iconColor, trendValue, trendType }) => {
    return (
        <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-lg border border-outline-variant dark:border-slate-700 shadow-soft">
            <div className="flex justify-between items-start mb-4">
                <p className="font-label-caps text-[12px] font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                    {title}
                </p>
                <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <h3 className="font-headline-lg text-[32px] font-bold text-on-surface dark:text-white">
                    {typeof value === 'number' ? <CountUpComponent end={value} decimals={suffix === 'd' || title.includes('Rate') ? 1 : 0} duration={1.5} /> : value}
                    {suffix}
                </h3>
                {trendValue && (
                    <span className={`font-body-sm text-[12px] font-semibold flex items-center ${trendType === 'up' ? 'text-status-completed' : 'text-status-blocked'}`}>
                        <span className="material-symbols-outlined text-[16px]">{trendType === 'up' ? 'trending_up' : 'trending_down'}</span>
                        <span className="ml-0.5">{trendValue}</span>
                    </span>
                )}
            </div>
        </div>
    );
};

const PipelineRow = ({ label, count, maxCount, colorClass }) => {
    const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
        <div className="flex items-center gap-4">
            <div className="w-32 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 text-right tracking-wider">
                {label}
            </div>
            <div className="flex-1 h-6 bg-surface-container dark:bg-slate-700 rounded overflow-hidden">
                <div
                    className={`h-full ${colorClass} rounded transition-all duration-1000 ease-out`}
                    style={{ width: `${widthPct}%` }}
                ></div>
            </div>
            <div className="w-12 font-body-sm text-on-surface dark:text-white font-semibold">
                {count}
            </div>
        </div>
    );
};

export default AnalyticsPage;
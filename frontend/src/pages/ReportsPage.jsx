import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authstore";
import { getSingleBoard } from "../api/board.api";
import { generateClientReport, generateFullReport, shareReportLink, getRecentReports } from "../api/reportService";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import useWorkspaceStore from "../store/workspaceStore";
import Navbar from "../components/Layout/Navbar";
import {SERVER_URL} from "../api/axios";
import CustomSelect from "../components/common/CustomSelect";

const ReportsPage = () => {
  const backendBase = SERVER_URL;
  const { boardId } = useParams();
  const user = useAuthStore((s) => s.user);

  // Role-based report access
  const canFullReport = user?.role === 'admin' || user?.role === 'project_manager';
  const canClientReport = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'client';

  const [selectedBoard, setSelectedBoard] = useState(null);
  const { workspaces, boardsByWorkspace, fetchWorkspacesAndBoards } = useWorkspaceStore();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [recentReports, setRecentReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Interactive UI configurations
  const [devLogsChecked, setDevLogsChecked] = useState(true);
  const [milestonesChecked, setMilestonesChecked] = useState(true);
  const [trackingChecked, setTrackingChecked] = useState(false);

  // Load workspaces, boards, and selected board states on mount
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await fetchWorkspacesAndBoards();
        const wsList = useWorkspaceStore.getState().workspaces;
        const boardMap = useWorkspaceStore.getState().boardsByWorkspace;

        let initialWorkspaceId = "";
        let initialBoardId = "";

        if (boardId) {
          const boardRes = await getSingleBoard(boardId);
          const boardDoc = boardRes.data?.board;
          if (boardDoc) {
            setSelectedBoard(boardDoc);
            initialBoardId = boardDoc._id;
            initialWorkspaceId = boardDoc.workspace || boardDoc.workspaceId || "";
            if (!initialWorkspaceId) {
              for (const wsId of Object.keys(boardMap)) {
                if (boardMap[wsId].some(b => b._id === boardId)) {
                  initialWorkspaceId = wsId;
                  break;
                }
              }
            }
          }
        }

        if (!initialWorkspaceId && wsList.length > 0) {
          initialWorkspaceId = wsList[0]._id;
          const boards = boardMap[initialWorkspaceId] || [];
          if (boards.length > 0) {
            initialBoardId = boards[0]._id;
            setSelectedBoard(boards[0]);
          }
        }

        setSelectedWorkspaceId(initialWorkspaceId);
        setSelectedBoardId(initialBoardId);

      } catch {
        toast.error("Failed to load workspace data");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [boardId, fetchWorkspacesAndBoards]);

  // Fetch recent reports whenever selected board changes
  useEffect(() => {
    if (!selectedBoardId) return;

    const fetchRecent = async () => {
      try {
        const res = await getRecentReports(selectedBoardId);
        if (res.success) {
          setRecentReports(res.reports);
        }
      } catch (err) {
        console.error("Failed to fetch recent reports", err);
      }
    };
    fetchRecent();
  }, [selectedBoardId]);

  const handleWorkspaceChange = (wsId) => {
    setSelectedWorkspaceId(wsId);
    const boards = boardsByWorkspace[wsId] || [];
    if (boards.length > 0) {
      setSelectedBoardId(boards[0]._id);
      setSelectedBoard(boards[0]);
    } else {
      setSelectedBoardId("");
      setSelectedBoard(null);
      setRecentReports([]);
    }
  };

  const handleBoardChange = (bId) => {
    setSelectedBoardId(bId);
    const boards = boardsByWorkspace[selectedWorkspaceId] || [];
    const boardDoc = boards.find(b => b._id === bId);
    setSelectedBoard(boardDoc || null);
  };

  const handleFullReport = async () => {
    if (!selectedBoardId) return;

    setGenerating(true);
    try {
      const data = await generateFullReport(selectedBoardId);
      toast.success("Full report generated successfully");
      const normalizedPath = data.report.pdfUrl.replace(/\\/g, "/");
      window.open(`${backendBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`, "_blank");
      
      // Refresh reports list
      const res = await getRecentReports(selectedBoardId);
      if (res.success) {
        setRecentReports(res.reports);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate full report");
    } finally {
      setGenerating(false);
    }
  };

  const handleClientReport = async () => {
    if (!selectedBoardId) return;

    setGenerating(true);
    try {
      const data = await generateClientReport(selectedBoardId);
      toast.success("Client progress report generated successfully");
      const normalizedPath = data.report.pdfUrl.replace(/\\/g, "/");
      window.open(`${backendBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`, "_blank");

      // Refresh reports list
      const res = await getRecentReports(selectedBoardId);
      if (res.success) {
        setRecentReports(res.reports);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate client report");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyShareLink = async (reportId) => {
    const activeReportId = reportId || (recentReports.length > 0 ? recentReports[0]._id : null);
    if (!activeReportId) {
      toast.error("No reports generated yet to copy a link for!");
      return;
    }
    
    setSharing(true);
    try {
      const res = await shareReportLink(activeReportId);
      const url = res.shareUrl;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate share link");
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = (pdfUrl) => {
    if (!pdfUrl) {
      toast.info("This is a placeholder report entry.");
      return;
    }
    const normalizedPath = pdfUrl.replace(/\\/g, "/");
    window.open(`${backendBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`, "_blank");
  };

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

  const activeWorkspace = workspaces.find(w => w._id === selectedWorkspaceId);

  const mergedReports = recentReports || [];

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const options = { month: "short", day: "numeric", year: "numeric" };
      const dStr = date.toLocaleDateString("en-US", options);
      const tStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${dStr} - ${tStr}`;
    } catch {
      return dateStr;
    }
  };

  const getRoleLabel = (role) => {
    if (role === "admin") return "Admin";
    if (role === "project_manager") return "Project Manager";
    if (role === "developer") return "Developer";
    return role || "Member";
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
      <Navbar />

      <div className="flex flex-1 pt-16 h-full">
        <DashboardSidebar currentWorkspace={activeWorkspace} />

        <main className="flex-1 ml-0 lg:ml-[280px] p-4 sm:p-6 lg:p-10 overflow-y-auto w-full flex flex-col justify-start items-center animate-in fade-in duration-300">
          <div className="w-full max-w-[1440px]">
          
          {/* Page Title & Dropdowns Selector */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-8">
            <div>
              <h2 className="font-display-xl text-3xl sm:text-[40px] md:text-[48px] font-bold text-primary dark:text-white leading-tight md:leading-[56px] tracking-tight mb-1">
                Reports Engine
              </h2>
              <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant dark:text-slate-400">
                Generate, download, and manage workspace performance documentation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {workspaces.length > 0 && (
                <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  {/* Workspace selector */}
                  <div className="flex-1 min-w-0 sm:flex-initial">
                    <CustomSelect
                      value={selectedWorkspaceId}
                      onChange={handleWorkspaceChange}
                      options={workspaces.map(ws => ({ value: ws._id, label: ws.name }))}
                      icon="workspaces"
                      placeholder="Select Workspace"
                      minWidth="min-w-0 sm:min-w-[180px]"
                    />
                  </div>

                  {/* Board selector */}
                  {selectedWorkspaceId && (
                    <div className="flex-1 min-w-0 sm:flex-initial">
                      <CustomSelect
                        value={selectedBoardId}
                        onChange={handleBoardChange}
                        options={(boardsByWorkspace[selectedWorkspaceId] || []).map(b => ({ value: b._id, label: b.name }))}
                        icon="dashboard"
                        placeholder="Select Board"
                        minWidth="min-w-0 sm:min-w-[180px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {workspaces.length === 0 || !selectedBoardId ? (
            <div className="text-center py-20 bg-surface-container-lowest dark:bg-slate-800/40 rounded-xl border border-outline-variant/30 dark:border-slate-700 shadow-sm max-w-xl mx-auto">
              <span className="material-symbols-outlined text-slate-350 dark:text-slate-600 text-[48px] mb-4">
                folder_open
              </span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No board data available</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Create workspaces and boards to access automated PDF report generation.</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Distinct Report Generators Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Card A: Full Performance Audit Report */}
                {canFullReport && (
                <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-outline dark:border-slate-700 shadow-soft flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                          admin_panel_settings
                        </span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Admin/PM Exclusive
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="font-title-md text-lg sm:text-[20px] font-bold text-primary dark:text-white mb-2">
                      Full Performance Audit Report
                    </h3>
                    <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant dark:text-slate-400 mb-6 leading-relaxed">
                      Comprehensive system report including raw developer logs, granular task tracking data, sprint velocity metrics, and un-sanitized team performance reviews.
                    </p>

                    <div className="space-y-3 mb-6">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          checked={devLogsChecked}
                          onChange={(e) => setDevLogsChecked(e.target.checked)}
                          className="form-checkbox w-4 h-4 text-secondary rounded border-outline focus:ring-secondary/50 dark:bg-slate-900 dark:border-slate-700"
                          type="checkbox"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary dark:text-slate-350 dark:group-hover:text-white transition-colors">
                          Developer performance logs
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          checked={milestonesChecked}
                          onChange={(e) => setMilestonesChecked(e.target.checked)}
                          className="form-checkbox w-4 h-4 text-secondary rounded border-outline focus:ring-secondary/50 dark:bg-slate-900 dark:border-slate-700"
                          type="checkbox"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary dark:text-slate-350 dark:group-hover:text-white transition-colors">
                          Milestone breakdown
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          checked={trackingChecked}
                          onChange={(e) => setTrackingChecked(e.target.checked)}
                          className="form-checkbox w-4 h-4 text-secondary rounded border-outline focus:ring-secondary/50 dark:bg-slate-900 dark:border-slate-700"
                          type="checkbox"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary dark:text-slate-350 dark:group-hover:text-white transition-colors">
                          Complete tracking data
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline dark:border-slate-700">
                    <button
                      onClick={handleFullReport}
                      disabled={generating || !canFullReport}
                      className="w-full bg-secondary text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                      {generating ? "Generating PDF..." : "Generate & Download PDF"}
                    </button>
                  </div>
                </div>
                )}

                {/* Card B: Client-Safe Progress Report */}
                <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-outline dark:border-slate-700 shadow-soft flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                          verified_user
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Client
                        </span>
                      </div>
                    </div>

                    <h3 className="font-title-md text-lg sm:text-[20px] font-bold text-primary dark:text-white mb-2">
                      Client Progress Report
                    </h3>
                    <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant dark:text-slate-400 mb-6 leading-relaxed">
                      Sanitizes internal metrics, shows high-level milestone timelines and completed items. Ideal for external stakeholder updates.
                    </p>

                    <div className="bg-surface-container-low dark:bg-slate-750 rounded-lg p-4 mb-6 border border-outline-variant/30 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-on-surface-variant dark:text-slate-400 mb-1">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <span className="font-label-caps text-[10px] uppercase tracking-wider">Safety Protocol</span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant dark:text-slate-400 leading-relaxed">
                        Excludes internal communication threads, raw developer velocity, and budget-sensitive raw logs.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-outline dark:border-slate-700">
                    <button
                      onClick={handleClientReport}
                      disabled={generating || !canClientReport}
                      className="flex-grow bg-surface-container-lowest border border-secondary text-secondary font-semibold py-3 px-4 rounded-lg flex justify-center items-center gap-2 hover:bg-secondary/5 transition-colors dark:bg-slate-800 dark:hover:bg-slate-750 text-sm sm:text-base"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Download Client PDF
                    </button>
                    <button
                      onClick={() => handleCopyShareLink("")}
                      disabled={sharing || recentReports.length === 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-on-surface-variant dark:text-slate-400 hover:text-secondary dark:hover:text-indigo-400 transition-colors font-medium text-sm sm:text-body-sm disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">link</span>
                      Copy Secure Share Link
                    </button>
                  </div>
                </div>

              </div>

              {/* Recent Generated Reports Table */}
              <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline dark:border-slate-700 shadow-soft overflow-hidden mt-8">
                <div className="p-4 sm:p-6 border-b border-outline dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-title-md text-lg sm:text-[20px] font-bold text-primary dark:text-white">
                    Recent Generated Reports
                  </h3>
                  <button className="text-secondary dark:text-indigo-400 hover:underline font-body-sm text-body-sm font-medium transition-colors">
                    View All Archive
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low dark:bg-slate-900/60 font-label-caps text-[12px] text-on-surface-variant dark:text-slate-400 border-b border-outline dark:border-slate-700 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:py-4 sm:px-6 font-semibold whitespace-nowrap">REPORT NAME</th>
                        <th className="py-3.5 px-4 sm:py-4 sm:px-6 font-semibold whitespace-nowrap">TYPE</th>
                        <th className="py-3.5 px-4 sm:py-4 sm:px-6 font-semibold whitespace-nowrap">GENERATED BY</th>
                        <th className="py-3.5 px-4 sm:py-4 sm:px-6 font-semibold whitespace-nowrap">TIMESTAMP</th>
                        <th className="py-3.5 px-4 sm:py-4 sm:px-6 font-semibold text-right whitespace-nowrap">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-on-surface dark:text-slate-350">
                      {mergedReports.map((row, idx) => (
                        <tr key={idx} className="border-b border-outline/30 dark:border-slate-700/50 hover:bg-surface-container-low/30 dark:hover:bg-slate-900/30 transition-colors h-[64px]">
                          <td className="py-3.5 px-4 sm:py-4 sm:px-6 font-medium text-primary dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-[18px]">
                                description
                              </span>
                              <span>
                                {row.type === "full" ? "Full Performance Audit" : "Alpha Project Progress - Oct"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:py-4 sm:px-6 whitespace-nowrap">
                            {row.type === "full" ? (
                              <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Audit
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Client
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 sm:py-4 sm:px-6 text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface dark:text-white">
                                {row.generatedBy?.username || "Sarah Jenkins"}
                              </span>
                              <span className="text-[10px] text-on-surface-variant/75 dark:text-slate-500 uppercase font-semibold">
                                {getRoleLabel(row.generatedBy?.role || "admin")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:py-4 sm:px-6 text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                            {formatDate(row.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 sm:py-4 sm:px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDownload(row.pdfUrl)}
                              className="text-secondary dark:text-indigo-400 hover:bg-secondary/10 dark:hover:bg-indigo-500/20 p-2 rounded-full transition-colors inline-flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-lg">download</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

export default ReportsPage;

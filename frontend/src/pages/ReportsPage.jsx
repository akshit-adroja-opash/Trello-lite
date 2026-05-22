import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authstore";
import { getWorkspaces } from "../api/workspace.api";
import { getBoardsByWorkspace, getSingleBoard } from "../api/board.api";
import { generateClientReport, generateFullReport, shareReportLink } from "../api/reportService";
import ReportActions from "../components/ReportActions";
import Avatar from "../UI/Avatar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import Navbar from "../components/Layout/Navbar";

const ReportsPage = () => {
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  const { boardId } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [sharing, setSharing] = useState(false);

  // Load single board info if boardId is provided
  useEffect(() => {
    if (boardId) {
      getSingleBoard(boardId)
        .then((res) => {
          setSelectedBoard(res.data?.board);
        })
        .catch(() => {
          toast.error("Failed to load board details");
        });
    } else {
      setSelectedBoard(null);
    }
  }, [boardId]);

  // Load all workspaces and boards for selector view
  useEffect(() => {
    const loadSelectionData = async () => {
      setLoading(true);
      try {
        const wsRes = await getWorkspaces();
        const wsList = wsRes.data?.workspaces || [];
        setWorkspaces(wsList);
        const map = {};
        await Promise.all(
          wsList.map(async (ws) => {
            const bRes = await getBoardsByWorkspace(ws._id);
            map[ws._id] = bRes.data?.boards || [];
          })
        );
        setBoardsByWorkspace(map);
      } catch {
        toast.error("Failed to load workspace boards list");
      } finally {
        setLoading(false);
      }
    };

    if (!boardId) {
      loadSelectionData();
    } else {
      setLoading(false);
    }
  }, [boardId]);

  const handleFullReport = async () => {
    const activeId = boardId || selectedBoard?._id;
    if (!activeId) return;

    setGenerating(true);
    try {
      const data = await generateFullReport(activeId);
      toast.success("Full report generated");
      setLastReport(data.report);
      const normalizedPath = data.report.pdfUrl.replace(/\\/g, "/");
      window.open(`${backendBase}/${normalizedPath}`, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate full report");
    } finally {
      setGenerating(false);
    }
  };

  const handleClientReport = async () => {
    const activeId = boardId || selectedBoard?._id;
    if (!activeId) return;

    setGenerating(true);
    try {
      const data = await generateClientReport(activeId);
      toast.success("Client report generated");
      setLastReport(data.report);
      const normalizedPath = data.report.pdfUrl.replace(/\\/g, "/");
      window.open(`${backendBase}/${normalizedPath}`, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate client report");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!lastReport?._id) return;
    setSharing(true);
    try {
      const res = await shareReportLink(lastReport._id);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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

      {/* Main Container wrapper */}
      <div className="flex flex-1 pt-16 h-full">
        {/* Left Fixed Sidebar */}
        <DashboardSidebar />

        {/* Content Canvas */}
        <main className="flex-1 ml-0 md:ml-sidebar-width p-6 md:p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
          {boardId && selectedBoard ? (
            // Detail view for a specific board
            <div>
              <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                <Link
                  to="/reports"
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-all group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm"
                >
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  <span>All Reports</span>
                </Link>
                <span className="text-slate-350 dark:text-slate-600 font-light text-lg">/</span>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                    {selectedBoard.name} Report Hub
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Generate structured document reviews for this project
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/70 dark:border-slate-700/50 p-6 shadow-sm">
                <div
                  className="h-28 rounded-2xl flex items-end p-4 relative overflow-hidden shadow-inner mb-6"
                  style={{ background: selectedBoard.background }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <span className="text-white font-bold text-lg tracking-wide z-10 drop-shadow">
                    {selectedBoard.name}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                    Available Actions
                  </h3>
                  {generating ? (
                    <div className="flex items-center gap-3 py-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                      <span className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      Generating PDF Report...
                    </div>
                  ) : (
                    <ReportActions
                      user={user}
                      onFullReport={handleFullReport}
                      onClientReport={handleClientReport}
                    />
                  )}

                  {lastReport && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                        Last Generated Report
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                              {lastReport.type} Report
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 px-2 py-0.5 rounded-full uppercase">
                              Ready
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Generated on {new Date(lastReport.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={`${backendBase}/${lastReport.pdfUrl.replace(/\\/g, "/")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-9 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Download
                          </a>
                          <button
                            onClick={handleCopyShareLink}
                            disabled={sharing}
                            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-indigo-600/10"
                          >
                            {sharing ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">share</span>
                            )}
                            Copy Share Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Selection view (List of all boards grouped by workspaces)
            <div>
              <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                  Project Reports
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select a board below to generate milestones and pipeline progress documents
                </p>
              </div>

              {workspaces.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 shadow-sm max-w-xl mx-auto">
                  <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600 mb-3">folder_open</span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    No board data available
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                    Create workspaces and boards to access automated PDF report generation.
                  </p>
                </div>
              ) : (
                workspaces.map((ws) => {
                  const boards = boardsByWorkspace[ws._id] || [];
                  if (boards.length === 0) return null;
                  return (
                    <div
                      key={ws._id}
                      className="mb-8 bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm"
                    >
                      <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2.5">
                        <span className="w-1.5 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                        {ws.name}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map((board) => (
                          <Link
                            key={board._id}
                            to={`/reports/${board._id}`}
                            className="group relative flex flex-col justify-between p-5 h-[11rem] bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                          >
                            {/* Dynamic Top Gradient Bar using the board color/gradient */}
                            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: board.background || 'linear-gradient(90deg, #6366f1, #a855f7)' }} />

                            <div className="flex items-start justify-between">
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-750 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/60 transition-colors">
                                <span className="material-symbols-outlined text-[24px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">analytics</span>
                              </div>
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/30 px-2 py-0.5 rounded-full">
                                PDF Available
                              </span>
                            </div>

                            <div className="mt-4">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {board.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                Generate audit and progress summary
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/40 pt-3 mt-3">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                Generate Reports
                              </span>
                              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                                arrow_forward
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;

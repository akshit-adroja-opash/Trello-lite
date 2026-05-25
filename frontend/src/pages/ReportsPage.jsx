import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authstore";
import { getWorkspaces } from "../api/workspace.api";
import { getBoardsByWorkspace, getSingleBoard } from "../api/board.api";
import { generateClientReport, generateFullReport, shareReportLink } from "../api/reportService";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import Navbar from "../components/Layout/Navbar";

const REPORT_THEME_COLORS = ['#26A69A', '#1E88E5', '#FB8C00', '#D81B60', '#8E24AA'];

const ReportsPage = () => {
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  const { boardId } = useParams();

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

      {/* Main Container wrapper */}
      <div className="flex flex-1 pt-16 h-full">
        {/* Left Fixed Sidebar */}
        <DashboardSidebar />

        {/* Content Canvas */}
        <main className="flex-1 ml-0 lg:ml-[280px] p-10 overflow-y-auto w-full max-w-[1440px] mx-auto">
          {boardId && selectedBoard ? (
            // Detail view for a specific board
            <div>
              <div className="flex items-center gap-4 mb-8 border-b border-outline-variant/30 pb-6">
                <Link
                  to="/reports"
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary font-body-sm font-semibold transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>All Reports</span>
                </Link>
                <span className="text-outline dark:text-slate-600 font-light text-lg">/</span>
                <div>
                  <h1 className="font-headline-lg text-headline-sm text-primary dark:text-white">
                    {selectedBoard.name} Report Hub
                  </h1>
                  <p className="text-on-surface-variant dark:text-slate-400 text-body-sm mt-0.5">
                    Generate structured document reviews for this project
                  </p>
                </div>
              </div>

              <section className="bg-surface-container-lowest dark:bg-slate-800/40 rounded-2xl p-8 border border-outline-variant/30 shadow-sm max-w-3xl">
                <div
                  className="h-28 rounded-2xl flex items-end p-6 relative overflow-hidden shadow-inner mb-8"
                  style={{ background: selectedBoard.background || 'linear-gradient(135deg, #005f73, #0a9396)' }}
                >
                  <div className="absolute inset-0 bg-black/35" />
                  <span className="text-white font-headline-lg text-headline-lg z-10 drop-shadow">
                    {selectedBoard.name}
                  </span>
                </div>

                <div className="space-y-6">
                  <h3 className="font-label-caps text-label-caps text-outline dark:text-slate-400">
                    REPORT GENERATOR ACTIONS
                  </h3>

                  {generating ? (
                    <div className="flex items-center gap-3 py-4 text-secondary dark:text-indigo-400 text-body-md font-semibold animate-pulse">
                      <span className="w-6 h-6 border-2 border-secondary/35 border-t-secondary rounded-full animate-spin" />
                      <span>Generating PDF Report Documents...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Full Report Option */}
                      <button
                        onClick={handleFullReport}
                        className="group flex flex-col justify-between p-6 bg-surface dark:bg-slate-700/40 border border-outline-variant/50 hover:border-secondary/40 hover:shadow-md rounded-xl text-left transition-all"
                      >
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-surface-container-low dark:bg-slate-750 flex items-center justify-center mb-4 text-on-surface-variant group-hover:text-secondary border border-outline-variant/35 transition-colors">
                            <span className="material-symbols-outlined">description</span>
                          </div>
                          <h4 className="font-title-md text-on-surface dark:text-white mb-1">Full Report</h4>
                          <p className="text-body-sm text-on-surface-variant dark:text-slate-400 mb-4">Complete project audit, includes list cards, details, and metrics summary.</p>
                        </div>
                        <div className="flex items-center justify-between w-full text-secondary font-semibold text-body-sm pt-2 border-t border-outline-variant/10">
                          <span>Generate Full PDF</span>
                          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                      </button>

                      {/* Client Report Option */}
                      <button
                        onClick={handleClientReport}
                        className="group flex flex-col justify-between p-6 bg-surface dark:bg-slate-700/40 border border-outline-variant/50 hover:border-secondary/40 hover:shadow-md rounded-xl text-left transition-all"
                      >
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-surface-container-low dark:bg-slate-750 flex items-center justify-center mb-4 text-on-surface-variant group-hover:text-secondary border border-outline-variant/35 transition-colors">
                            <span className="material-symbols-outlined">assignment_ind</span>
                          </div>
                          <h4 className="font-title-md text-on-surface dark:text-white mb-1">Client Report</h4>
                          <p className="text-body-sm text-on-surface-variant dark:text-slate-400 mb-4">Clean summary tailored for external review. Hides developer metrics.</p>
                        </div>
                        <div className="flex items-center justify-between w-full text-secondary font-semibold text-body-sm pt-2 border-t border-outline-variant/10">
                          <span>Generate Client PDF</span>
                          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                      </button>
                    </div>
                  )}

                  {lastReport && (
                    <div className="mt-8 pt-6 border-t border-outline-variant/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h3 className="font-label-caps text-label-caps text-outline dark:text-slate-400 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        LAST GENERATED REPORT
                      </h3>
                      <div className="bg-surface dark:bg-slate-700/30 border border-outline-variant/50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-title-md text-on-surface dark:text-white capitalize">
                              {lastReport.type} Report
                            </span>
                            <span className="font-label-caps text-[10px] text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 px-2 py-0.5 rounded-full">
                              READY
                            </span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant dark:text-slate-400 mt-1">
                            Generated on {new Date(lastReport.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={`${backendBase}/${lastReport.pdfUrl.replace(/\\/g, "/")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-10 px-4 bg-surface-container-high hover:bg-surface-container-highest dark:bg-slate-750 dark:hover:bg-slate-650 text-on-surface dark:text-slate-200 rounded-lg text-body-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Download
                          </a>
                          <button
                            onClick={handleCopyShareLink}
                            disabled={sharing}
                            className="h-10 px-4 bg-secondary text-white rounded-lg text-body-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-95"
                          >
                            {sharing ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">share</span>
                            )}
                            Copy Share Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            // Selection view (List of all boards grouped by workspaces)
            <div>
              <header className="mb-12">
                <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1">Project Reports</h2>
                <p className="font-body-md text-on-surface-variant dark:text-slate-400 max-w-2xl">Select a board below to generate milestones and pipeline progress documents</p>
              </header>

              {workspaces.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-lowest dark:bg-slate-800/40 rounded-2xl border border-outline-variant/30 shadow-sm max-w-xl mx-auto">
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
                    <section
                      key={ws._id}
                      className="bg-surface-container-lowest dark:bg-slate-800/20 rounded-2xl p-8 border border-outline-variant/30 shadow-sm mb-8"
                    >
                      {/* Section Title */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-secondary rounded-full"></div>
                        <h3 className="font-headline-lg text-title-md text-on-surface dark:text-white">{ws.name}</h3>
                      </div>

                      {/* Grid of Report Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map((board, index) => {
                          const cardColor = REPORT_THEME_COLORS[index % REPORT_THEME_COLORS.length];
                          return (
                            <Link
                              key={board._id}
                              to={`/reports/${board._id}`}
                              className="group bg-surface dark:bg-slate-800/30 rounded-xl border border-outline-variant/50 hover:border-secondary/40 hover:shadow-lg transition-all duration-300 overflow-hidden relative pt-1"
                            >
                              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: cardColor }}></div>
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="w-12 h-12 rounded-xl bg-surface-container-low dark:bg-slate-700/50 border border-outline-variant/30 flex items-center justify-center group-hover:bg-secondary-container/5 transition-colors">
                                    <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 group-hover:text-secondary">bar_chart</span>
                                  </div>
                                  <span className="font-label-caps text-[10px] text-secondary font-bold px-2 py-1 bg-secondary-fixed/30 rounded-md">PDF AVAILABLE</span>
                                </div>
                                <h4 className="font-title-md text-on-surface dark:text-white mb-1">{board.name}</h4>
                                <p className="font-body-sm text-on-surface-variant dark:text-slate-400 mb-6">Generate audit and progress summary</p>
                                <div className="h-[1px] w-full bg-outline-variant/30 mb-4"></div>
                                <div className="w-full flex items-center justify-between group/btn text-body-sm font-medium text-on-surface-variant dark:text-slate-350 hover:text-secondary transition-colors">
                                  <span>Generate Reports</span>
                                  <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              )}

              {/* Bottom Illustration/Spacer */}
              <div className="mt-12 flex flex-col items-center justify-center py-8 opacity-40">
                <div className="w-64 h-64 bg-surface-container dark:bg-slate-800/40 rounded-full relative overflow-hidden flex items-center justify-center border border-outline-variant/20">
                  <div className="absolute inset-0 bg-gradient-to-tr from-secondary/5 to-transparent"></div>
                  <span className="material-symbols-outlined text-[96px] text-outline-variant dark:text-slate-650">insights</span>
                </div>
                <p className="font-label-caps mt-6 text-outline-variant dark:text-slate-650 tracking-[0.2em]">END OF LIST</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;

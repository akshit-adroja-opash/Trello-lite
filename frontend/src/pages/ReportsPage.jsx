import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authstore";
import { getWorkspaces } from "../api/workspace.api";
import { getBoardsByWorkspace, getSingleBoard } from "../api/board.api";
import { generateClientReport, generateFullReport } from "../api/reportService";
import ReportActions from "../components/ReportActions";
import Avatar from "../UI/Avatar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/Notifications/NotificationBell";

const ReportsPage = () => {
  const { boardId } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
      const normalizedPath = data.report.pdfUrl.replace(/\\/g, "/");
      window.open(`http://localhost:5000/${normalizedPath}`, "_blank");
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
      const normalizedPath = data.report.pdfUrl.replace(/\\/g, "/");
      window.open(`http://localhost:5000/${normalizedPath}`, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate client report");
    } finally {
      setGenerating(false);
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 antialiased font-sans transition-colors duration-200">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/50 sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8 shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-800/90 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="18" rx="2" fill="white" />
              <rect x="14" y="3" width="7" height="11" rx="2" fill="white" opacity="0.7" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
            Trello<span className="text-indigo-600 font-medium">lite</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Link
            to="/profile"
            className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700/50 pl-2 pr-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-all"
          >
            <Avatar name={user?.username || "?"} size={28} className="shadow-inner" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
              {user?.username}
            </span>
          </Link>
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-700 hover:border-red-100 rounded-xl px-4 py-2 transition-all duration-200 shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main body with layout */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <div className="flex gap-8">
          <DashboardSidebar />
          <div className="flex-1">
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
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {selectedBoard.name} Report Hub
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      Generate structured document reviews for this project
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 p-6 shadow-sm">
                  <div
                    className="h-28 rounded-xl flex items-end p-4 relative overflow-hidden shadow-inner mb-6"
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
                  </div>
                </div>
              </div>
            ) : (
              // Selection view (List of all boards grouped by workspaces)
              <div>
                <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Project Reports
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Select a board below to generate milestones and pipeline progress documents
                  </p>
                </div>

                {workspaces.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl mx-auto">
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
                        className="mb-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 p-6 shadow-sm"
                      >
                        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          {ws.name}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {boards.map((board) => (
                            <Link
                              key={board._id}
                              to={`/reports/${board._id}`}
                              className="h-24 rounded-xl flex items-end p-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                              style={{ background: board.background }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                              <span className="text-white font-bold text-sm tracking-wide z-10 drop-shadow-sm group-hover:underline">
                                {board.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;

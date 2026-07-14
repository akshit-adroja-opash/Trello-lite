import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Navbar from '../components/Layout/Navbar';

const LearnMorePage = () => {
  return (
    <div className="flex min-h-screen bg-surface dark:bg-slate-900">
      <DashboardSidebar />
      <Navbar searchQuery="" setSearchQuery={() => {}} />

      <main className="ml-0 lg:ml-[280px] pt-16 min-h-screen w-full">
        <div className="max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-10 pb-24">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-8">
            <ol className="inline-flex items-center gap-2">
              <li className="inline-flex items-center">
                <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" to="/support">Support Center</Link>
              </li>
              <li><span className="material-symbols-outlined text-[16px]">chevron_right</span></li>
              <li aria-current="page"><span className="text-slate-900 dark:text-slate-200 font-medium">Documentation</span></li>
            </ol>
          </nav>

          {/* Header Section */}
          <div className="flex items-start gap-6 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-500/20">
              <span className="material-symbols-outlined text-[32px]">menu_book</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Trello-lite Documentation</h2>
              <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl">
                Master the platform with our comprehensive guides. From basic task management to advanced analytics and user roles.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Getting Started Section */}
            <section>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700/60">Getting Started</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                  Trellolite is designed to help your team organize work efficiently. When you first log in, you will be taken to your <strong>Dashboard</strong>. This is your central hub.
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                  <li><strong>Workspaces:</strong> Containers for multiple related boards. You can create a new workspace by clicking the "New Workspace" button.</li>
                  <li><strong>Boards:</strong> Kanban-style boards inside a workspace where tasks live.</li>
                  <li><strong>My Tasks:</strong> A dedicated page to see all tasks assigned to you across all boards and workspaces.</li>
                </ul>
              </div>
            </section>

            {/* Team Management Section */}
            <section>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700/60">Team Management & Roles</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                  Collaboration is key. You can invite members to your workspaces and assign them specific roles to control their access levels.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">👑 Admin</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Full control over workspaces, boards, members, and billing.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">🛠️ Project Manager</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Can manage boards, columns, and assign tasks, but cannot delete workspaces.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">💻 Developer</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Can move cards, add comments, and mark tasks as done.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">👁️ Client</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">View-only access. Cannot edit tasks or leave comments.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reports & Analytics Section */}
            <section>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700/60">Reports & Analytics</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                  Track your team's velocity and identify bottlenecks using the built-in analytics engine.
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                  <li><strong>PDF Reports:</strong> Generate client-ready PDF reports from the Reports page summarizing completed vs pending tasks.</li>
                  <li><strong>Analytics Dashboard:</strong> Visual charts showing task distribution by priority, column, and assignee (available to Admins and PMs).</li>
                </ul>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LearnMorePage;

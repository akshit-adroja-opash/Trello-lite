import DashboardSidebar from './DashboardSidebar';
import Navbar from './Navbar';

const AdminPanelLayout = ({
  children,
  currentWorkspace,
  openWorkspaceSettings,
  boards,
  navbarProps,
  mainClassName = '',
}) => {
  return (
    <div className="min-h-screen bg-background text-on-surface antialiased overflow-x-hidden flex flex-col dark:bg-slate-900 dark:text-white transition-colors duration-200">
      <Navbar {...(navbarProps || {})} />

      <div className="flex flex-1 pt-16 h-full">
        <DashboardSidebar
          currentWorkspace={currentWorkspace}
          openWorkspaceSettings={openWorkspaceSettings}
          boards={boards}
        />

        <main className="flex-1 ml-0 lg:ml-[280px] p-6 lg:p-10 overflow-y-auto w-full flex flex-col justify-center items-center">
          <div className={`w-full ${mainClassName}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanelLayout;

import { useState } from "react";
import Navbar from "../components/Layout/Navbar";
import DashboardSidebar from "../components/Layout/DashboardSidebar";
import useThemeStore from "../store/themeStore";
import toast from "react-hot-toast";

const SupportPage = () => {
    const darkMode = useThemeStore(s => s.darkMode);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);

    const topics = [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: "rocket_launch",
            description: "Account setup, basic navigation, and initial workspace configuration.",
            details: "Welcome to Trellolite! Start by creating your workspace, inviting team members via email, and setting up your first Kanban board. Use the top search bar to quickly jump between boards and assigned tasks."
        },
        {
            id: "workspace-management",
            title: "Workspace Management",
            icon: "view_kanban",
            description: "Managing boards, teams, member roles, and workflow automation.",
            details: "Workspace admins can manage member permissions from the User Management panel. Assign roles like Admin, Project Manager, Developer, or Client to control access to sensitive analytics and settings."
        },
        {
            id: "reporting-analytics",
            title: "Reporting & Analytics",
            icon: "bar_chart",
            description: "Exporting data, interpreting charts, and generating custom reports.",
            details: "The Analytics page features dynamic Sprint Burndown charts, Workload Distribution, and Task Pipeline metrics. You can also export comprehensive PDF reports directly from the Reports tab."
        },
        {
            id: "billing-subscriptions",
            title: "Billing & Subscriptions",
            icon: "credit_card",
            description: "Plan comparisons, managing invoices, upgrades, and payment methods.",
            details: "Trellolite Workspace Pro unlocks unlimited boards, advanced AI analytics, and 24/7 priority support. Manage your billing details or download invoices from your Profile settings."
        },
        {
            id: "security-privacy",
            title: "Security & Privacy",
            icon: "lock",
            description: "Configuring permissions, two-factor authentication, and data protection policies.",
            details: "We protect your data using industry-standard JWT authentication, role-based access control (RBAC), and secure MongoDB Atlas GridFS streaming storage for all media and attachments."
        },
        {
            id: "api-integrations",
            title: "API & Integrations",
            icon: "integration_instructions",
            description: "Developer documentation, webhooks, and third-party app connections.",
            details: "Connect Trello-lite with your CI/CD pipelines or Slack via WebSockets and REST APIs. Check out our GitHub Discussions repository for SDK examples and webhook schemas."
        }
    ];

    const popularArticles = [
        {
            title: "How to create your first project board",
            content: "To create a new board, navigate to your Dashboard and click the '+ Create Board' button. Give your board a name, choose a background color or workspace, and start adding custom lists like 'To Do', 'In Progress', and 'Done'."
        },
        {
            title: "Managing workspace permissions and roles",
            content: "Admins have full control over user invitations and role assignments. You can promote team members to Project Managers to allow them to assign tasks and view burndown charts, or set external stakeholders as read-only Clients."
        },
        {
            title: "Setting up automated workflows",
            content: "Automate your team's workflow by configuring column rules. When a card is moved to 'Code Review' or 'Completed', the system automatically updates sprint metrics and notifies assigned developers via real-time WebSockets."
        },
        {
            title: "Exporting reports to CSV or PDF",
            content: "Visit the Reports page from your left sidebar. Select your target board or sprint filter, and click 'Download PDF Report'. Our backend generates a clean, professional summary sheet with KPI statistics and overdue task lists."
        }
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast.error("Please enter a search term.");
            return;
        }
        toast.success(`Searching help articles for "${searchQuery}"...`);
    };

    const handleStartChat = () => {
        toast.success("Connecting you to a live support representative... Estimated wait time: < 1 minute.");
    };

    return (
        <div className={`min-h-screen bg-background dark:bg-slate-900 text-on-surface dark:text-slate-100 font-body-md antialiased overflow-x-hidden flex flex-col transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
            <Navbar />
            
            <div className="flex flex-1 pt-16 h-full">
                <DashboardSidebar />
                <main className="flex-1 ml-0 lg:ml-[280px] overflow-y-auto w-full min-h-[calc(100vh-64px)] bg-background dark:bg-slate-900 animate-in fade-in duration-300">
                    
                    {/* Header Section - Full Width Banner */}
                    <section className="bg-surface-container-lowest dark:bg-slate-800/90 border-b border-outline-variant dark:border-slate-700 py-14 px-6 md:px-12 text-center shadow-xs">
                        <h1 className="font-display-xl text-3xl md:text-5xl font-extrabold text-on-surface dark:text-white mb-5 tracking-tight">
                            How can we help you today?
                        </h1>
                        <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative mt-8">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-outline dark:text-slate-400 text-2xl">search</span>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for help articles, guides, and FAQs..."
                                className="block w-full pl-14 pr-32 py-4 md:py-5 rounded-2xl border border-outline-variant dark:border-slate-700 bg-surface dark:bg-slate-900 text-on-surface dark:text-white focus:ring-2 focus:ring-secondary/30 focus:border-secondary dark:focus:border-blue-400 transition-all shadow-md font-body-md text-base placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                className="absolute inset-y-2.5 right-2.5 bg-secondary hover:bg-secondary/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-on-secondary dark:text-white px-7 rounded-xl font-label-caps text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center"
                            >
                                Search
                            </button>
                        </form>
                    </section>

                    {/* Full Screen Layout Container */}
                    <div className="w-full max-w-[1700px] mx-auto px-6 md:px-12 py-12 space-y-16">
                        
                        {/* Support Categories (Bento Grid Style) */}
                        <section>
                            <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface dark:text-white mb-8 tracking-tight">
                                Browse Topics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {topics.map((topic) => (
                                    <div
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic)}
                                        className="group flex flex-col justify-between p-8 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/80 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-secondary dark:hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-2xl bg-secondary/10 dark:bg-blue-500/10 text-secondary dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white dark:group-hover:bg-blue-500 transition-all duration-300 shadow-xs">
                                                <span className="material-symbols-outlined text-3xl">{topic.icon}</span>
                                            </div>
                                            <h3 className="font-title-md text-xl font-extrabold text-on-surface dark:text-white mb-3 group-hover:text-secondary dark:group-hover:text-blue-400 transition-colors">
                                                {topic.title}
                                            </h3>
                                            <p className="font-body-sm text-sm md:text-[15px] text-on-surface-variant dark:text-slate-400 leading-relaxed">
                                                {topic.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Bottom Section: Featured & Contact - 12 Column Layout for Full Screen Proportions */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                            
                            {/* Featured Articles - Takes 7 or 8 columns on widescreen */}
                            <section className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-6">
                                <h2 className="font-title-md text-2xl font-extrabold text-on-surface dark:text-white tracking-tight">
                                    Popular Topics
                                </h2>
                                <div className="flex-1 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/80 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between">
                                    <ul className="divide-y divide-outline-variant dark:divide-slate-700/60 flex-1 flex flex-col justify-between">
                                        {popularArticles.map((article, idx) => (
                                            <li key={idx} className="flex-1 flex">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedArticle(article)}
                                                    className="w-full flex items-center justify-between p-6 md:p-7 hover:bg-surface-container-low/80 dark:hover:bg-slate-750 transition-all group text-left cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-container dark:bg-slate-700 flex items-center justify-center text-outline dark:text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary dark:group-hover:text-blue-400 transition-colors shrink-0">
                                                            <span className="material-symbols-outlined text-[22px]">
                                                                article
                                                            </span>
                                                        </div>
                                                        <span className="font-body-md text-base md:text-lg font-semibold text-on-surface dark:text-slate-100 group-hover:text-secondary dark:group-hover:text-blue-400 transition-colors">
                                                            {article.title}
                                                        </span>
                                                    </div>
                                                    <span className="material-symbols-outlined text-outline-variant dark:text-slate-500 group-hover:text-secondary dark:group-hover:text-blue-400 transition-all transform group-hover:translate-x-2 text-2xl">
                                                        arrow_forward
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            {/* Contact Options - Takes 5 or 4 columns on widescreen */}
                            <section className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-6">
                                <h2 className="font-title-md text-2xl font-extrabold text-on-surface dark:text-white tracking-tight">
                                    Still need help?
                                </h2>
                                
                                <div className="flex-1 flex flex-col justify-between space-y-5">
                                    {/* Community Forum */}
                                    <div className="p-6 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/80 dark:border-slate-700 shadow-sm flex items-start gap-5 hover:border-secondary/60 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high dark:bg-slate-700 flex items-center justify-center shrink-0 text-on-surface-variant dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[26px]">forum</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-body-md text-lg font-bold text-on-surface dark:text-white">
                                                Community Forum
                                            </h3>
                                            <p className="font-body-sm text-sm text-on-surface-variant dark:text-slate-400 mb-3 mt-1 leading-normal">
                                                Ask our community of Trellolite experts.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => toast("Redirecting to Trellolite Discussions Forum...", { icon: "💬" })}
                                                className="font-label-caps text-xs font-extrabold uppercase tracking-wider text-secondary dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                                            >
                                                <span>Visit Forum</span>
                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Email Support */}
                                    <div className="p-6 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/80 dark:border-slate-700 shadow-sm flex items-start gap-5 hover:border-secondary/60 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high dark:bg-slate-700 flex items-center justify-center shrink-0 text-on-surface-variant dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[26px]">mail</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-body-md text-lg font-bold text-on-surface dark:text-white">
                                                Email Support
                                            </h3>
                                            <p className="font-body-sm text-sm text-on-surface-variant dark:text-slate-400 mb-3 mt-1 leading-normal">
                                                Get a response from our team within 24 hours.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => toast.success("Support email window opened: support@trellolite.io")}
                                                className="font-label-caps text-xs font-extrabold uppercase tracking-wider text-secondary dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                                            >
                                                <span>Send Email</span>
                                                <span className="material-symbols-outlined text-[16px]">mail_outline</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Live Chat */}
                                    <div className="p-6 md:p-7 bg-gradient-to-br from-secondary to-blue-700 dark:from-blue-600 dark:to-indigo-700 text-on-secondary dark:text-white rounded-2xl shadow-md flex items-start gap-5 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                        <div className="absolute right-[-20px] top-[-20px] opacity-15 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                support_agent
                                            </span>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 relative z-10 text-white">
                                            <span className="material-symbols-outlined text-[26px]">chat</span>
                                        </div>
                                        <div className="relative z-10 flex-1">
                                            <h3 className="font-body-md text-lg font-extrabold text-white">
                                                Live Chat
                                            </h3>
                                            <p className="font-body-sm text-sm text-blue-100 dark:text-indigo-100 mb-4 mt-1 leading-relaxed">
                                                Chat with a support representative right now.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleStartChat}
                                                className="font-label-caps text-xs font-extrabold uppercase tracking-wider bg-white text-secondary dark:text-blue-600 px-5 py-2.5 rounded-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                                                <span>Start Chat</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                </main>
            </div>

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-surface-container-lowest dark:bg-slate-800 max-w-lg w-full rounded-2xl p-7 shadow-2xl border border-outline-variant dark:border-slate-700 space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant dark:border-slate-700">
                            <div className="flex items-center gap-2 text-secondary dark:text-blue-400">
                                <span className="material-symbols-outlined text-[24px]">article</span>
                                <span className="font-label-caps text-xs font-bold uppercase tracking-wider">Knowledge Base Article</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedArticle(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[22px]">close</span>
                            </button>
                        </div>
                        <h3 className="text-xl font-extrabold text-on-surface dark:text-white">
                            {selectedArticle.title}
                        </h3>
                        <p className="text-[15px] text-on-surface-variant dark:text-slate-300 leading-relaxed">
                            {selectedArticle.content}
                        </p>
                        <div className="pt-4 border-t border-outline-variant dark:border-slate-700 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedArticle(null)}
                                className="px-6 py-2.5 rounded-xl bg-secondary dark:bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Topic Details Modal */}
            {selectedTopic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-surface-container-lowest dark:bg-slate-800 max-w-lg w-full rounded-2xl p-7 shadow-2xl border border-outline-variant dark:border-slate-700 space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant dark:border-slate-700">
                            <div className="flex items-center gap-2 text-secondary dark:text-blue-400">
                                <span className="material-symbols-outlined text-[24px]">{selectedTopic.icon}</span>
                                <span className="font-label-caps text-xs font-bold uppercase tracking-wider">{selectedTopic.title} Guide</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTopic(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[22px]">close</span>
                            </button>
                        </div>
                        <h3 className="text-xl font-extrabold text-on-surface dark:text-white">
                            {selectedTopic.title} Overview
                        </h3>
                        <p className="text-[15px] text-on-surface-variant dark:text-slate-300 leading-relaxed">
                            {selectedTopic.details}
                        </p>
                        <div className="pt-4 border-t border-outline-variant dark:border-slate-700 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTopic(null);
                                    toast.success(`Redirecting to full ${selectedTopic.title} documentation...`);
                                }}
                                className="px-5 py-2.5 rounded-xl bg-surface dark:bg-slate-700 border border-outline-variant dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-on-surface dark:text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                            >
                                View Full Docs
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTopic(null)}
                                className="px-6 py-2.5 rounded-xl bg-secondary dark:bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportPage;

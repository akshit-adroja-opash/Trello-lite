import { useState } from 'react';
import DashboardSidebar from '../components/Layout/DashboardSidebar';
import Navbar from '../components/Layout/Navbar';

const faqs = [
  { q: 'How do I create a new workspace?', a: 'Navigate to the Dashboard and click the "New Workspace" button in the top-right corner of the My Workspaces section.' },
  { q: 'How do I invite members to a workspace?', a: 'Open your workspace card on the Dashboard and click "Invite Members". Enter their email address and assign a role.' },
  { q: 'How do I create a board inside a workspace?', a: 'Click "Add Board" on the workspace card, give it a name, pick a wallpaper theme, and hit "Launch Board".' },
  { q: 'What roles are available?', a: 'Trellolite supports Admin, Project Manager, Developer, and Client roles. Each role has different permissions for managing workspaces, boards, and cards.' },
  { q: 'How do I assign a task to someone?', a: 'Open a card on any board, click "Assign Members", and select the team member you want to assign.' },
  { q: 'How do I generate reports?', a: 'Go to the Reports page from the sidebar. Select the workspace, date range, and click "Generate PDF Report".' },
  { q: 'How do I change my profile or avatar?', a: 'Click your avatar in the top-right corner of the navbar, then select "Profile" to update your details.' },
  { q: 'Can I set due dates on cards?', a: 'Yes! Open any card and use the due date picker to set a deadline. Overdue cards are highlighted automatically.' },
];

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="flex min-h-screen bg-surface dark:bg-slate-900">
      <DashboardSidebar />
      <Navbar searchQuery="" setSearchQuery={() => {}} />

      <main className="ml-0 lg:ml-[280px] pt-16 min-h-screen w-full">
        <div className="max-w-[900px] mx-auto p-4 sm:p-6 lg:p-10">

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-[22px]">help</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Support & Help Center</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Find answers, get help, and reach out to our team</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for help topics..."
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: 'menu_book', title: 'Getting Started', desc: 'Learn the basics of Trellolite' },
              { icon: 'groups', title: 'Team Management', desc: 'Roles, invitations & permissions' },
              { icon: 'bar_chart', title: 'Reports & Analytics', desc: 'Generate insights & PDF reports' },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-secondary dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary dark:text-blue-400">quiz</span>
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {filteredFaqs.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No matching questions found. Try a different search term.</p>
              )}
              {filteredFaqs.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-white pr-4">{faq.q}</span>
                    <span className={`material-symbols-outlined text-slate-400 text-xl transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  {openIndex === i && (
                    <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary dark:text-blue-400">mail</span>
              Contact Support
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Can't find what you're looking for? Send us a message and we'll get back to you.</p>

            {submitted && (
              <div className="mb-5 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-3 text-sm font-medium">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Your message has been sent! We'll respond within 24 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold capitalize tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Your Name</label>
                  <input
                    value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="John Doe" required
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold capitalize tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
                  <input
                    value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    type="email" placeholder="you@example.com" required
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold capitalize tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Message</label>
                <textarea
                  value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or question..." required rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>
              <button type="submit"
                className="h-11 px-6 bg-secondary hover:bg-[#00489e] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all">
                Send Message
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 pb-6">
            <p>Need urgent help? Email us at <span className="text-secondary dark:text-blue-400 font-semibold">support@trellolite.com</span></p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default SupportPage;

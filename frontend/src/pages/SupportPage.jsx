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
        <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-10">

          {/* Page Header */}
          <div className="mb-10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full -z-10 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                  <span className="material-symbols-outlined text-[28px]">support_agent</span>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Support & Help Center</h1>
                  <p className="text-base text-slate-500 dark:text-slate-400 font-medium">Find answers, get help, and reach out to our support team.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-12 max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-2xl">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for help topics, FAQs, or keywords..."
              className="w-full h-16 pl-14 pr-12 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-white text-base font-medium placeholder-slate-400 focus:outline-none focus:border-secondary/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: 'menu_book', title: 'Getting Started', desc: 'Learn the basics of Trellolite, set up your profile, and more.', color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
              { icon: 'groups', title: 'Team Management', desc: 'Manage roles, send invitations & handle workspace permissions.', color: 'from-purple-500 to-pink-400', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
              { icon: 'bar_chart', title: 'Reports & Analytics', desc: 'Generate powerful insights, track progress & export PDF reports.', color: 'from-orange-500 to-amber-400', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
            ].map((item, i) => (
              <div key={i} className="relative group p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.text} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                <div className="mt-4 flex items-center text-sm font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  Learn more <span className="material-symbols-outlined text-[16px] ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-[20px]">quiz</span>
              </div>
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {filteredFaqs.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">No matching questions found. Try a different search term.</p>
              )}
              {filteredFaqs.map((faq, i) => (
                <div key={i} className={`rounded-2xl border ${openIndex === i ? 'border-secondary/50 dark:border-blue-500/50 shadow-md shadow-blue-500/5' : 'border-slate-200/80 dark:border-slate-700/80'} bg-white dark:bg-slate-800/80 overflow-hidden transition-all duration-300`}>
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <span className={`text-base font-semibold ${openIndex === i ? 'text-secondary dark:text-blue-400' : 'text-slate-800 dark:text-white'} pr-4 transition-colors`}>{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ml-2 ${openIndex === i ? 'bg-blue-50 dark:bg-blue-900/30 text-secondary dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>
                      <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </button>
                  <div className={`grid transition-all duration-300 ease-in-out ${openIndex === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="relative rounded-[2rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-8 sm:p-10 overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Contact Support</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 pl-13">Can't find what you're looking for? Send us a message and we'll get back to you.</p>

              {submitted && (
                <div className="mb-6 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                  <span className="material-symbols-outlined text-xl text-emerald-500">check_circle</span>
                  Your message has been sent successfully! We'll respond within 24 hours.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Name</label>
                    <input
                      value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="John Doe" required
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:bg-slate-50 dark:hover:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                    <input
                      value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      type="email" placeholder="you@example.com" required
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:bg-slate-50 dark:hover:bg-slate-900"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Message</label>
                  <textarea
                    value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your issue or question in detail..." required rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-secondary dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none hover:bg-slate-50 dark:hover:bg-slate-900"
                  />
                </div>
                <button type="submit"
                  className="h-12 px-8 bg-gradient-to-r from-secondary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400 pb-8">
            <p>Need urgent help? Email us at <span className="text-secondary dark:text-blue-400 font-semibold hover:underline cursor-pointer">support@trellolite.com</span></p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default SupportPage;

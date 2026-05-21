import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authstore';
import { getMyTasks } from '../api/card.api';
import ThemeToggle from '../components/ThemeToggle';

const MyTasksPage = () => {
    const user = useAuthStore(s => s.user);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getMyTasks()
            .then(res => setCards(res.data?.cards || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user]);

    const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();
    const isDueSoon = (dueDate) => {
        if (!dueDate || isOverdue(dueDate)) return false;
        return (new Date(dueDate) - new Date()) < 86400000 * 2;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 antialiased font-sans transition-colors duration-200">
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/50 sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8 shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard"
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-all group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm">
                        <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <span className="text-slate-300 dark:text-slate-600 text-lg font-light">/</span>
                    <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">My Tasks</h1>
                </div>
                <div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-slate-800 dark:text-white font-bold text-lg mb-1">No tasks assigned</p>
                        <p className="text-slate-400 dark:text-slate-400 text-sm">Cards assigned to you will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 dark:text-slate-450 font-medium mb-5">{cards.length} task{cards.length !== 1 ? 's' : ''} assigned to you</p>
                        {cards.map(card => {
                            const overdue = isOverdue(card.dueDate);
                            const dueSoon = isDueSoon(card.dueDate);
                            return (
                                <Link
                                    key={card._id}
                                    to={`/board/${card.board?._id}`}
                                    className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${overdue ? 'bg-rose-500' : dueSoon ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                {card.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs text-slate-400 dark:text-slate-450 font-medium">
                                                    {card.board?.name || '—'}
                                                </span>
                                                {card.column?.name && (
                                                    <>
                                                        <span className="text-slate-200 dark:text-slate-700">·</span>
                                                        <span className="text-xs text-slate-400 dark:text-slate-450">{card.column.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {card.dueDate && (
                                        <div className={`shrink-0 ml-4 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                            overdue
                                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                                                : dueSoon
                                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}>
                                            {overdue ? 'Overdue · ' : dueSoon ? 'Due soon · ' : ''}
                                            {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyTasksPage;

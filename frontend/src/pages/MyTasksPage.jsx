import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authstore';
import { getMyTasks } from '../api/card.api';

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
        <div className="min-h-screen bg-slate-50/50 antialiased font-sans">
            <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-40 flex items-center px-6 sm:px-8 shadow-sm gap-4">
                <Link to="/dashboard"
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-all group bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
                    <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                    <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <span className="text-slate-300 text-lg font-light">/</span>
                <h1 className="font-extrabold text-slate-900 text-base tracking-tight">My Tasks</h1>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-slate-800 font-bold text-lg mb-1">No tasks assigned</p>
                        <p className="text-slate-400 text-sm">Cards assigned to you will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 font-medium mb-5">{cards.length} task{cards.length !== 1 ? 's' : ''} assigned to you</p>
                        {cards.map(card => {
                            const overdue = isOverdue(card.dueDate);
                            const dueSoon = isDueSoon(card.dueDate);
                            return (
                                <Link
                                    key={card._id}
                                    to={`/board/${card.board?._id}`}
                                    className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${overdue ? 'bg-rose-500' : dueSoon ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                                {card.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {card.board?.name || '—'}
                                                </span>
                                                {card.column?.name && (
                                                    <>
                                                        <span className="text-slate-200">·</span>
                                                        <span className="text-xs text-slate-400">{card.column.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {card.dueDate && (
                                        <div className={`shrink-0 ml-4 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                            overdue
                                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                : dueSoon
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-slate-50 text-slate-500 border-slate-200'
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

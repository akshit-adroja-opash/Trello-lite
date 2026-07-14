
const ReportActions = ({
    user,
    onFullReport,
    onClientReport,
}) => {
    const role = user?.role;
    const canGenerateFull = role === "admin" || role === "project_manager";
    const canGenerateClient = role === "admin" || role === "project_manager" || role === "client";
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {canGenerateFull && (
                <button
                    onClick={onFullReport}
                    className="h-11 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m3 6V7m3 10v-4m-6 4h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Generate Full Report (PDF)
                </button>
            )}

            {canGenerateClient && (
                <button
                    onClick={onClientReport}
                    className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Generate Client Report (PDF)
                </button>
            )}

            {!canGenerateFull && !canGenerateClient && (
                <p className="text-sm text-slate-400 dark:text-slate-500">You do not have permission to generate reports.</p>
            )}
        </div>
    );
};

export default ReportActions;

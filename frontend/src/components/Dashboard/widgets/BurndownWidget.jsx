import { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import useThemeStore from '../../../store/themeStore';

export default function BurndownWidget({ data: propData }) {
  const darkMode = useThemeStore(s => s.darkMode);
  const [viewMode, setViewMode] = useState('burndown'); // 'burndown' or 'velocity'

  // Generate responsive burndown timeline data based on current sprint or props
  const chartData = useMemo(() => {
    if (propData && propData.length > 0) return propData;

    // Simulated 14-day Sprint Burndown & Velocity Data
    return [
      { day: 'Day 1', ideal: 40, actual: 40, velocity: 0 },
      { day: 'Day 2', ideal: 37, actual: 39, velocity: 1 },
      { day: 'Day 3', ideal: 34, actual: 35, velocity: 4 },
      { day: 'Day 4', ideal: 31, actual: 32, velocity: 3 },
      { day: 'Day 5', ideal: 28, actual: 30, velocity: 2 },
      { day: 'Day 6', ideal: 25, actual: 24, velocity: 6 },
      { day: 'Day 7', ideal: 22, actual: 21, velocity: 3 },
      { day: 'Day 8', ideal: 19, actual: 18, velocity: 3 },
      { day: 'Day 9', ideal: 16, actual: 14, velocity: 4 },
      { day: 'Day 10', ideal: 13, actual: 11, velocity: 3 },
      { day: 'Day 11', ideal: 10, actual: 9, velocity: 2 },
      { day: 'Day 12', ideal: 7, actual: 5, velocity: 4 },
      { day: 'Day 13', ideal: 4, actual: 2, velocity: 3 },
      { day: 'Day 14', ideal: 0, actual: 0, velocity: 2 },
    ];
  }, [propData]);

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-xl border border-outline-variant dark:border-slate-700 shadow-sm flex flex-col justify-between h-full min-h-[360px]">
      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">trending_down</span>
            <div>
              <h3 className="font-title-md text-[18px] font-bold text-on-surface dark:text-white">
                Sprint Velocity & Burndown
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">Current 2-Week Sprint Trajectory</p>
            </div>
          </div>

          <div className="flex gap-1 bg-surface-container dark:bg-slate-700/80 p-1 rounded-lg border border-outline-variant/60 dark:border-slate-600">
            <button
              onClick={() => setViewMode('burndown')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'burndown'
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Burndown
            </button>
            <button
              onClick={() => setViewMode('velocity')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'velocity'
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Velocity
            </button>
          </div>
        </div>

        <div className="h-[240px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'burndown' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: darkMode ? '#ffffff' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="actual" name="Actual Remaining" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#actualGrad)" />
              </AreaChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: darkMode ? '#ffffff' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="velocity" name="Daily Completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#velocityGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-outline-variant/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-on-surface-variant dark:text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            {viewMode === 'burndown' ? 'Actual Tasks' : 'Completed Cards'}
          </div>
          {viewMode === 'burndown' && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-0.5 bg-slate-400"></span> Ideal Burn
            </div>
          )}
        </div>
        <span className="font-semibold text-purple-600 dark:text-purple-400">Sprint 12 On Track</span>
      </div>
    </div>
  );
}

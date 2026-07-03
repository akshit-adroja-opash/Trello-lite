import { useState, useMemo } from 'react';
import useAuthStore from '../../store/authstore';

function WidgetItem({ children, colSpan = 'col-span-1' }) {
  return (
    <div className={`${colSpan} relative transition-all duration-200`}>
      <div className="h-full">
        {children}
      </div>
    </div>
  );
}

export default function WidgetContainer({
  widgets = [],
  context = 'dashboard',
  defaultOrder = [],
  defaultHidden = [],
  title = 'Dashboard Analytics',
  showHeader = true,
  showModal = undefined,
  onShowModalChange = undefined
}) {
  const user = useAuthStore(s => s.user);
  const updatePreferences = useAuthStore(s => s.updatePreferences);
  const [internalShowModal, setInternalShowModal] = useState(false);
  const showCustomizeModal = showModal !== undefined ? showModal : internalShowModal;
  const setShowCustomizeModal = (val) => {
    if (onShowModalChange) onShowModalChange(val);
    else setInternalShowModal(val);
  };

  // Retrieve saved preferences for this context
  const savedContextPrefs = useMemo(() => {
    const prefs = user?.preferences?.dashboardWidgets?.[context];
    return prefs || {};
  }, [user, context]);

  const activeOrder = useMemo(() => {
    if (defaultOrder.length > 0) {
      const validDef = defaultOrder.filter(id => widgets.some(w => w.id === id));
      const missing = widgets.map(w => w.id).filter(id => !validDef.includes(id));
      return [...validDef, ...missing];
    }
    return widgets.map(w => w.id);
  }, [widgets, defaultOrder]);

  const activeHidden = useMemo(() => {
    if (savedContextPrefs.hidden && Array.isArray(savedContextPrefs.hidden)) {
      return savedContextPrefs.hidden;
    }
    return defaultHidden || [];
  }, [savedContextPrefs.hidden, defaultHidden]);

  // Sort widgets according to activeOrder
  const sortedWidgets = useMemo(() => {
    const map = new Map(widgets.map(w => [w.id, w]));
    return activeOrder
      .map(id => map.get(id))
      .filter(w => w && !activeHidden.includes(w.id));
  }, [widgets, activeOrder, activeHidden]);

  const toggleWidgetVisibility = (widgetId) => {
    const isHidden = activeHidden.includes(widgetId);
    const nextHidden = isHidden
      ? activeHidden.filter(id => id !== widgetId)
      : [...activeHidden, widgetId];

    updatePreferences({
      dashboardWidgets: {
        [context]: {
          order: activeOrder,
          hidden: nextHidden
        }
      }
    });
  };

  const handleResetToDefault = () => {
    const fallbackOrder = defaultOrder.length > 0 ? defaultOrder : widgets.map(w => w.id);
    updatePreferences({
      dashboardWidgets: {
        [context]: {
          order: fallbackOrder,
          hidden: defaultHidden || []
        }
      }
    });
    setShowCustomizeModal(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header bar */}
      {showHeader && (
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-outline-variant/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">space_dashboard</span>
            <div>
              <h2 className="font-title-lg text-[20px] font-bold text-on-surface dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Customize visible dashboard widgets and analytics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomizeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container dark:bg-slate-800 border border-outline-variant dark:border-slate-700 hover:bg-surface-container-high dark:hover:bg-slate-700/80 text-on-surface dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            <span>Customize View</span>
            {activeHidden.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-extrabold ml-0.5">
                {widgets.length - activeHidden.length}/{widgets.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Grid of widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {sortedWidgets.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center bg-surface-container-lowest dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-outline-variant dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant dark:text-slate-500 mb-2">
              dashboard_customize
            </span>
            <h4 className="font-title-md font-bold text-on-surface dark:text-white mb-1">
              All Widgets Are Hidden
            </h4>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-sm mx-auto mb-4">
              You have hidden all dashboard analytics widgets. Click customization below to enable them.
            </p>
            <button
              type="button"
              onClick={() => setShowCustomizeModal(true)}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Show Widgets
            </button>
          </div>
        ) : (
          sortedWidgets.map(w => {
            const Component = w.component;
            return (
              <WidgetItem
                key={w.id}
                colSpan={w.colSpan || 'col-span-1 md:col-span-1 lg:col-span-1'}
              >
                {typeof Component === 'function' ? (
                  <Component {...(w.props || {})} />
                ) : (
                  Component
                )}
              </WidgetItem>
            );
          })
        )}
      </div>

      {/* Customize Modal / Drawer */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">dashboard_customize</span>
                <h3 className="font-title-md font-bold text-on-surface dark:text-white">
                  Customize Dashboard Widgets
                </h3>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                Toggle switches to show or hide widgets from your workspace view. Your preference is saved automatically.
              </p>

              <div className="space-y-2 pt-2">
                {widgets.map(w => {
                  const isVisible = !activeHidden.includes(w.id);
                  return (
                    <div
                      key={w.id}
                      onClick={() => toggleWidgetVisibility(w.id)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/80 dark:border-slate-700 cursor-pointer hover:border-secondary hover:shadow-sm transition-all select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary/10 dark:bg-indigo-950/60 flex items-center justify-center text-secondary dark:text-indigo-400 shrink-0">
                          <span className="material-symbols-outlined text-[20px]">{w.icon || 'widgets'}</span>
                        </div>
                        <div>
                          <span className="font-body-md font-bold text-sm text-on-surface dark:text-white block">
                            {w.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant dark:text-slate-400">
                            {w.colSpan ? (w.colSpan.includes('col-span-2') ? 'Wide Widget' : 'Standard Widget') : 'Standard Widget'}
                          </span>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWidgetVisibility(w.id);
                        }}
                        className="w-5 h-5 rounded-md text-secondary focus:ring-secondary border-outline-variant dark:border-slate-600 bg-surface-container-lowest dark:bg-slate-800 cursor-pointer transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant dark:border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 hover:text-secondary dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-container dark:hover:bg-slate-700/50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset to Role Default
              </button>

              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="px-5 py-2 bg-secondary text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

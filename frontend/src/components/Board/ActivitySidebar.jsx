import { useEffect, useState } from "react";
import API from "../../api/axios";

const ActivitySidebar = ({ boardId }) => {

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

 
    useEffect(() => {

        const fetchActivities = async () => {

            try {

                const res = await API.get(
                    `/activities/board/${boardId}`
                );

                setActivities(
                    res.data.activities || []
                );

            } catch (error) {

                console.error(
                    "Failed to fetch activities",
                    error
                );

            } finally {

                setLoading(false);
            }
        };

        if (boardId) {
            fetchActivities();
        }

    }, [boardId]);

   

    const formatTime = (date) => {

        const now = new Date();
        const activityDate = new Date(date);

        const diff =
            Math.floor(
                (now - activityDate) / 1000
            );

        if (diff < 60) {
            return `${diff}s ago`;
        }

        if (diff < 3600) {
            return `${Math.floor(diff / 60)}m ago`;
        }

        if (diff < 86400) {
            return `${Math.floor(diff / 3600)}h ago`;
        }

        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="w-[320px] h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700/50 flex flex-col transition-colors duration-200">

            {/* HEADER */}

            <div className="p-4 border-b border-slate-200 dark:border-slate-700">

                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Activity Feed
                </h2>

                <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
                    Live board activity
                </p>

            </div>

            {/* BODY */}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {loading && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Loading activities...
                    </p>
                )}

                {!loading &&
                    activities.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No activities yet
                        </p>
                    )}

                {activities.map((activity) => (

                    <div
                        key={activity._id}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3"
                    >

                        {/* USER */}

                        <div className="flex items-center gap-2 mb-2">

                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">

                                {activity.user?.username?.[0] || "U"}

                            </div>

                            <div>

                                <p className="text-sm font-semibold text-slate-800 dark:text-white">

                                    {activity.user?.username || "User"}

                                </p>

                                <p className="text-xs text-slate-400 dark:text-slate-450">

                                    {formatTime(
                                        activity.createdAt
                                    )}

                                </p>

                            </div>

                        </div>

                        {/* ACTION */}

                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">

                            {activity.details}

                        </p>

                    </div>
                ))}

            </div>
        </div>
    );
};

export default ActivitySidebar;



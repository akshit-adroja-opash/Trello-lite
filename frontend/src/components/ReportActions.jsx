import React from "react";

const ReportActions = ({
    user,
    onFullReport,
    onClientReport,
}) => {

    return (
        <div className="flex gap-4">

            {(user.role === "admin" ||
                user.role === "pm") && (
                <button
                    onClick={onFullReport}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Generate Full Report
                </button>
            )}

            {(user.role === "admin" ||
                user.role === "pm" ||
                user.role === "client") && (
                <button
                    onClick={onClientReport}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Generate Client Report
                </button>
            )}
        </div>
    );
};

export default ReportActions;
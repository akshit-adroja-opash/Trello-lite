import mongoose from "mongoose";
import Card from "../models/Card.js";
import Column from "../models/Column.js";
import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import User from "../models/User.js";

export const getWorkspaceAnalytics = async (req, res) => {
    try {

        const { workspaceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid workspace ID"
            });
        }

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        // Check if the user is the Admin or a member of the workspace
        const isAdmin = workspace.Admin?.toString() === req.user._id.toString();
        const isMember = workspace.members.some(
            member => member.user?.toString() === req.user._id.toString()
        );

        if (!isAdmin && !isMember) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this workspace analytics"
            });
        }

        // =========================
        // BOARDS IN WORKSPACE
        // =========================
        const boards = await Board.find({ workspace: workspaceId }).select("_id");
        const boardIds = boards.map(board => board._id);
        const boardObjectIds = boardIds.map(id => new mongoose.Types.ObjectId(id));

        // =========================
        // TOTAL COUNTS
        // =========================

        const totalCards = await Card.countDocuments({
            board: { $in: boardIds }
        });

        const totalColumns = await Column.countDocuments({
            board: { $in: boardIds }
        });

        // =========================
        // DONE COLUMN IDS
        // =========================

        const doneColumns = await Column.find({
            board: { $in: boardIds },
            name: { $regex: /done/i }
        }).select("_id");

        const doneColumnIds = doneColumns.map(col => col._id);

        // =========================
        // COMPLETED TASKS
        // =========================

        const completedTasks = await Card.countDocuments({
            board: { $in: boardIds },
            column: { $in: doneColumnIds }
        });

        const completedRatio =
            totalCards === 0
                ? 0
                : Math.round((completedTasks / totalCards) * 100);

        // =========================
        // OVERDUE TASKS
        // =========================

        const overdueTasks = await Card.countDocuments({
            board: { $in: boardIds },
            dueDate: { $lt: new Date() },
            column: { $nin: doneColumnIds }
        });

        // =========================
        // ACTIVE BLOCKERS
        // =========================

        const activeBlockers = await Card.countDocuments({
            board: { $in: boardIds },
            blocked: true
        });

        // =========================
        // AVERAGE LEAD TIME
        // =========================

        const completedCardsInfo = await Card.find({
            board: { $in: boardIds },
            column: { $in: doneColumnIds }
        }).select("createdAt updatedAt");

        let avgLeadTime = 0;
        if (completedCardsInfo.length > 0) {
            const totalLeadTime = completedCardsInfo.reduce((acc, card) => {
                const diffTime = Math.abs(card.updatedAt - card.createdAt);
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return acc + diffDays;
            }, 0);
            avgLeadTime = Math.round((totalLeadTime / completedCardsInfo.length) * 10) / 10;
        }

        // =========================
        // WORKLOAD DISTRIBUTION
        // =========================

        const workloadStats = await Card.aggregate([
            {
                $match: {
                    board: { $in: boardObjectIds }
                }
            },
            {
                $unwind: "$assignees"
            },
            {
                $lookup: {
                    from: "columns",
                    localField: "column",
                    foreignField: "_id",
                    as: "columnDoc"
                }
            },
            {
                $unwind: "$columnDoc"
            },
            {
                $group: {
                    _id: "$assignees",
                    totalCount: { $sum: 1 },
                    completedCount: {
                        $sum: {
                            $cond: [
                                { $regexMatch: { input: "$columnDoc.name", regex: "done", options: "i" } },
                                1,
                                0
                            ]
                        }
                    },
                    blockedCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$blocked", true] },
                                1,
                                0
                            ]
                        }
                    },
                    reviewCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $regexMatch: { input: "$columnDoc.name", regex: "review", options: "i" } },
                                        { $ne: ["$blocked", true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    progressCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $not: [{ $regexMatch: { input: "$columnDoc.name", regex: "done", options: "i" } }] },
                                        { $not: [{ $regexMatch: { input: "$columnDoc.name", regex: "review", options: "i" } }] },
                                        { $ne: ["$blocked", true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 0,
                    username: "$user.username",
                    avatar: "$user.avatar",
                    totalCount: 1,
                    completedCount: 1,
                    blockedCount: 1,
                    reviewCount: 1,
                    progressCount: 1
                }
            }
        ]);

        // =========================
        // STATUS DISTRIBUTION
        // =========================

        const statusDistribution = await Column.aggregate([
            {
                $match: {
                    board: { $in: boardObjectIds }
                }
            },
            {
                $lookup: {
                    from: "cards",
                    localField: "_id",
                    foreignField: "column",
                    as: "cards"
                }
            },
            {
                $group: {
                    _id: { $toLower: "$name" },
                    title: { $first: "$name" },
                    cardCount: { $sum: { $size: "$cards" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    cardCount: 1
                }
            }
        ]);

        // =========================
        // PRODUCTIVITY TIMELINE
        // =========================

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const productivityTimeline = await Card.aggregate([
            {
                $match: {
                    board: { $in: boardObjectIds },
                    updatedAt: { $gte: last30Days },
                    column: { $in: doneColumnIds }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$updatedAt"
                        }
                    },
                    completed: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // =========================
        // ROLE PERFORMANCE SUMMARY
        // =========================

        // 1. Gather all users who are members/admin of the workspace, and map their workspace roles
        const allWorkspaceUsers = [];
        if (workspace.Admin) {
            const adminUser = await User.findById(workspace.Admin).select("role username");
            if (adminUser) {
                allWorkspaceUsers.push({
                    userId: adminUser._id.toString(),
                    role: "admin",
                    username: adminUser.username
                });
            }
        }

        for (const m of workspace.members) {
            if (m.user) {
                const memberUser = await User.findById(m.user).select("role username");
                if (memberUser) {
                    allWorkspaceUsers.push({
                        userId: memberUser._id.toString(),
                        role: m.role || "client",
                        username: memberUser.username
                    });
                }
            }
        }

        // 2. Count active members per role
        const roleMembersCount = { admin: 0, project_manager: 0, developer: 0, client: 0 };
        allWorkspaceUsers.forEach(u => {
            const roleKey = u.role === "admin" ? "admin" :
                            u.role === "project_manager" ? "project_manager" :
                            u.role === "developer" ? "developer" : "client";
            if (roleMembersCount[roleKey] !== undefined) {
                roleMembersCount[roleKey]++;
            }
        });

        // 3. Count tasks assigned to users of each role
        const roleTasksCount = { admin: 0, project_manager: 0, developer: 0, client: 0 };
        const roleCompletionTimes = { admin: [], project_manager: [], developer: [], client: [] };

        const cardsWithAssignees = await Card.find({ board: { $in: boardIds } })
            .select("assignees createdAt updatedAt column")
            .populate("column", "name");

        cardsWithAssignees.forEach(card => {
            if (!card.assignees) return;
            card.assignees.forEach(assigneeId => {
                if (!assigneeId) return;
                const wsUser = allWorkspaceUsers.find(u => u.userId === assigneeId.toString());
                if (wsUser) {
                    const roleKey = wsUser.role === "admin" ? "admin" :
                                    wsUser.role === "project_manager" ? "project_manager" :
                                    wsUser.role === "developer" ? "developer" : "client";
                    roleTasksCount[roleKey] = (roleTasksCount[roleKey] || 0) + 1;
                    const isDone = card.column && typeof card.column === "object" && card.column.name && /done/i.test(card.column.name);
                    if (isDone) {
                        const diffTime = Math.abs(card.updatedAt - card.createdAt);
                        const diffDays = diffTime / (1000 * 60 * 60 * 24);
                        roleCompletionTimes[roleKey].push(diffDays);
                    }
                }
            });
        });

        // 4. Calculate average completion time and construct role summary list
        const roles = ["admin", "project_manager", "developer", "client"];
        const rolePerformance = roles.map(role => {
            const memberCount = roleMembersCount[role] || 0;
            const tasksAssigned = roleTasksCount[role] || 0;
            const completionTimesList = roleCompletionTimes[role] || [];

            let avgCompletion = "0.0 days";
            if (completionTimesList.length > 0) {
                const sum = completionTimesList.reduce((a, b) => a + b, 0);
                avgCompletion = `${(sum / completionTimesList.length).toFixed(1)} days`;
            }

            let status = "Optimal";
            if (role === "developer" && tasksAssigned > 0) {
                status = "High Load";
            }

            return {
                role,
                activeMembers: memberCount,
                tasksAssigned: tasksAssigned,
                avgCompletion,
                status
            };
        });

        // =========================
        // TREND CALCULATIONS (Current 30 vs Prev 30)
        // =========================
        const prev30Start = new Date(last30Days);
        prev30Start.setDate(prev30Start.getDate() - 30);

        const prevTotalCards = await Card.countDocuments({
            board: { $in: boardIds },
            createdAt: { $lt: last30Days }
        });

        const prevCompletedTasks = await Card.countDocuments({
            board: { $in: boardIds },
            column: { $in: doneColumnIds },
            updatedAt: { $lt: last30Days }
        });

        const prevCompletedRatio = prevTotalCards === 0 ? 0 : Math.round((prevCompletedTasks / prevTotalCards) * 100);

        const prevActiveBlockers = await Card.countDocuments({
            board: { $in: boardIds },
            blocked: true,
            createdAt: { $lt: last30Days }
        });

        let trends = {
            totalCards: prevTotalCards > 0 ? Math.round(((totalCards - prevTotalCards) / prevTotalCards) * 100) : (totalCards > 0 ? 100 : 0),
            completionRate: completedRatio - prevCompletedRatio,
            activeBlockers: activeBlockers - prevActiveBlockers,
            avgLeadTime: 0 
        };

        return res.status(200).json({
            success: true,
            analytics: {
                kpis: {
                    totalCards,
                    totalColumns,
                    completedTasks,
                    completedRatio,
                    overdueTasks,
                    activeBlockers,
                    avgLeadTime,
                    trends
                },
                workloadStats,
                statusDistribution,
                productivityTimeline,
                rolePerformance
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
            error: error.message,
            stack: error.stack
        });
    }
};

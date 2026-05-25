import mongoose from "mongoose";
import Card from "../models/Card.js";
import Column from "../models/Column.js";
import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";

export const getWorkspaceAnalytics = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "project_manager") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Only project managers and admins can view analytics"
            });
        }

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
                $group: {
                    _id: "$assignees",
                    cardCount: { $sum: 1 }
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
                    cardCount: 1
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
        // RESPONSE
        // =========================

        return res.status(200).json({
            success: true,
            analytics: {
                kpis: {
                    totalCards,
                    totalColumns,
                    completedTasks,
                    completedRatio,
                    overdueTasks
                },
                workloadStats,
                statusDistribution,
                productivityTimeline
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch analytics"
        });
    }
};
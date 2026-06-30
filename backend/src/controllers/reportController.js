import Board from "../models/Board.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Column from "../models/Column.js";
import Card from "../models/Card.js";
import Workspace from "../models/Workspace.js";
import { generatePDF } from "../utils/generatePDF.js";
import jwt from "jsonwebtoken";

export const generateFullReport = async (req, res) => {
    try {

        const { boardId } = req.params;

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        const columns = await Column.find({ board: boardId }).sort("order").lean();
        for (const col of columns) {
            col.cards = await Card.find({ column: col._id })
                .populate("assignees", "username email avatar")
                .sort("order")
                .lean();
        }

        const pdfPath = await generatePDF(
            {
                boardName: board.name,
                columns: columns,
            },
            `full-report-${Date.now()}.pdf`
        );

        const report = await Report.create({
            board: board._id,
            generatedBy: req.user._id,
            type: "full",
            pdfUrl: pdfPath,
        });

        res.status(200).json({
            success: true,
            report,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const generateClientReport = async (req, res) => {
    try {

        const { boardId } = req.params;

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        const columns = await Column.find({ board: boardId }).sort("order").lean();
        for (const col of columns) {
            col.cards = await Card.find({ column: col._id })
                .populate("assignees", "username email avatar")
                .sort("order")
                .lean();
        }

        const completedCards = [];

        columns.forEach((column) => {

            if (column.name.toLowerCase() === "done") {
                completedCards.push(...column.cards);
            }
        });

        const pdfPath = await generatePDF(
            {
                boardName: board.name,
                columns: [
                    {
                        title: "Completed Milestones",
                        cards: completedCards,
                    },
                ],
            },
            `client-report-${Date.now()}.pdf`
        );

        const report = await Report.create({
            board: board._id,
            generatedBy: req.user._id,
            type: "client",
            pdfUrl: pdfPath,
        });

        res.status(200).json({
            success: true,
            report,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const shareReportLink = async (req, res) => {

    const { reportId } = req.params;

    const token = jwt.sign(
        { reportId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const report = await Report.findByIdAndUpdate(
        reportId,
        { sharedToken: token },
        { new: true }
    );

    const protocol = req.protocol;
    const host = req.get('host');
    const shareUrl = `${protocol}://${host}/api/v1/reports/shared/${token}`;

    res.json({
        shareUrl,
        report,
    });
};

export const downloadSharedReport = async (req, res) => {

    const { token } = req.params;

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    const report = await Report.findById(decoded.reportId);

    if (!report) {
        return res.status(404).json({
            message: "Report not found",
        });
    }

    res.download(report.pdfUrl);
};

export const getRecentReports = async (req, res) => {
    try {
        const { boardId } = req.params;
        let filter = {};
        if (boardId) {
            filter = { board: boardId };
        } else {
            // Find all workspaces the user is a part of
            const workspaces = await Workspace.find({
                $or: [{ Admin: req.user._id }, { 'members.user': req.user._id }]
            }).select('_id');
            const workspaceIds = workspaces.map(w => w._id);
            
            // Find all boards in those workspaces
            const boards = await Board.find({ workspace: { $in: workspaceIds } }).select('_id');
            const boardIds = boards.map(b => b._id);
            
            filter = { board: { $in: boardIds } };
        }

        const reports = await Report.find(filter)
            .populate("board", "name")
            .populate("generatedBy", "username role")
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            reports
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
import Board from "../models/Board.js";
import Report from "../models/Report.js";
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

        const Column = (await import("../models/Column.js")).default;
        const Card = (await import("../models/Card.js")).default;

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

        const Column = (await import("../models/Column.js")).default;
        const Card = (await import("../models/Card.js")).default;

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
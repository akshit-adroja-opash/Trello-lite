import Board from "../models/Board.js";
import Report from "../models/Report.js";
import { generatePDF } from "../utils/generatePDF.js";
import jwt from "jsonwebtoken";

export const generateFullReport = async (req, res) => {
    try {

        const { boardId } = req.params;

        const board = await Board.findById(boardId)
            .populate({
                path: "columns",
                populate: {
                    path: "cards",
                },
            });

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        const pdfPath = await generatePDF(
            {
                boardName: board.title,
                columns: board.columns,
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

        const board = await Board.findById(boardId)
            .populate({
                path: "columns",
                populate: {
                    path: "cards",
                },
            });

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        const completedCards = [];

        board.columns.forEach((column) => {

            if (column.title.toLowerCase() === "done") {
                completedCards.push(...column.cards);
            }
        });

        const pdfPath = await generatePDF(
            {
                boardName: board.title,
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

    res.json({
        shareUrl: `http://localhost:5000/api/reports/shared/${token}`,
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
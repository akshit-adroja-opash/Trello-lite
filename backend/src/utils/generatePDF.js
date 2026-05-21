import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePDF = async (data, fileName) => {

    const reportsDir = path.join("uploads", "reports");

    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(24).text("Project Report", {
        align: "center",
    });

    doc.moveDown();

    doc.fontSize(18).text(`Board: ${data.boardName}`);

    doc.moveDown();

    doc.fontSize(14).text(`Generated At: ${new Date()}`);

    doc.moveDown();

    data.columns.forEach((column) => {
        doc.fontSize(18).text(column.name || column.title || "Unnamed Column");

        (column.cards || []).forEach((card) => {
            doc.fontSize(12).text(`• ${card.title}`);
        });

        doc.moveDown();
    });

    doc.end();

    return filePath.replace(/\\/g, '/');
};
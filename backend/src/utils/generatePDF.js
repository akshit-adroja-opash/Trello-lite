import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Color Palette
const COLOR_PRIMARY = "#2563EB";      // Blue 600
const COLOR_TEXT_MAIN = "#0F172A";    // Slate 900
const COLOR_TEXT_MUTED = "#64748B";   // Slate 500
const COLOR_BG_CARD = "#F8FAFC";      // Slate 50
const COLOR_BORDER = "#E2E8F0";       // Slate 200

// --- VECTOR ICON DRAWING HELPERS ---
const drawFileIcon = (doc, x, y, color = '#2563EB') => {
    doc.save();
    doc.lineWidth(1).strokeColor(color);
    doc.roundedRect(x, y, 9, 11, 1.5).stroke();
    doc.moveTo(x + 2.5, y + 3.5).lineTo(x + 6.5, y + 3.5).stroke();
    doc.moveTo(x + 2.5, y + 6).lineTo(x + 6.5, y + 6).stroke();
    doc.moveTo(x + 2.5, y + 8.5).lineTo(x + 5.5, y + 8.5).stroke();
    doc.restore();
};

const drawKanbanIcon = (doc, x, y, color = '#2563EB') => {
    doc.save();
    doc.lineWidth(1.2).strokeColor(color);
    doc.rect(x, y, 3, 10).stroke();
    doc.rect(x + 5, y, 3, 10).stroke();
    doc.rect(x + 10, y, 3, 10).stroke();
    doc.restore();
};

const drawInsightsIcon = (doc, x, y, color = '#2563EB') => {
    doc.save();
    doc.lineWidth(1.2).strokeColor(color);
    doc.moveTo(x, y + 8).lineTo(x + 3, y + 5).lineTo(x + 6, y + 7).lineTo(x + 11, y + 2).stroke();
    doc.moveTo(x + 8, y + 2).lineTo(x + 11, y + 2).lineTo(x + 11, y + 5).stroke();
    doc.restore();
};

const drawWarningIcon = (doc, x, y, color = '#EF4444') => {
    doc.save();
    doc.lineWidth(1).strokeColor(color);
    doc.moveTo(x + 6, y).lineTo(x, y + 11).lineTo(x + 12, y + 11).closePath().stroke();
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor(color).text("!", x + 4.5, y + 2.5);
    doc.restore();
};

const drawClockIcon = (doc, x, y, color = '#10B981') => {
    doc.save();
    doc.lineWidth(1).strokeColor(color);
    doc.circle(x + 6, y + 6, 5).stroke();
    doc.moveTo(x + 6, y + 3).lineTo(x + 6, y + 6).lineTo(x + 8.5, y + 6).stroke();
    doc.restore();
};

const drawInternalReportBadge = (doc, x, y) => {
    doc.save();
    doc.roundedRect(x, y, 80, 15, 7.5).fillColor('#2563EB').fill();
    drawFileIcon(doc, x + 6, y + 2, '#FFFFFF');
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#FFFFFF').text("Internal Report", x + 19, y + 4.5);
    doc.restore();
};

// Draw footer on the current page
const drawFooter = (doc, boardName) => {
    doc.save();
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const footerY = doc.page.height - 35;
    doc.rect(0, footerY, doc.page.width, 35).fillColor('#F8FAFC').fill();
    doc.moveTo(0, footerY).lineTo(doc.page.width, footerY).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#94A3B8');
    const cleanBoardName = (boardName || "BOARD").toUpperCase().replace(/[^A-Z0-9]/g, '');
    const reportIdText = `REPORT ID: TR-2026-${cleanBoardName}-001`;
    doc.text(reportIdText, 40, footerY + 12);

    doc.fontSize(8).font("Helvetica-Bold").fillColor('#CBD5E1');
    doc.text("Trellolite", 40, footerY + 10, { align: 'right', width: doc.page.width - 80 });

    doc.page.margins.bottom = oldBottom;
    doc.restore();
};

// Draw header on continuation pages
const drawContinuationHeader = (doc, boardName) => {
    doc.save();
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.strokeColor(COLOR_BORDER).lineWidth(0.5);
    doc.moveTo(40, 30).lineTo(doc.page.width - 40, 30).stroke();

    doc.fontSize(7.5)
       .fillColor(COLOR_TEXT_MUTED)
       .font("Helvetica-Bold")
       .text("TRELLO-LITE BOARD STATUS", 40, 18);

    doc.font("Helvetica")
       .text(`BOARD: ${(boardName || "BOARD").toUpperCase()}`, 40, 18, { align: "right", width: doc.page.width - 80 });

    doc.page.margins.bottom = oldBottom;
    doc.restore();
};

export const generatePDF = async (data, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            const reportsDir = path.join("uploads", "reports");

            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const filePath = path.join(reportsDir, fileName);

            // No bufferPages — pages render immediately to avoid blank page accumulation
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 40, bottom: 60, left: 40, right: 40 },
                autoFirstPage: true,
            });

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            let isFirstPage = true;

            // Draw footer + continuation header automatically on every new page added
            doc.on('pageAdded', () => {
                if (!isFirstPage) {
                    drawContinuationHeader(doc, data.boardName);
                }
                drawFooter(doc, data.boardName);
                isFirstPage = false;
            });

            // Trigger first page initialization
            isFirstPage = false;

            // --- STATISTICS ---
            let totalCards = 0;
            let completedCount = 0;
            const uniqueAssignees = new Set();
            const now = new Date();
            let overdueCount = 0;

            data.columns.forEach((col) => {
                const count = col.cards?.length || 0;
                totalCards += count;

                const isDoneCol = col.name?.toLowerCase() === "done" || col.title?.toLowerCase() === "completed milestones";
                if (isDoneCol) {
                    completedCount += count;
                }

                col.cards?.forEach((card) => {
                    card.assignees?.forEach((asn) => {
                        if (!asn) return;
                        const identifier = asn.username || asn.email || (typeof asn === "string" ? asn : null);
                        if (identifier) uniqueAssignees.add(identifier);
                    });

                    if (!isDoneCol && card.dueDate && new Date(card.dueDate) < now) {
                        overdueCount++;
                    }
                });
            });

            const completionRate = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0;

            // FOOTER_HEIGHT = 35, so effective bottom boundary is page.height - 60 (margins.bottom)
            // ensureSpace checks remaining usable space before adding a new page
            const FOOTER_AREA = 60;
            const ensureSpace = (height) => {
                const usableBottom = doc.page.height - FOOTER_AREA;
                if (doc.y + height > usableBottom) {
                    doc.addPage();
                    // After addPage, reset y to below the continuation header
                    doc.y = 45;
                }
            };

            // Draw footer on the very first page (pageAdded doesn't fire for page 1)
            drawFooter(doc, data.boardName);

            // --- HEADER PORTION ---
            drawInternalReportBadge(doc, 40, 40);

            // Generated at top-right
            doc.save();
            doc.fontSize(6).font("Helvetica-Bold").fillColor('#94A3B8').text("GENERATED AT", doc.page.width - 160, 40, { align: 'right', width: 120 });

            const formattedDate = new Date().toLocaleDateString("en-US", {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
            const formattedTime = new Date().toTimeString().split(' ')[0] + ' ' + new Date().toTimeString().split(' ')[1];

            doc.fontSize(7.5).font("Helvetica-Bold").fillColor('#1E293B').text(formattedDate, doc.page.width - 160, 48, { align: 'right', width: 120 });
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#64748B').text(formattedTime, doc.page.width - 160, 57, { align: 'right', width: 120 });
            doc.restore();

            // Board Status title & subtitle
            doc.fontSize(18).font("Helvetica-Bold").fillColor('#0F172A').text(`${data.boardName} Board Status`, 40, 72);
            doc.fontSize(8.5).font("Helvetica").fillColor('#64748B').text("Quarterly performance and task lifecycle overview.", 40, 93);

            // Summary row grid
            const gridY = 115;
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#94A3B8').text("BOARD IDENTIFIER", 40, gridY);
            doc.fontSize(10).font("Helvetica-Bold").fillColor('#0F172A').text(data.boardName.toLowerCase(), 40, gridY + 10);

            doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#94A3B8').text("TOTAL TASKS", 180, gridY);
            doc.fontSize(10).font("Helvetica-Bold").fillColor('#0F172A').text(totalCards.toString(), 180, gridY + 10);

            doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#94A3B8').text("COMPLETION RATE", 320, gridY);
            doc.fontSize(10).font("Helvetica-Bold").fillColor('#0F172A').text(`${completionRate}%`, 320, gridY + 10);

            // Divider line
            doc.save();
            doc.lineWidth(0.5).strokeColor('#E2E8F0').moveTo(40, 148).lineTo(doc.page.width - 40, 148).stroke();
            doc.restore();

            // --- EXECUTIVE SUMMARY ---
            let currentY = 165;
            drawFileIcon(doc, 40, currentY, '#2563EB');
            doc.fontSize(9.5).font("Helvetica-Bold").fillColor('#0F172A').text("Executive Summary", 55, currentY + 1);

            currentY += 15;
            const execBoxH = 62;
            doc.save();
            doc.roundedRect(40, currentY, doc.page.width - 80, execBoxH, 4).fillColor('#F8FAFC').fill();
            doc.roundedRect(40, currentY, doc.page.width - 80, execBoxH, 4).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
            doc.lineWidth(3).strokeColor('#2563EB').moveTo(40.5, currentY + 5).lineTo(40.5, currentY + execBoxH - 5).stroke();

            const execSummaryText = `This report provides a snapshot of the current development velocity for board ${data.boardName}. As of the generation date, the project shows a current task distribution across ${data.columns.length} pipeline stage(s). Review overdue items and backlog status to maintain operational milestones.`;
            doc.fontSize(8.5).font("Helvetica").fillColor('#475569').text(execSummaryText, 52, currentY + 10, { width: doc.page.width - 104, lineGap: 2.5 });
            doc.restore();

            currentY += execBoxH + 18;
            doc.y = currentY;

            // --- TASK LIFECYCLE STATUS ---
            ensureSpace(50);
            const cycleY = doc.y;
            drawKanbanIcon(doc, 40, cycleY, '#2563EB');
            doc.fontSize(9.5).font("Helvetica-Bold").fillColor('#0F172A').text("Task Lifecycle Status", 58, cycleY + 1);

            doc.y = cycleY + 16;

            // Render columns in a 2-column grid
            const colWidth = (doc.page.width - 80 - 15) / 2;
            const colGap = 15;

            const drawColumnCard = (x, y, w, h, col) => {
                doc.save();
                doc.roundedRect(x, y, w, h, 6).fillColor('#F8FAFC').fill();
                doc.roundedRect(x, y, w, h, 6).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

                const colName = col.name || col.title || "Unnamed";
                const nameLower = colName.toLowerCase();

                let headerBg = '#F1F5F9';
                let indicatorColor = '#64748B';
                let textColor = '#1E293B';

                if (nameLower.includes('backlog') || nameLower.includes('to do')) {
                    headerBg = '#F1F5F9';
                    indicatorColor = '#64748B';
                } else if (nameLower.includes('progress')) {
                    headerBg = '#EFF6FF';
                    indicatorColor = '#2563EB';
                    textColor = '#1E40AF';
                } else if (nameLower.includes('review')) {
                    headerBg = '#F5F3FF';
                    indicatorColor = '#7C3AED';
                    textColor = '#5B21B6';
                } else if (nameLower.includes('done') || nameLower.includes('completed')) {
                    headerBg = '#ECFDF5';
                    indicatorColor = '#10B981';
                    textColor = '#065F46';
                }

                doc.save();
                doc.roundedRect(x, y, w, h, 6).clip();
                doc.rect(x, y, w, 24).fillColor(headerBg).fill();
                doc.restore();

                doc.save();
                doc.fillColor(indicatorColor);
                doc.circle(x + 10, y + 12, 2.5).fill();
                doc.restore();

                doc.fontSize(8).font("Helvetica-Bold").fillColor(textColor).text(colName.toUpperCase(), x + 18, y + 8);

                const count = col.cards?.length || 0;
                const countText = `${count} ${count === 1 ? 'ITEM' : 'ITEMS'}`;
                const pillW = doc.widthOfString(countText, { font: "Helvetica-Bold", size: 6 }) + 8;

                doc.save();
                doc.roundedRect(x + w - 10 - pillW, y + 6, pillW, 12, 6).fillColor(indicatorColor).fill();
                doc.fontSize(6).font("Helvetica-Bold").fillColor('#FFFFFF').text(countText, x + w - 10 - pillW + 4, y + 9);
                doc.restore();

                let taskY = y + 30;
                if (count === 0) {
                    doc.save();
                    doc.dash(3, { space: 3 });
                    doc.roundedRect(x + 8, taskY, w - 16, 42, 4).strokeColor('#CBD5E1').stroke();
                    doc.undash();

                    let emptyMsg = "No active tasks";
                    if (nameLower.includes('review')) {
                        emptyMsg = "No active pull requests";
                    } else if (nameLower.includes('done')) {
                        emptyMsg = "No tasks completed in this period";
                    }

                    doc.fontSize(7.5).font("Helvetica-Oblique").fillColor('#94A3B8').text(emptyMsg, x + 12, taskY + 16, { width: w - 24, align: 'center' });
                    doc.restore();
                } else {
                    col.cards.forEach((card) => {
                        doc.save();
                        doc.roundedRect(x + 8, taskY, w - 16, 22, 4).fillColor('#FFFFFF').fill();
                        doc.roundedRect(x + 8, taskY, w - 16, 22, 4).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

                        doc.fontSize(8).font("Helvetica-Bold").fillColor('#1E293B').text(card.title || "Untitled Task", x + 14, taskY + 7, { width: w - 80 });

                        let prioText = "";
                        let prioColor = '#94A3B8';
                        if (card.labels && card.labels.length > 0) {
                            const prioLabel = card.labels.find(l => l.name.toLowerCase().includes('prio') || l.name.toLowerCase().includes('high') || l.name.toLowerCase().includes('mid') || l.name.toLowerCase().includes('low'));
                            if (prioLabel) {
                                prioText = prioLabel.name.toUpperCase();
                                prioColor = prioLabel.color || '#94A3B8';
                            }
                        }

                        if (prioText) {
                            doc.fontSize(6).font("Helvetica-Bold").fillColor(prioColor).text(prioText, x + w - 75, taskY + 8, { width: 60, align: 'right' });
                        } else if (nameLower.includes('progress')) {
                            doc.fillColor('#3B82F6').circle(x + w - 18, taskY + 11, 2.5).fill();
                        }

                        doc.restore();
                        taskY += 28;
                    });
                }

                doc.restore();
            };

            for (let i = 0; i < data.columns.length; i += 2) {
                const col1 = data.columns[i];
                const col2 = data.columns[i + 1];

                const h1 = 24 + (col1.cards?.length ? col1.cards.length * 28 - 6 : 42) + 12;
                const h2 = col2 ? (24 + (col2.cards?.length ? col2.cards.length * 28 - 6 : 42) + 12) : 0;
                const rowHeight = Math.max(h1, h2);

                ensureSpace(rowHeight + 25);

                const startY = doc.y;

                drawColumnCard(40, startY, colWidth, h1, col1);

                if (col2) {
                    drawColumnCard(40 + colWidth + colGap, startY, colWidth, h2, col2);
                }

                doc.y = startY + rowHeight + 15;
            }

            // --- INSIGHTS & PROJECTIONS ---
            ensureSpace(70);
            const insightY = doc.y;
            drawInsightsIcon(doc, 40, insightY, '#2563EB');
            doc.fontSize(9.5).font("Helvetica-Bold").fillColor('#0F172A').text("Insights & Projections", 58, insightY + 1);

            const cardsY = insightY + 16;
            const cardW = (doc.page.width - 80 - 12) / 2;
            const cardH = 40;

            // Velocity Warning card
            doc.save();
            doc.roundedRect(40, cardsY, cardW, cardH, 4).fillColor('#FEF2F2').fill();
            doc.roundedRect(40, cardsY, cardW, cardH, 4).lineWidth(0.5).strokeColor('#FEE2E2').stroke();
            doc.lineWidth(2.5).strokeColor('#EF4444').moveTo(40.5, cardsY + 4).lineTo(40.5, cardsY + cardH - 4).stroke();

            drawWarningIcon(doc, 50, cardsY + 8, '#EF4444');
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#EF4444').text("VELOCITY WARNING", 68, cardsY + 8);

            const warningText = overdueCount > 0
                ? `${overdueCount} tasks are overdue. Backlog velocity requires adjustment.`
                : "Backlog is growing 40% faster than completion.";
            doc.fontSize(7.5).font("Helvetica").fillColor('#7F1D1D').text(warningText, 68, cardsY + 17, { width: cardW - 80 });
            doc.restore();

            // Est. Completion card
            doc.save();
            doc.roundedRect(40 + cardW + 12, cardsY, cardW, cardH, 4).fillColor('#ECFDF5').fill();
            doc.roundedRect(40 + cardW + 12, cardsY, cardW, cardH, 4).lineWidth(0.5).strokeColor('#D1FAE5').stroke();
            doc.lineWidth(2.5).strokeColor('#10B981').moveTo(40 + cardW + 12.5, cardsY + 4).lineTo(40 + cardW + 12.5, cardsY + cardH - 4).stroke();

            drawClockIcon(doc, 40 + cardW + 22, cardsY + 8, '#10B981');
            doc.fontSize(6.5).font("Helvetica-Bold").fillColor('#10B981').text("EST. COMPLETION", 40 + cardW + 40, cardsY + 8);

            const completionText = completionRate > 80
                ? "Project timeline is tracking ahead of schedule."
                : "Timeline currently indeterminate.";
            doc.fontSize(7.5).font("Helvetica").fillColor('#065F46').text(completionText, 40 + cardW + 40, cardsY + 17, { width: cardW - 80 });
            doc.restore();

            doc.end();

            writeStream.on("finish", () => {
                resolve(filePath.replace(/\\/g, "/"));
            });

            writeStream.on("error", (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};
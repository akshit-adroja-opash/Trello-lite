
import ReportActions from "../components/ReportActions";

import { generateClientReport, generateFullReport } from "../api/reportService";

const ReportsPage = ({ boardId, user }) => {
  const token = localStorage.getItem("token");

  const handleFullReport = async () => {
    try {
      const data = await generateFullReport(boardId, token);

      alert("Full report generated");

      window.open(`http://localhost:5000/${data.report.pdfUrl}`);
    } catch (error) {
      console.log(error);
    }
  };

  const handleClientReport = async () => {
    try {
      const data = await generateClientReport(boardId, token);

      alert("Client report generated");

      window.open(`http://localhost:5000/${data.report.pdfUrl}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <ReportActions
        user={user}
        onFullReport={handleFullReport}
        onClientReport={handleClientReport}
      />
    </div>
  );
};

export default ReportsPage;

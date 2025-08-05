// App.jsx (updated to include upload and dropdown for report checking)
import { useEffect, useState } from "react";
import DisclosureCard from "./components/DisclosureCard";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import FileUploadForm from "./components/FileUploadForm";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaFilePdf } from "react-icons/fa";

function App() {
  const [disclosures, setDisclosures] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedReport, setSelectedReport] = useState("");
  const [checkingCompliance, setCheckingCompliance] = useState(false);
  const [availableReports, setAvailableReports] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/generated-disclosures")
      .then((res) => {
        setDisclosures(res.data);
      })
      .catch((err) => {
        console.error("Error fetching disclosures:", err);
      });
  }, []);
  useEffect(() => {
    axios
      .get("http://localhost:8000/available-reports")
      .then((res) => {
        setAvailableReports(res.data.reports);
      })
      .catch((err) => {
        console.error("Error fetching report list:", err);
      });
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setSelectedReport("");
  };

  const handleReportSelect = (e) => {
    setSelectedReport(e.target.value);
    setSelectedFile(null);
  };

  const handleCheckCompliance = async () => {
    const formData = new FormData();
    if (selectedFile) {
      // alert("Please upload and wait for processing");
      formData.append("file", selectedFile);
    } else if (selectedReport) {
      formData.append("report_name", selectedReport);
    } else {
      alert("Please upload a file or select a report.");
      return;
    }

    setCheckingCompliance(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/check-compliance",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setDisclosures(response.data);
    } catch (err) {
      console.error("Compliance check failed:", err);
    } finally {
      setCheckingCompliance(false);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return alert("Nothing to export.");

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;
    if (pdfHeight > pageHeight) {
      // Multi-page support
      let heightLeft = pdfHeight;
      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position = 0;
        }
      }
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`${selectedReport || "disclosure"}_compliance_report.pdf`);
  };

  return (
    <div className="bg-dark text-light min-vh-100 px-4 py-5">
      <button
        className="btn btn-outline-danger d-flex"
        onClick={exportToPDF}
        title="Export to PDF"
      >
        <FaFilePdf className="me-2" />
        Export
      </button>
      <h1 className="text-center mb-4">Basel III Missing Disclosures</h1>
      <div className="container mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <FileUploadForm
              onUploadComplete={(data) => {
                console.log("Upload Success!", data);
              }}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedReport}
              onChange={handleReportSelect}
            >
              <option value="">Select Existing Report</option>
              {availableReports.map((report, i) => (
                <option key={i} value={report}>
                  {report}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-info w-100"
              onClick={handleCheckCompliance}
              disabled={checkingCompliance}
            >
              {checkingCompliance ? "Checking..." : "Check Compliance"}
            </button>
          </div>
        </div>
      </div>

      <div className="container" id="pdf-content">
        <div className="row g-4">
          {disclosures.map((item, idx) =>
            item.generated ? (
              <div className="col-md-4 d-flex" key={idx}>
                <DisclosureCard data={item.generated} />
              </div>
            ) : (
              <></>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

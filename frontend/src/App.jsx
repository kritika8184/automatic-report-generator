// App.jsx (updated to include upload and dropdown for report checking)
import { useEffect, useState } from "react";
import DisclosureCard from "./components/DisclosureCard";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import FileUploadForm from "./components/FileUploadForm";

function App() {
  const [disclosures, setDisclosures] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedReport, setSelectedReport] = useState("");
  const [checkingCompliance, setCheckingCompliance] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8000/generated-disclosures")
      .then((res) => {
        setDisclosures(res.data);
      })
      .catch((err) => {
        console.error("Error fetching disclosures:", err);
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
      formData.append("file", selectedFile);
    } else if (selectedReport) {
      formData.append("report_name", selectedReport);
    } else {
      alert("Please upload a file or select a report.");
      return;
    }

    setCheckingCompliance(true);

    try {
      const response = await axios.post("http://localhost:8000/check-compliance", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDisclosures(response.data);
    } catch (err) {
      console.error("Compliance check failed:", err);
    } finally {
      setCheckingCompliance(false);
    }
  };

  return (
    <div className="bg-dark text-light min-vh-100 px-4 py-5">
      <h1 className="text-center mb-4">Basel III Missing Disclosures</h1>

      <div className="container mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            {/* <input type="file" className="form-control" onChange={handleFileChange} /> */}
            <FileUploadForm/>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={selectedReport} onChange={handleReportSelect}>
              <option value="">Select Existing Report</option>
              <option value="axis_2025.pdf">Axis Bank 2025</option>
              <option value="hdfc_2025.pdf">HDFC Bank 2025</option>
              {/* Add more options here */}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-info w-100" onClick={handleCheckCompliance} disabled={checkingCompliance}>
              {checkingCompliance ? "Checking..." : "Check Compliance"}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row g-4">
          {disclosures.map((item, idx) => (
            <div className="col-md-4 d-flex" key={idx}>
              <DisclosureCard data={item.generated || item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
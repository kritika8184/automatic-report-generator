import { useState } from "react";
import axios from "axios";

function FileUploadForm({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("report", file);

    setUploading(true);
    try {
      const res = await axios.post("http://localhost:8000/upload-report", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload success:", res.data);
      onUploadComplete(res.data); // optional callback
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="d-flex align-items-stretch gap-2">
      <input type="file" accept=".pdf" onChange={handleFileChange} className="form-control col-md-4"
      style={{ height: "100%" }}/>
      <button type="submit" disabled={uploading} className="btn btn-primary ms-2 col-md-2"
      style={{ whiteSpace: "nowrap" }}>
        {uploading ? "Uploading..." : "Upload Report"}
      </button>
      </div>
    </form>
  );
}

export default FileUploadForm;

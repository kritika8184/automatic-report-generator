import { useState } from "react";
import axios from "axios";
import LoadingOverlay from "./LoadingOverlay";

const FileUploadForm = ({onUploadComplete})=>{
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
    const res = await axios.post(
      "http://localhost:8000/upload-report",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Upload success:", res.data);
    onUploadComplete(res.data); // optional callback
  } catch (err) {
    console.error("Upload failed:", err);
  } finally {
    setUploading(false);
  }
};

return (
  <>
    {uploading && 
      <LoadingOverlay message="Uploading and processing report..." />
    }

    <form onSubmit={handleSubmit} className="w-100">
      <div className="row g-2 align-items-center">
        <div className="col-md-8">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="form-control col-md-4"
            style={{ height: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <button
            type="submit"
            disabled={uploading}
            className="btn button-gradient text-white w-100"
          >
            {uploading ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      </div>
    </form>
  </>
);
}

export default FileUploadForm;

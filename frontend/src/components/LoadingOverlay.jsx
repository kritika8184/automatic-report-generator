import React from "react";

const LoadingOverlay = ({ message = "Processing..." }) => {
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
      style={{ zIndex: 1050 }}
    >
      <div className="text-center text-light">
        <div className="spinner-border text-light mb-3" role="status"></div>
        <h5>{message}</h5>
      </div>
    </div>
  );
};

export default LoadingOverlay;

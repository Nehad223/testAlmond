import React from "react";

const Loader = () => {
  return (
    <div className="loader-container">
<img
  src="/logo.webp"
  alt="Loading"
  className="loader-logo"
  fetchPriority="high"
  decoding="async"
/>


      <div className="loader-credit en">
Developed by Mj+
      </div>
    </div>
  );
};

export default Loader;


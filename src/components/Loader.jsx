import React from "react";

const Loader = () => {
  return (
    <div className="loader-container">
<img
  src="/logo.png"
  alt="Loading"
  className="loader-logo"
  fetchpriority="high"
  decoding="async"
/>


      <div className="loader-credit en">
Developed by NovaTech
      </div>
    </div>
  );
};

export default Loader;

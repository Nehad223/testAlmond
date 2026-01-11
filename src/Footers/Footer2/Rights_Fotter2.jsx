import React from 'react';

const Rights_Fotter2 = () => {
  return (
    <div className="Last_Fotter container">
      <p className="copyright">
        © 2025 Snack Almond
      </p>

      <div
        className="dev-mark"
onClick={() =>
  window.open(
    "https://novatech-1tne.vercel.app/",
    "_blank",
    "noopener,noreferrer"
  )
}
      >
        <span>Developed by</span>
        <img src="/Logo.avif" alt="NovaTech" />
      </div>
    </div>
  );
};

export default Rights_Fotter2;


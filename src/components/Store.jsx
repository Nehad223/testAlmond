import React from 'react';

const Store = ({ count = 0, onToggle = () => {} }) => {
  return (
    <div className='store' role="button" onClick={onToggle} aria-label="افتح السلة">
      <div className='store-inner'>
        <img src='/pngegg.avif' alt="cart" />
        <span aria-live="polite">{count}</span>
      </div>
    </div>
  );
}

export default Store;


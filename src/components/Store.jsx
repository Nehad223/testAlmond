import React from 'react';

const Store = ({ count = 0, onToggle = () => {} }) => {
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className='store '
      role="button"
      onClick={onToggle}
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-label="افتح السلة"
      id="cart-icon"
    >
      <div className='store-inner'>
        <img src='/pngegg.avif' alt="cart" fetchPriority="high" loading="eager" />
        <span aria-live="polite">{count}</span>
      </div>
    </div>
  );
}

export default Store;



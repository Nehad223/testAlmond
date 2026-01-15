import React from 'react';
import { getEmptyCartMessage } from "../utils";

const Store = ({ count = 0, onToggle = () => {} }) => {
  const CartEmptyState = () => {
  const msg = getEmptyCartMessage();

  return (
      <p>الى المنزل</p>
  );
};
  return (
    <div className='store' role="button" onClick={onToggle} aria-label="افتح السلة" id="cart-icon">
      <div className='store-inner'>
        <img src='/pngegg.avif' alt="cart"   fetchPriority="high"   />
        <span aria-live="polite">{count}</span>  
      </div>
    </div>
  );
}

export default Store;



import React from 'react';

const Add_Store_Btn = ({ meal, onAddToCart }) => {
  return (
    <div>
      <button
        className='Add_Store_Btn'
        onClick={() => onAddToCart(meal)}
        aria-label="إضافة إلى السلة"
      >
        <span>
          <img className='add_op_Text' src='/plus.webp' alt="+" />
        </span>
        <span className='add_Text'> اضف </span>
        <span className='ToStore_Text'>الى السلة</span>
      </button>
    </div>
  );
};

export default Add_Store_Btn;



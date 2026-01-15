import React from 'react';

const Add_Store_Btn = ({ meal, onAddToCart }) => {

  const triggerShake = (btn) => {
    btn.classList.add("shake");
    setTimeout(() => btn.classList.remove("shake"), 400);

    const cart = document.getElementById("cart-icon");
    if (cart) {
      cart.classList.add("shake");
      setTimeout(() => cart.classList.remove("shake"), 400);
    }
  };

  const flyToCart = (imgEl) => {
    const cart = document.getElementById("cart-icon");
    if (!cart || !imgEl) return;

    cart.classList.add("pop");
    setTimeout(() => cart.classList.remove("pop"), 300);

    const imgRect = imgEl.getBoundingClientRect();
    const cartRect = cart.getBoundingClientRect();

    const clone = imgEl.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = imgRect.left + "px";
    clone.style.top = imgRect.top + "px";
    clone.style.width = imgRect.width + "px";
    clone.style.height = imgRect.height + "px";
    clone.style.borderRadius = "12px";
    clone.style.zIndex = 9999;
    clone.style.pointerEvents = "none";
    clone.style.transition =
      "all .65s cubic-bezier(.4,0,.2,1)";

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = cartRect.left + "px";
      clone.style.top = cartRect.top + "px";
      clone.style.width = "20px";
      clone.style.height = "20px";
      clone.style.opacity = "0";
      clone.style.transform = "scale(0.3)";
    });

    setTimeout(() => clone.remove(), 700);
  };

  const handleAdd = (e) => {
    const btn = e.currentTarget;
    const card = btn.closest('.Card_Slider');
    const img = card?.querySelector('img');

    // نحاول الإضافة
    const added = onAddToCart(meal);

    // ❌ فشل الإضافة (وصل الحد)
    if (added === false) {
      triggerShake(btn);
      return;
    }

    // ✅ نجحت الإضافة
    if (img) flyToCart(img);
  };

  return (
    <button
      className='Add_Store_Btn'
      onClick={handleAdd}
      aria-label="إضافة إلى السلة"
    >
      <span>
        <img className='add_op_Text' src='/plus.webp' alt="+" />
      </span>
      <span className='add_Text'> اضف </span>
      <span className='ToStore_Text'>الى السلة</span>
    </button>
  );
};

export default Add_Store_Btn;

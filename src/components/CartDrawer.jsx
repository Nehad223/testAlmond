import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

const CartDrawer = ({
  open,
  onClose,
  cart = [],
  incQty,
  decQty,
  total = 0,
  onCancel,
  clearCart,
}) => {

  const [showCheckout, setShowCheckout] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const validateInputs = () => {
    if (name.trim().length < 3) {
      toast.warn("الاسم يجب أن يكون أكثر من حرفين");
      return false;
    }

    if (location.trim().length < 4) {
      toast.warn("العنوان يجب أن يكون أكثر من 3 أحرف");
      return false;
    }

    if (!/^09\d{8}$/.test(phone)) {
      toast.warn("رقم الهاتف يجب أن يبدأ بـ 09 ويتكون من 10 أرقام");
      return false;
    }

    return true;
  };

  const sendOrder = async () => {
    if (sendingRef.current || isSending) return;
    sendingRef.current = true;
    setIsSending(true);

    if (cart.length === 0) {
      toast.info("السلة فارغة");
      sendingRef.current = false;
      setIsSending(false);
      return;
    }

    if (!validateInputs()) {
      sendingRef.current = false;
      setIsSending(false);
      return;
    }

    const payload = {
      name,
      phone,
      location,
      items: cart.map(item => ({
        meal_id: item.id,
        quantity: item.qty
      }))
    };

    try {
      const res = await fetch("https://snackalmond.duckdns.org/createorder/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      toast.success("تم إرسال الطلب بنجاح!");

      if (typeof clearCart === "function") clearCart();
      setShowCheckout(false);
      onClose();

      setName("");
      setPhone("");
      setLocation("");

    } catch (err) {
      console.error("Order send failed:", err);
      toast.error("فشل إرسال الطلب، حاول مرة ثانية.");
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleClear = () => {
    if (isSending) return;
    if (cart.length === 0) {
      toast.info("السلة فارغة بالفعل");
      setShowClearConfirm(false);
      return;
    }

    if (typeof clearCart === "function") {
      clearCart();
      setShowClearConfirm(false);
    } else {
      toast.error("تعذر إفراغ السلة — الدالة clearCart غير متوفرة");
      setShowClearConfirm(false);
    }
  };

  return (
    <>
      <div className={`cart-drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>

        <div className="cart-header">
          <h3>السلة</h3>
          <button className="close-btn" onClick={onClose} disabled={isSending} aria-label="إغلاق السلة">×</button>
        </div>

        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="empty">السلة فارغة</div>
          ) : (
            cart.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="left">
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="right">
                  <div className="item-row">
                    <div className="name">{item.name}</div>
                    <div className="price">{Number(item.price).toFixed(2)} ل.س</div>
                  </div>

                  <div className="controls">
                    <button onClick={() => decQty(item.id)} disabled={isSending} className="qty-btn" aria-label={`نقص ${item.name}`}>-</button>
                    <div className="qty">{item.qty}</div>
                    <button onClick={() => incQty(item.id)} disabled={isSending} className="qty-btn" aria-label={`زيادة ${item.name}`}>+</button>

                    <div className="subtotal">
                      {(item.price * item.qty).toFixed(2)} ل.س
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <div>المجموع الكلي</div>
            <div>{total.toFixed(2)} ل.س</div>
          </div>

          <div className="footer-actions">
            <button className="btn btn-cancel" onClick={onCancel} disabled={isSending}>إلغاء</button>

            {/* زر افراغ السلة المحترف */}
            <button
              className="btn btn-clear"
              onClick={() => setShowClearConfirm(true)}
              disabled={isSending || cart.length === 0}
              aria-label="افراغ السلة"
              title="افراغ السلة"
            >
              {/* أيقونة سلة مهملات صغيرة */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              className="btn btn-order"
              onClick={() => { if (!isSending && cart.length > 0) setShowCheckout(true); }}
              disabled={isSending || cart.length === 0}
            >
              {isSending ? 'جارٍ الإرسال...' : 'اطلب الآن'}
            </button>
          </div>
        </div>
      </aside>

      {showCheckout && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            {isSending && <div className="checkout-sending-overlay" />}

            <button
              className="checkout-close"
              onClick={() => !isSending && setShowCheckout(false)}
              disabled={isSending}
            >
              ×
            </button>

            <h2>تأكيد الطلب</h2>
            <p className="checkout-sub">يرجى إدخال المعلومات لتأكيد طلبك</p>

            <div className="checkout-input">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل" disabled={isSending}/>
              <img src="/name.webp" />
            </div>
            <div className="checkout-input">
              <input
                type="text"
                value={phone}
                placeholder="رقم الهاتف"
                disabled={isSending}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
              />
              <img src="/phone.webp" />
            </div>

            <div className="checkout-input">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="العنوان بالتفصيل" disabled={isSending}/>
              <img src="/location.webp" />
            </div>

            <button
              className={`checkout-confirm ${isSending ? 'btn-loading' : ''}`}
              onClick={sendOrder}
              disabled={isSending}
            >
              تأكيد الطلب
            </button>

          </div>
        </div>
      )}

      {/* Confirm clear modal */}
      {showClearConfirm && (
        <div className="clear-confirm-overlay" role="dialog" aria-modal="true" onClick={() => !isSending && setShowClearConfirm(false)}>
          <div className="clear-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد افراغ السلة</h3>
            <p>هل أنت متأكد من حذف جميع العناصر؟ لا يمكن التراجع عن هذا الإجراء.</p>

            <div className="clear-actions">
              <button className="btn btn-cancel" onClick={() => setShowClearConfirm(false)} disabled={isSending}>إلغاء</button>
              <button className="btn btn-clear-confirm" onClick={handleClear} disabled={isSending || cart.length === 0}>أفرغ السلة</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartDrawer;

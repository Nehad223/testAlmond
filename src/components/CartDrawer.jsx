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
  const [notes, setNotes] = useState(""); 

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
      note: notes.trim(),
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

      if (!res.ok) throw new Error("Request failed");

      toast.success("تم إرسال الطلب بنجاح!");

      if (typeof clearCart === "function") clearCart();
      setShowCheckout(false);
      onClose();

      setName("");
      setPhone("");
      setLocation("");
      setNotes(""); // ⭐ تفريغ الملاحظات

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
      <div
        className={`cart-drawer-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open}>

        <div className="cart-header">
          <h3>توصيل الى المنزل</h3>
          <button className="close-btn" onClick={onClose} disabled={isSending}>×</button>
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
                    <button onClick={() => decQty(item.id)} disabled={isSending} className="qty-btn">-</button>
                    <div className="qty">{item.qty}</div>
                    <button onClick={() => incQty(item.id)} disabled={isSending} className="qty-btn">+</button>
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
            <button className="btn btn-cancel" onClick={onCancel} disabled={isSending}>
              إلغاء
            </button>

            <button
              className="btn btn-clear"
              onClick={() => setShowClearConfirm(true)}
              disabled={isSending || cart.length === 0}
            >
              🗑
            </button>

            <button
              className="btn btn-order"
              onClick={() => !isSending && cart.length > 0 && setShowCheckout(true)}
              disabled={isSending || cart.length === 0}
            >
              اطلب الآن
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
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="الاسم الكامل"
                disabled={isSending}
              />
              <img src="/name.webp" alt="" />
            </div>

            <div className="checkout-input">
              <input
                type="text"
                value={phone}
                placeholder="رقم الهاتف"
                maxLength={10}
                disabled={isSending}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) setPhone(value);
                }}
              />
              <img src="/phone.webp" alt="" />
            </div>

            <div className="checkout-input">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="العنوان بالتفصيل"
                disabled={isSending}
              />
              <img src="/location.webp" alt="" />
            </div>

    
<div className="checkout-notes">
  <div className="notes-head">
    <img src="/description.webp" alt="" />
    <span>ملاحظات على الطلب (اختياري)</span>
  </div>

  <textarea
    placeholder="مثال: بدون بصل – زيادة صوص – الصوص على جنب"
    maxLength={200}
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    disabled={isSending}
  />

  <div className="char-count">
    {notes.length} / 200
  </div>
</div>



            <button
              className={`checkout-confirm ${isSending ? "btn-loading" : ""}`}
              onClick={sendOrder}
              disabled={isSending}
            >
              تأكيد الطلب
            </button>

          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="clear-confirm-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="clear-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد افراغ السلة</h3>
            <p>هل أنت متأكد من حذف جميع العناصر؟</p>

            <div className="clear-actions">
              <button className="btn btn-cancel" onClick={() => setShowClearConfirm(false)}>
                إلغاء
              </button>
              <button className="btn btn-clear-confirm" onClick={handleClear}>
                أفرغ السلة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartDrawer;


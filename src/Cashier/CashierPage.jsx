import { useEffect, useRef, useState } from "react";
import "./Cashier.css";

export default function CashierPage() {
  const [orders, setOrders] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [newOrderId, setNewOrderId] = useState(null);
  const audioRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/Orders_up.mp3");

    // جلب الطلبات أول مرة
    fetch("http://31.97.75.5/orders/")
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 HTTP orders:", data);
        setOrders(sortOrders(data));
      })
      .catch(console.error);

    // WebSocket للإشعارات
    const socket = new WebSocket("ws://31.97.75.5/ws/orders/");

    socket.onopen = () => console.log("✅ WebSocket connected");

    socket.onmessage = (event) => {
      try {
        const order = JSON.parse(event.data);
        setOrders((prev) => {
          const index = prev.findIndex((o) => o.id === order.id);
          if (index !== -1) {
            // حدث الطلب الموجود
            const updated = [...prev];
            updated[index] = { ...updated[index], ...order };
            return sortOrders(updated);
          } else {
            // طلب جديد
            setNewOrderId(order.id);
            audioRef.current?.play();
            setTimeout(() => setNewOrderId(null), 3000);
            return sortOrders([order, ...prev]);
          }
        });
      } catch (e) {
        console.error(e);
      }
    };

    socketRef.current = socket;
    return () => socket.close();
  }, []);

  // ===============================
  // Helpers
  // ===============================
  const sortOrders = (orders) => {
    // الغير منتهية
    const notFinished = orders
      .filter((o) => o.state !== "finish")
      .sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at) // الأحدث فوق
      );

    // المنتهية
    const finished = orders
      .filter((o) => o.state === "finish")
      .sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at) // الأحدث فوق
      );

    return [...notFinished, ...finished];
  };

  // ===============================
  // Finish order
  // ===============================
  const requestFinish = (id) => setPendingId(id);

  const confirmFinish = () => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === pendingId ? { ...o, state: "finish" } : o
      );
      return sortOrders(updated);
    });

    // إرسال تحديث للباك إند
    fetch(`http://31.97.75.5/details/${pendingId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "finish" }),
    }).catch(console.error);

    setPendingId(null);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="cashier-container">
      <h1 className="cashier-title">Cashier dashboard</h1>

      {/* ===== Desktop ===== */}
      <div className="table-wrapper desktop-only">
        <table className="cashier-table">
          <thead>
            <tr>
              <th>العميل</th>
              <th>الوقت</th>
              <th>الطلبات</th>
              <th>الإجمالي</th>
              <th>الحالة</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`
                  ${order.state === "finish" ? "row-done" : "row-active"}
                  ${order.id === newOrderId ? "row-new" : ""}
                `}
              >
                <td>
                  <strong>{order.name}</strong>
                  <div className="muted small">{order.phone}</div>
                  {order.location && <div className="muted small">{order.location}</div>}
                </td>

                <td className="muted">
                  {new Date(order.created_at).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                <td className="order-items">
                  {order.items.map((i) => (
                    <div key={i.id} className="item-row with-image">
                      <img
                        src={i.meal.image_url}
                        alt={i.meal.name}
                        className="item-img"
                      />
                      <span>{i.meal.name}</span>
                      <span className="qty">× {i.quantity}</span>
                    </div>
                  ))}
                </td>

                <td className="order-price">{order.total_price} ل.س</td>

                <td>
                  {order.state !== "finish" ? (
                    <button
                      className="btn-finish"
                      onClick={() => requestFinish(order.id)}
                    >
                      إنهاء
                    </button>
                  ) : (
                    <span className="done-label">منتهي</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile ===== */}
      <div className="mobile-only">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`order-card ${order.id === newOrderId ? "order-card-new" : ""}`}
          >
            <div className="card-header">
              <strong>{order.name}</strong>
              <div className="order-price">{order.total_price} ل.س</div>
            </div>
            <div className="muted small">{order.phone}</div>
            {order.location && <div className="card-meta">{order.location}</div>}
            <div className="card-meta">
              {new Date(order.created_at).toLocaleTimeString("ar-EG")}
            </div>

            <div className="order-items">
              {order.items.map((i) => (
                <div key={i.id} className="item-row with-image">
                  <img
                    src={i.meal.image_url}
                    alt={i.meal.name}
                    className="item-img"
                  />
                  <span>{i.meal.name}</span>
                  <span className="qty">× {i.quantity}</span>
                </div>
              ))}
            </div>

            {order.state !== "finish" ? (
              <button
                className="btn-finish full"
                onClick={() => requestFinish(order.id)}
              >
                إنهاء الطلب
              </button>
            ) : (
              <div className="done-label">تم الإنهاء</div>
            )}
          </div>
        ))}
      </div>

      {/* ===== Modal ===== */}
      {pendingId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">تأكيد الإنهاء</h3>
            <p className="muted">هل تريد إنهاء الطلب؟</p>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setPendingId(null)}>
                لا
              </button>
              <button className="btn-confirm" onClick={confirmFinish}>
                نعم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

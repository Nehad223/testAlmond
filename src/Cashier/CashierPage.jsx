import { useEffect, useRef, useState } from "react";
import "./Cashier.css";

export default function CashierPage() {
  const [orders, setOrders] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [newOrderId, setNewOrderId] = useState(null);

  const [socketStatus, setSocketStatus] = useState("connecting"); 
  // connecting | connected | disconnected
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // -----------------------------
  // Helpers: date filtering
  // -----------------------------
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const isWithinLastDays = (dateString, days = 2) => {
    if (!dateString) return false;
    const ts = new Date(dateString).getTime();
    if (Number.isNaN(ts)) return false;
    const diff = Date.now() - ts;
    return diff >= 0 && diff <= days * MS_PER_DAY;
  };

  const filterToLastDays = (ordersArray, days = 2) =>
    (ordersArray || []).filter((o) => isWithinLastDays(o.created_at, days));

  // ===============================
  // Internet status
  // ===============================
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ===============================
  // WebSocket connection
  // ===============================
  const connectSocket = () => {
    setSocketStatus("connecting");

    const socket = new WebSocket("wss://snackalmond.duckdns.org/ws/orders/");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setSocketStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const order = JSON.parse(event.data);

        // تجاهل الطلبات الأقدم من آخر يومين
        if (!isWithinLastDays(order.created_at, 2)) {
          // إذا أردت، يمكن تسجيل هذا الحدث للـ debug
          // console.log('Ignored old order from websocket:', order.id);
          return;
        }

        setOrders((prev) => {
          // تأكد أن القائمة الحالية أيضاً تحتوي فقط على آخر يومين
          const cleanedPrev = filterToLastDays(prev, 2);

          const index = cleanedPrev.findIndex((o) => o.id === order.id);
          if (index !== -1) {
            const updated = [...cleanedPrev];
            updated[index] = { ...updated[index], ...order };
            return sortOrders(updated);
          } else {
            setNewOrderId(order.id);
            audioRef.current?.play();
            setTimeout(() => setNewOrderId(null), 3000);
            return sortOrders([order, ...cleanedPrev]);
          }
        });
      } catch (e) {
        console.error(e);
      }
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket disconnected");
      setSocketStatus("disconnected");

      reconnectTimeoutRef.current = setTimeout(() => {
        if (navigator.onLine) connectSocket();
      }, 5000);
    };

    socket.onerror = () => {
      socket.close();
    };
  };

  // ===============================
  // Initial load
  // ===============================
  useEffect(() => {
    audioRef.current = new Audio("/Orders_up.mp3");

    fetch("https://snackalmond.duckdns.org/orders/")
      .then((res) => res.json())
      .then((data) => {
        // فلترة الطلبات لتحتوي فقط على آخر يومين قبل التخزين
        const lastTwoDays = filterToLastDays(data, 2);
        setOrders(sortOrders(lastTwoDays));
      })
      .catch(console.error);

    connectSocket();

    return () => {
      socketRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===============================
  // Periodic cleanup: إزالة الطلبات القديمة لو الصفحة فتحت مدة طويلة
  // ===============================
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => sortOrders(filterToLastDays(prev, 2)));
    }, 60 * 60 * 1000); // كل ساعة

    return () => clearInterval(interval);
  }, []);

  // ===============================
  // Reload if disconnected too long
  // ===============================
  useEffect(() => {
    if (socketStatus === "disconnected") {
      const t = setTimeout(() => {
        window.location.reload();
      }, 30000);

      return () => clearTimeout(t);
    }
  }, [socketStatus]);

  // ===============================
  // Helpers
  // ===============================
  const sortOrders = (orders) => {
    const notFinished = orders
      .filter((o) => o.state !== "finish")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const finished = orders
      .filter((o) => o.state === "finish")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
      // بعد التحديث، حافظ على فلترة آخر يومين أيضاً
      return sortOrders(filterToLastDays(updated, 2));
    });

    fetch(`https://snackalmond.duckdns.org/details/${pendingId}/`, {
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

      {/* ===== Connection status ===== */}
      <div className="connection-status">
        {!isOnline && <span className="offline">🔴 لا يوجد إنترنت</span>}
        {isOnline && socketStatus === "connected" && (
          <span className="online">🟢 متصل</span>
        )}
        {isOnline && socketStatus === "connecting" && (
          <span className="connecting">🟡 جارٍ الاتصال...</span>
        )}
        {isOnline && socketStatus === "disconnected" && (
          <span className="offline">🔴 غير متصل (يعاد المحاولة)</span>
        )}
      </div>

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
                  {order.location && (
                    <div className="muted small">{order.location}</div>
                  )}
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
            className={`order-card ${
              order.id === newOrderId ? "order-card-new" : ""
            }`}
          >
            <div className="card-header">
              <strong>{order.name}</strong>
              <div className="order-price">{order.total_price} ل.س</div>
            </div>
            <div className="muted small">{order.phone}</div>
            {order.location && (
              <div className="card-meta">{order.location}</div>
            )}
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
              <button
                className="btn-cancel"
                onClick={() => setPendingId(null)}
              >
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

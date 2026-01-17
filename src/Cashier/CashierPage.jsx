import { useEffect, useRef, useState } from "react";
import "./Cashier.css";

export default function CashierPage() {
  const [orders, setOrders] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  const [newOrderId, setNewOrderId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const initialPermissionGranted =
    typeof Notification !== "undefined" && Notification.permission === "granted";
  const initialPermissionDenied =
    typeof Notification !== "undefined" && Notification.permission === "denied";

  const [permissionGranted, setPermissionGranted] = useState(initialPermissionGranted);
  const [permissionDenied, setPermissionDenied] = useState(initialPermissionDenied);

  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const isSyncingRef = useRef(false);
  const lastIdRef = useRef(null);
  const pendingPatchesRef = useRef([]);

  const requestDelete = (order) => {
    if (order.state !== "finish") return;
    setDeleteId(order.id);
  };

  const confirmDelete = () => {
    const id = deleteId;
    setOrders((prev) => prev.filter((o) => o.id !== id));
    fetch(`https://snackalmond.duckdns.org/details/${id}/`, {
      method: "DELETE",
    }).catch(console.error);
    setDeleteId(null);
  };

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

  const sortOrders = (ordersArray) => {
    const notFinished = ordersArray
      .filter((o) => o.state !== "finish")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const finished = ordersArray
      .filter((o) => o.state === "finish")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return [...notFinished, ...finished];
  };

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


  const connectSocket = () => {
    setSocketStatus("connecting");

    const socket = new WebSocket("wss://snackalmond.duckdns.org/ws/orders/");
    socketRef.current = socket;

    socket.onopen = async () => {
      console.log("✅ WebSocket connected");
      setSocketStatus("connected");

      isSyncingRef.current = true;

      try {

        const lastId = lastIdRef.current;
        const url = lastId
          ? `https://snackalmond.duckdns.org/orders/?since_id=${lastId}`
          : `https://snackalmond.duckdns.org/orders/`;

        const res = await fetch(url);
        const data = await res.json();
        const lastTwoDays = filterToLastDays(data, 2);

        setOrders((prev) => {
          const map = new Map();
          lastTwoDays.forEach((o) => map.set(o.id, o));
          filterToLastDays(prev, 2).forEach((o) => {
            if (!map.has(o.id)) map.set(o.id, o);
          });

          const merged = sortOrders(Array.from(map.values()));


          const existingIds = new Set(filterToLastDays(prev, 2).map((o) => o.id));
          const missed = merged.filter((o) => !existingIds.has(o.id));
          if (missed.length > 0) {
            if (permissionGranted) {
              audioRef.current?.play().catch((e) => {
                console.warn("Audio play failed:", e);
              });
              setTimeout(() => {

                try {
                  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                    new Notification("طلب جديد", {
                      body: `طلب من ${missed[0].name} — ${missed[0].total_price} ل.س`,
                    });
                  }
                } catch (e) {
                  console.error("Notification error:", e);
                }
              }, 100);
              setNewOrderId(missed[0].id);
              setTimeout(() => setNewOrderId(null), 3000);
            } else {
              console.log("Missed orders but permission not granted; skipping sound/notification");
            }
          }

          return merged;
        });
      } catch (e) {
        console.error("Sync failed:", e);
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 500);
      }


      flushPending();
    };

    socket.onmessage = (event) => {
      try {
        const order = JSON.parse(event.data);
        if (!isWithinLastDays(order.created_at, 2)) return;

        setOrders((prev) => {
          const cleanedPrev = filterToLastDays(prev, 2);
          const index = cleanedPrev.findIndex((o) => o.id === order.id);

          if (index !== -1) {
            const updated = [...cleanedPrev];
            updated[index] = { ...updated[index], ...order };
            return sortOrders(updated);
          } else {
            if (!isSyncingRef.current) {
              setNewOrderId(order.id);

              if (permissionGranted) {
                audioRef.current?.play().catch((e) => {
                  console.warn("Audio play failed:", e);
                });

                try {
                  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                    new Notification("طلب جديد", {
                      body: `طلب من ${order.name} — ${order.total_price} ل.س`,
                    });
                  }
                } catch (e) {
                  console.error("Notification error:", e);
                }
              } else {
                console.log("Incoming order but permission not granted; skipping sound/notification");
              }

              setTimeout(() => setNewOrderId(null), 3000);
            }
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

  useEffect(() => {

    audioRef.current = new Audio("/Orders_up.mp3");
    audioRef.current.preload = "auto";

    fetch("https://snackalmond.duckdns.org/orders/")
      .then((res) => res.json())
      .then((data) => {
        const lastTwoDays = filterToLastDays(data, 2);
        setOrders(sortOrders(lastTwoDays));
      })
      .catch(console.error);

    connectSocket();

    return () => {
      socketRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    lastIdRef.current = orders[0]?.id ?? null;
  }, [orders]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => sortOrders(filterToLastDays(prev, 2)));
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socketStatus === "disconnected") {
      const t = setTimeout(() => {
        window.location.reload();
      }, 30000);

      return () => clearTimeout(t);
    }
  }, [socketStatus]);


  const requestFinish = (id) => setPendingId(id);

  const confirmFinish = () => {
    const id = pendingId;

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === id ? { ...o, state: "finish" } : o
      );
      return sortOrders(filterToLastDays(updated, 2));
    });

    const patch = { id, body: { state: "finish" } };
    if (!navigator.onLine) {
      pendingPatchesRef.current.push(patch);
      localStorage.setItem("pendingPatches", JSON.stringify(pendingPatchesRef.current));
    } else {
      sendPatch(patch);
    }

    setPendingId(null);
  };

  const sendPatch = ({ id, body }) => {
    fetch(`https://snackalmond.duckdns.org/details/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((e) => {
      console.error("patch failed, queueing:", e);
      pendingPatchesRef.current.push({ id, body });
      localStorage.setItem("pendingPatches", JSON.stringify(pendingPatchesRef.current));
    });
  };

  const flushPending = () => {
    const list = JSON.parse(localStorage.getItem("pendingPatches") || "[]");
    list.forEach((p) => sendPatch(p));
    localStorage.removeItem("pendingPatches");
    pendingPatchesRef.current = [];
  };


  const handleRequestPermission = async () => {
    if (typeof Notification === "undefined") {
      alert("المتصفح يلي عم تستخدمه ما بيدعم إشعارات الويب.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setPermissionGranted(true);
        setPermissionDenied(false);

        audioRef.current?.play().catch((e) => {
          console.warn("Test audio play failed:", e);
        });

        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("تم تفعيل الإشعارات", { body: "الإشعارات الصوتية مفعلة الآن." });
          }
        } catch (e) {
          console.error("Notification creation failed:", e);
        }
      } else if (perm === "denied") {
        setPermissionDenied(true);
        setPermissionGranted(false);
      } else {

        setPermissionGranted(false);
        setPermissionDenied(false);
      }
    } catch (e) {
      console.error("Permission request error:", e);
    }
  };

  const openSettingsHint = () => {
    alert(
      "إذا رفضت السماحية قبلًا، فعلها من إعدادات المتصفح لصفحة الموقع (Site settings -> Notifications)."
    );
  };


  return (
    <div className="cashier-container">
      <div className="connection-status">
        {!isOnline && <span className="offline">🔴 لا يوجد إنترنت</span>}
        {isOnline && socketStatus === "connected" && <span className="online">🟢 متصل</span>}
        {isOnline && socketStatus === "connecting" && <span className="connecting">🟡 جارٍ الاتصال...</span>}
        {isOnline && socketStatus === "disconnected" && <span className="offline">🔴 غير متصل (يعاد المحاولة)</span>}
      </div>

      <h1 className="cashier-title">Cashier dashboard</h1>

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


  {order.note && (
    <div
      className="order-note muted small"
      title={String(order.note)} >
      {order.note}
    </div>
  )}
</td>

                <td className="muted">
                  {new Date(order.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="order-items">
                  {order.items.map((i) => (
                    <div key={i.id} className="item-row with-image">
                      <img src={i.meal.image_url || "exampel.jpg"}  loading="lazy" alt={i.meal.name} className="item-img" />
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
                    <div className="action-buttons">
                      <span className="done-label">منتهي</span>
                      <button
                        className="btn-delete"
                        onClick={() => requestDelete(order)}
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-only">
        {orders.map((order) => (
          <div key={order.id} className={`order-card ${order.id === newOrderId ? "order-card-new" : ""}`}>
            <div className="card-header">
              <strong>{order.name}</strong>
              <div className="order-price">{order.total_price} ل.س</div>
            </div>

<div className="muted small">{order.phone}</div>
{order.location && <div className="card-meta">{order.location}</div>}

{order.note && (
  <div
    className="order-note card-meta"
    title={String(order.note)}
  >
    {order.note}
  </div>
)}
            <div className="card-meta">{new Date(order.created_at).toLocaleTimeString("ar-EG")}</div>
            <div className="order-items">
              {order.items.map((i) => (
                <div key={i.id} className="item-row with-image">
                  <img src={i.meal.image_url  || "/exampel.jpg" } loading="lazy" alt={i.meal.name} className="item-img" />
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
  <div className="action-buttons">
    <span className="done-label">منتهي</span>
    <button
      className="btn-delete full"
      onClick={() => requestDelete(order)}
    >
      حذف الطلب
    </button>
  </div>
)}

          </div>
        ))}
      </div>

      {pendingId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">تأكيد الإنهاء</h3>
            <p className="muted">هل تريد إنهاء الطلب؟</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setPendingId(null)}>لا</button>
              <button className="btn-confirm" onClick={confirmFinish}>نعم</button>
            </div>
          </div>
        </div>
      )}

      
      {!permissionGranted && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-box">
<h3 className="modal-title">تنبيه هام — الإشعارات الصوتية مطلوبة</h3>
<p className="muted">
  لضمان استقبال تنبيهات الطلبات وتشغيل الأصوات الخاصة بها، يجب السماح بالإشعارات من المتصفح.
  يرجى الضغط على زر «طلب الإذن» للموافقة على ذلك. لا يمكن متابعة العمل قبل تفعيل الإشعارات.
</p>

            <div className="modal-actions">
              <button
                className="btn-confirm"
                onClick={handleRequestPermission}
              >
                اطلب السماح
              </button>
            </div>

            {permissionDenied && (
              <div style={{ marginTop: 12 }}>
                <p className="muted small">
                  إذا رفضت السماحية قبلًا، شغّلها من إعدادات المتصفح (Site settings → Notifications).
                </p>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={openSettingsHint}>كيف أفعلها؟</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {deleteId && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3 className="modal-title danger">تأكيد الحذف</h3>
      <p className="muted">
        هل أنت متأكد أنك تريد حذف هذا الطلب نهائيًا؟
      </p>
      <div className="modal-actions">
        <button
          className="btn-cancel"
          onClick={() => setDeleteId(null)}
        >
          لا
        </button>
        <button
          className="btn-delete confirm"
          onClick={confirmDelete}
        >
          نعم، احذف
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}



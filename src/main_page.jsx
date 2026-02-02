import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Logo from "./components/Logo";
import Navbar from "./components/Navbar";
import Cards from "./components/Cards";
import Loader from "./components/Loader.jsx";
import Store from "./components/Store.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
const CART_MAX_QTY = 99;
const Main_page = ({
  isAdmin = false,
  onDelete,
  onUpdate,
}) => {
  const [data, setData] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(false);

  const contentRef = useRef(null);

  /* ===================== HELPERS ===================== */
  const clearCart = () => setCart([]);

  const getCartTotalQty = (arr = []) =>
    arr.reduce((s, i) => s + (i.qty || 0), 0);

  /* ===================== FETCH DATA ===================== */
  const fetchData = async () => {
    setLoading(true);
    setError(false);

    const criticalImages = ["/name.webp", "/location.webp", "/phone.webp"];

    const preloadImages = Promise.all(
      criticalImages.map(src =>
        new Promise(res => {
          const img = new Image();
          img.src = src;
          const t = setTimeout(res, 2500);
          img.onload = img.onerror = () => {
            clearTimeout(t);
            res();
          };
        })
      )
    );

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "https://snackalmond.duckdns.org";
      const res = await fetch(`${API_BASE}/home/`);
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();
      setData(json);
      setActiveCategory(0);
      await preloadImages;
    } catch (err) {
      console.error(err);
      setError(true);
      toast.error("فشل تحميل البيانات. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== RESET SCROLL ===================== */
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeCategory]);

  /* ===================== CART LOGIC ===================== */
  const addToCart = (meal) => {
    let added = true;

    setCart(prev => {
      const totalQty = getCartTotalQty(prev);
      if (totalQty + 1 > CART_MAX_QTY) {
        toast.warn(`لا يمكنك إضافة أكثر من ${CART_MAX_QTY} وجبة`);
        added = false;
        return prev;
      }

      const found = prev.find(i => i.id === meal.id);

      if (found) {
        if (found.qty + 1 > CART_MAX_QTY) {
          toast.warn(`الحد الأقصى لهذا المنتج هو ${CART_MAX_QTY}`);
          added = false;
          return prev;
        }

        return prev.map(i =>
          i.id === meal.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [
        ...prev,
        {
          id: meal.id,
          name: meal.name || meal.title || "بدون اسم",
          price: Number(meal.price || meal.price_value || 0),
          qty: 1,
          img: meal.image || meal.img || "/exampel.jpg",
        },
      ];
    });

    return added;
  };

  const incQty = (id) =>
    setCart(prev => {
      const totalQty = getCartTotalQty(prev);
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      if (totalQty + 1 > CART_MAX_QTY) {
        toast.warn(`لا يمكنك إضافة أكثر من ${CART_MAX_QTY} وجبة`);
        return prev;
      }

      if (item.qty + 1 > CART_MAX_QTY) {
        toast.warn(`الحد الأقصى لهذا المنتج هو ${CART_MAX_QTY}`);
        return prev;
      }

      return prev.map(i =>
        i.id === id ? { ...i, qty: i.qty + 1 } : i
      );
    });

  const decQty = (id) =>
    setCart(prev =>
      prev
        .map(i =>
          i.id === id ? { ...i, qty: i.qty - 1 } : i
        )
        .filter(i => i.qty > 0)
    );

  /* ===================== TOTALS ===================== */
  const cartCount = getCartTotalQty(cart);
  const cartTotal = cart.reduce(
    (s, i) => s + i.qty * Number(i.price || 0),
    0
  );

  /* ===================== ORDER ===================== */
  const handleOrder = () => {
    if (!cart.length) {
      toast.info("السلة فارغة");
      return;
    }

    toast.success("تم إرسال الطلب بنجاح!");
    clearCart();
    setCartOpen(false);
  };

  /* ===================== ADMIN ACTIONS ===================== */
const handleDelete = async (mealId) => {
  const confirm = await new Promise((resolve) => {
    toast(
      ({ closeToast }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span>هل أنت متأكد من حذف الوجبة؟</span>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: "6px" }}>
            <button
              onClick={() => { resolve(true); closeToast(); }}
              style={{
                padding: "5px 12px",
                backgroundColor: "#E74C3C",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              نعم
            </button>
            <button
              onClick={() => { resolve(false); closeToast(); }}
              style={{
                padding: "5px 12px",
                backgroundColor: "#95A5A6",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              لا
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false }
    );
  });
  if (!confirm) return; 
  try {
    await onDelete(mealId);
    setData((prev) =>
      prev.map((cat) => ({
        ...cat,
        meals: cat.meals.filter((meal) => meal.id !== mealId),
      }))
    );

  } catch {}
};

  const handleUpdate = async (mealId, updatedData) => {
    try {
      await onUpdate(mealId, updatedData);
      setData(prev =>
        prev.map(cat => ({
          ...cat,
          meals: cat.meals.map(m =>
            m.id === mealId ? { ...m, ...updatedData } : m
          ),
        }))
      );
 
    } catch {

    }
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div>
             <Logo />
          </div>
          
            <div >

                <Store count={cartCount} onToggle={() => setCartOpen(true)} />
       
            </div>
     
          <div className={`navbar-wrapper ${loading ? "skeleton-block skeleton-navbar" : ""}`}>
            {!loading && (
              <Navbar
                categories={data}
                active={activeCategory}
                setActive={setActiveCategory}
              />
            )}
          </div>
        </div>
      </header>

      <main className="main-scroll" ref={contentRef}>
        <div className="content-wrap" key={activeCategory}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '6vh 2vh' }}>
              <p style={{ color: '#fff', fontSize: '1.05rem' }}>حدث خطأ أثناء تحميل المحتوى</p>
              <button
                onClick={() => fetchData()}
                style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#c9a24d', color: '#111', fontWeight: 700 }}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : loading ? (
            <div className="cards-skeleton-grid">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="cards-skeleton-item">
                  <div className="Card_Slider card card-skeleton">
                    <div className="card-skeleton-img" />
                    <div className="card-skeleton-info">
                      <div className="card-skeleton-line long" />
                      <div className="card-skeleton-line" />
                      <div className="card-skeleton-line short" />
                      <div className="card-skeleton-btn" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            data?.[activeCategory]?.meals?.length > 0 ? (
              <Cards
                key={activeCategory}
                meals={data[activeCategory].meals}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onUpdateProduct={handleUpdate}
                onAddToCart={addToCart}
              />
            ) : (
              <div className="cards-skeleton-grid">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="cards-skeleton-item">
                    <div className="Card_Slider card card-skeleton">
                      <div className="card-skeleton-img" />
                      <div className="card-skeleton-info">
                        <div className="card-skeleton-line long" />
                        <div className="card-skeleton-line" />
                        <div className="card-skeleton-line short" />
                        <div className="card-skeleton-btn" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        incQty={incQty}
        decQty={decQty}
        total={cartTotal}
        onOrder={handleOrder}
        onCancel={() => setCartOpen(false)}
        clearCart={clearCart}
      />
    </div>
  );
};

export default Main_page;




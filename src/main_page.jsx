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
  const [uiReady, setUiReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);

  const contentRef = useRef(null);

  /* ===================== HELPERS ===================== */
  const clearCart = () => setCart([]);

  const getCartTotalQty = (arr = []) =>
    arr.reduce((s, i) => s + (i.qty || 0), 0);

  /* ===================== FETCH DATA ===================== */
  useEffect(() => {
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

    fetch("https://snackalmond.duckdns.org/home/")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setActiveCategory(0);
        return preloadImages;
      })
      .finally(() => {
        setLoading(false);
        setUiReady(true);
      });
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
          img: meal.image || meal.img || "/pngegg.avif",
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
    if (!window.confirm("متأكد من الحذف؟")) return;

    try {
      await onDelete(mealId);
      setData(prev =>
        prev.map(cat => ({
          ...cat,
          meals: cat.meals.filter(m => m.id !== mealId),
        }))
      );
      toast.success("تم حذف الوجبة");
    } catch {
      toast.error("فشل الحذف");
    }
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
      toast.success("تم تحديث الوجبة");
    } catch {
      toast.error("فشل التحديث");
    }
  };

  if (loading || !uiReady) return <Loader />;

  /* ===================== RENDER ===================== */
  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <Store count={cartCount} onToggle={() => setCartOpen(true)} />
          <Navbar
            categories={data}
            active={activeCategory}
            setActive={setActiveCategory}
          />
        </div>
      </header>

      <main className="main-scroll" ref={contentRef}>
        <div className="content-wrap" key={activeCategory}>
          {data?.[activeCategory]?.meals?.length > 0 && (
            <Cards
              key={activeCategory}
              meals={data[activeCategory].meals}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onUpdateProduct={handleUpdate}
              onAddToCart={addToCart}
            />
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

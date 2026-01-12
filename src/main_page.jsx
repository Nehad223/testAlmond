import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Logo from "./components/Logo";
import Navbar from "./components/Navbar";
import Cards from "./components/Cards";
import Loader from "./components/Loader.jsx";
import Footer2 from './Footers/Footer2/Fotter2.jsx';
import Store from "./components/Store.jsx";
import CartDrawer from "./components/CartDrawer.jsx";

const Main_page = ({
  isAdmin = false,
  onDelete,
  onUpdate,
}) => {
  const [data, setData] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uiReady, setUiReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const clearCart = () => setCart([]);

  useEffect(() => {
    const criticalImages = [
      "/logo.webp",
      "/pngegg.avif",
      "/plus.webp",
      "/name.webp",
      "/location.webp",
      "/phone.webp",
    ];

    fetch("https://snackalmond.duckdns.org/home/")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setActiveCategory(0);


        Promise.all(
          criticalImages.map(src =>
            new Promise(res => {
              const img = new Image();
              img.src = src;

              const timeout = setTimeout(res, 2500); // أمان

              img.onload = () => {
                clearTimeout(timeout);
                res();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                res();
              };
            })
          )
        ).then(() => {
          setLoading(false);
          setUiReady(true);
        });
      })
      .catch(() => {
        setLoading(false);
        setUiReady(true);
      });
  }, []);

  /* ======= دوال السلة (محدّثة لحد 99) ======= */

  // الحد الأقصى الإجمالي للعناصر في السلة
  const CART_MAX_QTY = 99;

  const getCartTotalQty = (cartArray) =>
    (cartArray || []).reduce((s, i) => s + (i.qty || 0), 0);

  const addToCart = (meal) => {
    setCart(prev => {
      // حساب الكمية الكلية الحالية
      const totalQty = getCartTotalQty(prev);

      // تأكد أن إضافة عنصر واحد لن تتجاوز الحد
      if (totalQty + 1 > CART_MAX_QTY) {
        toast.warn(`لا يمكنك إضافة أكثر من ${CART_MAX_QTY} وجبة في السلة`);
        return prev;
      }

      const found = prev.find(i => i.id === meal.id);
      if (found) {
        // لو العنصر موجود، تأكد أن كمية هذا العنصر لن تتجاوز 99
        if ((found.qty || 0) + 1 > CART_MAX_QTY) {
          toast.warn(`الحد الأقصى لكمية هذا المنتج هو ${CART_MAX_QTY}`);
          return prev;
        }
        // بالإضافة، تحقق من الحد الإجمالي (أعد الحساب لأن found.qty ستزداد)
        if (totalQty + 1 > CART_MAX_QTY) {
          toast.warn(`لا يمكنك إضافة أكثر من ${CART_MAX_QTY} وجبة في السلة`);
          return prev;
        }

        return prev.map(i => i.id === meal.id ? { ...i, qty: (i.qty || 0) + 1 } : i);
      }

      // عنصر جديد: أضف فقط إذا لا يتجاوز الحد
      const newItem = { 
        id: meal.id, 
        name: meal.name || meal.title || 'بدون اسم', 
        price: Number(meal.price || meal.price_value || 0), 
        qty: 1, 
        img: meal.image || meal.img || '/pngegg.avif' 
      };
      return [...prev, newItem];
    });
  };

  const incQty = (id) => {
    setCart(prev => {
      const totalQty = getCartTotalQty(prev);
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      // لو زيادة وحدة واحدة تتجاوز الحد الإجمالي => منع
      if (totalQty + 1 > CART_MAX_QTY) {
        toast.warn(`لا يمكنك إضافة أكثر من ${CART_MAX_QTY} وجبة في السلة`);
        return prev;
      }

      // لو كمية هذا العنصر ستتجاوز 99 => منع
      if ((item.qty || 0) + 1 > CART_MAX_QTY) {
        toast.warn(`الحد الأقصى لكمية هذا المنتج هو ${CART_MAX_QTY}`);
        return prev;
      }

      return prev.map(i => i.id === id ? { ...i, qty: (i.qty || 0) + 1 } : i);
    });
  };

  const decQty = (id) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + (Number(i.price) * i.qty), 0);

  const handleOrder = () => {
    if (cart.length === 0) {
      toast.info("السلة فارغة");
      return;
    }
    toast.success("تم إرسال الطلب بنجاح!");
    setCart([]);
    setCartOpen(false);
  };

  const handleCancel = () => {
    setCartOpen(false);
  };

  /* ================= حذف فوري ================= */
  const handleDelete = async (mealId) => {
    if (!window.confirm("متأكد من الحذف؟")) return;

    try {
      await onDelete(mealId);

      setData((prev) =>
        prev.map((cat) => ({
          ...cat,
          meals: cat.meals.filter((meal) => meal.id !== mealId),
        }))
      );

      toast.success("تم حذف الوجبات");
    } catch {
      toast.error("فشل الحذف");
    }
  };

  /* ================= تعديل فوري ================= */
  const handleUpdate = async (mealId, updatedData) => {
    try {
      await onUpdate(mealId, updatedData);

      setData((prev) =>
        prev.map((cat) => ({
          ...cat,
          meals: cat.meals.map((meal) =>
            meal.id === mealId ? { ...meal, ...updatedData } : meal
          ),
        }))
      );

      toast.success("تم تحديث الوجبة");
    } catch {
      toast.error("فشل التحديث");
    }
  };


  if (loading || !uiReady) return <Loader />;

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

      <main className="main-scroll">
        <div className="content-wrap">
          {data?.[activeCategory]?.meals?.length > 0 && (
            <Cards
              meals={data[activeCategory].meals}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onUpdateProduct={handleUpdate}
              Categories={data}
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
        onCancel={handleCancel}
        clearCart={clearCart}
      />

      <Footer2/>
    </div>
  );
};

export default Main_page;

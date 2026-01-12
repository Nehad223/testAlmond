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

  /* ======= سلة المشتريات وفتح الدروير ======= */
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const clearCart = () => setCart([]);

  useEffect(() => {
    const criticalImages = [
      "/logo.png",
      "/pngegg.avif",
      "/plus.png",
      "/name.png",
      "/location.png",
      "/phone.png",
    ];

    fetch("https://snackalmond.duckdns.org/home/")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setActiveCategory(0);

        // تحميل الصور الحرجة مع timeout لتفادي التعليق
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

  /* ======= دوال السلة ======= */
  const addToCart = (meal) => {
    setCart(prev => {
      const found = prev.find(i => i.id === meal.id);
      if (found) {
        return prev.map(i => i.id === meal.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { 
        id: meal.id, 
        name: meal.name || meal.title || 'بدون اسم', 
        price: Number(meal.price || meal.price_value || 0), 
        qty: 1, 
        img: meal.image || meal.img || '/pngegg.avif' 
      }];
    });
  };

  const incQty = (id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
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

      toast.success("تم حذف الوجبة");
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

  // عرض اللودر حتى تحميل البيانات + الصور الحرجة
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

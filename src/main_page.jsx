import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Logo from "./components/Logo";
import Navbar from "./components/Navbar";
import Cards from "./components/Cards";
import Loader from "./components/Loader.jsx";
import Footer2 from './Footers/Footer2/Fotter2.jsx';
import Store from "./components/Store.jsx";
import CartDrawer from "./components/CartDrawer.jsx"; // اضيف الملف الجديد

const Main_page = ({
  isAdmin = false,
  onDelete,
  onUpdate,
}) => {
  const [data, setData] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ======= سلة المشتريات وفتح الدروير ======= */
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]); // كل عنصر: { id, name, price, qty, img }

  // الآن بعد تعريف setCart نحط clearCart
  const clearCart = () => setCart([]);

  useEffect(() => {
    fetch("http://31.97.75.5/home/")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setActiveCategory(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
    // ما بنفتح السلة آلياً هون حسب طلبك
  };

  const incQty = (id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  };
  const decQty = (id) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.qty <= 1) {
        // نحذف العنصر لو صار صفر
        return prev.filter(i => i.id !== id);
      }
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
    // ممكن تستخدم هالـ handler لو بدك إرسال مباشر من هنا
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
          meals: cat.meals.filter(
            (meal) => meal.id !== mealId
          ),
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
            meal.id === mealId
              ? { ...meal, ...updatedData }
              : meal
          ),
        }))
      );

      toast.success("تم تحديث الوجبة");
    } catch {
      toast.error("فشل التحديث");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="app">
      
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          {/* مرّر عدد العناصر ودالة فتح السلة */}
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
        clearCart={clearCart} // بنمرر دالة تفريغ السلة
      />

      <Footer2/>
    </div>
  );
};

export default Main_page;


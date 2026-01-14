import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "./../admin.css";
import Navbar from "../../components/Navbar";
import Logo from "../../components/Logo";
import EditPage from "./Edit";

export default function AdminPage() {
  const [categories, setCategories] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [loading, setLoading] = useState(false);

  const [prodForm, setProdForm] = useState({
    name: "",
    englishName: "",
    price: "",
    category: "",
    image_url: "",
  });

  const widgetRef = useRef(null);
  const token = sessionStorage.getItem("token");

  // =======================
  // جلب الكاتيغوريس فقط
  // =======================
  useEffect(() => {
    if (!token) return;

    fetch("https://snackalmond.duckdns.org/getcategories/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // البيانات جاية من الباك كما هي [{id, name}]
        setCategories(data);
      })
      .catch(() => toast.error("خطأ في جلب الكاتيجوريس"));
  }, [token]);

  // =======================
  // Cloudinary Widget
  // =======================
  useEffect(() => {
    if (!window.cloudinary) {
      toast.error("Cloudinary غير محمّل");
      return;
    }

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dph8y1htk",
        uploadPreset: "unsigned_products",
        multiple: false,
        folder: "products",
      },
      (error, result) => {
        if (error) {
          console.error(error);
          toast.error("خطأ أثناء رفع الصورة");
          return;
        }

        if (result.event === "success") {
          setProdForm((prev) => ({
            ...prev,
            image_url: result.info.secure_url,
          }));
          toast.success("تم رفع الصورة بنجاح");
        }
      }
    );
  }, []);

  // =======================
  // إضافة كاتيجوري
  // =======================
  const handleAddCategory = async () => {
    if (!catName) return toast.error("أدخل اسم الكاتيجوري");

    try {
      const res = await fetch(
        "https://snackalmond.duckdns.org/createcategory/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: catName }),
        }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setCategories((prev) => [...prev, data]);
      setCatName("");
      setIsCatModalOpen(false);
      toast.success("تمت إضافة الكاتيجوري");
    } catch {
      toast.error("خطأ أثناء إضافة الكاتيجوري");
    }
  };

  // =======================
  // إضافة وجبة
  // =======================
  const handleAddProduct = async (e) => {
    e.preventDefault();

    const { name, englishName, price, category, image_url } = prodForm;

    if (!name || !englishName || !price || !category || !image_url) {
      return toast.error("املأ جميع الحقول");
    }

    setLoading(true);

    try {

      const res = await fetch(
        "https://snackalmond.duckdns.org/createmeal/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            englishName,
            price: Number(price),
            category: Number(category), // id الحقيقي
            image_url,
          }),
        }
    

      );
      console.log(prodForm)

      if (!res.ok) throw new Error();

      await res.json();

      setProdForm({
        name: "",
        englishName: "",
        price: "",
        category: "",
        image_url: "",
      });

      setIsProdModalOpen(false);
      toast.success("تمت إضافة الوجبة");
    } catch {
      toast.error("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // UI
  // =======================
  return (
    <>
 

    <div className="min-h-screen flex flex-col items-end gap-4 bg-[#111] text-white p-6 admin container">
      <button className="admin-btn" onClick={() => setIsCatModalOpen(true)}>
        إضافة كاتيجوري
      </button>

      <button className="admin-btn" onClick={() => setIsProdModalOpen(true)}>
        إضافة وجبة
      </button>

      {isCatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>إضافة كاتيجوري</h2>

            <input
              type="text"
              placeholder="اسم الكاتيجوري"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />

            <div className="modal-buttons">
              <button
                className="cancel"
                onClick={() => setIsCatModalOpen(false)}
              >
                إلغاء
              </button>
              <button className="add" onClick={handleAddCategory}>
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {isProdModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>إضافة وجبة</h2>

            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="اسم الوجبة"
                value={prodForm.name}
                onChange={(e) =>
                  setProdForm((p) => ({ ...p, name: e.target.value }))
                }
              />

              <input
                type="text"
                placeholder="English Name"
                value={prodForm.englishName}
                onChange={(e) =>
                  setProdForm((p) => ({ ...p, englishName: e.target.value }))
                }
              />

              <input
                type="number"
                placeholder="السعر"
                value={prodForm.price}
                onChange={(e) =>
                  setProdForm((p) => ({ ...p, price: e.target.value }))
                }
              />

              <select
                value={prodForm.category}
                onChange={(e) =>
                  setProdForm((p) => ({
                    ...p,
                    category: e.target.value,
                  }))
                }
              >
                <option value="">اختر الكاتيجوري</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="upload-btn"
                onClick={() => widgetRef.current.open()}
              >
                رفع صورة الوجبة
              </button>

              <div className="modal-buttons mt-3">
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setIsProdModalOpen(false)}
                >
                  إلغاء
                </button>

                <button type="submit" className="add">
                  {loading ? "جارٍ الإضافة..." : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}
          <button
        className="admin-btn bg-yellow-500"
         onClick={() => (window.location.href = "admin/edit")}
      >
        تعديل الوجبة
      </button>
    </div>

        </>
  );
}


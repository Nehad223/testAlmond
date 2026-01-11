import React, { useState } from "react";
import { toast } from "react-toastify";
import '../admin/admin.css';
import Add_Store_Btn from "./Add_Store_Btn";
const Card_Slider = ({
  Img,
  Title,
  TitleEng,
  PriceNumber,
  CategoryId,
  Id,
  isAdmin,
  onDelete,
  onUpdateProduct, // دالة تحديث كل الخصائص
    onAddToCart, 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: Title,
    englishName: TitleEng,
    price: PriceNumber,
    category: CategoryId,
    image_url: Img,
  });
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = () => {
    setForm({
      name: Title,
      englishName: TitleEng,
      price: PriceNumber,
      category: CategoryId,
      image_url: Img,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const parsedPrice = Number(form.price);
    if (!form.name || !form.englishName) {
      return toast.error("املأ جميع الحقول");
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return toast.error("أدخل سعر صالح");
    }

    setSaving(true);
    try {
      await onUpdateProduct(Id, {
        ...form,
        price: parsedPrice,
      });
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("فشل تحديث المنتج");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="Card_Slider card">
        <div className={`img-wrapper ${loaded ? "loaded" : "loading"}`}>
          <img
            src={Img || "/exampel.jpg"}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            alt={Title}
          />
        </div>

        <div className="info">
          <h1 className="ar">{Title}</h1>
          <h1 className="en">{TitleEng}</h1>
          <h1>{PriceNumber} ل.س</h1>
               {!isAdmin && (
  <Add_Store_Btn
    meal={{
      id: Id,
      name: Title,
      price: PriceNumber,
      image: Img
    }}
    onAddToCart={onAddToCart}
  />
)}

        </div>


        {isAdmin && (
          <div
            className="actions"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          >
            <button
              onClick={handleOpenEdit}
              style={{
                marginRight: 8,
                padding: "6px 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "#ffd166",
              }}
            >
              تعديل
            </button>

            <button
              onClick={() => onDelete(Id)}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "#ef476f",
                color: "#fff",
              }}
            >
              حذف
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" role="dialog" aria-modal="true">
            <h3>تعديل الوجبة</h3>

            <input
              type="text"
              placeholder="اسم الوجبة"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              type="text"
              placeholder="English Name"
              value={form.englishName}
              onChange={(e) =>
                setForm((p) => ({ ...p, englishName: e.target.value }))
              }
            />
            <input
              type="number"
              placeholder="السعر"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            />


            <button
              type="button"
              className="upload-btn"
              onClick={() =>
                window.cloudinary &&
                window.cloudinary
                  .createUploadWidget(
                    {
                      cloudName: "dph8y1htk",
                      uploadPreset: "unsigned_products",
                      multiple: false,
                      folder: "products",
                    },
                    (err, res) => {
                      if (res.event === "success") {
                        setForm((p) => ({ ...p, image_url: res.info.secure_url }));
                        toast.success("تم رفع الصورة بنجاح");
                      }
                    }
                  )
                  .open()
              }
            >
              رفع صورة جديدة
            </button>


            <div className="modal-buttons mt-3">
              <button onClick={() => setShowModal(false)} className="cancel" disabled={saving}>
                إلغاء
              </button>
              <button onClick={handleSave} disabled={saving}  className="add">
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Card_Slider;




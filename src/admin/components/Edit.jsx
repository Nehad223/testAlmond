import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Main_page from "../../main_page";

const EditPage = () => {
  const navigate = useNavigate();
  const adminToken = sessionStorage.getItem("token");
  const isAdmin = Boolean(adminToken);

  useEffect(() => {
    if (!adminToken) navigate("/");
  }, [adminToken, navigate]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  });

  // حذف (API فقط)
const deleteMeal = async (mealId) => {
  try {
    const [res1, res2] = await Promise.all([
      fetch(`https://snackalmond.duckdns.org/editmeal/${mealId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
      fetch(`https://snackalmond1.pythonanywhere.com/editmeal/${mealId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    ]);

    if (!res1.ok || !res2.ok) {
      throw new Error("DELETE_FAILED");
    }

    toast.success("تم حذف الوجبة بنجاح");
  } catch (err) {
    console.error(err);
    toast.error("حدث خطأ أثناء حذف الوجبة");
  }
};


  const updateMeal = async (mealId, updatedData) => {
  try {
    const [res1, res2] = await Promise.all([
      fetch(`https://snackalmond.duckdns.org/editmeal/${mealId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData),
      }),
      fetch(`https://snackalmond1.pythonanywhere.com/editmeal/${mealId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData),
      }),
    ]);

    if (!res1.ok || !res2.ok) {
      throw new Error("UPDATE_FAILED");
    }

    toast.success("تم تعديل الوجبة بنجاح");
  } catch (err) {
    console.error(err);
    toast.error("حدث خطأ أثناء تعديل الوجبة");
  }
};


  return (
    <>
      <Main_page
        isAdmin={isAdmin}
        onDelete={deleteMeal}
        onUpdate={updateMeal}
      />

    </>
  );
};

export default EditPage;

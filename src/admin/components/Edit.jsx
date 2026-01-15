import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
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


  const deleteMeal = async (mealId) => {
    const res = await fetch(
      `https://snackalmond.duckdns.org/editmeal/${mealId}/`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error("DELETE_FAILED");
    }
  };

  const updateMeal = async (mealId, updatedData) => {
    const res = await fetch(
      `https://snackalmond.duckdns.org/editmeal/${mealId}/`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData),
      }
    );

    if (!res.ok) {
      throw new Error("UPDATE_FAILED");
    }
  };

  return (
    <>
      <Main_page
        isAdmin={isAdmin}
        onDelete={deleteMeal}
        onUpdate={updateMeal}
      />

      <ToastContainer
        position="bottom-center"
        autoClose={2500}
        hideProgressBar
        theme="dark"
      />
    </>
  );
};

export default EditPage;


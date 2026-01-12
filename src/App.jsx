import './App.css'
import Main_page from './main_page';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import ProtectEdit from './admin/components/ProtectEdit'
import AdminDashboard from './admin/page';
import AdminLogin from './admin/login/page';
import ProtectedRoute from './admin//components/ProtectedRoute';
import EditPage from './admin/components/Edit';
import AdminLogin2 from './admin/login2/page';
import CashierPage from './Cashier/CashierPage';

function App() {
  return (
    <div>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        theme="dark"
      />

      <Routes>
        <Route path="/" element={<Main_page />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/login2" element={<AdminLogin2 />} />
<Route path='cashier' element={<CashierPage/>} />


        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>

          }
        />
                <Route
          path="/admin/edit"
          element={
            <ProtectEdit>
              <EditPage />
            </ProtectEdit>

          }
        />
        
      </Routes>
    </div>
  )
}

export default App;

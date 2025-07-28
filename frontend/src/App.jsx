import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './assets/ProtectedRoutes';
import Layout from './assets/Layout';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import AdminHome from './pages/AdminHome';

function App() {
  return (
    <Router>
      <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<UserHome />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminHome />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
      </Routes>
    </Router>
  );
}

export default App;

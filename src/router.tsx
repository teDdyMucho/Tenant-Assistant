import { createBrowserRouter, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Home from './pages/Home';
import Otp from './pages/Otp';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/register',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Register />,
  },
  {
    path: '/otp',
    element: <Otp />,
  },
  {
    path: '/home',
    element: <Home />,
  },
]);

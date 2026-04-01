import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import Layout from './components/Layout.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import TelegramBackupOnBrowserOpen from './components/TelegramBackupOnBrowserOpen.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import TitleDetail from './pages/TitleDetail.jsx';
import EditTitle from './pages/EditTitle.jsx';
import MyLists from './pages/MyLists.jsx';
import Backup from './pages/Backup.jsx';
import AddTitle from './pages/AddTitle.jsx';
import AddBookmark from './pages/AddBookmark.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

function SearchToBrowseRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/browse${search}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <TelegramBackupOnBrowserOpen />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="browse" element={<Browse />} />
            <Route path="search" element={<SearchToBrowseRedirect />} />
            <Route path="title/:slug" element={<TitleDetail />} />
            <Route path="lists" element={<MyLists />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/backup" element={<Backup />} />
              <Route path="admin/add" element={<AddTitle />} />
              <Route path="admin/add-bookmark" element={<AddBookmark />} />
              <Route path="title/:slug/edit" element={<EditTitle />} />
            </Route>
            <Route path="backup" element={<Navigate to="/admin/backup" replace />} />
            <Route path="add" element={<Navigate to="/admin/add" replace />} />
            <Route path="add-bookmark" element={<Navigate to="/admin/add-bookmark" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

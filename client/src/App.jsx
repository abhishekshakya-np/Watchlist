import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
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
import NotFound from './pages/NotFound.jsx';

function SearchToBrowseRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/browse${search}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TelegramBackupOnBrowserOpen />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="search" element={<SearchToBrowseRedirect />} />
          <Route path="title/:slug/edit" element={<EditTitle />} />
          <Route path="title/:slug" element={<TitleDetail />} />
          <Route path="lists" element={<MyLists />} />
          <Route path="backup" element={<Backup />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="add" element={<AddTitle />} />
          <Route path="add-bookmark" element={<AddBookmark />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

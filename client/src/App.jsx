import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import TelegramBackupOnBrowserOpen from './components/TelegramBackupOnBrowserOpen.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import Search from './pages/Search.jsx';
import TitleDetail from './pages/TitleDetail.jsx';
import EditTitle from './pages/EditTitle.jsx';
import MyLists from './pages/MyLists.jsx';
import Backup from './pages/Backup.jsx';
import AddTitle from './pages/AddTitle.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <TelegramBackupOnBrowserOpen />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="search" element={<Search />} />
          <Route path="title/:slug/edit" element={<EditTitle />} />
          <Route path="title/:slug" element={<TitleDetail />} />
          <Route path="lists" element={<MyLists />} />
          <Route path="backup" element={<Backup />} />
          <Route path="add" element={<AddTitle />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

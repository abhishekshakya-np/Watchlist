import { Link } from 'react-router-dom';
import TitleCard from './TitleCard.jsx';

export default function SidebarBlock({ title, items, viewMoreLink, viewMoreLabel = 'View more' }) {
  if (!items?.length) return null;
  return (
    <aside className="sidebar-block">
      <h3 className="sidebar-block-title">{title}</h3>
      <ul className="sidebar-block-list">
        {items.map((item) => (
          <li key={item.id}>
            <TitleCard title={item} compact />
          </li>
        ))}
      </ul>
      {viewMoreLink && (
        <Link to={viewMoreLink} className="sidebar-block-more">
          {viewMoreLabel}
        </Link>
      )}
    </aside>
  );
}

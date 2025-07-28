import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  return (
    <header className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow-md">
        <img src="logo.png" alt="logo" className=' w-4 ' />
      
      <nav className="flex gap-4">
        <Link
          to="/"
          className={`hover:text-green-400 transition ${location.pathname === '/user' ? 'text-green-400 font-semibold' : ''}`}
        >
          Home
        </Link>
        <Link
          to="/admin"
          className={`hover:text-blue-400 transition ${location.pathname === '/admin' ? 'text-blue-400 font-semibold' : ''}`}
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}

import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}

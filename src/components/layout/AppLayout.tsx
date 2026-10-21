import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}

export function BareLayout() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Outlet />
    </div>
  );
}

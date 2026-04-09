import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-on-surface">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,61,155,0.16),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(140,0,29,0.1),_transparent_32%)]" />
      <div className="absolute left-1/2 top-0 h-40 w-[60rem] -translate-x-1/2 bg-gradient-to-b from-white/80 to-transparent blur-3xl" />

      <div className="relative mx-auto  min-h-screen max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-8">
        <section className="flex items-center  justify-center">
          <div className="w-full max-w-xl rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-[0_20px_60px_rgba(20,27,44,0.08)] sm:p-8 lg:p-10">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;


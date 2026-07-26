import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: "Overview", label: "Dashboard", path: "/", icon: "dashboard" },
    { name: "Map View", label: "Topography", path: "/map", icon: "map" },
    {
      name: "Node Detail",
      label: "Sensor Clusters",
      path: "/nodes/NODE-001",
      icon: "hub",
    },
  ];

  return (
    <>
      {/* TopNavBar */}
      <header className="bg-surface border-b border-outline-variant h-16 fixed top-0 w-full z-50">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-full">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-display-lg text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2"
            >
              <span>GEO-VIGILANT</span>
            </Link>
            <div className="h-8 w-[1px] bg-outline-variant ml-4 hidden md:block" />
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-lg border border-outline-variant">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="location_on"
              >
                location_on
              </span>
              <select className="bg-transparent border-none focus:ring-0 font-body-md text-on-surface pr-8 py-0 cursor-pointer">
                <option>Cianjur - Sektor 4</option>
                <option>Cianjur - Sektor 1</option>
                <option>Sumedang - Zona B</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 w-64">
              <input
                className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-body-md text-on-surface placeholder-outline"
                placeholder="Cari sensor..."
                type="text"
              />
              <span
                className="material-symbols-outlined text-outline"
                data-icon="search"
              >
                search
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar & Mobile Nav */}
      <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] fixed top-16 left-0 p-4 gap-2 w-64 bg-surface-container-low border-r border-outline-variant z-40 shrink-0">
        <div className="px-2 py-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center shadow-sm">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="hub"
              >
                hub
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-lg font-bold text-primary">
                Global Status
              </h2>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant opacity-70">
                Vigilant - Sistem Normal
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                item.path !== "/map" &&
                location.pathname.startsWith("/nodes"));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  data-icon={item.icon}
                >
                  {item.icon}
                </span>
                <span className="font-label-caps text-xs uppercase tracking-wider">
                  {item.label} ({item.name})
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant flex justify-around items-center h-16 z-50">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" &&
              item.path !== "/map" &&
              location.pathname.startsWith("/nodes"));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 ${
                isActive
                  ? "text-secondary font-bold"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

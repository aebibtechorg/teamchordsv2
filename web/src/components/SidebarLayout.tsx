import Sidebar from "./Sidebar";

export default function SidebarLayout({ children }) {
  return (
      <div className="flex w-full h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 w-full h-full overflow-auto">
          {children}
        </div>
      </div>
  );
}
import Sidebar from "./Sidebar";

export default function SidebarLayout({ children }) {
  return (
      <div className="fixed inset-0 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="w-full h-full overflow-y-auto bg-gray-100 pb-24 md:pb-0">
          {children}
        </div>
      </div>
  );
}
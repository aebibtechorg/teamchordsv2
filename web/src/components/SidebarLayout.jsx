import Sidebar from "./Sidebar";

export default function SidebarLayout({ children }) {
  return (
      <div className="flex w-full h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 w-full p-4 overflow-auto">
          {children}
        </div>
      </div>
  );
}
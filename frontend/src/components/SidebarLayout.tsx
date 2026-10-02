import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const hideSidebar = pathname === '/onboard';

  return (
    <View className="flex-1 flex-col md:flex-row bg-gray-100">
      {!hideSidebar && <Sidebar />}
      <View className="flex-1 bg-gray-100 overflow-hidden">
        {children}
      </View>
      {!hideSidebar && <MobileSidebar />}
    </View>
  );
}


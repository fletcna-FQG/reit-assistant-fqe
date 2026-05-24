import { PersistentBottomNav } from '@/components/layout/PersistentBottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { useResponsive } from '@/hooks/useResponsive';
import { View } from 'react-native';

type ResponsiveLayoutProps = {
  children: React.ReactNode;
};

/**
 * Responsive shell — 02_Component_Library.md
 * Desktop (≥1024px): Sidebar 280px + main content
 * Mobile (<1024px): Full-width content + persistent bottom navigation
 * Left-handed: flips sidebar to the right
 */
export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { isDesktop } = useResponsive();
  const { isLeftHanded } = useLeftHanded();

  if (!isDesktop) {
    return (
      <View className="flex-1 bg-light-gray" style={{ flex: 1 }}>
        <View className="flex-1">{children}</View>
        <PersistentBottomNav />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-light-gray"
      style={{
        flex: 1,
        flexDirection: isLeftHanded ? 'row-reverse' : 'row',
      }}
    >
      <Sidebar />
      <View
        className="flex-1"
        style={{
          flex: 1,
          marginLeft: isLeftHanded ? 0 : undefined,
          marginRight: isLeftHanded ? 0 : undefined,
        }}
      >
        {children}
      </View>
    </View>
  );
}

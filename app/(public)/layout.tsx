import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";
import SiteFooter from "@/components/SiteFooter";
import PublicSidebar from "@/components/PublicSidebar";
import { AmbientScene } from "@/components/home/AmbientScene";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-public-shell flex min-h-screen flex-col overflow-x-clip">
      <AmbientScene />
      <div className="flex min-h-0 flex-1">
        <PublicSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="flex-1 overflow-x-clip">{children}</main>
        </div>
      </div>
      <SiteFooter />
      <BottomTabBar />
    </div>
  );
}

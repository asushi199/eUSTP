import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";
import SiteFooter from "@/components/SiteFooter";
import { AmbientScene } from "@/components/home/AmbientScene";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-public-shell flex min-h-screen flex-col overflow-x-clip">
      <AmbientScene />
      <TopNav />
      <main className="flex-1 overflow-x-clip pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomTabBar />
    </div>
  );
}

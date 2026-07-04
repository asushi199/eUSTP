import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";
import SiteFooter from "@/components/SiteFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomTabBar />
    </div>
  );
}

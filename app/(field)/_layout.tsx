import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";

const NAV: NavItem[] = [
  { name: "dashboard", label: "Home",    icon: "home-outline",      href: "/(field)/dashboard", matchPath: "/dashboard" },
  { name: "inspect",   label: "Inspect", icon: "clipboard-outline", href: "/(field)/inspect",   matchPath: "/inspect"   },
  { name: "actions",   label: "Actions", icon: "warning-outline",   href: "/(field)/actions",   matchPath: "/actions"   },
  { name: "training",  label: "Training",icon: "school-outline",    href: "/(field)/training",  matchPath: "/training"  },
];

export default function FieldLayout() {
  return <AppShell navItems={NAV} />;
}

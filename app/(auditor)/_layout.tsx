import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";

const NAV: NavItem[] = [
  { name: "dashboard",   label: "Overview",    icon: "eye-outline",               href: "/(auditor)/dashboard",   matchPath: "/dashboard"   },
  { name: "inspections", label: "Inspections", icon: "clipboard-outline",         href: "/(auditor)/inspections", matchPath: "/inspections" },
  { name: "compliance",  label: "Compliance",  icon: "shield-checkmark-outline",  href: "/(auditor)/compliance",  matchPath: "/compliance"  },
];

export default function AuditorLayout() {
  return <AppShell navItems={NAV} />;
}

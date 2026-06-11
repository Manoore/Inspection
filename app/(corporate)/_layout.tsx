import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";

const NAV: NavItem[] = [
  { name: "dashboard",   label: "Dashboard",   icon: "grid-outline",            href: "/(corporate)/dashboard",    matchPath: "/dashboard"    },
  { name: "locations",   label: "Locations",   icon: "location-outline",        href: "/(corporate)/locations",    matchPath: "/locations"    },
  { name: "inspections", label: "Inspections", icon: "clipboard-outline",       href: "/(corporate)/inspections",  matchPath: "/inspections"  },
  { name: "checklists",  label: "Checklists",  icon: "checkbox-outline",        href: "/(corporate)/checklists",   matchPath: "/checklists"   },
  { name: "training",    label: "Training",    icon: "school-outline",          href: "/(corporate)/training",     matchPath: "/training"     },
  { name: "actions",     label: "Actions",     icon: "alert-circle-outline",    href: "/(corporate)/actions",      matchPath: "/actions"      },
  { name: "escalation",  label: "Escalation",  icon: "git-branch-outline",      href: "/(corporate)/escalation",   matchPath: "/escalation"   },
  { name: "reports",     label: "Reports",     icon: "document-text-outline",   href: "/(corporate)/reports",      matchPath: "/reports"      },
  { name: "users",       label: "Users",       icon: "people-outline",          href: "/(corporate)/users",        matchPath: "/users"        },
  { name: "inquiries",   label: "Inquiries",   icon: "mail-outline",            href: "/(corporate)/inquiries",    matchPath: "/inquiries"    },
  { name: "profile",     label: "Profile",     icon: "person-circle-outline",   href: "/(corporate)/profile",      matchPath: "/profile"      },
];

export default function CorporateLayout() {
  return <AppShell navItems={NAV} />;
}

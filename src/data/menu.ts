// src/data/menu.ts
import {
    HomeIcon,
    FireIcon,
    ChartBarIcon,
    BookOpenIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
  } from "@heroicons/react/24/outline";
  
  export const menuItems = [
    { name: "แดชบอร์ด", href: "/admin", icon: HomeIcon },
    { name: "ข้อมูลต้นกล้า", href: "/admin/seedlings", icon: FireIcon },
    { name: "รุ่น/แหล่งที่มา", href: "/admin/batches", icon: MapPinIcon },
    { name: "Logbook", href: "/admin/logbook", icon: BookOpenIcon },
    { name: "Partner/เครือข่าย", href: "/admin/partners", icon: UsersIcon },
    { name: "Request Order", href: "/admin/requests", icon: ClipboardDocumentListIcon },
    { name: "สถานะโครงการ", href: "/admin/status", icon: ChartBarIcon },
  ];
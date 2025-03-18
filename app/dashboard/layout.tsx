"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  IconMenu2,
  IconHome,
  IconBox,
  IconTruck,
  IconCoin,
  IconUsers,
  IconBuildingStore,
  IconReportMoney,
  IconBuildingWarehouse,
  IconBottleFilled,
  IconSettings,
  IconShoppingCart,
  IconDashboard,
  IconCash,
  IconPackage,
  IconTruckDelivery,
  IconUserCircle,
  IconBuilding,
  IconPackageImport,
  IconFilter,
} from "@tabler/icons-react";
import { LoadingOverlay } from "@/components/loading-overlay";
const drawerWidth = 280;

const menuItems = [
  {
    title: "لوحة التحكم",
    path: "/dashboard",
    icon: <IconDashboard />,
  },
  {
    title: "المنتجات",
    path: "/dashboard/products",
    icon: <IconBottleFilled />,
  },
  {
    title: "المبيعات",
    path: "/dashboard/sales",
    icon: <IconCash />,
  },
  {
    title: "المشتريات",
    path: "/dashboard/purchases",
    icon: <IconShoppingCart />,
  },

  {
    title: "المخازن",
    path: "/dashboard/warehouses",
    icon: <IconBuildingWarehouse />,
  },
  {
    title: "المواد",
    path: "/dashboard/materials",
    icon: <IconFilter />,
  },
  {
    title: "المنتج النهائي",
    path: "/dashboard/inventory",
    icon: <IconPackage />,
  },
  {
    title: "العملاء",
    path: "/dashboard/customers",
    icon: <IconUsers />,
  },
  {
    title: "الموردين",
    path: "/dashboard/suppliers",
    icon: <IconPackageImport />,
  },
  {
    title: "المندوبين",
    path: "/dashboard/representatives",
    icon: <IconUsers />,
  },
  {
    title: "النقل",
    path: "/dashboard/vehicles",
    icon: <IconTruckDelivery />,
  },
  {
    title: "الأصول الثابتة",
    path: "/dashboard/assets",
    icon: <IconBuilding />,
  },
  {
    title: "الخزينة",
    path: "/dashboard/treasury",
    icon: <IconCash />,
  },
  {
    title: "المستخدمين",
    path: "/dashboard/users",
    icon: <IconUserCircle />,
    roles: ["ADMIN"],
  },
  {
    title: "الإعدادات",
    path: "/dashboard/settings",
    icon: <IconSettings />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return <LoadingOverlay />;
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          مصنع كلاكيت
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => {
          if (item.roles && !item.roles.includes(session.user?.role)) {
            return null;
          }
          let isActive = pathname === item.path;
          return (
            <ListItem key={item.title} disablePadding className={`${isActive ? "bg-primary " : ""}`}>
              <ListItemButton
                onClick={() => {
                  router.push(item.path);
                  setMobileOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          left: { sm: `${drawerWidth}px` },
          mr: { sm: `${drawerWidth}px` },
          bgcolor: "primary.light",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: "none" } }}
          >
            <IconMenu2 />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="h6" noWrap component="div">
            {session.user?.name}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              direction: "rtl",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

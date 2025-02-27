"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useApi } from "@/hooks/use-api";
import { CategoriesManagement } from "@/components/dashboard/categories-management";
import { UnitsManagement } from "@/components/dashboard/units-management";
import { CompanySettings } from "@/app/components/settings/company-settings";
import { BackupSettings } from "@/app/components/settings/backup-settings";
import { SystemSettings } from "@/app/components/settings/system-settings";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const api = useApi();

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/api/categories"),
  });

  const {
    data: units,
    isLoading: unitsLoading,
    refetch: refetchUnits,
  } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/api/units"),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (categoriesLoading || unitsLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" />

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="إعدادات الشركة" />
              <Tab label="التصنيفات" />
              <Tab label="الوحدات" />
              <Tab label="النسخ الاحتياطي" />
              <Tab label="إعدادات النظام" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <CompanySettings />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CategoriesManagement
              categories={categories}
              onUpdate={refetchCategories}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <UnitsManagement units={units} onUpdate={refetchUnits} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <BackupSettings />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <SystemSettings />
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
} 
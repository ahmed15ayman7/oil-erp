"use client";

import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ar } from "date-fns/locale";
import dayjs from "dayjs";

export type DateRange = "day" | "week" | "month" | "year";

interface DateRangeSelectorProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onDateChange: (date: dayjs.Dayjs) => void;
  currentDate: dayjs.Dayjs;
}

export function DateRangeSelector({
  range,
  onRangeChange,
  onDateChange,
  currentDate,
}: DateRangeSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: DateRange | null
  ) => {
    if (newRange) {
      onRangeChange(newRange);
      // تحديث التاريخ عند تغيير النطاق
      let newDate = new Date(currentDate.toDate());
      switch (newRange) {
        case "day":
          newDate = new Date(); // اليوم الحالي
          break;
        case "week":
          newDate = startOfWeek(new Date(), { locale: ar }); // بداية الأسبوع الحالي
          break;
        case "month":
          newDate = startOfMonth(new Date()); // بداية الشهر الحالي
          break;
        case "year":
          newDate = startOfYear(new Date()); // بداية السنة الحالية
          break;
      }
      onDateChange(dayjs(newDate));
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate.toDate());
    switch (range) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    onDateChange(dayjs(newDate));
  };

  const handleNext = () => {
    const newDate = new Date(currentDate.toDate());
    const today = new Date();
    let canAdvance = true;

    switch (range) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        canAdvance = newDate <= today;
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        canAdvance = startOfWeek(newDate, { locale: ar }) <= today;
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        canAdvance = startOfMonth(newDate) <= today;
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() + 1);
        canAdvance = startOfYear(newDate) <= today;
        break;
    }

    if (canAdvance) {
      onDateChange(dayjs(newDate));
    }
  };

  const handleCalendarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuickSelect = (option: string) => {
    let newDate = new Date();
    switch (option) {
      case "today":
        break;
      case "yesterday":
        newDate = subDays(newDate, 1);
        break;
      case "lastWeek":
        newDate = subWeeks(newDate, 1);
        break;
      case "lastMonth":
        newDate = subMonths(newDate, 1);
        break;
      case "lastYear":
        newDate = subYears(newDate, 1);
        break;
    }
    onDateChange(dayjs(newDate));
    handleMenuClose();
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    switch (range) {
      case "day":
        return format(currentDate.toDate(), "dd MMMM yyyy", { locale: ar });
      case "week":
        const weekStart = currentDate.startOf("week");
        const weekEnd = currentDate.endOf("week");
        return `${format(weekStart.toDate(), "dd", { locale: ar })} - ${format(
          weekEnd.toDate(),
          "dd MMMM yyyy",
          { locale: ar }
        )}`;
      case "month":
        return format(currentDate.toDate(), "MMMM yyyy", { locale: ar });
      case "year":
        return format(currentDate.toDate(), "yyyy", { locale: ar });
    }
  };

  return (
    <Box className="flex items-center gap-4">
      <ToggleButtonGroup
        value={range}
        exclusive
        onChange={handleRangeChange}
        size="small"
      >
        <ToggleButton value="day">يوم</ToggleButton>
        {/* <ToggleButton value="week">أسبوع</ToggleButton> */}
        <ToggleButton value="month">شهر</ToggleButton>
        <ToggleButton value="year">سنة</ToggleButton>
      </ToggleButtonGroup>

      <Box className="flex items-center gap-2">
        <IconButton onClick={handlePrevious} size="small">
          <IconChevronRight size={20} />
        </IconButton>

        <Tooltip title="اختيار سريع">
          <Box
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 cursor-pointer"
            onClick={handleCalendarClick}
          >
            <IconCalendar size={16} />
            <span className="text-sm">{formatDate()}</span>
          </Box>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <MenuItem onClick={() => handleQuickSelect("today")}>
            اليوم
          </MenuItem>
          <MenuItem onClick={() => handleQuickSelect("yesterday")}>
            الأمس
          </MenuItem>
          <MenuItem onClick={() => handleQuickSelect("lastWeek")}>
            الأسبوع الماضي
          </MenuItem>
          <MenuItem onClick={() => handleQuickSelect("lastMonth")}>
            الشهر الماضي
          </MenuItem>
          <MenuItem onClick={() => handleQuickSelect("lastYear")}>
            السنة الماضية
          </MenuItem>
        </Menu>

        <IconButton
          onClick={handleNext}
          size="small"
          disabled={
            new Date(currentDate.toDate()).setHours(0, 0, 0, 0) >=
            new Date().setHours(0, 0, 0, 0)
          }
        >
          <IconChevronLeft size={20} />
        </IconButton>
      </Box>
    </Box>
  );
} 
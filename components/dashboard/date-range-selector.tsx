"use client";

import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";

export type DateRange = "day" | "week" | "month" | "year";

interface DateRangeSelectorProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onDateChange: (date: Date) => void;
  currentDate: Date;
}

export function DateRangeSelector({
  range,
  onRangeChange,
  onDateChange,
  currentDate,
}: DateRangeSelectorProps) {
  const handleRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: DateRange | null
  ) => {
    if (newRange) {
      onRangeChange(newRange);
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
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
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (range) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    onDateChange(newDate);
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    switch (range) {
      case "day":
        return new Intl.DateTimeFormat("ar-EG", options).format(currentDate);
      case "week":
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${new Intl.DateTimeFormat("ar-EG", {
          day: "numeric",
          month: "short",
        }).format(weekStart)} - ${new Intl.DateTimeFormat("ar-EG", options).format(
          weekEnd
        )}`;
      case "month":
        return new Intl.DateTimeFormat("ar-EG", {
          month: "long",
          year: "numeric",
        }).format(currentDate);
      case "year":
        return new Intl.DateTimeFormat("ar-EG", {
          year: "numeric",
        }).format(currentDate);
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
        <ToggleButton value="week">أسبوع</ToggleButton>
        <ToggleButton value="month">شهر</ToggleButton>
        <ToggleButton value="year">سنة</ToggleButton>
      </ToggleButtonGroup>

      <Box className="flex items-center gap-2">
        <IconButton onClick={handlePrevious} size="small">
          <IconChevronRight size={20} />
        </IconButton>

        <Tooltip title="التاريخ الحالي">
          <Box className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/5 dark:bg-white/5">
            <IconCalendar size={16} />
            <span className="text-sm">{formatDate()}</span>
          </Box>
        </Tooltip>

        <IconButton
          onClick={handleNext}
          size="small"
          disabled={
            new Date(currentDate).setHours(0, 0, 0, 0) >=
            new Date().setHours(0, 0, 0, 0)
          }
        >
          <IconChevronLeft size={20} />
        </IconButton>
      </Box>
    </Box>
  );
} 
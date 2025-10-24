import { useState } from 'react';

export interface UseMonthYearPickerProps {
  initialDate?: Date;
  onChange?: (date: Date) => void;
}

export function useMonthYearPicker({ 
  initialDate = new Date(),
  onChange 
}: UseMonthYearPickerProps = {}) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [isOpen, setIsOpen] = useState(false);

  // Get current display year
  const displayYear = selectedDate.getFullYear();
  
  // Get current month (0-11)
  const currentMonth = selectedDate.getMonth();

  // Check if a month is the current month
  const isCurrentMonth = (monthIndex: number) => {
    const today = new Date();
    return monthIndex === today.getMonth() && displayYear === today.getFullYear();
  };

  // Navigate to previous year
  const previousYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(displayYear - 1);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // Navigate to next year
  const nextYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(displayYear + 1);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // Set year directly (from input)
  const setYear = (year: number) => {
    if (year < 1900 || year > 2100) return; // Validation
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // Select a month
  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(displayYear, monthIndex, 1);
    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false); // Close popover after selection
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onChange?.(today);
    setIsOpen(false);
  };

  // Update selected date from external source
  const updateDate = (date: Date) => {
    setSelectedDate(date);
  };

  return {
    selectedDate,
    displayYear,
    currentMonth,
    isOpen,
    setIsOpen,
    isCurrentMonth,
    previousYear,
    nextYear,
    setYear,
    selectMonth,
    goToToday,
    updateDate
  };
}
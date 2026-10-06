import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholderText?: string;
  minDate?: Date;
  dateFormat?: string;
}

export default function CustomDatePicker({ 
  selected, 
  onChange, 
  className, 
  placeholderText, 
  minDate,
  dateFormat = "yyyy-MM-dd"
}: CustomDatePickerProps) {
  
  // List of public holidays (YYYY-MM-DD format)
  // This can be fetched from an API in the future
  const publicHolidays = [
    '2024-01-26', // Republic Day
    '2024-08-15', // Independence Day
    '2024-10-02', // Gandhi Jayanti
    '2024-12-25', // Christmas
    '2025-01-26', // Republic Day
    '2025-08-15', // Independence Day
    '2025-10-02', // Gandhi Jayanti
    '2025-12-25', // Christmas
    '2026-01-26', // Republic Day
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-12-25', // Christmas
  ];

  const isHoliday = (date: Date) => {
    // Format to YYYY-MM-DD handling local timezone shifts safely
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    return publicHolidays.includes(formattedDate);
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday (0) or Saturday (6)
  };

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 ${className || ''}`}
      placeholderText={placeholderText || "YYYY-MM-DD"}
      minDate={minDate}
      dateFormat={dateFormat}
      portalId="__next"
      popperPlacement="bottom-start"
      calendarStartDay={1}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      dayClassName={(date) => {
        if (isWeekend(date) || isHoliday(date)) {
          return "red-holiday-day";
        }
        return undefined;
      }}
    />
  );
}

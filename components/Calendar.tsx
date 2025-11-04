
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { OrgCoverageData } from '../services/leaveService';
import { DEPARTMENT_COLORS } from '../constants';
import CalendarDayCell from './CalendarDayCell';

// FIX: Add interface for component props
interface CalendarProps {
  orgCoverage: OrgCoverageData;
}

const Calendar: React.FC<CalendarProps> = ({ orgCoverage }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col gap-4 transition-colors">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">{format(currentMonth, 'MMMM yyyy')}</h2>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRightIcon className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {weekdays.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const dayData = orgCoverage[dayStr];
                        return (
                           <CalendarDayCell key={day.toString()} day={day} dayData={dayData} isCurrentMonth={isSameMonth(day, monthStart)} />
                        );
                    })}
                </div>
            </div>
             <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Department Legend</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {Object.entries(DEPARTMENT_COLORS).filter(([dept]) => dept !== 'Other').map(([dept, color]) => (
                        <div key={dept} className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{dept}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
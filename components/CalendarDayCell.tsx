import React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { LeaveStatus } from '../types';
import { DailyCoverage } from '../services/leaveService';
import Tooltip from './Tooltip';
import { DEPARTMENT_COLORS } from '../constants';
import { getThaiBankHoliday } from '../utils/holidayUtils';

const leaveStatusClasses: Record<LeaveStatus, string> = {
  [LeaveStatus.APPROVED]: 'text-green-600 dark:text-green-400 font-semibold',
  [LeaveStatus.PENDING]: 'text-yellow-600 dark:text-yellow-400 font-semibold',
  [LeaveStatus.REJECTED]: 'text-red-600 dark:text-red-400 font-semibold',
  [LeaveStatus.CANCELLED]: 'text-gray-500 line-through',
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

interface CalendarDayCellProps {
    day: Date;
    dayData: DailyCoverage;
    isCurrentMonth: boolean;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({ day, dayData, isCurrentMonth }) => {
    const MAX_VISIBLE_AVATARS = 6;
    const dailyStatsTitle = `Working: ${dayData?.totalWorking ?? 0}, On Leave: ${dayData?.totalOnLeave ?? 0}`;
    
    const companyHoliday = dayData?.holidays?.[0];
    const bankHoliday = getThaiBankHoliday(day);
    const isHoliday = !!companyHoliday || !!bankHoliday;
    const holidayName = companyHoliday?.name || bankHoliday;

    const cellBgClass = isHoliday 
        ? 'bg-blue-50 dark:bg-blue-900/40'
        : isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50';

    const dayTextClass = isCurrentMonth 
        ? 'text-gray-700 dark:text-gray-300'
        : 'text-gray-400 dark:text-gray-500';

    return (
        <div className={`relative group p-2 h-32 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 ${cellBgClass} hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500`}>
            {/* Day number */}
            <span className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white rounded-full flex items-center justify-center w-6 h-6' : dayTextClass}`}>
                {format(day, 'd')}
            </span>

            {isHoliday ? (
                // Holiday View
                <div className="flex-grow flex items-center justify-center text-center">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{holidayName}</p>
                </div>
            ) : (
                // Normal Day View
                <>
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                        {dayData && (
                             <span 
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${dayData.totalOnLeave > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'}`}
                                title={dailyStatsTitle}
                                aria-label={dailyStatsTitle}
                            >
                                Work:{dayData.totalWorking}|Leave:{dayData.totalOnLeave}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    {/* Avatars for leave events */}
                    {dayData?.onLeave && dayData.onLeave.length > 0 && (
                         <div className="flex flex-wrap items-end -space-x-2">
                            {dayData.onLeave.slice(0, MAX_VISIBLE_AVATARS).map((event, i) => {
                                const deptColor = DEPARTMENT_COLORS[event.department] || DEPARTMENT_COLORS['Other'];
                                return (
                                     <Tooltip key={i} content={`${event.name} — ${event.department}`} side="top">
                                        <div
                                            className="w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] leading-none font-bold text-white ring-1 ring-white dark:ring-gray-800"
                                            style={{ backgroundColor: deptColor }}
                                            title={`${event.name} — ${event.department}`}
                                        >
                                            {getInitials(event.name)}
                                        </div>
                                    </Tooltip>
                                )
                            })}
                             {dayData.onLeave.length > MAX_VISIBLE_AVATARS && (
                                 <Tooltip
                                    content={
                                        <ul className="text-left space-y-1">
                                            {dayData.onLeave.slice(MAX_VISIBLE_AVATARS).map(e => <li key={e.id}>{e.name}</li>)}
                                        </ul>
                                    }
                                    side="top"
                                >
                                    <div className="w-[14px] h-[14px] rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[9px] leading-none font-bold ring-1 ring-white dark:ring-gray-800" title={`+${dayData.onLeave.length - MAX_VISIBLE_AVATARS} more`}>
                                        +{dayData.onLeave.length - MAX_VISIBLE_AVATARS}
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                    )}

                    {/* Tooltip on hover for non-holiday days */}
                    {dayData && (
                        <div className="absolute z-20 w-80 p-3 text-sm text-left transition-opacity duration-200 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none top-0 left-full ml-2 max-h-96 overflow-y-auto">
                            <p className="font-bold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{format(day, 'EEEE, MMM d')}</p>

                            <h4 className="font-semibold text-red-600 dark:text-red-400">On Leave ({dayData.onLeave.length})</h4>
                            {dayData.onLeave.length > 0 ? (
                                <ul className="text-gray-700 dark:text-gray-300 space-y-2 mt-1">
                                    {dayData.onLeave.map((event, i) => (
                                        <li key={i} className="truncate">
                                            <p className="font-semibold flex items-center justify-between">
                                                <span>{event.name}</span>
                                                <span className={`text-xs ${leaveStatusClasses[event.status]}`}>{event.status}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 block">{event.leaveType} - {event.department}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 block">{format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-xs text-gray-500 dark:text-gray-400">No one is on leave.</p>}

                            <h4 className="mt-3 font-semibold text-green-600 dark:text-green-400">Working ({dayData.working.length})</h4>
                            {dayData.working.length > 0 ? (
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 columns-2 gap-4 mt-1">
                                    {dayData.working.map(e => <li key={e.id} className="truncate">{e.name}</li>)}
                                </ul>
                            ) : <p className="text-xs text-gray-500 dark:text-gray-400">Everyone is on leave.</p>}
                            <div className="absolute w-3 h-3 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 transform rotate-45 -left-1.5 top-1/2 -translate-y-1/2"></div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
export default CalendarDayCell;
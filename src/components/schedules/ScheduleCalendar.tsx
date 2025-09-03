'use client';

import React from 'react';
import { Calendar, dateFnsLocalizer, Views, Event } from 'react-big-calendar';
import {format} from 'date-fns/format';
import {parse} from 'date-fns/parse';
import {startOfWeek} from 'date-fns/startOfWeek';
import {getDay} from 'date-fns/getDay';
import {enUS} from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { scheduleService } from '@/lib/supabase/schedules';
import { Schedule, Lesson } from '@/types/schedule';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ScheduleCalendarProps {
  schedule: Schedule;
  // This new prop will handle the click event
  onSelectLesson: (lesson: Lesson) => void;
}

export function ScheduleCalendar({ schedule, onSelectLesson }: ScheduleCalendarProps) {
  // Initialize the calendar to the schedule's start date or first lesson's date
  const getInitialDate = () => {
    if (schedule.lessons && schedule.lessons.length > 0) {
      // Use the first lesson's date
      return new Date(schedule.lessons[0].date);
    } else if (schedule.start_date) {
      // Use the schedule's start date
      return new Date(schedule.start_date);
    } else {
      // Fallback to current date
      return new Date();
    }
  };

  const [currentDate, setCurrentDate] = React.useState(getInitialDate());
  const [currentView, setCurrentView] = React.useState(Views.MONTH);

  if (!schedule.lessons || schedule.lessons.length === 0) {
    return <div className="p-8 text-center text-gray-500">No lessons to display in calendar.</div>;
  }
  
  const events = scheduleService.transformToCalendarEvents(schedule.lessons);

  const handleEventSelect = (event: Event) => {
    // The lesson data is stored in the event's resource property
    if (event.resource) {
      onSelectLesson(event.resource.lesson as Lesson);
    }
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (view: any) => {
    setCurrentView(view);
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={currentView}
        date={currentDate}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        popup
        onSelectEvent={handleEventSelect}
        tooltipAccessor={(event: any) => event.resource?.description || event.title}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { scheduleAPI } from '../utils/api';

const Calendar = ({ onDateClick, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await scheduleAPI.getCalendar(year, month);
      setSchedules(response.data.data);
    } catch (error) {
      console.error('일정 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getSchedulesForDate = (date) => {
    if (!date) return [];

    return schedules.filter((schedule) => {
      const scheduleStart = new Date(schedule.startDate);
      const scheduleEnd = new Date(schedule.endDate);
      const checkDate = new Date(date);

      scheduleStart.setHours(0, 0, 0, 0);
      scheduleEnd.setHours(23, 59, 59, 999);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate >= scheduleStart && checkDate <= scheduleEnd;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getStatusColor = (status) => {
    switch (status) {
      case '예정': return '#007bff';
      case '진행중': return '#ffc107';
      case '완료': return '#28a745';
      case '취소': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="btn btn-sm btn-secondary">
          ◀ 이전
        </button>
        <div className="calendar-title">
          <h2>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h2>
          <button onClick={handleToday} className="btn btn-sm btn-primary">
            오늘
          </button>
        </div>
        <button onClick={handleNextMonth} className="btn btn-sm btn-secondary">
          다음 ▶
        </button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="calendar-grid">
          {weekDays.map((day, index) => (
            <div
              key={`weekday-${index}`}
              className="calendar-weekday"
              style={{
                color: index === 0 ? '#dc3545' : index === 6 ? '#007bff' : '#333'
              }}
            >
              {day}
            </div>
          ))}

          {days.map((date, index) => {
            const daySchedules = getSchedulesForDate(date);
            return (
              <div
                key={`day-${index}`}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''}`}
                onClick={() => date && onDateClick && onDateClick(date)}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-events">
                      {daySchedules.slice(0, 3).map((schedule) => (
                        <div
                          key={schedule._id}
                          className="calendar-event"
                          style={{ borderLeft: `3px solid ${getStatusColor(schedule.status)}` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick && onEventClick(schedule);
                          }}
                        >
                          <span className="event-time">
                            {new Date(schedule.startDate).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="event-title">{schedule.title}</span>
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <div className="more-events">+{daySchedules.length - 3}개 더보기</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .calendar-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .calendar-title h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background-color: #ddd;
          border: 1px solid #ddd;
        }

        .calendar-weekday {
          background-color: #f8f9fa;
          padding: 0.75rem;
          text-align: center;
          font-weight: 600;
        }

        .calendar-day {
          background-color: white;
          min-height: 100px;
          padding: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .calendar-day:hover:not(.empty) {
          background-color: #f8f9fa;
        }

        .calendar-day.empty {
          background-color: #fafafa;
          cursor: default;
        }

        .calendar-day.today {
          background-color: #e3f2fd;
        }

        .day-number {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .day-events {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .calendar-event {
          background-color: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.75rem;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .calendar-event:hover {
          background-color: #e9ecef;
        }

        .event-time {
          color: #666;
          margin-right: 0.25rem;
        }

        .event-title {
          color: #333;
        }

        .more-events {
          font-size: 0.7rem;
          color: #666;
          text-align: center;
          padding: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default Calendar;

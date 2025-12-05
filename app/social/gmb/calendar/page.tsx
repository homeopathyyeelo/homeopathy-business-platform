'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MoreVertical,
    Trash2,
    Edit2,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import SchedulePostModal from '@/components/gmb/SchedulePostModal';

interface ScheduledPost {
    id: string;
    content: string;
    scheduled_time: string;
    status: string;
    is_recurring: boolean;
    recurrence_pattern?: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [currentDate]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();

            const response = await fetch(`/api/social/gmb/schedule?start=${start}&end=${end}`);
            const data = await response.json();

            if (data.success) {
                setPosts(data.data);
            } else {
                toast.error('Failed to fetch scheduled posts');
            }
        } catch (error) {
            toast.error('Error loading calendar');
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const getPostsForDay = (date: Date) => {
        return posts.filter(post => isSameDay(parseISO(post.scheduled_time), date));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled post?')) return;

        try {
            const response = await fetch(`/api/social/gmb/schedule/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Post cancelled');
                fetchPosts();
            } else {
                toast.error('Failed to cancel post');
            }
        } catch (error) {
            toast.error('Error deleting post');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        Content Calendar
                    </h1>
                    <p className="text-gray-500">Manage your scheduled GMB posts.</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-md">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="px-4 font-medium text-gray-900 min-w-[140px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-md">
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Post
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                    {/* Empty cells for start of month padding (simplified) */}
                    {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="border-b border-r border-gray-100 bg-gray-50/30" />
                    ))}

                    {daysInMonth.map(day => {
                        const dayPosts = getPostsForDay(day);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`min-h-[120px] p-2 border-b border-r border-gray-100 transition-colors hover:bg-gray-50 ${isTodayDate ? 'bg-blue-50/30' : ''
                                    }`}
                                onClick={() => setSelectedDate(day)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-blue-600 text-white' : 'text-gray-700'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayPosts.length > 0 && (
                                        <span className="text-xs font-medium text-gray-400">
                                            {dayPosts.length} posts
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {dayPosts.map(post => (
                                        <div
                                            key={post.id}
                                            className={`group text-xs p-1.5 rounded border truncate cursor-pointer flex items-center justify-between ${post.status === 'PUBLISHED'
                                                ? 'bg-green-50 border-green-100 text-green-700'
                                                : post.status === 'FAILED'
                                                    ? 'bg-red-50 border-red-100 text-red-700'
                                                    : 'bg-blue-50 border-blue-100 text-blue-700'
                                                }`}
                                        >
                                            <div className="flex items-center overflow-hidden">
                                                <Clock className="w-3 h-3 mr-1 flex-shrink-0 opacity-70" />
                                                <span className="truncate">{format(parseISO(post.scheduled_time), 'HH:mm')}</span>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white rounded text-red-500"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Queue / List View (Optional sidebar or below) */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Queue</h2>
                <div className="bg-white rounded-lg shadow border border-gray-200 divide-y divide-gray-100">
                    {posts.filter(p => new Date(p.scheduled_time) > new Date()).slice(0, 5).map(post => (
                        <div key={post.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {format(parseISO(post.scheduled_time), 'dd MMM')}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.content}</p>
                                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {format(parseISO(post.scheduled_time), 'h:mm a')}
                                        {post.is_recurring && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] uppercase font-bold">
                                                {post.recurrence_pattern}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500">
                            No upcoming posts scheduled.
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Post Modal */}
            <SchedulePostModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSuccess={fetchPosts}
            />
        </div>
    );
}

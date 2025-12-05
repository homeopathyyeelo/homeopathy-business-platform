'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    Image as ImageIcon,
    Repeat,
    MapPin,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SchedulePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialContent?: string;
}

export default function SchedulePostModal({ isOpen, onClose, onSuccess }: SchedulePostModalProps) {
    const [content, setContent] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('10:00');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrencePattern, setRecurrencePattern] = useState('DAILY');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setScheduleDate(tomorrow.toISOString().split('T')[0]);

            // Check for template content from localStorage
            const templateContent = localStorage.getItem('gmb_template_content');
            if (templateContent) {
                setContent(templateContent);
                localStorage.removeItem('gmb_template_content');
            }
        }
    }, [isOpen]);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/social/gmb/accounts');
            const data = await response.json();
            if (data.success) {
                setAccounts(data.data);
                if (data.data.length > 0) {
                    setSelectedAccount(data.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast.error('Please enter post content');
            return;
        }

        if (!selectedAccount) {
            toast.error('Please select an account');
            return;
        }

        setLoading(true);

        try {
            const scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

            const response = await fetch('/api/social/gmb/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    scheduled_time: scheduledTime,
                    is_recurring: isRecurring,
                    recurrence_pattern: isRecurring ? recurrencePattern : null,
                    account_id: selectedAccount,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Post scheduled successfully!');
                onSuccess?.();
                handleClose();
            } else {
                toast.error(data.error || 'Failed to schedule post');
            }
        } catch (error) {
            toast.error('Error scheduling post');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setContent('');
        setScheduleDate('');
        setScheduleTime('10:00');
        setIsRecurring(false);
        setRecurrencePattern('DAILY');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Schedule GMB Post
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Account Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Select Location
                        </label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.businessName} - {account.locationName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Post Content *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your GMB post content here..."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {content.length} / 1500 characters
                        </p>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Date *
                            </label>
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Time *
                            </label>
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Recurring */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                    Make this a recurring post
                                </span>
                            </div>
                        </label>

                        {isRecurring && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recurrence Pattern
                                </label>
                                <select
                                    value={recurrencePattern}
                                    onChange={(e) => setRecurrencePattern(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="BIWEEKLY">Bi-weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4" />
                                    Schedule Post
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

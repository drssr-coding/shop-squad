import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (partyData: { 
    title: string; 
    date: Date; 
    location: string;
    status: string;
    payments: any[];
    messages: any[];
  }) => void;
}

interface Location {
  street: string;
  number: string;
  city: string;
}

export function CreatePartyModal({ isOpen, onClose, onSubmit }: CreatePartyModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('Shopping Squad');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState<Location>({ street: '', number: '', city: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update title when user's display name changes
  useEffect(() => {
    if (user?.displayName) {
      setTitle(`${user.displayName}'s Squad`);
    }
  }, [user?.displayName]);

  // Generate time slots every 30 minutes from 7:00 to 23:30
  const timeSlots = Array.from({ length: 34 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7;
    const minutes = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location.street || !location.number || !location.city) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const dateTime = new Date(`${date}T${time}`);
      if (isNaN(dateTime.getTime())) {
        throw new Error('Invalid date or time');
      }

      // Format location string for better map accuracy
      const formattedLocation = `${location.street} ${location.number}, ${location.city}`;

      await onSubmit({
        title,
        date: dateTime,
        location: formattedLocation,
        status: 'upcoming',
        payments: [],
        messages: []
      });
      
      // Reset form with user's name in title
      setTitle(user?.displayName ? `${user.displayName}'s Squad` : 'Shopping Squad');
      setDate('');
      setTime('09:00');
      setLocation({ street: '', number: '', city: '' });
      onClose();
    } catch (err) {
      console.error('Error creating party:', err);
      setError(err instanceof Error ? err.message : 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text">
            Create Shopping Squad
          </h2>
          <p className="text-gray-600 mt-2">Set up your shopping squad details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Squad Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
              placeholder="Enter squad name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10 w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Meeting Location</label>
            
            <div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={location.street}
                  onChange={(e) => setLocation(prev => ({ ...prev, street: e.target.value }))}
                  className="pl-10 w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
                  placeholder="Street name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={location.number}
                  onChange={(e) => setLocation(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
                  placeholder="Number"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
                  placeholder="City"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Squad...' : 'Create Squad'}
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { addNotification } from '../utils/notifications';
import { ReopenConfirmationModal } from './ReopenConfirmationModal';
import { SuccessModal } from './SuccessModal';
import type { Notification, Party } from '../types';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = doc(db, 'notifications', user.uid);
    const unsubscribe = onSnapshot(notificationsRef, (doc) => {
      if (doc.exists()) {
        const items = doc.data().items || [];
        setNotifications(items.sort((a: Notification, b: Notification) => 
          b.timestamp.seconds - a.timestamp.seconds
        ));
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;

    if (notification.type === 'reopen_request') {
      setSelectedNotification(notification);
      setShowReopenModal(true);
      setShowDropdown(false);
    }

    // Mark notification as read
    if (!notification.read) {
      const notificationsRef = doc(db, 'notifications', user.uid);
      const updatedNotification = { ...notification, read: true };

      try {
        await updateDoc(notificationsRef, {
          items: arrayRemove(notification)
        });
        await updateDoc(notificationsRef, {
          items: arrayUnion(updatedNotification)
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const notificationsRef = doc(db, 'notifications', user.uid);
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));

      await updateDoc(notificationsRef, {
        items: updatedNotifications
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleReopenSquad = async () => {
    if (!selectedNotification?.partyId || !user) return;

    try {
      const partyRef = doc(db, 'parties', selectedNotification.partyId);
      const partyDoc = await getDoc(partyRef);
      
      if (!partyDoc.exists()) {
        console.error('Party not found');
        return;
      }

      const party = partyDoc.data() as Party;

      await updateDoc(partyRef, {
        status: 'upcoming'
      });

      // Notify all participants
      for (const participant of party.participants) {
        await addNotification({
          type: 'squad_reopened',
          title: 'Squad Reopened',
          message: `${party.title} has been reopened for new members`,
          userId: participant.id,
          partyId: selectedNotification.partyId
        });
      }

      // Remove the reopen request notification
      const notificationsRef = doc(db, 'notifications', user.uid);
      await updateDoc(notificationsRef, {
        items: arrayRemove(selectedNotification)
      });

      setShowReopenModal(false);
      setSelectedNotification(null);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error reopening squad:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FF4D8D] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[#FF4D8D] text-sm font-medium hover:text-[#FF8D6B] transition-colors flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-pink-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 text-xs sm:text-sm">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">{notification.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showReopenModal && selectedNotification && (
        <ReopenConfirmationModal
          isOpen={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          onConfirm={handleReopenSquad}
          type="approve"
          requesterName={selectedNotification.requesterName}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message="Squad has been reopened successfully!"
        />
      )}
    </div>
  );
}
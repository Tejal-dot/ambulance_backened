import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Booking } from '@/types';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@ambulance_bookings';
const POLL_INTERVAL = 2000;

export const [BookingProvider, useBookings] = createContextHook(() => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBookings();
    
    const interval = setInterval(() => {
      loadBookings();
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBookings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allBookings: Booking[] = JSON.parse(stored);
        
        if (user?.role === 'driver') {
          setBookings(allBookings);
          console.log('[Bookings] Driver loaded bookings:', allBookings.length);
        } else {
          const userBookings = user ? allBookings.filter(b => b.userId === user.id) : [];
          setBookings(userBookings);
          console.log('[Bookings] Patient loaded bookings:', userBookings.length);
        }
      }
    } catch (error) {
      console.log('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'userId' | 'status' | 'bookingTime'>): Promise<Booking> => {
    if (!user) throw new Error('User not logged in');
    
    try {
      const newBooking: Booking = {
        ...bookingData,
        id: Date.now().toString(),
        userId: user.id,
        status: 'pending',
        bookingTime: new Date().toISOString(),
      };
      
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allBookings: Booking[] = stored ? JSON.parse(stored) : [];
      allBookings.push(newBooking);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allBookings));
      console.log('[Bookings] Created new booking:', newBooking.id, 'Total:', allBookings.length);
      
      await loadBookings();
      
      return newBooking;
    } catch (error) {
      console.log('Create booking error:', error);
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status'], driverId?: string) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const allBookings: Booking[] = JSON.parse(stored);
      const updatedBookings = allBookings.map(b => {
        if (b.id === bookingId) {
          const updated = { ...b, status, driverId: driverId || b.driverId };
          if (driverId && user) {
            updated.driverName = user.name;
            updated.driverPhone = user.phone;
            updated.vehicleNumber = user.vehicleNumber;
          }
          return updated;
        }
        return b;
      });
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookings));
      console.log('[Bookings] Updated booking:', bookingId, 'to status:', status);
      
      await loadBookings();
    } catch (error) {
      console.log('Update booking status error:', error);
    }
  };

  const getActiveBooking = (): Booking | undefined => {
    return bookings.find(b => 
      ['pending', 'accepted', 'on-the-way', 'arrived', 'in-transit'].includes(b.status)
    );
  };

  return {
    bookings,
    isLoading,
    createBooking,
    updateBookingStatus,
    getActiveBooking,
  };
});

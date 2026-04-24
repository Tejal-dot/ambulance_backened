import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const bookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ambulanceId: z.string(),
  hospitalId: z.string(),
  driverId: z.string().optional(),
  pickupLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  hospitalLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  ambulanceType: z.enum(['basic', 'advanced', 'air']),
  patientName: z.string(),
  patientAge: z.number(),
  patientCondition: z.string(),
  status: z.enum(['pending', 'accepted', 'on-the-way', 'arrived', 'in-transit', 'completed', 'cancelled']),
  isEmergency: z.boolean(),
  bookingTime: z.string(),
  estimatedArrival: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleNumber: z.string().optional(),
});

const bookings: any[] = [];

export const bookingsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      ambulanceId: z.string(),
      hospitalId: z.string(),
      pickupLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string(),
      }),
      hospitalLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string(),
      }),
      ambulanceType: z.enum(['basic', 'advanced', 'air']),
      patientName: z.string(),
      patientAge: z.number(),
      patientCondition: z.string(),
      isEmergency: z.boolean(),
      driverName: z.string().optional(),
      driverPhone: z.string().optional(),
      vehicleNumber: z.string().optional(),
      estimatedArrival: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const newBooking = {
        ...input,
        id: Date.now().toString(),
        status: 'pending' as const,
        bookingTime: new Date().toISOString(),
      };
      
      bookings.push(newBooking);
      console.log('[Bookings] New booking created:', newBooking.id, 'Total bookings:', bookings.length);
      return newBooking;
    }),
    
  getAll: publicProcedure
    .query(() => {
      console.log('[Bookings] Fetching all bookings. Total:', bookings.length);
      return bookings;
    }),
    
  getByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const userBookings = bookings.filter(b => b.userId === input.userId);
      console.log('[Bookings] User bookings:', userBookings.length, 'for user:', input.userId);
      return userBookings;
    }),
    
  updateStatus: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      status: z.enum(['pending', 'accepted', 'on-the-way', 'arrived', 'in-transit', 'completed', 'cancelled']),
      driverId: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const booking = bookings.find(b => b.id === input.bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      booking.status = input.status;
      if (input.driverId) {
        booking.driverId = input.driverId;
      }
      
      console.log('[Bookings] Updated booking:', booking.id, 'to status:', input.status);
      return booking;
    }),
});

import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { ArrowLeft, MapPin, Clock, User, Phone, CheckCircle, XCircle, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Booking } from '@/types';
import * as Linking from 'expo-linking';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookings, updateBookingStatus } = useBookings();
  const [refreshing, setRefreshing] = useState(false);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => 
    b.driverId === user?.id && ['accepted', 'on-the-way', 'arrived', 'in-transit'].includes(b.status)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptBooking = (booking: Booking) => {
    Alert.alert(
      'Accept Booking',
      'Do you want to accept this ride request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            await updateBookingStatus(booking.id, 'accepted', user?.id);
            Alert.alert('Success', 'Booking accepted! Navigate to pickup location.');
          },
        },
      ]
    );
  };

  const handleRejectBooking = (booking: Booking) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            await updateBookingStatus(booking.id, 'cancelled');
            Alert.alert('Rejected', 'Booking request rejected.');
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (latitude: number, longitude: number, address: string) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      }
    });
  };

  const handleUpdateStatus = (bookingId: string, currentStatus: string) => {
    const statusFlow = {
      'accepted': { next: 'on-the-way', label: 'Start Journey' },
      'on-the-way': { next: 'arrived', label: 'Mark Arrived' },
      'arrived': { next: 'in-transit', label: 'Start to Hospital' },
      'in-transit': { next: 'completed', label: 'Complete Trip' },
    };

    const nextStep = statusFlow[currentStatus as keyof typeof statusFlow];
    if (nextStep) {
      Alert.alert(
        'Update Status',
        `Mark this booking as ${nextStep.label}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: nextStep.label,
            onPress: async () => {
              await updateBookingStatus(bookingId, nextStep.next as any);
              if (nextStep.next === 'completed') {
                Alert.alert('Success', 'Trip completed successfully!');
              }
            },
          },
        ]
      );
    }
  };

  const renderBookingCard = (booking: Booking, isPending: boolean) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={[styles.statusBadge, { backgroundColor: isPending ? '#FEF3C7' : '#DBEAFE' }]}>
          <Text style={[styles.statusText, { color: isPending ? '#92400E' : '#1E40AF' }]}>
            {isPending ? 'New Request' : booking.status.toUpperCase().replace('-', ' ')}
          </Text>
        </View>
        {booking.isEmergency && (
          <View style={styles.emergencyBadge}>
            <Text style={styles.emergencyText}>🚨 EMERGENCY</Text>
          </View>
        )}
      </View>

      <View style={styles.patientInfo}>
        <View style={styles.patientHeader}>
          <View style={styles.patientIcon}>
            <User color="#EF4444" size={20} />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{booking.patientName}</Text>
            <Text style={styles.patientAge}>{booking.patientAge} years • {booking.patientCondition}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleCall(user?.phone || '')}
          style={({ pressed }) => [
            styles.callButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Phone color="#3B82F6" size={20} />
        </Pressable>
      </View>

      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <MapPin color="#10B981" size={20} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationAddress}>{booking.pickupLocation.address}</Text>
          </View>
          <Pressable
            onPress={() => handleNavigate(
              booking.pickupLocation.latitude,
              booking.pickupLocation.longitude,
              booking.pickupLocation.address
            )}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Navigation color="#3B82F6" size={16} />
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <MapPin color="#EF4444" size={20} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Hospital</Text>
            <Text style={styles.locationAddress}>{booking.hospitalLocation.address}</Text>
          </View>
          <Pressable
            onPress={() => handleNavigate(
              booking.hospitalLocation.latitude,
              booking.hospitalLocation.longitude,
              booking.hospitalLocation.address
            )}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Navigation color="#3B82F6" size={16} />
          </Pressable>
        </View>
      </View>

      <View style={styles.timeInfo}>
        <Clock color="#6B7280" size={16} />
        <Text style={styles.timeText}>{booking.bookingTime}</Text>
      </View>

      {isPending ? (
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => handleRejectBooking(booking)}
            style={({ pressed }) => [
              styles.rejectButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <XCircle color="#EF4444" size={20} />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>

          <Pressable
            onPress={() => handleAcceptBooking(booking)}
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <CheckCircle color="#FFFFFF" size={20} />
              <Text style={styles.acceptText}>Accept</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => handleUpdateStatus(booking.id, booking.status)}
          style={({ pressed }) => [
            styles.updateStatusButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.updateStatusText}>Update Status</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );

  if (user?.role !== 'driver') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorDesc}>This page is only for drivers</Text>
          <Pressable onPress={() => router.back()} style={styles.backButtonError}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{user?.name.charAt(0)}</Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{user?.name}</Text>
            <Text style={styles.driverVehicle}>{user?.vehicleNumber}</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {pendingBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Requests ({pendingBookings.length})</Text>
            {pendingBookings.map(booking => renderBookingCard(booking, true))}
          </View>
        )}

        {activeBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Rides ({activeBookings.length})</Text>
            {activeBookings.map(booking => renderBookingCard(booking, false))}
          </View>
        )}

        {pendingBookings.length === 0 && activeBookings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚑</Text>
            <Text style={styles.emptyTitle}>No Bookings</Text>
            <Text style={styles.emptyText}>You&apos;re all set! New ride requests will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverAvatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  emergencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#DC2626',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    gap: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
  },
  rejectText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  updateStatusButton: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateStatusText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

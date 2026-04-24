import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookings } from '@/contexts/BookingContext';
import { Clock, MapPin, Calendar, ArrowRight } from 'lucide-react-native';

export default function BookingsTabScreen() {
  const router = useRouter();
  const { bookings } = useBookings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
        return '#3B82F6';
      case 'on-the-way':
        return '#8B5CF6';
      case 'arrived':
        return '#10B981';
      case 'in-transit':
        return '#06B6D4';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime()
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>View all your ambulance bookings</Text>
        </View>

        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>
              Your booking history will appear here once you book an ambulance
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {sortedBookings.map((booking) => (
              <Pressable
                key={booking.id}
                onPress={() => router.push('/booking/tracking')}
                style={({ pressed }) => [
                  styles.bookingCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingIconContainer}>
                    <Text style={styles.bookingIcon}>🚑</Text>
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingId}>Booking #{booking.id.slice(0, 8)}</Text>
                    <Text style={styles.bookingDate}>{formatDate(booking.bookingTime)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <MapPin color="#6B7280" size={16} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Pickup</Text>
                      <Text style={styles.detailValue}>{booking.pickupLocation.address}</Text>
                    </View>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Text style={styles.hospitalIcon}>🏥</Text>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Hospital</Text>
                      <Text style={styles.detailValue}>{booking.hospitalLocation.address}</Text>
                    </View>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Clock color="#6B7280" size={16} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Patient</Text>
                      <Text style={styles.detailValue}>{booking.patientName} • {booking.patientAge}y</Text>
                    </View>
                  </View>
                </View>

                {booking.isEmergency && (
                  <View style={styles.emergencyBadge}>
                    <Text style={styles.emergencyText}>⚡ Emergency</Text>
                  </View>
                )}

                <View style={styles.bookingFooter}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{booking.ambulanceType.toUpperCase()}</Text>
                  </View>
                  {booking.vehicleNumber && (
                    <Text style={styles.vehicleNumber}>{booking.vehicleNumber}</Text>
                  )}
                  <ArrowRight color="#9CA3AF" size={20} />
                </View>
              </Pressable>
            ))}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
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
  bookingsList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.7,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingIcon: {
    fontSize: 24,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bookingDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalIcon: {
    fontSize: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  emergencyBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  vehicleNumber: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
});

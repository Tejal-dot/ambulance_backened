import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { AlertCircle, MapPin, Navigation, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';


import { MOCK_AMBULANCES } from '@/mocks/ambulances';
import { MOCK_HOSPITALS } from '@/mocks/hospitals';
import { findNearestAmbulances, findNearestHospitals } from '@/utils/location';
import { sendEmergencySMS } from '@/utils/sms';
import { Ambulance, Hospital } from '@/types';

export default function HomeScreen() {
  if (Platform.OS === "web") {
    return (
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <Text>Map is available only in mobile app</Text>
      </View>
    );
  }
  const router = useRouter();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearbyAmbulances, setNearbyAmbulances] = useState<Ambulance[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'driver') {
      router.replace('/driver-dashboard');
      return;
    }
    getLocation();
  }, [user, router]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this app');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      const userCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      
      const ambulances = findNearestAmbulances(userCoords, MOCK_AMBULANCES);
      const hospitals = findNearestHospitals(userCoords, MOCK_HOSPITALS);
      
      setNearbyAmbulances(ambulances);
      setNearbyHospitals(hospitals);
      setLoading(false);
    } catch (error) {
      console.log('Error getting location:', error);
      setLoading(false);
    }
  };

  const handleEmergencySOS = async () => {
    if (!user || !location) {
      Alert.alert('Error', 'Unable to process emergency request');
      return;
    }

    Alert.alert(
      'Emergency SOS',
      'This will book the nearest ambulance immediately and notify your emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setEmergencyLoading(true);
            
            try {
              const nearestAmbulance = nearbyAmbulances.find(a => a.available);
              const nearestHospital = nearbyHospitals.find(h => h.available);
              
              if (!nearestAmbulance || !nearestHospital) {
                Alert.alert('Error', 'No available ambulances or hospitals nearby');
                setEmergencyLoading(false);
                return;
              }

              await createBooking({
                ambulanceId: nearestAmbulance.id,
                hospitalId: nearestHospital.id,
                pickupLocation: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  address: 'Current Location',
                },
                hospitalLocation: {
                  latitude: nearestHospital.latitude,
                  longitude: nearestHospital.longitude,
                  address: nearestHospital.address,
                },
                ambulanceType: nearestAmbulance.type,
                patientName: user.name,
                patientAge: 30,
                patientCondition: 'Emergency',
                isEmergency: true,
                driverName: nearestAmbulance.driverName,
                driverPhone: nearestAmbulance.driverPhone,
                vehicleNumber: nearestAmbulance.vehicleNumber,
                estimatedArrival: '5-10 minutes',
              });

              await sendEmergencySMS(
                user.emergencyContacts,
                user.name,
                nearestHospital.name,
                nearestHospital.address
              );

              setEmergencyLoading(false);
              
              Alert.alert(
                'Emergency Booking Confirmed!',
                `Ambulance ${nearestAmbulance.vehicleNumber} is on the way. ETA: 5-10 minutes`,
                [
                  {
                    text: 'View Details',
                    onPress: () => router.push('/booking/tracking'),
                  },
                ]
              );
            } catch (error) {
              console.log('Emergency booking error:', error);
              Alert.alert('Error', 'Failed to book ambulance');
              setEmergencyLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <MapPin color="#9CA3AF" size={64} />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>
          Please enable location services to use this app
        </Text>
        <Pressable onPress={getLocation} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearbyAmbulances.map((ambulance) => (
          <Marker
            key={ambulance.id}
            coordinate={{
              latitude: ambulance.latitude,
              longitude: ambulance.longitude,
            }}
            title={`Ambulance ${ambulance.vehicleNumber}`}
            description={`${ambulance.distance}km away • ${ambulance.type}`}
          >
            <View style={styles.ambulanceMarker}>
              <Text style={styles.markerEmoji}>🚑</Text>
            </View>
          </Marker>
        ))}

        {nearbyHospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            coordinate={{
              latitude: hospital.latitude,
              longitude: hospital.longitude,
            }}
            title={hospital.name}
            description={`${hospital.distance}km away`}
          >
            <View style={styles.hospitalMarker}>
              <Text style={styles.markerEmoji}>🏥</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <Pressable
            onPress={handleEmergencySOS}
            disabled={emergencyLoading}
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.buttonPressed,
              emergencyLoading && styles.buttonDisabled,
            ]}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.sosGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.sosContent}>
                <AlertCircle color="#FFFFFF" size={32} strokeWidth={2.5} />
                <View style={styles.sosTextContainer}>
                  <Text style={styles.sosTitle}>
                    {emergencyLoading ? 'Booking...' : 'Emergency SOS'}
                  </Text>
                  <Text style={styles.sosSubtitle}>
                    {emergencyLoading ? 'Please wait' : 'Tap for immediate help'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          <View style={styles.quickActions}>
            <Pressable
              onPress={() => router.push('/booking/new')}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.actionIconContainer}>
                <Plus color="#EF4444" size={24} />
              </View>
              <Text style={styles.actionText}>Book</Text>
              <Text style={styles.actionSubtext}>Ambulance</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/hospitals')}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.actionIconContainer}>
                <MapPin color="#3B82F6" size={24} />
              </View>
              <Text style={styles.actionText}>Nearby</Text>
              <Text style={styles.actionSubtext}>Hospitals</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/booking/tracking')}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.actionIconContainer}>
                <Navigation color="#10B981" size={24} />
              </View>
              <Text style={styles.actionText}>Track</Text>
              <Text style={styles.actionSubtext}>Booking</Text>
            </Pressable>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nearbyAmbulances.filter(a => a.available).length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nearbyHospitals.filter(h => h.available).length}</Text>
              <Text style={styles.statLabel}>Hospitals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {nearbyAmbulances[0]?.distance?.toFixed(1) || '-'}km
              </Text>
              <Text style={styles.statLabel}>Nearest</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  ambulanceMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  hospitalMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    pointerEvents: 'box-none',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sosButton: {
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sosGradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sosContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sosTextContainer: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sosSubtitle: {
    fontSize: 14,
    color: '#FEE2E2',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

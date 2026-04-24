import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { ArrowLeft, User, Calendar, FileText, MapPin, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_AMBULANCES } from '@/mocks/ambulances';
import { MOCK_HOSPITALS } from '@/mocks/hospitals';
import { sendEmergencySMS } from '@/utils/sms';

export default function NewBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [selectedType, setSelectedType] = useState<'basic' | 'advanced' | 'air'>('basic');
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientAge, setPatientAge] = useState('');
  const [condition, setCondition] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(MOCK_HOSPITALS[0].id);
  const [loading, setLoading] = useState(false);

  const ambulanceTypes = [
    { type: 'basic' as const, label: 'Basic', price: '$50', icon: '🚑' },
    { type: 'advanced' as const, label: 'Advanced', price: '$150', icon: '🚑' },
    { type: 'air' as const, label: 'Air', price: '$500', icon: '🚁' },
  ];

  const handleBooking = async () => {
    if (!patientName || !patientAge || !condition) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const selectedAmbulance = MOCK_AMBULANCES.find(
        a => a.type === selectedType && a.available
      );
      const hospital = MOCK_HOSPITALS.find(h => h.id === selectedHospital);

      if (!selectedAmbulance || !hospital) {
        Alert.alert('Error', 'Selected ambulance or hospital not available');
        setLoading(false);
        return;
      }

      await createBooking({
        ambulanceId: selectedAmbulance.id,
        hospitalId: hospital.id,
        pickupLocation: {
          latitude: 37.78825,
          longitude: -122.4324,
          address: 'Current Location',
        },
        hospitalLocation: {
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          address: hospital.address,
        },
        ambulanceType: selectedType,
        patientName,
        patientAge: parseInt(patientAge),
        patientCondition: condition,
        isEmergency: false,
        driverName: selectedAmbulance.driverName,
        driverPhone: selectedAmbulance.driverPhone,
        vehicleNumber: selectedAmbulance.vehicleNumber,
        estimatedArrival: '15-20 minutes',
      });

      if (user) {
        await sendEmergencySMS(
          user.emergencyContacts,
          patientName,
          hospital.name,
          hospital.address
        );
      }

      setLoading(false);
      
      Alert.alert(
        'Booking Confirmed!',
        `Ambulance ${selectedAmbulance.vehicleNumber} will arrive in 15-20 minutes`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1F2937" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Ambulance</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ambulance Type</Text>
          <View style={styles.typeGrid}>
            {ambulanceTypes.map((item) => (
              <Pressable
                key={item.type}
                onPress={() => setSelectedType(item.type)}
                style={({ pressed }) => [
                  styles.typeCard,
                  selectedType === item.type && styles.typeCardSelected,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text style={[
                  styles.typeLabel,
                  selectedType === item.type && styles.typeLabelSelected,
                ]}>
                  {item.label}
                </Text>
                <Text style={[
                  styles.typePrice,
                  selectedType === item.type && styles.typePriceSelected,
                ]}>
                  {item.price}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <User color="#9CA3AF" size={20} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              placeholderTextColor="#9CA3AF"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Calendar color="#9CA3AF" size={20} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Patient Age"
              placeholderTextColor="#9CA3AF"
              value={patientAge}
              onChangeText={setPatientAge}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Activity color="#9CA3AF" size={20} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Medical Condition"
              placeholderTextColor="#9CA3AF"
              value={condition}
              onChangeText={setCondition}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Hospital</Text>
          {MOCK_HOSPITALS.slice(0, 3).map((hospital) => (
            <Pressable
              key={hospital.id}
              onPress={() => setSelectedHospital(hospital.id)}
              style={({ pressed }) => [
                styles.hospitalCard,
                selectedHospital === hospital.id && styles.hospitalCardSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.hospitalIcon}>
                <Text style={styles.hospitalEmoji}>🏥</Text>
              </View>
              <View style={styles.hospitalInfo}>
                <Text style={[
                  styles.hospitalName,
                  selectedHospital === hospital.id && styles.hospitalNameSelected,
                ]}>
                  {hospital.name}
                </Text>
                <Text style={styles.hospitalAddress}>{hospital.address}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedHospital === hospital.id && styles.radioOuterSelected,
              ]}>
                {selectedHospital === hospital.id && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleBooking}
          disabled={loading}
          style={({ pressed }) => [
            styles.bookButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeCardSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: '#1F2937',
  },
  typePrice: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  typePriceSelected: {
    color: '#EF4444',
    fontWeight: '600' as const,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    minHeight: 56,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  hospitalCardSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalEmoji: {
    fontSize: 24,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  hospitalNameSelected: {
    color: '#EF4444',
  },
  hospitalAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#EF4444',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

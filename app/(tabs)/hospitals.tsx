import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { MapPin, Star, Phone, Navigation } from 'lucide-react-native';
import { MOCK_HOSPITALS } from '@/mocks/hospitals';
import * as Linking from 'expo-linking';
import { useState, useMemo } from 'react';
import { HospitalCategory } from '@/types';

export default function HospitalsTabScreen() {
  const [selectedCategory, setSelectedCategory] = useState<HospitalCategory | 'all'>('all');

  const categories: Array<{ value: HospitalCategory | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '🏥' },
    { value: 'emergency', label: 'Emergency', icon: '🚨' },
    { value: 'cardiology', label: 'Heart', icon: '❤️' },
    { value: 'neurology', label: 'Brain', icon: '🧠' },
    { value: 'orthopedics', label: 'Orthopedics', icon: '🦴' },
    { value: 'gynecology', label: 'Gynecology', icon: '👶' },
    { value: 'pediatrics', label: 'Pediatrics', icon: '🧒' },
    { value: 'oncology', label: 'Cancer', icon: '🎗️' },
    { value: 'gastroenterology', label: 'Gastro', icon: '🫁' },
  ];

  const filteredHospitals = useMemo(() => {
    if (selectedCategory === 'all') {
      return MOCK_HOSPITALS;
    }
    return MOCK_HOSPITALS.filter(h => h.category.includes(selectedCategory));
  }, [selectedCategory]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (latitude: number, longitude: number, name: string) => {
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nearby Hospitals</Text>
          <Text style={styles.subtitle}>Find the best healthcare facilities near you</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              style={({ pressed }) => [
                styles.categoryChip,
                selectedCategory === cat.value && styles.categoryChipSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.value && styles.categoryLabelSelected,
              ]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.resultsCount}>
          {filteredHospitals.length} {filteredHospitals.length === 1 ? 'Hospital' : 'Hospitals'} Found
        </Text>

        {filteredHospitals.map((hospital, index) => (
          <View key={hospital.id} style={styles.hospitalCard}>
            <View style={styles.hospitalHeader}>
              <View style={styles.hospitalIconContainer}>
                <Text style={styles.hospitalIcon}>🏥</Text>
              </View>
              <View style={styles.hospitalInfo}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star color="#F59E0B" size={16} fill="#F59E0B" />
                  <Text style={styles.rating}>{hospital.rating}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: hospital.available ? '#D1FAE5' : '#FEE2E2' },
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: hospital.available ? '#059669' : '#DC2626' },
                    ]}>
                      {hospital.available ? 'Available' : 'Busy'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.hospitalDetails}>
              <View style={styles.detailRow}>
                <MapPin color="#6B7280" size={16} />
                <Text style={styles.detailText}>{hospital.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Phone color="#6B7280" size={16} />
                <Text style={styles.detailText}>{hospital.phone}</Text>
              </View>
            </View>

            <View style={styles.specialtiesContainer}>
              <Text style={styles.specialtiesLabel}>Specialties:</Text>
              <View style={styles.specialties}>
                {hospital.specialties.map((specialty, idx) => (
                  <View key={idx} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => handleCall(hospital.phone)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.callButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Phone color="#10B981" size={18} />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Call</Text>
              </Pressable>

              <Pressable
                onPress={() => handleDirections(hospital.latitude, hospital.longitude, hospital.name)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.directionsButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Navigation color="#3B82F6" size={18} />
                <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Directions</Text>
              </Pressable>
            </View>
          </View>
        ))}
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
  hospitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  hospitalHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  hospitalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalIcon: {
    fontSize: 28,
  },
  hospitalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  hospitalDetails: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  specialtiesContainer: {
    marginBottom: 16,
  },
  specialtiesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  callButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  directionsButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  categoryLabelSelected: {
    color: '#3B82F6',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 16,
  },
});

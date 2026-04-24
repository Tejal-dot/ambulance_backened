import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ambulance, Heart, MapPin, Clock, User, Truck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRole } from '@/types';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim]);

  const slides = [
    {
      icon: Ambulance,
      title: 'Quick Ambulance Booking',
      description: 'Book ambulances instantly with just one tap in emergencies',
      color: '#EF4444',
    },
    {
      icon: MapPin,
      title: 'Nearest Hospitals',
      description: 'Find and navigate to the nearest hospitals in your area',
      color: '#3B82F6',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Round-the-clock service ensuring help whenever you need it',
      color: '#10B981',
    },
    {
      icon: Heart,
      title: 'Emergency Alerts',
      description: 'Auto-notify emergency contacts when you book an ambulance',
      color: '#F59E0B',
    },
  ];

  const currentColor = slides[currentSlide].color;
  const Icon = slides[currentSlide].icon;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[currentColor, '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: currentColor }]}>
              <Icon color="#FFFFFF" size={48} strokeWidth={2} />
            </View>
          </Animated.View>
          
          <Text style={styles.title}>{slides[currentSlide].title}</Text>
          <Text style={styles.description}>{slides[currentSlide].description}</Text>
        </View>

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setCurrentSlide(index)}
              style={[
                styles.dot,
                currentSlide === index && { backgroundColor: currentColor, width: 32 },
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          {currentSlide < slides.length - 1 ? (
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => router.push('/login')}
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>

              <Pressable
                onPress={() => setCurrentSlide(currentSlide + 1)}
                style={({ pressed }) => [
                  styles.nextButton,
                  { backgroundColor: currentColor },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.nextText}>Next</Text>
              </Pressable>
            </View>
          ) : (
            !showRoleSelection ? (
              <Pressable
                onPress={() => setShowRoleSelection(true)}
                style={({ pressed }) => [
                  styles.registerButton,
                  { backgroundColor: currentColor },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.registerText}>Get Started</Text>
              </Pressable>
            ) : (
              <View style={styles.roleSelection}>
                <Text style={styles.roleTitle}>Choose Your Role</Text>
                <View style={styles.roleButtons}>
                  <Pressable
                    onPress={() => {
                      router.push('/login?role=patient');
                    }}
                    style={({ pressed }) => [
                      styles.roleCard,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: '#FEE2E2' }]}>
                      <User color="#EF4444" size={32} />
                    </View>
                    <Text style={styles.roleCardTitle}>I&apos;m a Patient</Text>
                    <Text style={styles.roleCardDesc}>Book ambulances and get emergency help</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      router.push('/login?role=driver');
                    }}
                    style={({ pressed }) => [
                      styles.roleCard,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Truck color="#3B82F6" size={32} />
                    </View>
                    <Text style={styles.roleCardTitle}>I&apos;m a Driver</Text>
                    <Text style={styles.roleCardDesc}>Accept ride requests and help patients</Text>
                  </Pressable>
                </View>
              </View>
            )
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  footer: {
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  skipText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  finalButtons: {
    gap: 16,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  loginText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  registerButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  roleSelection: {
    gap: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleButtons: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  roleCardDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

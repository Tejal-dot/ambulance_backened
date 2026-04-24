export type UserRole = 'patient' | 'driver';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  bloodGroup?: string;
  emergencyContacts: EmergencyContact[];
  vehicleNumber?: string;
  licenseNumber?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export type HospitalCategory = 'emergency' | 'cardiology' | 'neurology' | 'orthopedics' | 'gynecology' | 'pediatrics' | 'oncology' | 'multispecialist' | 'gastroenterology';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance?: number;
  specialties: string[];
  category: HospitalCategory[];
  rating: number;
  available: boolean;
}

export interface Ambulance {
  id: string;
  type: 'basic' | 'advanced' | 'air';
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  latitude: number;
  longitude: number;
  distance?: number;
  available: boolean;
  rating: number;
  equipments: string[];
}

export interface Booking {
  id: string;
  userId: string;
  ambulanceId: string;
  hospitalId: string;
  driverId?: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  hospitalLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  ambulanceType: 'basic' | 'advanced' | 'air';
  patientName: string;
  patientAge: number;
  patientCondition: string;
  status: 'pending' | 'accepted' | 'on-the-way' | 'arrived' | 'in-transit' | 'completed' | 'cancelled';
  isEmergency: boolean;
  bookingTime: string;
  estimatedArrival?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
}

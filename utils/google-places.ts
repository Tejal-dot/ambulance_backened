import { Hospital } from '@/types';

export interface GooglePlacesResponse {
  results: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    formatted_phone_number?: string;
    types: string[];
  }[];
  status: string;
}

export const fetchNearbyHospitals = async (
  latitude: number,
  longitude: number,
  apiKey: string,
  radius: number = 5000
): Promise<Hospital[]> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=hospital&key=${apiKey}`;
    
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();
    
    if (data.status !== 'OK') {
      console.log('Google Places API error:', data.status);
      return [];
    }
    
    const hospitals: Hospital[] = data.results.map((place, index) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number || '+1-XXX-XXX-XXXX',
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      distance: calculateDistance(
        latitude,
        longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      specialties: extractSpecialties(place.types),
      category: extractCategories(place.name, place.types),
      rating: place.rating || 4.0,
      available: Math.random() > 0.3,
    }));
    
    return hospitals.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch (error) {
    console.error('Error fetching hospitals from Google Places:', error);
    return [];
  }
};

export const fetchHospitalDetails = async (
  placeId: string,
  apiKey: string
): Promise<{
  phone?: string;
  website?: string;
  openingHours?: string[];
} | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,opening_hours&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.log('Google Places Details API error:', data.status);
      return null;
    }
    
    return {
      phone: data.result.formatted_phone_number,
      website: data.result.website,
      openingHours: data.result.opening_hours?.weekday_text,
    };
  } catch (error) {
    console.error('Error fetching hospital details:', error);
    return null;
  }
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

const extractSpecialties = (types: string[]): string[] => {
  const specialtyMap: Record<string, string> = {
    hospital: 'General',
    emergency_room: 'Emergency',
    doctor: 'General Practice',
    health: 'Healthcare',
  };
  
  const specialties = types
    .map(type => specialtyMap[type])
    .filter(Boolean);
  
  return specialties.length > 0 ? specialties : ['General'];
};

const extractCategories = (name: string, types: string[]): ('emergency' | 'cardiology' | 'neurology' | 'orthopedics' | 'gynecology' | 'pediatrics' | 'oncology' | 'multispecialist' | 'gastroenterology')[] => {
  const categories: ('emergency' | 'cardiology' | 'neurology' | 'orthopedics' | 'gynecology' | 'pediatrics' | 'oncology' | 'multispecialist' | 'gastroenterology')[] = [];
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('cardio') || nameLower.includes('heart')) {
    categories.push('cardiology');
  }
  if (nameLower.includes('neuro') || nameLower.includes('brain')) {
    categories.push('neurology');
  }
  if (nameLower.includes('ortho') || nameLower.includes('bone')) {
    categories.push('orthopedics');
  }
  if (nameLower.includes('gynec') || nameLower.includes('women') || nameLower.includes('maternity')) {
    categories.push('gynecology');
  }
  if (nameLower.includes('child') || nameLower.includes('pediatric') || nameLower.includes('paediatric')) {
    categories.push('pediatrics');
  }
  if (nameLower.includes('cancer') || nameLower.includes('oncology')) {
    categories.push('oncology');
  }
  if (nameLower.includes('gastro') || nameLower.includes('digestive')) {
    categories.push('gastroenterology');
  }
  
  if (types.includes('emergency_room') || nameLower.includes('emergency')) {
    categories.push('emergency');
  }
  
  if (categories.length === 0 || categories.length > 2) {
    categories.push('multispecialist');
  }
  
  return categories.length > 0 ? categories : ['emergency', 'multispecialist'];
};

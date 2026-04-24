export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371;
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

export const findNearestAmbulances = (
  userLocation: Coordinates,
  ambulances: any[],
  limit: number = 5
) => {
  return ambulances
    .map(ambulance => ({
      ...ambulance,
      distance: calculateDistance(userLocation, {
        latitude: ambulance.latitude,
        longitude: ambulance.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

export const findNearestHospitals = (
  userLocation: Coordinates,
  hospitals: any[],
  limit: number = 5
) => {
  return hospitals
    .map(hospital => ({
      ...hospital,
      distance: calculateDistance(userLocation, {
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

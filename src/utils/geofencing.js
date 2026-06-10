// Geofencing utility for detecting location breaches

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return deg * Math.PI / 180;
}

// Calculate distance between two GPS coordinates using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Default geofencing radius in meters
const DEFAULT_GEOFENCE_RADIUS = 200; // 200 meters

// Check if a visit location is within the geofence of the doctor's archived location
export function checkGeofencingBreach(doctorLat, doctorLon, visitLat, visitLon, radiusMeters = DEFAULT_GEOFENCE_RADIUS) {
  const distanceKm = calculateDistance(doctorLat, doctorLon, visitLat, visitLon);
  if (distanceKm === null) return { isBreach: false, distance: null, message: '' };
  
  const distanceMeters = distanceKm * 1000;
  const isBreach = distanceMeters > radiusMeters;
  
  return {
    isBreach,
    distance: distanceMeters,
    distanceKm: distanceKm,
    radius: radiusMeters,
    message: isBreach 
      ? `تنبيه خرق جيو-جغرافي! المسافة ${distanceMeters.toFixed(0)} متر عن موقع الطبيب المؤرشف (الحد المسموح: ${radiusMeters} متر)`
      : `الموقع ضمن النطاق المسموح (${distanceMeters.toFixed(0)} متر)`
  };
}

// Get current GPS position
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع الجغرافي'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let message = 'فشل في تحديد الموقع';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'تم رفض إذن تحديد الموقع';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'معلومات الموقع غير متاحة';
            break;
          case error.TIMEOUT:
            message = 'انتهت مهلة طلب الموقع';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

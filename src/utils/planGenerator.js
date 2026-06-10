// Smart Monthly Plan Generator

import { getAppData, getDoctorRequiredVisits, getMonthName } from './storage';
import { calculateDistance } from './geofencing';

// Yemen approximate center coordinates for reference
const YEMEN_CENTER = { lat: 15.5527, lon: 48.5164 };

// Group doctors by geographic proximity using simple clustering
function clusterDoctorsByLocation(doctors, thresholdKm = 5) {
  const clusters = [];
  const assigned = new Set();
  
  for (let i = 0; i < doctors.length; i++) {
    if (assigned.has(i)) continue;
    
    const cluster = [i];
    assigned.add(i);
    
    const doc = doctors[i];
    if (!doc.latitude || !doc.longitude) {
      clusters.push(cluster);
      continue;
    }
    
    for (let j = i + 1; j < doctors.length; j++) {
      if (assigned.has(j)) continue;
      
      const otherDoc = doctors[j];
      if (!otherDoc.latitude || !otherDoc.longitude) continue;
      
      const dist = calculateDistance(doc.latitude, doc.longitude, otherDoc.latitude, otherDoc.longitude);
      if (dist !== null && dist <= thresholdKm) {
        cluster.push(j);
        assigned.add(j);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

// Count visits for a doctor in a specific month/year
function countVisitsInMonth(visits, doctorName, year, month) {
  return visits.filter(v => {
    if (v.doctorName !== doctorName) return false;
    const visitDate = new Date(v.visitDate);
    return visitDate.getFullYear() === year && visitDate.getMonth() === month;
  }).length;
}

// Count total visits for a doctor from start of year to previous month
function countVisitsYearToDate(visits, doctorName, year, currentMonth) {
  let total = 0;
  for (let m = 0; m < currentMonth; m++) {
    total += countVisitsInMonth(visits, doctorName, year, m);
  }
  return total;
}

export function generateSmartPlan(year, targetMonth) {
  const data = getAppData();
  const { doctors, visits } = data;
  
  // Determine which doctors need visits this month
  const doctorsNeedingVisits = [];
  
  for (const doctor of doctors) {
    const requiredPerMonth = getDoctorRequiredVisits(doctor.classRating);
    const prevMonthVisits = countVisitsInMonth(visits, doctor.name, year, targetMonth - 1 >= 0 ? targetMonth - 1 : 11);
    const currentMonthVisits = countVisitsInMonth(visits, doctor.name, year, targetMonth);
    const remaining = requiredPerMonth - currentMonthVisits;
    
    if (remaining > 0) {
      doctorsNeedingVisits.push({
        ...doctor,
        requiredVisits: requiredPerMonth,
        prevMonthVisits,
        currentMonthVisits,
        remainingVisits: remaining,
        totalYearVisits: countVisitsYearToDate(visits, doctor.name, year, targetMonth)
      });
    }
  }
  
  // Sort by class priority (A first, then B, then C)
  const classOrder = { A: 0, B: 1, C: 2 };
  doctorsNeedingVisits.sort((a, b) => {
    const classDiff = (classOrder[a.classRating] || 2) - (classOrder[b.classRating] || 2);
    if (classDiff !== 0) return classDiff;
    return (b.remainingVisits || 0) - (a.remainingVisits || 0);
  });
  
  // Cluster doctors by location
  const clusters = clusterDoctorsByLocation(doctorsNeedingVisits);
  
  // Generate day assignments (working days in month)
  const daysInMonth = new Date(year, targetMonth + 1, 0).getDate();
  const workingDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, targetMonth, d);
    const dayOfWeek = date.getDay();
    // Skip Fridays (5) and Saturdays (6) - weekend in Yemen
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      workingDays.push(d);
    }
  }
  
  // Assign visits to days, grouping by location clusters
  const plan = [];
  let dayIndex = 0;
  
  for (const cluster of clusters) {
    const clusterDoctors = cluster.map(i => doctorsNeedingVisits[i]).filter(Boolean);
    
    for (const doctor of clusterDoctors) {
      const visitsToSchedule = doctor.remainingVisits;
      // Spread visits evenly across the month
      const interval = Math.max(1, Math.floor(workingDays.length / visitsToSchedule));
      
      for (let v = 0; v < visitsToSchedule; v++) {
        const targetDayIndex = Math.min(dayIndex + v * interval, workingDays.length - 1);
        const day = workingDays[targetDayIndex % workingDays.length];
        
        plan.push({
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctorClass: doctor.classRating,
          speciality: doctor.speciality,
          workplace: doctor.workplace1 || '',
          latitude: doctor.latitude,
          longitude: doctor.longitude,
          plannedDay: day,
          plannedDate: `${year}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          month: getMonthName(targetMonth),
          clusterGroup: clusterDoctors.map(d => d.name)
        });
      }
    }
    dayIndex = (dayIndex + 1) % workingDays.length;
  }
  
  // Sort plan by date
  plan.sort((a, b) => a.plannedDay - b.plannedDay);
  
  return {
    plan,
    summary: {
      totalDoctors: doctorsNeedingVisits.length,
      totalVisitsPlanned: plan.length,
      classA: doctorsNeedingVisits.filter(d => d.classRating === 'A').length,
      classB: doctorsNeedingVisits.filter(d => d.classRating === 'B').length,
      classC: doctorsNeedingVisits.filter(d => d.classRating === 'C').length,
      workingDays: workingDays.length,
      month: getMonthName(targetMonth),
      year
    }
  };
}

export function getDoctorsVisitStats(year, month) {
  const data = getAppData();
  const { doctors, visits } = data;
  
  return doctors.map(doctor => {
    const requiredPerMonth = getDoctorRequiredVisits(doctor.classRating);
    const monthVisits = countVisitsInMonth(visits, doctor.name, year, month);
    const totalVisits = countVisitsYearToDate(visits, doctor.name, year, month + 1);
    
    return {
      id: doctor.id,
      name: doctor.name,
      speciality: doctor.speciality,
      classRating: doctor.classRating,
      requiredVisits: requiredPerMonth,
      completedVisits: monthVisits,
      totalVisits,
      completionRate: requiredPerMonth > 0 ? Math.round((monthVisits / requiredPerMonth) * 100) : 0
    };
  }).sort((a, b) => {
    const classOrder = { A: 0, B: 1, C: 2 };
    return (classOrder[a.classRating] || 2) - (classOrder[b.classRating] || 2);
  });
}

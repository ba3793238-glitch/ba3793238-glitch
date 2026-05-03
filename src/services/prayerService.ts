import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Madhab } from 'adhan';
import { format } from 'date-fns';

export interface PrayerTimeInfo {
  name: string;
  time: string;
  id: string;
}

export const PRAYER_NAMES: Record<string, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function getPrayerTimes(lat: number, lng: number, date: Date = new Date(), settings?: { method?: string; madhab?: string }): PrayerTimeInfo[] {
  const coords = new Coordinates(lat, lng);
  
  // Select method
  let params;
  switch (settings?.method) {
    case 'UmmAlQura': params = CalculationMethod.UmmAlQura(); break;
    case 'Egyptian': params = CalculationMethod.Egyptian(); break;
    case 'MoonsightingCommittee': params = CalculationMethod.MoonsightingCommittee(); break;
    case 'Dubai': params = CalculationMethod.Dubai(); break;
    case 'Kuwait': params = CalculationMethod.Kuwait(); break;
    case 'Qatar': params = CalculationMethod.Qatar(); break;
    case 'Singapore': params = CalculationMethod.Singapore(); break;
    case 'Turkey': params = CalculationMethod.Turkey(); break;
    default: params = CalculationMethod.MuslimWorldLeague();
  }

  params.madhab = settings?.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  
  const prayerTimes = new PrayerTimes(coords, date, params);
  
  return [
    { id: 'fajr', name: PRAYER_NAMES.fajr, time: format(prayerTimes.fajr, 'hh:mm a') },
    { id: 'sunrise', name: PRAYER_NAMES.sunrise, time: format(prayerTimes.sunrise, 'hh:mm a') },
    { id: 'dhuhr', name: PRAYER_NAMES.dhuhr, time: format(prayerTimes.dhuhr, 'hh:mm a') },
    { id: 'asr', name: PRAYER_NAMES.asr, time: format(prayerTimes.asr, 'hh:mm a') },
    { id: 'maghrib', name: PRAYER_NAMES.maghrib, time: format(prayerTimes.maghrib, 'hh:mm a') },
    { id: 'isha', name: PRAYER_NAMES.isha, time: format(prayerTimes.isha, 'hh:mm a') },
  ];
}

export function getNextPrayer(lat: number, lng: number, settings?: { method?: string; madhab?: string }): { name: string; time: string; remaining: string } {
  const coords = new Coordinates(lat, lng);
  
  // Select method
  let params;
  switch (settings?.method) {
    case 'UmmAlQura': params = CalculationMethod.UmmAlQura(); break;
    case 'Egyptian': params = CalculationMethod.Egyptian(); break;
    case 'MoonsightingCommittee': params = CalculationMethod.MoonsightingCommittee(); break;
    case 'Dubai': params = CalculationMethod.Dubai(); break;
    case 'Kuwait': params = CalculationMethod.Kuwait(); break;
    case 'Qatar': params = CalculationMethod.Qatar(); break;
    case 'Singapore': params = CalculationMethod.Singapore(); break;
    case 'Turkey': params = CalculationMethod.Turkey(); break;
    default: params = CalculationMethod.MuslimWorldLeague();
  }
  
  params.madhab = settings?.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  
  const prayerTimes = new PrayerTimes(coords, new Date(), params);
  
  const next = prayerTimes.nextPrayer();
  const nextTime = prayerTimes.timeForPrayer(next);
  
  if (!nextTime) {
      // If no next prayer today, look for Fajr tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimes = new PrayerTimes(coords, tomorrow, params);
      return { 
          name: PRAYER_NAMES.fajr, 
          time: format(tomorrowTimes.fajr, 'hh:mm a'),
          remaining: '...'
      };
  }

  return {
    name: PRAYER_NAMES[next] || next,
    time: format(nextTime, 'hh:mm a'),
    remaining: format(nextTime, 'H:mm') // Simplified for now
  };
}

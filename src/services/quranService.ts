export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  audio?: string;
  audioSecondary?: string[];
}

export async function fetchSurahs(): Promise<Surah[]> {
  try {
    const cached = localStorage.getItem('offline_surahs_list');
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const response = await fetch('https://api.alquran.cloud/v1/surah');
  const data = await response.json();
  
  try {
    localStorage.setItem('offline_surahs_list', JSON.stringify(data.data));
  } catch (e) {}
  
  return data.data;
}

export async function fetchSurahDetail(number: number): Promise<{ ayahs: Ayah[]; surah: Surah }> {
  try {
    const cached = localStorage.getItem(`offline_surah_${number}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`);
  const data = await response.json();
  const res = {
    ayahs: data.data.ayahs,
    surah: data.data
  };
  
  return res;
}

export async function fetchSurahWithTranslation(number: number, edition: string): Promise<{ ayahs: Ayah[]; translation: Ayah[]; surah: Surah }> {
  try {
    const cached = localStorage.getItem(`offline_surah_${number}_${edition}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,${edition}`);
  const data = await response.json();
  const res = {
    ayahs: data.data[0].ayahs,
    translation: data.data[1].ayahs,
    surah: data.data[0]
  };
  
  return res;
}

export async function downloadSurahOffline(number: number, edition?: string): Promise<boolean> {
  try {
    if (edition && edition !== 'none') {
      const data = await fetchSurahWithTranslation(number, edition);
      localStorage.setItem(`offline_surah_${number}_${edition}`, JSON.stringify(data));
    } else {
      const data = await fetchSurahDetail(number);
      localStorage.setItem(`offline_surah_${number}`, JSON.stringify(data));
    }
    return true;
  } catch (e) {
    console.error('Download surah error:', e);
    return false;
  }
}

export function isSurahOffline(number: number, edition?: string): boolean {
    if (edition && edition !== 'none') {
        return localStorage.getItem(`offline_surah_${number}_${edition}`) !== null;
    }
    return localStorage.getItem(`offline_surah_${number}`) !== null;
}

export async function fetchReciters(): Promise<{ id: string; name: string; englishName: string }[]> {
  const response = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar');
  const data = await response.json();
  return data.data.map((item: any) => ({
    id: item.identifier,
    name: item.name,
    englishName: item.englishName
  }));
}

export async function fetchSurahAudio(number: number, reciter: string): Promise<Ayah[]> {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/${reciter}`);
  const data = await response.json();
  return data.data.ayahs;
}

export async function fetchFullJuz(number: number): Promise<Ayah[]> {
  const response = await fetch(`https://api.alquran.cloud/v1/juz/${number}/quran-uthmani`);
  const data = await response.json();
  return data.data.ayahs;
}

export async function fetchPage(pageNumber: number): Promise<{ ayahs: Ayah[]; surahs: Record<number, Surah> }> {
  const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
  const data = await response.json();
  return {
    ayahs: data.data.ayahs,
    surahs: data.data.surahs
  };
}

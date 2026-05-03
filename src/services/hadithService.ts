
export interface Hadith {
  number: number;
  text: string;
  reference: string;
  explanation?: string;
  translation?: string;
}

const HADITH_API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

export async function fetchNawawiHadiths(lang: 'ara' | 'eng' = 'ara'): Promise<any[]> {
  try {
    const response = await fetch(`${HADITH_API_BASE}/${lang}-nawawi.json`);
    const data = await response.json();
    return data.hadiths;
  } catch (error) {
    console.error('Error fetching hadiths:', error);
    return [];
  }
}

export async function getDailyHadith(language: 'ar' | 'en'): Promise<Hadith | null> {
  try {
    // We fetch both to have them paired if possible
    const arabicHadiths = await fetchNawawiHadiths('ara');
    const englishHadiths = await fetchNawawiHadiths('eng');

    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % arabicHadiths.length;

    const arabic = arabicHadiths[index];
    const english = englishHadiths[index];

    return {
      number: arabic.hadithnumber || index + 1,
      text: arabic.text,
      translation: english?.text,
      reference: 'الأربعون النووية / 40 Hadith Nawawi',
      // We will provide a static explanation for now or use AI
      explanation: language === 'ar' 
        ? "هذا الحديث من جوامع كلم النبي صلى الله عليه وسلم، ويتناول أصلًا عظيمًا من أصول الدين."
        : "This hadith is one of the comprehensive statements of the Prophet (PBUH) and addresses a major principle of faith."
    };
  } catch (error) {
    return null;
  }
}

export async function getAllHadiths(language: 'ar' | 'en'): Promise<Hadith[]> {
  try {
    // Check for offline cache first
    const cached = localStorage.getItem('offline_hadiths');
    if (cached) {
      const data = JSON.parse(cached);
      return data.map((h: any, i: number) => ({
        number: h.number || i + 1,
        text: h.text,
        translation: h.translation,
        reference: h.reference,
        explanation: h.explanation
      }));
    }

    const arabicHadiths = await fetchNawawiHadiths('ara');
    const englishHadiths = await fetchNawawiHadiths('eng');

    return arabicHadiths.map((h, i) => ({
      number: h.hadithnumber || i + 1,
      text: h.text,
      translation: englishHadiths[i]?.text,
      reference: 'الأربعون النووية / 40 Hadith Nawawi',
    }));
  } catch (error) {
    return [];
  }
}

export async function saveHadithsForOffline(): Promise<boolean> {
  try {
    const arabicHadiths = await fetchNawawiHadiths('ara');
    const englishHadiths = await fetchNawawiHadiths('eng');

    const combined = arabicHadiths.map((h, i) => ({
      number: h.hadithnumber || i + 1,
      text: h.text,
      translation: englishHadiths[i]?.text,
      reference: 'الأربعون النووية / 40 Hadith Nawawi',
    }));

    localStorage.setItem('offline_hadiths', JSON.stringify(combined));
    localStorage.setItem('offline_hadiths_date', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Failed to save hadiths offline:', error);
    return false;
  }
}

export function isOfflineAvailable(): boolean {
  return localStorage.getItem('offline_hadiths') !== null;
}

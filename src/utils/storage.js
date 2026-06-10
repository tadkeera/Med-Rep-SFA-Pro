// Storage utility for managing app data with localStorage

const STORAGE_KEY = 'medrep_sfa_data';

const defaultData = {
  doctors: [],
  clients: [],
  visits: [],
  workplaces: [],
  invoices: [],
  samples: [
    { id: 's1', name: 'كولاجين (90) كبسول', initialQuantity: 100, currentQuantity: 100 },
    { id: 's2', name: 'ميلاتونين كبسول', initialQuantity: 80, currentQuantity: 80 },
    { id: 's3', name: 'جلوكوزامين ام اس ام', initialQuantity: 120, currentQuantity: 120 },
    { id: 's4', name: 'جوجوينت شراب', initialQuantity: 60, currentQuantity: 60 },
    { id: 's5', name: 'فيمنكس كرانبيري 10000', initialQuantity: 90, currentQuantity: 90 },
    { id: 's6', name: 'ديجست 365 كبسول', initialQuantity: 70, currentQuantity: 70 },
    { id: 's7', name: 'ارثري فلكس كريم', initialQuantity: 50, currentQuantity: 50 },
    { id: 's8', name: 'انرجكس تو جو', initialQuantity: 110, currentQuantity: 110 },
    { id: 's9', name: 'ملتي فيتامين البالغين', initialQuantity: 100, currentQuantity: 100 },
    { id: 's10', name: 'ريلاكسين داي', initialQuantity: 85, currentQuantity: 85 },
    { id: 's11', name: 'ريلاكسين نايت', initialQuantity: 85, currentQuantity: 85 },
    { id: 's12', name: 'فيمنكس كاليسوم', initialQuantity: 75, currentQuantity: 75 },
  ],
  weeklyCycles: [],
};

export function getAppData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultData, ...parsed };
    }
  } catch (e) {
    console.error('Error reading app data:', e);
  }
  return { ...defaultData };
}

export function saveAppData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving app data:', e);
  }
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function getDoctorRequiredVisits(classRating) {
  switch (classRating) {
    case 'A': return 4;
    case 'B': return 3;
    case 'C': return 1;
    default: return 1;
  }
}

export function getMonthName(monthIndex) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthIndex] || '';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

import { Grade } from '@/models/types';

export const SORT_FEE_PER_KG = 5;

export const DEFAULT_GRADES: Grade[] = [
  { id: 'a-toom', name: 'A ตูม',         price: 120, badge: 'A', color: 'orange' },
  { id: 'a-baan', name: 'A บาน',         price: 95,  badge: 'A', color: 'orange' },
  { id: 'b-toom', name: 'B ตูม',         price: 85,  badge: 'B', color: 'green'  },
  { id: 'b-baan', name: 'B บาน',         price: 65,  badge: 'B', color: 'green'  },
  { id: 'c-toom', name: 'C ตูม',         price: 45,  badge: 'C', color: 'cyan'   },
  { id: 'c-baan', name: 'C บาน',         price: 30,  badge: 'C', color: 'cyan'   },
  { id: 'offgrade', name: 'ตกเกรด / อื่นๆ', price: 10, badge: 'F', color: 'red' },
];

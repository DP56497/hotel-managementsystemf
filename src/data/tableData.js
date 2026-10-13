/**
 * 50 Hotel Dining Tables Configuration:
 * - 10 Two-person tables (Tables 1 - 10)
 * - 10 Four-person tables (Tables 11 - 20)
 * - 10 Six-person tables (Tables 21 - 30)
 * - 10 Twelve-person tables (Tables 31 - 40)
 * - 10 Sixteen-person tables (Tables 41 - 50)
 */
export const HOTEL_TABLES = Array.from({ length: 50 }, (_, i) => {
  const number = i + 1;
  let capacity = 2;
  let category = '2 Persons';

  if (number <= 10) {
    capacity = 2;
    category = '2 Persons';
  } else if (number <= 20) {
    capacity = 4;
    category = '4 Persons';
  } else if (number <= 30) {
    capacity = 6;
    category = '6 Persons';
  } else if (number <= 40) {
    capacity = 12;
    category = '12 Persons';
  } else {
    capacity = 16;
    category = '16 Persons';
  }

  return {
    id: number,
    number,
    capacity,
    category
  };
});

export const TABLE_CATEGORIES = [
  { key: 'all', label: 'All Tables (50)', capacity: null },
  { key: '2p', label: '2 Persons (10)', capacity: 2 },
  { key: '4p', label: '4 Persons (10)', capacity: 4 },
  { key: '6p', label: '6 Persons (10)', capacity: 6 },
  { key: '12p', label: '12 Persons (10)', capacity: 12 },
  { key: '16p', label: '16 Persons (10)', capacity: 16 }
];

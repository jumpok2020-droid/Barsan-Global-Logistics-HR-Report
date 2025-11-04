
const getThaiHolidaysForYear = (year: number): Record<string, string> => {
    const userHolidays: Record<string, string> = {
        [`${year}-01-01`]: "New Year's Day",
        [`${year}-02-24`]: "Makha Bucha Day", // Note: This is a lunar holiday, date is for 2024
        [`${year}-04-06`]: "Chakri Memorial Day",
        [`${year}-04-13`]: "Songkran Festival",
        [`${year}-04-14`]: "Songkran Festival",
        [`${year}-04-15`]: "Songkran Festival",
        [`${year}-05-01`]: "Labor Day",
        [`${year}-05-05`]: "Coronation Day",
        [`${year}-07-20`]: "Asarnha Bucha Day", // Note: This is a lunar holiday, date is for 2024
        [`${year}-07-21`]: "Buddhist Lent Day", // Note: This is a lunar holiday, date is for 2024
        [`${year}-08-12`]: "H.M. Queen Mother’s Birthday",
        [`${year}-10-23`]: "Chulalongkorn Day",
        [`${year}-12-05`]: "King’s Birthday / Father’s Day",
        [`${year}-12-10`]: "Constitution Day",
        [`${year}-12-31`]: "New Year’s Eve",
    };

    return userHolidays;
};

const thaiHolidays = getThaiHolidaysForYear(new Date().getFullYear());

/**
 * Checks if a given date is a Thai bank holiday.
 * @param date The date to check.
 * @returns The name of the holiday if it is one, otherwise null.
 */
export const getThaiBankHoliday = (date: Date): string | null => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return thaiHolidays[dateString] || null;
};

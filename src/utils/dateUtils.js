export const formatDate = (dateInput) => {
    if (!dateInput) return "-";

    try {
        let date;

        // Handle Firestore Timestamp (has toDate method)
        if (dateInput && typeof dateInput.toDate === 'function') {
            date = dateInput.toDate();
        }
        // Handle serialized Timestamp (has seconds)
        else if (dateInput && typeof dateInput.seconds === 'number') {
            date = new Date(dateInput.seconds * 1000);
        }
        else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return dateInput; // Return original if invalid date

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        // If it's an object (like a timestamp) that caused an error, convert to string to avoid React error
        if (typeof dateInput === 'object') {
            return JSON.stringify(dateInput);
        }
        return dateInput;
    }
};

/**
 * Parses a date string in dd/mm/yyyy format and returns a YYYY-MM-DD string
 * for storage or a Date object.
 */
export const parseTemplateDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle Excel Serial Dates (Numeric)
    if (typeof dateStr === 'number') {
        // Excel serial dates: days since 1899-12-30
        const date = new Date((dateStr - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }

    // If it's already a Date object
    if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];

    const str = String(dateStr).trim();
    if (!str) return null;

    // Check for dd/mm/yyyy or dd-mm-yyyy
    const parts = str.split(/[/|-]/);
    if (parts.length === 3) {
        let day, month, year;

        // Assume first part is day if it's <= 31 and third part is 4 digits
        if (parts[0].length <= 2 && parts[2].length === 4) {
            day = parts[0].padStart(2, '0');
            month = parts[1].padStart(2, '0');
            year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }

    // Fallback to standard JS parsing if it doesn't match dd/mm/yyyy
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return null;
};

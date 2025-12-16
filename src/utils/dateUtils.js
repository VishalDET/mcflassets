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

/**
 * Simple CSV parser utility that handles basic quoted strings
 */

/**
 * Parses a CSV string into an array of objects
 * 
 * @param csvContent The raw CSV string content
 * @returns Array of parsed objects where keys are the headers
 */
export const parseCSV = (csvContent: string): Record<string, string>[] => {
    if (!csvContent || csvContent.trim() === '') {
        return [];
    }

    // Remove BOM if present (UTF-8)
    const cleanContent = csvContent.replace(/^\uFEFF/, '');

    // Split into lines considering both \r\n and \n
    const lines = cleanContent.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) {
        return [];
    }

    // Parse headers (first line)
    const headers = parseCSVLine(lines[0]);

    const result: Record<string, string>[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        // Only process rows that have values and match header length roughly
        if (values.length > 0 && values.some(v => v !== '')) {
            const rowObj: Record<string, string> = {};

            headers.forEach((header, index) => {
                // Map value to header, fallback to empty string if missing
                rowObj[header] = index < values.length ? values[index] : '';
            });

            result.push(rowObj);
        }
    }

    return result;
};

/**
 * Parses a single line of CSV respecting double quotes containing commas
 */
const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            // Toggle quotes state
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(currentVal.trim());
            currentVal = '';
        } else {
            currentVal += char;
        }
    }

    // Push the last value
    result.push(currentVal.trim());

    // Clean up double quotes escaping ("" -> ")
    return result.map(val => val.replace(/""/g, '"'));
};

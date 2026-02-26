import { saveAs } from 'file-saver';

/**
 * Interface definition for export columns
 */
export interface ExportColumn<T> {
    header: string;
    key: keyof T | ((row: T) => string | number);
}

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 */
const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If the value contains comma, newline, or double quotes, it must be enclosed in double quotes.
    // Double quotes inside the string must be escaped with another double quote.
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

/**
 * Generates and downloads a CSV file from an array of objects
 * 
 * @param data Array of records to export
 * @param columns Array of column definitions (header and key/accessor)
 * @param filename Name of the exported file (without extension)
 */
export const exportToCSV = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    filename: string
): void => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    // 1. Create header row
    const headerRow = columns.map(col => escapeCsvValue(col.header)).join(',');

    // 2. Create data rows
    const dataRows = data.map(row => {
        return columns.map(col => {
            let value: any;
            if (typeof col.key === 'function') {
                value = col.key(row);
            } else {
                value = row[col.key];
            }
            return escapeCsvValue(value);
        }).join(',');
    });

    // 3. Combine with BOM for Excel UTF-8 support
    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');

    // 4. Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
};

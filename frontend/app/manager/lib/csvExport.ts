/**
 * Utility to export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
) {
  if (data.length === 0) return;

  const columnHeaders = headers || Object.keys(data[0]);
  const keys = Object.keys(data[0]);

  const csvContent = [
    columnHeaders.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key] === null || row[key] === undefined ? '' : row[key];
        // Handle strings with commas by wrapping in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

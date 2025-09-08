/**
 * Utility functions for date handling and formatting
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
  daysBack: number;
}

/**
 * Calculate date range based on days back from current UTC time
 */
export const getDateRange = (daysBack: number): DateRange => {
  const endDate = new Date(); // Current UTC time
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);
  
  return {
    startDate,
    endDate,
    daysBack
  };
};

/**
 * Format date range for display in UI
 */
export const formatDateRange = (daysBack: number): string => {
  const { startDate, endDate } = getDateRange(daysBack);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  };
  
  const startFormatted = startDate.toLocaleDateString('en-US', formatOptions);
  const endFormatted = endDate.toLocaleDateString('en-US', formatOptions);
  
  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Format date range for compact display (e.g., "Last 30 days")
 */
export const formatDateRangeCompact = (daysBack: number): string => {
  if (daysBack === 1) {
    return 'Last 24 hours';
  } else if (daysBack === 7) {
    return 'Last 7 days';
  } else if (daysBack === 30) {
    return 'Last 30 days';
  } else if (daysBack === 90) {
    return 'Last 3 months';
  } else if (daysBack === 365) {
    return 'Last year';
  } else if (daysBack === 1825) {
    return 'Last 5 years';
  } else {
    return `Last ${daysBack} days`;
  }
};

/**
 * Get time range options for dropdown
 */
export const getTimeRangeOptions = () => [
  { value: 1, label: 'Last 24 hours', compact: 'Last 24 hours' },
  { value: 7, label: 'Last 7 days', compact: 'Last 7 days' },
  { value: 30, label: 'Last 30 days', compact: 'Last 30 days' },
  { value: 90, label: 'Last 3 months', compact: 'Last 3 months' },
  { value: 365, label: 'Last year', compact: 'Last year' },
  { value: 1825, label: 'Last 5 years', compact: 'Last 5 years' }
];

/**
 * Format date for API queries (YYYY-MM-DD format)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

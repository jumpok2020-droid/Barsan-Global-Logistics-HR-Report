import { useState, useEffect, useCallback } from 'react';
import { EmployeeLeaveSummary } from '../types';
import { N8N_MYLEAVE_WEBHOOK } from '../constants';

const useLeaveTrackingData = () => {
  const [summaryData, setSummaryData] = useState<EmployeeLeaveSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(N8N_MYLEAVE_WEBHOOK);
      if (!response.ok) {
        throw new Error('Failed to fetch leave data from the webhook.');
      }
      
      const data = await response.json();
      
      // The API can return a single object or an array of objects.
      const apiRecords = Array.isArray(data) ? data : [data];
      
      const processedData: EmployeeLeaveSummary[] = apiRecords.map((record: any, index: number) => ({
        employeeId: record.row_number || index + 1,
        employeeName: record.Name,
        annualQuota: record['Annual Leave provided'],
        businessQuota: record['Business Leave provided'],
        sickQuota: record['Sick Leave provided'],
        annualUsed: record['Annual Leave taken'],
        businessUsed: record['Business Leave taken'],
        sickUsed: record['Sick Leave taken'],
        annualRemaining: record['Annual Leave Remaining'],
        businessRemaining: record['Business Leave Remaining'],
        sickRemaining: record['Sick Leave Remaining'],
        managerEmail: record['Email Manager'],
      }));
      
      setSummaryData(processedData);

    } catch (e: any) {
      console.error("Failed to process leave tracking data:", e);
      setError("Could not load employee leave data. Please check the API connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  return { summaryData, isLoading, error, refetch: fetchAndProcessData };
};

export default useLeaveTrackingData;
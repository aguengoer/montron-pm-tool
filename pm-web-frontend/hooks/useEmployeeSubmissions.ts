import { useQuery } from "@tanstack/react-query";
import { pmApiFetch } from "@/lib/apiClient";

export type SubmissionDto = {
  id: string;
  formId: string;
  formName: string;
  formVersion: number;
  employeeId: string;
  employeeUsername: string;
  submittedAt: string;
  hasAttachments: boolean;
};

export type SubmissionPageResponse = {
  content: SubmissionDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type WorkdaySummaryDto = {
  date: string; // ISO date string (YYYY-MM-DD)
  status: "RELEASED" | "READY" | "DRAFT";
  submissions: SubmissionDto[];
  tbCount: number; // Tagesbericht count
  rsCount: number; // Regieschein count
  hasStreetwatch: boolean;
};

export type UseEmployeeSubmissionsParams = {
  employeeId: string;
  from: string; // ISO date or datetime
  to: string; // ISO date or datetime
};

function groupSubmissionsByDate(submissions: SubmissionDto[]): Map<string, SubmissionDto[]> {
  const grouped = new Map<string, SubmissionDto[]>();
  
  for (const submission of submissions) {
    // Extract date from submittedAt (YYYY-MM-DD)
    const date = submission.submittedAt.slice(0, 10);
    const existing = grouped.get(date) || [];
    existing.push(submission);
    grouped.set(date, existing);
  }
  
  return grouped;
}

function createWorkdaySummaries(submissions: SubmissionDto[]): WorkdaySummaryDto[] {
  const grouped = groupSubmissionsByDate(submissions);
  const summaries: WorkdaySummaryDto[] = [];
  
  for (const [date, subs] of grouped.entries()) {
    const tbCount = subs.filter(s => 
      s.formName.toLowerCase().includes('tagesbericht') || 
      s.formName.toLowerCase().includes('tb')
    ).length;
    
    const rsCount = subs.filter(s => 
      s.formName.toLowerCase().includes('regieschein') || 
      s.formName.toLowerCase().includes('rs')
    ).length;
    
    const hasStreetwatch = subs.some(s => 
      s.formName.toLowerCase().includes('streetwatch') ||
      s.formName.toLowerCase().includes('sw')
    );
    
    summaries.push({
      date,
      status: "RELEASED", // All submitted forms are considered released
      submissions: subs,
      tbCount,
      rsCount,
      hasStreetwatch,
    });
  }
  
  // Sort by date descending (newest first)
  summaries.sort((a, b) => b.date.localeCompare(a.date));
  
  return summaries;
}

export function useEmployeeSubmissions(params: UseEmployeeSubmissionsParams) {
  const { employeeId, from, to } = params;

  return useQuery({
    queryKey: ["employeeSubmissions", { employeeId, from, to }],
    enabled: Boolean(employeeId && from && to),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("employeeId", employeeId);
      
      // Convert date strings to ISO datetime if needed
      const fromDate = from.includes('T') ? from : `${from}T00:00:00Z`;
      const toDate = to.includes('T') ? to : `${to}T23:59:59Z`;
      
      searchParams.set("from", fromDate);
      searchParams.set("to", toDate);
      searchParams.set("size", "1000"); // Fetch all submissions in range
      
      const path = `/api/submissions?${searchParams.toString()}`;
      const response = await pmApiFetch<SubmissionPageResponse>(path);
      
      // Transform submissions into workday summaries
      return createWorkdaySummaries(response.content);
    },
  });
}

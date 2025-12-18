// lib/deadlineService.ts

export interface DeadlineInfo {
    days: number;
    deadlineDate: string;
    region: string;
  }
  
  export const getDynamicDeadline = (state?: string, county?: string): DeadlineInfo => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Default: Standard Texas May 15th
    let deadlineDate = new Date(currentYear + 1, 4, 15); 
    let region = "Dallas";
  
    if (state === 'TX') {
      deadlineDate = new Date(currentYear + 1, 4, 15);
      region = county ? county.replace(' County', '').replace(' Appraisal District', '') : "Dallas";
    } else if (state === 'CA') {
      deadlineDate = new Date(currentYear, 10, 30);
      region = "California";
    } else if (state === 'FL') {
      deadlineDate = new Date(currentYear, 8, 15);
      region = "Florida";
    }
  
    const diff = deadlineDate.getTime() - today.getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    
    return {
      days,
      deadlineDate: deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      region
    };
  };
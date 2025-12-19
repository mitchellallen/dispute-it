/**
 * deadlineService.ts
 * Manages state-specific property tax protest deadlines.
 */

export interface DeadlineInfo {
    days: number;           // Required for badge count
    label: string;          // Required for badge text
    isExpired: boolean;     
    region: string;         // Required by [id].tsx
    deadlineDate: string;   // Required by [id].tsx
  }
  
  const STATE_DEADLINES: Record<string, { month: number; day: number; name: string }> = {
    'FL': { month: 8, day: 15, name: 'Florida Deadline' },    // Sept 15
    'TX': { month: 4, day: 15, name: 'Texas Deadline' },      // May 15
    'CA': { month: 11, day: 10, name: 'California Deadline' }, // Dec 10
  };
  
  /**
   * Modern logic to handle year-rollover automatically.
   */
  export function getDeadlineData(stateCode: string, county?: string): DeadlineInfo {
    const now = new Date();
    const currentYear = now.getFullYear();
    const upperState = stateCode?.toUpperCase() || 'TX';
    
    // Default to Texas if state is missing
    const config = STATE_DEADLINES[upperState] || { month: 4, day: 15, name: 'Tax Deadline' };
    
    // Create deadline date for current year
    let targetDate = new Date(currentYear, config.month, config.day);
  
    // IF today is past the deadline, move to next year (Fixes Florida 0 error)
    if (now > targetDate) {
      targetDate = new Date(currentYear + 1, config.month, config.day);
    }
  
    const diffTime = targetDate.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    const formattedDate = targetDate.toLocaleDateString('en-US', options).toUpperCase();
    
    return {
      days,
      label: `${config.name.toUpperCase()}: ${formattedDate}`,
      isExpired: days <= 0,
      region: county ? `${county.toUpperCase()}, ${upperState}` : upperState,
      deadlineDate: formattedDate
    };
  }
  
  /**
   * DYNAMIC BRIDGE: Now accepts 2 arguments to match your frontend
   */
  export function getDynamicDeadline(stateCode: string, county?: string): DeadlineInfo {
    return getDeadlineData(stateCode, county);
  }
  
  /**
   * Simple helper for other components
   */
  export function getDaysUntilDeadline(stateCode: string): number {
    return getDeadlineData(stateCode).days;
  }
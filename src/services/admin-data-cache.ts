// Module-level cache so data survives tab switches
export const adminDataCache: {
  dashboard: any;
  students: any[];
  teachers: any[];
  courses: any[];
  batches: any[];
  enquiries: any[];
  passwordResets: any[];
  pendingResetCount: number;
} = {
  dashboard: null,
  students: [],
  teachers: [],
  courses: [],
  batches: [],
  enquiries: [],
  passwordResets: [],
  pendingResetCount: 0,
};

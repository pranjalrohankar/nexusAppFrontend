// Module-level cache so data survives tab switches
export const adminDataCache: {
  dashboard: any;
  students: any[];
  teachers: any[];
  courses: any[];
  batches: any[];
  enquiries: any[];
} = {
  dashboard: null,
  students: [],
  teachers: [],
  courses: [],
  batches: [],
  enquiries: [],
};

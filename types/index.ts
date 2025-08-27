export interface MaintenanceJO {
  "Internal ID"?: string;
  Date?: string;
  "Technician Assigned"?: string;
  Item?: string;
  Equipment?: string;
  Quantity?: string;
  "Maintenance Occurrence Type"?: string;
  "Maintenance Start date"?: string;
  "Maintenance End date"?: string;
  "Equipment Status"?: string;
  "Maintenance Frequency"?: string;
  "Maintenance Interval"?: string;
  "Maintenance Month (Bi-Month/Quarterly)"?: string;
  "Maintenance Month"?: string;
  "Maintenance Day"?: string;
  "Maintenance Threshold (In Usage Units)"?: string;
  "Maintenance Week Day"?: string;
  "Maintenance Coverage Limit (In Usage Units)"?: string;
  "Equipment Usage Units"?: string;
  "Technician Type"?: string;
  "Maintenance Type"?: string;
  "Included Maintenance"?: string;
  Exclusions?: string;
  "Instructions/Specifications"?: string;
  Period?: string;
  "Memo (Main)"?: string;
  Department?: string;
  Class?: string;
  "Document Number"?: string;
  Customer?: string;
  "Rental Sales Order #"?: string;
  Location?: string;
  Amount?: string;
  "Item Rate"?: string;
}

export interface User {
  name: string;
  role: string;
}

export interface Customer {
  "Internal ID"?: string;
  Name: string;
  ID: string;
}

export interface Technician {
  "Internal ID"?: string;
  Name: string;
  ID: string;
  Email: string;
}

export interface Locations {
  "Internal ID"?: string;
  Name: string;
}

export interface SO {
  "Internal ID"?: string;
  "Document Number": string;
  Name: string;
}

export interface items {
  Name: string;
  "Display Name": string;
  Description: String;
  Type: string;
  "Base Price": string;
  "Warranty Start Date": string;
  "Warranty End Date": string;
  "Under Warranty": false;
  "Internal ID": string;
}

export interface charegeItems {
  Name: string;
  "Display Name": string;
  Description: String;
  Type: string;
  "Base Price": string;
  "Warranty Start Date": string;
  "Warranty End Date": string;
  "Under Warranty": false;
  "Internal ID": string;
}

export interface ShipmentMaintenanceList {
  chargeitem: string;
  chargeitemId: string;
  itemId: string;
  line: number;
  itemName: string;
  quantity: number;
  location: string;
  stockAvailable: number;
}

export interface JobScheduleData {
  "Document Number": string;
  "Internal ID": string;
  "Customer Name": string;
  Date: string;
  "Overall Job Status": string;
  Location: string;
  "Maintenance Occurrence Type": string;
  "Technician Type": string;
  "Assigned Technician": string;
  "Equipment Maintenance Job Order #": string;
}

export interface EquipmentUsageLogList {
  internalid: string;
  "Document Number": string;
  Name: string;
  Date: string;
  Department: string;
  Location: string;
  Class: string;
  Equipment: string;
  "Usage Units": string;
  "Maintenance Coverage Limit (In Usage Units)": string;
  "Maintenance Threshold (In Usage Units)": string;
  "Maintenance Job Schedule": string;
  "Maintenance Start Date": string;
  "Maintenance End Date": string;
  "Last Maintenance": boolean;
  "Maintenance Completed": boolean;
  "Equipment Maintenance Job Order #": string;
}

export interface PostingPeriod {
  Name: string;
  "Internal ID": string;
}

export interface MaintenanceOccurrenceType {
  name: string;
  id: string;
}

export interface BillingCycle {
  name: string;
  id: string;
}
export interface BillingDay {
  name: string;
  id: string;
}
export interface BillingInterval {
  name: string;
  id: string;
}
export interface BillingMonth {
  name: string;
  id: string;
}
export interface BillingMonthsForBiMonQtr {
  name: string;
  id: string;
}
export interface BillingType {
  name: string;
  id: string;
}
export interface BillingWeekDay {
  name: string;
  id: string;
}
export interface ContractType {
  name: string;
  id: string;
}
export interface EquipmentCondition {
  name: string;
  id: string;
}
export interface EquipmentStatus {
  name: string;
  id: string;
}
export interface InAdvanceArrears {
  name: string;
  id: string;
}
export interface MaintenanceAction {
  name: string;
  id: string;
}
export interface MaintenanceJobStatus {
  name: string;
  id: string;
}
export interface MaintenanceType {
  name: string;
  id: string;
}
export interface TechnicianType {
  name: string;
  id: string;
}
export interface UsageChargeType {
  name: string;
  id: string;
}
export interface UsageRateType {
  name: string;
  id: string;
}

export interface JobLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  googleMapsUrl: string;
}

export interface JobLocationData {
  startMap: string;
  endMap: string;
}

export interface PerformJobData {
  id: string;
  maintenanceCompletionDate: string;
  maintenanceJobStatus: string;
  dayOfWork: string;
  startTime: string;
  endTime: string;
  supportTechnicians: string[];
  itemsUsed: string[];
  technicianComments: string;
  chargeCustomer: boolean;
  customerCharge: string;
  generatePO: boolean;
  vendor: string;
  expenseIncurred: string;
  technicianPerformed: string;
  technicianType: string;
  photos: string[];
  startMap?: string;
  endMap?: string;
}

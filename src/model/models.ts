export type ProfileValue = {
  datetime: string
  value: number
  status: 'VALID' | 'MISSING'
}

export type MeterValueSummary = {
  value: number
  unit: string
  dateTime?: string
}

export type MeterData = {
  meterPointAdministrationNumber: string
  from: string
  to: string
  granularity: 'MONTH' | string // Assuming there might be other granularities
  type: 'ACTIVE_CURRENT' | string // Assuming there might be other types
  unit: string
  profileValues: ProfileValue[]
  minimum: MeterValueSummary
  maximum: MeterValueSummary
  average: MeterValueSummary
  sum: MeterValueSummary
}

export type Credentials = {
  j_username: string
  j_password: string
}

export interface Address {
  street: string
  housenumber: string
  postcode: string
  city: string
  country: string
}

export interface Entity {
  type: string
  address: Address
  landline: Record<string, never>
  mobile: Record<string, never>
  firstname: string
  lastname: string
  salutation: string
  fullname: string
}

export interface Contract {
  contractNumber: string
  meterPointAdministrationNumber: string
  branch: string
  active: boolean
  scaleType: string
  powerGenerationUnit: boolean
  moveInDate: string
  moveOutDate: string
}

export interface ContractAccount {
  contractAccountNumber: string
  businessPartnerNumber: string
  active: boolean
  description: string
  address: string
  contracts: Contract[]
  branch: string
  numberOfContracts: number
}

export interface BusinessPartner {
  type: string
  businessPartnerNumber: string
  entity: Entity
  mobileMissing: boolean
  mobileVerified: boolean
  ecommunicationActive: boolean
  ecommunicationInactive: boolean
  email: string
}

export interface BusinessPartnerOverview {
  businessPartners: BusinessPartner[]
  contractAccounts: ContractAccount[]
  totalNumberOfContractAccounts: number
  displaySearch: boolean
}

export type Timerange = {
  from: string
  to: string
}

export type Pod = {
  contractAccountNumber: string
  meterPointAdministrationNumber: string
  type: string
  timerange: Timerange
  bestAvailableGranularity: string
}

export type MeterdataRequest = {
  dimension: string
  pods: Pod[]
}

export type EnergyDimension = 'ENERGY' | string

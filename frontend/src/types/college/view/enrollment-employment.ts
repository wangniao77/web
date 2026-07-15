import type {
  EnrollmentEmploymentDetailDTO,
  EnrollmentEmploymentFocus,
  EnrollmentEmploymentOverviewDTO,
} from '@/types/college/api/enrollment-employment'

export type { EnrollmentEmploymentFocus }

export interface EnrollmentEmploymentOverviewVM extends EnrollmentEmploymentOverviewDTO {}

export interface EnrollmentEmploymentDetailVM extends EnrollmentEmploymentDetailDTO {}

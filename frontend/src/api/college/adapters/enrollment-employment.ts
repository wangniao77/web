import type {
  EnrollmentEmploymentDetailDTO,
  EnrollmentEmploymentOverviewDTO,
} from '@/types/college/api/enrollment-employment'
import type {
  EnrollmentEmploymentDetailVM,
  EnrollmentEmploymentOverviewVM,
} from '@/types/college/view/enrollment-employment'

export function adaptEnrollmentEmploymentOverview(
  dto: EnrollmentEmploymentOverviewDTO,
): EnrollmentEmploymentOverviewVM {
  return { ...dto }
}

export function adaptEnrollmentEmploymentDetail(
  dto: EnrollmentEmploymentDetailDTO,
): EnrollmentEmploymentDetailVM {
  return { ...dto }
}

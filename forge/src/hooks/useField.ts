import { useQuery } from '@tanstack/react-query'
import {
  getFieldAthleteBySlug,
  getFieldAthletes,
  getFieldRecordCards,
  getFieldStream,
} from '../api/field'

export const fieldQueryKeys = {
  athletes: (cohort?: string) => ['field-athletes', cohort ?? 'all'] as const,
  stream: (cohort?: string) => ['field-stream', cohort ?? 'all'] as const,
  records: (cohort?: string) => ['field-records', cohort ?? 'all'] as const,
  athlete: (slug: string) => ['field-athlete', slug] as const,
}

export function useFieldAthletes(cohort?: string) {
  return useQuery({
    queryKey: fieldQueryKeys.athletes(cohort),
    queryFn: () => getFieldAthletes(cohort),
  })
}

export function useFieldStream(cohort?: string) {
  return useQuery({
    queryKey: fieldQueryKeys.stream(cohort),
    queryFn: () => getFieldStream(cohort),
  })
}

export function useFieldRecordCards(cohort?: string) {
  return useQuery({
    queryKey: fieldQueryKeys.records(cohort),
    queryFn: () => getFieldRecordCards(cohort),
  })
}

export function useFieldAthlete(slug: string) {
  return useQuery({
    queryKey: fieldQueryKeys.athlete(slug),
    queryFn: () => getFieldAthleteBySlug(slug),
    enabled: !!slug,
  })
}

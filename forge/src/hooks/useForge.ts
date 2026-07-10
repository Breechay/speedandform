import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoster,
  getAthlete,
  getAthleteSessions,
  getAthletePrograms,
  getAthleteStrengthSessions,
  getAthleteRunningSessions,
  getCoachNotes,
  saveCoachNote,
  deleteCoachNote,
  createAthlete,
} from '../api/athletes'
import { getAthleteAccountability } from '../api/accountability'
import {
  clearCoachJudgment,
  getActiveCoachJudgment,
  setCoachJudgment,
} from '../api/judgments'
import {
  getPrograms,
  getProgram,
  createProgram,
  saveProgram,
  publishProgram,
  archiveProgram,
  duplicateProgram,
  assignProgram,
} from '../api/programs'
import type { ProgramTemplate } from '../types/program'

// ── Query keys ───────────────────────────────────────────────

export const queryKeys = {
  roster: ['roster'] as const,
  athlete: (id: string) => ['athlete', id] as const,
  athleteSessions: (id: string, assignmentId?: string) =>
    ['athlete-sessions', id, assignmentId] as const,
  athletePrograms: (id: string) => ['athlete-programs', id] as const,
  athleteStrengthSessions: (authUserId: string | null) => ['athlete-strength-sessions', authUserId] as const,
  athleteRunningSessions: (authUserId: string | null) => ['athlete-running-sessions', authUserId] as const,
  coachNotes: (athleteId: string) => ['coach-notes', athleteId] as const,
  athleteAccountability: (authUserId: string | null) => ['athlete-accountability', authUserId] as const,
  coachJudgment: (authUserId: string | null, programId: string) =>
    ['coach-judgment', authUserId, programId] as const,
  programs: ['programs'] as const,
  program: (id: string) => ['program', id] as const,
}

// ── Roster ───────────────────────────────────────────────────

export function useRoster() {
  return useQuery({
    queryKey: queryKeys.roster,
    queryFn: getRoster,
    staleTime: 30_000, // 30s — coach checks this frequently
  })
}

// ── Athlete detail ────────────────────────────────────────────

export function useAthlete(id: string) {
  return useQuery({
    queryKey: queryKeys.athlete(id),
    queryFn: () => getAthlete(id),
    enabled: !!id,
  })
}

export function useAthleteSessions(id: string, assignmentId?: string) {
  return useQuery({
    queryKey: queryKeys.athleteSessions(id, assignmentId),
    queryFn: () => getAthleteSessions(id, assignmentId),
    enabled: !!id,
  })
}

export function useAthletePrograms(id: string) {
  return useQuery({
    queryKey: queryKeys.athletePrograms(id),
    queryFn: () => getAthletePrograms(id),
    enabled: !!id,
  })
}

export function useAthleteStrengthSessions(authUserId: string | null) {
  return useQuery({
    queryKey: queryKeys.athleteStrengthSessions(authUserId),
    queryFn: () => getAthleteStrengthSessions(authUserId!),
    enabled: !!authUserId,
  })
}

export function useAthleteRunningSessions(authUserId: string | null) {
  return useQuery({
    queryKey: queryKeys.athleteRunningSessions(authUserId),
    queryFn: () => getAthleteRunningSessions(authUserId!),
    enabled: !!authUserId,
  })
}

export function useCoachNotes(athleteId: string) {
  return useQuery({
    queryKey: queryKeys.coachNotes(athleteId),
    queryFn: () => getCoachNotes(athleteId),
    enabled: !!athleteId,
  })
}

export function useAthleteAccountability(authUserId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.athleteAccountability(authUserId),
    queryFn: () => getAthleteAccountability(authUserId!),
    enabled: !!authUserId && enabled,
    staleTime: 15_000,
  })
}

export function useCoachJudgment(authUserId: string | null, programId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.coachJudgment(authUserId, programId ?? ''),
    queryFn: () => getActiveCoachJudgment(authUserId!, programId!),
    enabled: !!authUserId && !!programId && enabled,
    staleTime: 10_000,
  })
}

export function useSetCoachJudgment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setCoachJudgment,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coachJudgment(vars.athleteAuthId, vars.programId),
      })
    },
  })
}

export function useClearCoachJudgment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      judgmentId,
      athleteAuthId,
      programId,
    }: {
      judgmentId: string
      athleteAuthId: string
      programId: string
    }) => clearCoachJudgment(judgmentId).then(() => ({ athleteAuthId, programId })),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.coachJudgment(vars.athleteAuthId, vars.programId),
      })
    },
  })
}

export function useSaveCoachNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      athleteId,
      content,
      isShared,
    }: {
      athleteId: string
      content: string
      isShared: boolean
    }) => saveCoachNote(athleteId, content, isShared),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coachNotes(vars.athleteId) })
    },
  })
}

export function useDeleteCoachNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      noteId,
      athleteId: _athleteId,
    }: {
      noteId: string
      athleteId: string
    }) => deleteCoachNote(noteId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coachNotes(vars.athleteId) })
    },
  })
}

// ── Create athlete ────────────────────────────────────────────

export function useCreateAthlete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      firstName,
      lastName,
      email,
    }: {
      firstName: string
      lastName: string
      email: string
    }) => createAthlete(firstName, lastName, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roster })
    },
  })
}

// ── Programs ──────────────────────────────────────────────────

export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs,
    queryFn: getPrograms,
    staleTime: 60_000,
  })
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.program(id!),
    queryFn: () => getProgram(id!),
    enabled: !!id,
  })
}

// ── Create program ────────────────────────────────────────────

export function useCreateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (program: ProgramTemplate) => createProgram(program),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs })
    },
  })
}

// ── Save program ──────────────────────────────────────────────

export function useSaveProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (program: ProgramTemplate) => saveProgram(program),
    onSuccess: (_, program) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.program(program.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.programs })
    },
  })
}

// ── Publish program ───────────────────────────────────────────

export function usePublishProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishProgram(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.program(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.programs })
    },
  })
}

// ── Archive program ───────────────────────────────────────────

export function useArchiveProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs })
    },
  })
}

// ── Duplicate program ─────────────────────────────────────────

export function useDuplicateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => duplicateProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs })
    },
  })
}

// ── Assign program ────────────────────────────────────────────

export function useAssignProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      programId,
      athleteIds,
      startDate,
    }: {
      programId: string
      athleteIds: string[]
      startDate: string
    }) => assignProgram(programId, athleteIds, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roster })
      queryClient.invalidateQueries({ queryKey: queryKeys.programs })
    },
  })
}

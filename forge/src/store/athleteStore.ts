import { create } from 'zustand'
import type { AthleteProfile } from '../api/athleteInvite'

interface AthleteAuthState {
  athlete: AthleteProfile | null
  loading: boolean
  setAthlete: (a: AthleteProfile | null) => void
  setLoading: (v: boolean) => void
}

export const useAthleteStore = create<AthleteAuthState>((set) => ({
  athlete: null,
  loading: true,
  setAthlete: (athlete) => set({ athlete }),
  setLoading: (loading) => set({ loading }),
}))

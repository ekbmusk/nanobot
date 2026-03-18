import { create } from 'zustand'

export const useProgressStore = create((set, get) => ({
  topics: {},
  totalScore: 0,
  streak: 0,

  setTopicProgress: (topicId, percent) =>
    set((state) => ({
      topics: { ...state.topics, [topicId]: percent },
    })),

  addScore: (points) =>
    set((state) => ({ totalScore: state.totalScore + points })),

  setStreak: (days) => set({ streak: days }),

  reset: () => set({ topics: {}, totalScore: 0, streak: 0 }),
}))

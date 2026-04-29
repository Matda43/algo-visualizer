import { createReducer, on } from '@ngrx/store';
import { xpActions, Badge } from './xp.actions';

export interface XpState {
  totalXp:    number;
  level:      number;
  badges:     Badge[];
  stepsCount: number;
}

export const initialState: XpState = {
  totalXp:    0,
  level:      1,
  badges:     [],
  stepsCount: 0,
};

const XP_PER_LEVEL = 200;

export const xpReducer = createReducer(
  initialState,

  on(xpActions.stepReceived, state => ({
    ...state,
    stepsCount: state.stepsCount + 1,
  })),

  on(xpActions.sessionComplete, (state, { xpGained }) => {
    const newXp   = state.totalXp + xpGained;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    return { ...state, totalXp: newXp, level: newLevel };
  }),

  on(xpActions.badgeUnlocked, (state, { badge }) => ({
    ...state,
    badges: [...state.badges, badge],
  })),
);
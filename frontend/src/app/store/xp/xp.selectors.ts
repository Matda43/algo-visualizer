import { createFeatureSelector, createSelector } from '@ngrx/store';
import { XpState } from './xp.reducer';

export const selectXpState = createFeatureSelector<XpState>('xp');

export const selectTotalXp = createSelector(
  selectXpState, s => s.totalXp
);

export const selectLevel = createSelector(
  selectXpState, s => s.level
);

export const selectBadges = createSelector(
  selectXpState, s => s.badges
);

export const selectStepsCount = createSelector(
  selectXpState, s => s.stepsCount
);

export const selectXpProgress = createSelector(
  selectXpState, s => (s.totalXp % 200) / 200 * 100
);
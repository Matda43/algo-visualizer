import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface Badge {
  id: string;
  name: string;
  description: string;
}

export const xpActions = createActionGroup({
  source: 'XP',
  events: {
    'Step Received':    emptyProps(),
    'Session Complete': props<{ xpGained: number }>(),
    'Badge Unlocked':   props<{ badge: Badge }>(),
    'Level Up':         props<{ newLevel: number }>(),
  }
});
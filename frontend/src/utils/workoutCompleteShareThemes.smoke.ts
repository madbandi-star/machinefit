import {
  pickRandomWorkoutShareTheme,
  resetWorkoutShareThemeDeck,
  WORKOUT_SHARE_THEMES,
} from './workoutCompleteShareThemes';

resetWorkoutShareThemeDeck();
const first10 = Array.from({ length: 10 }, () => pickRandomWorkoutShareTheme().id);
const uniq = new Set(first10);
if (uniq.size !== WORKOUT_SHARE_THEMES.length) {
  console.error('expected unique themes in first cycle', first10);
  process.exit(1);
}
const eleventh = pickRandomWorkoutShareTheme().id;
if (eleventh === first10[9]) {
  console.error('expected no consecutive repeat across cycle boundary', { eleventh, prev: first10[9] });
  process.exit(1);
}
console.log('ok', { first10, eleventh });

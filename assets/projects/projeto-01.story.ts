import type { StoryDurations, StoryState } from "./projeto-01.types";
import { clamp, easeInOutCubic } from "./projeto-01.math";

export const getStoryState = (
  elapsed: number,
  durations: StoryDurations,
  total: number,
  animationDone: boolean,
): StoryState => {
  const cycleTime = clamp(elapsed, 0, total);

  const introEnd = durations.intro;
  const blueEnd = introEnd + durations.blueGrow;
  const hold2017End = blueEnd + durations.hold2017;

  const axisProgress = easeInOutCubic(cycleTime / durations.intro);
  const blueProgress = easeInOutCubic((cycleTime - introEnd) / durations.blueGrow);
  const pinkProgress = easeInOutCubic((cycleTime - hold2017End) / durations.pinkGrow);

  const beatIndex = cycleTime >= hold2017End ? 2 : cycleTime >= blueEnd ? 1 : 0;

  return {
    cycleTime,
    axisProgress,
    blueProgress,
    pinkProgress,
    beatIndex,
    animationDone,
  };
};

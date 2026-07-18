import { useEffect, useRef, useCallback } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";
import type { SceneMode, CompanionMood, CompanionActivity } from "@/stores/useCompanionStore";

/* ================================================================== */
/*  Scene Orchestrator                                                 */
/*  Time-aware auto scene switching + transition coordination          */
/* ================================================================== */

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function isNearTime(timeStr: string, toleranceMinutes = 15): boolean {
  const { hour, minute } = parseTime(timeStr);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hour * 60 + minute;
  return Math.abs(nowMinutes - targetMinutes) <= toleranceMinutes;
}

function getCurrentTimeContext(): {
  period: "night" | "early_morning" | "morning" | "midday" | "afternoon" | "evening" | "late_night";
  hour: number;
} {
  const hour = new Date().getHours();
  if (hour < 5) return { period: "late_night", hour };
  if (hour < 7) return { period: "early_morning", hour };
  if (hour < 12) return { period: "morning", hour };
  if (hour < 14) return { period: "midday", hour };
  if (hour < 18) return { period: "afternoon", hour };
  if (hour < 22) return { period: "evening", hour };
  return { period: "night", hour };
}

export function useSceneOrchestrator() {
  const {
    dailySchedule,
    setSceneMode,
    setMood,
    setActivity,
    setAlarmActive,
    sceneMode,
    activity,
    alarmActive,
    welcomeCompleted,
    setWelcomeCompleted,
    setWelcomePlaying,
  } = useCompanionStore();

  const checkIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastTriggeredRef = useRef<string>(""); // Prevent re-triggering same event

  /* ---------------------------------------------------------------- */
  /*  Time-based auto-switching                                        */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const state = useCompanionStore.getState();
      // Don't auto-switch if user manually set a scene or during welcome
      if (state.welcomePlaying) return;

      const now = new Date();
      const eventKey = `${now.getHours()}:${Math.floor(now.getMinutes() / 15)}`;

      // Skip if we already triggered for this 15-min window
      if (lastTriggeredRef.current === eventKey) return;

      const schedule = state.dailySchedule;

      // Wake up time
      if (isNearTime(schedule.wakeTime, 5) && state.activity !== "waking_up") {
        lastTriggeredRef.current = eventKey;
        triggerWakeUp();
        return;
      }

      // Breakfast
      if (isNearTime(schedule.breakfastTime, 10) && state.activity !== "eating_breakfast") {
        lastTriggeredRef.current = eventKey;
        triggerMeal("breakfast");
        return;
      }

      // Lunch
      if (isNearTime(schedule.lunchTime, 10) && state.activity !== "eating_lunch") {
        lastTriggeredRef.current = eventKey;
        triggerMeal("lunch");
        return;
      }

      // Dinner
      if (isNearTime(schedule.dinnerTime, 10) && state.activity !== "eating_dinner") {
        lastTriggeredRef.current = eventKey;
        triggerMeal("dinner");
        return;
      }

      // Workout
      if (isNearTime(schedule.workoutTime, 10) && state.activity !== "working_out") {
        lastTriggeredRef.current = eventKey;
        triggerWorkout();
        return;
      }

      // Sleep
      if (isNearTime(schedule.sleepTime, 15) && state.activity !== "sleeping") {
        lastTriggeredRef.current = eventKey;
        triggerSleep();
        return;
      }
    }, 30_000); // Check every 30 seconds

    return () => clearInterval(checkIntervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Scene triggers                                                   */
  /* ---------------------------------------------------------------- */

  const triggerWelcome = useCallback(() => {
    setWelcomePlaying(true);
    setSceneMode("welcome");
    setMood("happy");
    setActivity("greeting");
  }, [setWelcomePlaying, setSceneMode, setMood, setActivity]);

  const triggerWakeUp = useCallback(() => {
    setSceneMode("bedroom");
    setMood("sleep");
    setActivity("waking_up");
    setAlarmActive(true);
  }, [setSceneMode, setMood, setActivity, setAlarmActive]);

  const triggerMeal = useCallback((meal: "breakfast" | "lunch" | "dinner") => {
    setSceneMode("kitchen");
    setMood("hungry");
    setActivity(
      meal === "breakfast" ? "eating_breakfast" :
      meal === "lunch" ? "eating_lunch" : "eating_dinner"
    );

    // After 2s, switch to eating mood
    setTimeout(() => {
      const s = useCompanionStore.getState();
      if (s.activity?.startsWith("eating_")) {
        s.setMood("eating");
      }
    }, 2000);
  }, [setSceneMode, setMood, setActivity]);

  const triggerWorkout = useCallback(() => {
    setSceneMode("gym");
    setMood("exercise");
    setActivity("working_out");
  }, [setSceneMode, setMood, setActivity]);

  const triggerSleep = useCallback(() => {
    setSceneMode("bedroom");
    setMood("sleepy");
    setActivity("sleeping");

    // Transition: sleepy → yawning → sleep
    setTimeout(() => {
      const s = useCompanionStore.getState();
      if (s.activity === "sleeping") {
        s.setMood("yawning");
        setTimeout(() => {
          const s2 = useCompanionStore.getState();
          if (s2.activity === "sleeping") {
            s2.setMood("sleep");
          }
        }, 3000);
      }
    }, 2000);
  }, [setSceneMode, setMood, setActivity]);

  const resetToIdle = useCallback(() => {
    setSceneMode("none");
    setMood("idle");
    setActivity("none");
    setAlarmActive(false);
  }, [setSceneMode, setMood, setActivity, setAlarmActive]);

  return {
    triggerWelcome,
    triggerWakeUp,
    triggerMeal,
    triggerWorkout,
    triggerSleep,
    resetToIdle,
    getCurrentTimeContext,
  };
}

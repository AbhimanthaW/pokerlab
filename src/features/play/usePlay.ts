import { useEffect, useReducer } from "react";
import {
  applyAction,
  createSession,
  startHand,
  validateAction,
} from "../../domain/play/engine";
import { observeNpc } from "../../domain/play/observation";
import { chooseNpcAction, safeNpcAction } from "../../domain/play/policy";
import { assertSession } from "../../domain/play/invariants";
import type {
  Action,
  Pacing,
  Session,
  SessionConfig,
} from "../../domain/play/types";
import {
  loadPlayData,
  savePlayData,
  type PlayData,
} from "../../lib/playStorage";

type Command =
  | {
      type: "ACT";
      action: Action;
      revision: number;
      now: number;
      sessionId: string;
    }
  | { type: "START"; session: Session }
  | { type: "NEXT"; revision: number; session: Session; sessionId: string }
  | { type: "DISCARD" }
  | { type: "PACING"; pacing: Pacing }
  | { type: "ERROR"; message: string }
  | { type: "STORAGE"; message: string | undefined };
interface Controller extends PlayData {
  error?: string;
}
export function playReducer(state: Controller, command: Command): Controller {
  try {
    if (command.type === "STORAGE")
      return { ...state, warning: command.message };
    if (command.type === "ERROR") return { ...state, error: command.message };
    if (command.type === "PACING") return { ...state, pacing: command.pacing };
    if (command.type === "DISCARD")
      return { session: null, pacing: state.pacing };
    if (command.type === "START") {
      if (state.session) return state;
      assertSession(command.session);
      return { session: command.session, pacing: state.pacing };
    }
    if (
      !state.session ||
      command.revision !== state.session.revision ||
      command.sessionId !== state.session.id
    )
      return state;
    const session =
      command.type === "NEXT"
        ? command.session
        : applyAction(
            state.session,
            command.action,
            command.revision,
            command.now,
          );
    assertSession(session);
    return { ...state, session, error: undefined };
  } catch (e) {
    return {
      ...state,
      error:
        e instanceof Error
          ? e.message
          : "Unexpected engine error. Your last valid state has been retained.",
    };
  }
}
export function usePlay() {
  const [state, dispatch] = useReducer(playReducer, undefined, (): Controller =>
    loadPlayData(),
  );
  const { session, pacing, invalid } = state;
  useEffect(() => {
    if (invalid) return;
    const warning = savePlayData({ session, pacing });
    dispatch({ type: "STORAGE", message: warning });
  }, [session, pacing, invalid]);
  const s = state.session;
  useEffect(() => {
    if (
      !s ||
      s.status !== "hand_in_progress" ||
      !s.actor ||
      s.actor === "you" ||
      state.error
    )
      return;
    const observation = observeNpc(s, s.actor);
    const revision = s.revision;
    const timer = window.setTimeout(
      () => {
        try {
          let action = chooseNpcAction(observation);
          if (validateAction(s, action))
            action = safeNpcAction(observation, null);
          dispatch({
            type: "ACT",
            action,
            revision,
            now: Date.now(),
            sessionId: s!.id,
          });
        } catch (e) {
          dispatch({
            type: "ERROR",
            message:
              e instanceof Error
                ? e.message
                : "NPC action failed. Session paused.",
          });
        }
      },
      state.pacing === "instant" ? 0 : state.pacing === "relaxed" ? 1300 : 550,
    );
    return () => window.clearTimeout(timer);
  }, [s, state.pacing, state.error]);
  return {
    ...state,
    start: (config: SessionConfig) => {
      try {
        dispatch({ type: "START", session: startHand(createSession(config)) });
      } catch (e) {
        dispatch({
          type: "ERROR",
          message:
            e instanceof Error ? e.message : "Could not start a session.",
        });
      }
    },
    act: (action: Action, revision: number) =>
      dispatch({
        type: "ACT",
        action,
        revision,
        now: Date.now(),
        sessionId: s!.id,
      }),
    next: () => {
      if (s)
        try {
          dispatch({
            type: "NEXT",
            revision: s.revision,
            session: startHand(s),
            sessionId: s.id,
          });
        } catch (e) {
          dispatch({
            type: "ERROR",
            message: e instanceof Error ? e.message : "Cannot start next hand.",
          });
        }
    },
    discard: () => dispatch({ type: "DISCARD" }),
    setPacing: (pacing: Pacing) => dispatch({ type: "PACING", pacing }),
  };
}

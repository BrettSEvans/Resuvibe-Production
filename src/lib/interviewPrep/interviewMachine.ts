import type { InterviewState, InterviewEvent } from "./types";

/**
 * The interview state machine — ported from the standalone Interview Coach
 * reducer and extended for the Resuvibe integration with:
 *  - the retry-to-improve loop (RETRY_QUESTION vs NEXT_QUESTION after scoring),
 *  - INIT_FROM_SNAPSHOT for resuming an interrupted session from persisted turns.
 *
 * Components stay thin: they dispatch events and perform side effects (edge
 * function calls); all transitions live here and are unit-tested.
 */
export const initialState: InterviewState = {
  status: "initial",
  questions: [],
  currentIndex: 0,
  attempts: [],
  currentFeedback: null,
  awaitingChoice: false,
};

export function interviewReducer(
  state: InterviewState,
  event: InterviewEvent,
): InterviewState {
  switch (event.type) {
    case "START":
      return {
        ...initialState,
        status: "inProgress",
        questions: event.questions,
        currentIndex: 0,
      };

    case "ANSWER_SCORED":
      return {
        ...state,
        // Attach the scored feedback to the attempt so it can be revisited
        // later via the subway progress indicator.
        attempts: [
          ...state.attempts,
          { ...event.attempt, feedback: event.feedback },
        ],
        currentFeedback: event.feedback,
        awaitingChoice: true,
      };

    case "RETRY_QUESTION":
      // Stay on the same question; prior attempts are retained so the next
      // scoring call can be improvement-aware.
      return {
        ...state,
        awaitingChoice: false,
        currentFeedback: null,
      };

    case "NEXT_QUESTION": {
      const isLast = state.currentIndex >= state.questions.length - 1;
      if (isLast) {
        return { ...state, status: "complete", awaitingChoice: false, currentFeedback: null };
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        awaitingChoice: false,
        currentFeedback: null,
      };
    }

    case "JUMP_TO_QUESTION": {
      const target = event.index;
      if (
        target < 0 ||
        target >= state.questions.length ||
        target === state.currentIndex
      ) {
        return state;
      }
      // Only allow jumping to a question the user has already answered at
      // least once — the subway indicator only exposes those as links.
      const targetQuestionId = state.questions[target].id;
      const hasAttempt = state.attempts.some((a) => a.questionId === targetQuestionId);
      if (!hasAttempt) return state;
      // Enter review mode for the target question so the component renders
      // the prior answer + feedback (rather than an empty input state). The
      // component drives which specific attempt is currently being viewed.
      const priorAttempts = state.attempts.filter(
        (a) => a.questionId === targetQuestionId,
      );
      const latest = priorAttempts[priorAttempts.length - 1];
      return {
        ...state,
        currentIndex: target,
        awaitingChoice: true,
        currentFeedback: latest?.feedback ?? null,
      };
    }

    case "ERROR":
      return { ...state, status: "error", error: event.message };

    case "INIT_FROM_SNAPSHOT":
      return {
        ...initialState,
        status: "inProgress",
        questions: event.questions,
        attempts: event.attempts,
        currentIndex: event.currentIndex,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

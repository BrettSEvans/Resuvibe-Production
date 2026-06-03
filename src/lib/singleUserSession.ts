export interface SingleUserGenerationInput {
  companyUrl?: string;
  jobTitle: string;
  jobDescription: string;
  resumeText: string;
  coverLetterText?: string;
}

export interface SingleUserGenerationResult {
  id: string;
  companyName: string;
  jobTitle: string;
  resumeHtml: string;
  coverLetter: string;
  createdAt: string;
}

type Listener = () => void;

let result: SingleUserGenerationResult | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getSingleUserSessionResult() {
  return result;
}

export function setSingleUserSessionResult(nextResult: SingleUserGenerationResult) {
  result = nextResult;
  notify();
}

export function clearSingleUserSessionResult() {
  result = null;
  notify();
}

export function subscribeToSingleUserSession(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

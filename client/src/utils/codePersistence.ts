const CODE_KEY_PREFIX = 'cw-draft-problem';

export function getProblemCodeKey(problemId: string, languageId: number): string {
  return `${CODE_KEY_PREFIX}-${problemId}-${languageId}`;
}

export function loadProblemCode(problemId: string, languageId: number): string | null {
  return localStorage.getItem(getProblemCodeKey(problemId, languageId));
}

export function saveProblemCode(problemId: string, languageId: number, code: string): void {
  localStorage.setItem(getProblemCodeKey(problemId, languageId), code);
}

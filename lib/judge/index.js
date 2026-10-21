import { PistonProvider } from './piston.provider';
// Singleton judge provider — using Piston for code execution
let provider = null;
export function getJudgeProvider() {
    if (!provider) {
        provider = new PistonProvider();
    }
    return provider;
}

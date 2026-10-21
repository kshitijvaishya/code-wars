export interface ExecuteRequest {
    language: string;
    version: string;
    files: Array<{
        name?: string;
        content: string;
    }>;
    stdin?: string;
    args?: string[];
    compile_timeout?: number;
    run_timeout?: number;
}
export interface ExecuteResult {
    compile?: {
        stdout: string;
        stderr: string;
        code: number;
        output: string;
    };
    run: {
        stdout: string;
        stderr: string;
        code: number;
        output: string;
    };
    language: string;
    version: string;
}
export interface Runtime {
    language: string;
    version: string;
    aliases: string[];
}
export declare function executeCode(request: ExecuteRequest): Promise<ExecuteResult>;
export declare function getRuntimes(): Promise<Runtime[]>;
export declare const LANGUAGE_MAP: Record<string, {
    language: string;
    version: string;
}>;
export declare function getLanguageConfig(lang: string): {
    language: string;
    version: string;
};

import axios from 'axios';
const pistonClient = axios.create({
    baseURL: process.env.PISTON_BASE_URL || 'https://emkc.org/api/v2/piston',
    timeout: 15000,
    headers: process.env.PISTON_API_KEY ? {
        'Authorization': `Bearer ${process.env.PISTON_API_KEY}`
    } : {}
});
export async function executeCode(request) {
    try {
        const response = await pistonClient.post('/execute', request);
        return response.data;
    }
    catch (error) {
        console.error('Piston execution error:', error);
        throw new Error('Code execution failed');
    }
}
export async function getRuntimes() {
    try {
        const response = await pistonClient.get('/runtimes');
        return response.data;
    }
    catch (error) {
        console.error('Failed to fetch runtimes:', error);
        throw new Error('Failed to fetch available languages');
    }
}
// Language mappings
export const LANGUAGE_MAP = {
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'java': { language: 'java', version: '15.0.2' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'rust': { language: 'rust', version: '1.68.2' },
    'go': { language: 'go', version: '1.16.2' },
};
export function getLanguageConfig(lang) {
    const config = LANGUAGE_MAP[lang.toLowerCase()];
    if (!config) {
        throw new Error(`Unsupported language: ${lang}`);
    }
    return config;
}

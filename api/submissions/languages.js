import { sendSuccess, sendError } from '../../lib/utils/response';
import { getRuntimes } from '../../lib/judging/piston';
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const runtimes = await getRuntimes();
        // Filter to commonly used languages
        const supportedLanguages = [
            'python',
            'javascript',
            'typescript',
            'java',
            'cpp',
            'c',
            'go',
            'rust',
        ];
        const filtered = runtimes.filter(runtime => supportedLanguages.includes(runtime.language));
        return sendSuccess(res, filtered);
    }
    catch (error) {
        return sendError(res, error);
    }
}

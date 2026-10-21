import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import register from './api/auth/register';
import login from './api/auth/login';
import me from './api/auth/me';
import refresh from './api/auth/refresh';
import logout from './api/auth/logout';
import health from './api/health';
const handlers = {
    'POST /api/auth/register': register,
    'POST /api/auth/login': login,
    'GET /api/auth/me': me,
    'POST /api/auth/refresh': refresh,
    'POST /api/auth/logout': logout,
    'GET /api/health': health,
};
function readBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            raw += chunk;
            if (raw.length > 1000000)
                reject(new Error('Request body is too large'));
        });
        req.on('end', () => {
            if (!raw)
                return resolve({});
            try {
                resolve(JSON.parse(raw));
            }
            catch {
                reject(new Error('Request body must be valid JSON'));
            }
        });
        req.on('error', reject);
    });
}
function createResponse(res, requestId) {
    return {
        setHeader(name, value) {
            res.setHeader(name, value);
            return this;
        },
        status(statusCode) {
            res.statusCode = statusCode;
            return this;
        },
        json(payload) {
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('x-request-id', requestId);
            }
            res.end(JSON.stringify(payload));
            return this;
        },
        end() {
            res.end();
            return this;
        },
    };
}
export function serverlessApiPlugin() {
    return {
        name: 'code-wars-serverless-api',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url?.startsWith('/api/'))
                    return next();
                const url = new URL(req.url, 'http://localhost');
                const key = `${req.method ?? 'GET'} ${url.pathname}`;
                const handler = handlers[key];
                if (!handler)
                    return next();
                const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
                const startedAt = Date.now();
                try {
                    const body = await readBody(req);
                    const apiRequest = Object.assign(req, { body, query: Object.fromEntries(url.searchParams) });
                    await handler(apiRequest, createResponse(res, requestId));
                    if (res.statusCode >= 500) {
                        console.error(JSON.stringify({
                            requestId,
                            endpoint: url.pathname,
                            category: 'api-handler',
                            statusCode: res.statusCode,
                            durationMs: Date.now() - startedAt,
                        }));
                    }
                }
                catch (error) {
                    console.error(JSON.stringify({
                        requestId,
                        endpoint: url.pathname,
                        category: 'api-adapter',
                        stack: error instanceof Error ? error.stack : String(error),
                    }));
                    if (!res.headersSent) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        res.setHeader('x-request-id', requestId);
                        res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }));
                    }
                }
            });
        },
    };
}

import { connectDB } from '../lib/db/connection';
export default async function handler(req, res) {
    try {
        await connectDB();
        return res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    }
    catch (error) {
        return res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
}

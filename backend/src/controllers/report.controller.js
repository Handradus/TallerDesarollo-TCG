const { AppDataSource } = require('../data-source');
const Report = require('../entities/Report');
const MarketItem = require('../entities/MarketItem');

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.userId || req.user.id;
        const { marketItemId, reason, reportedUserId } = req.body;

        if (!reason || (!marketItemId && !reportedUserId)) {
            return res.status(400).json({ error: 'Debes proporcionar una razón y seleccionar qué reportar' });
        }

        const reportRepo = AppDataSource.getRepository(Report);
        const marketItemRepo = AppDataSource.getRepository(MarketItem);

        // Si es reporte de publicación
        if (marketItemId) {
            const marketItemRepo = AppDataSource.getRepository(MarketItem);
            const marketItem = await marketItemRepo.findOne({ where: { id: marketItemId, active: true } });
            if (!marketItem) return res.status(404).json({ error: 'Publicación no encontrada' });
            
            const existingReport = await reportRepo.findOne({ where: { reporterId, marketItemId } });
            if (existingReport) return res.status(400).json({ error: 'Ya has reportado esta publicación anteriormente.' });
        } else if (reportedUserId) {
            const existingReport = await reportRepo.findOne({ where: { reporterId, reportedUserId, status: 'pending' } });
            if (existingReport) return res.status(400).json({ error: 'Ya tienes un reporte pendiente para este usuario.' });
        }

        // Crear el nuevo reporte
        const report = reportRepo.create({
            reporterId,
            marketItemId: marketItemId || null,
            reportedUserId: reportedUserId || null,
            reason
        });

        await reportRepo.save(report);

        res.status(201).json({ success: true, message: 'Reporte enviado correctamente. Un administrador lo revisará.' });
    } catch (error) {
        console.error('Error al crear reporte:', error);
        // Manejar el error de clave única de TypeORM en caso de race condition
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya has reportado esta publicación.' });
        }
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const getPendingReports = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const reportRepo = AppDataSource.getRepository(Report);
        
        const reports = await reportRepo.find({
            where: { status: 'pending' },
            relations: ['reporter', 'marketItem', 'marketItem.user', 'marketItem.carta', 'reportedUser'],
            order: { createdAt: 'DESC' }
        });

        res.json(reports);
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const resolveReport = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { id } = req.params;
        const { action } = req.body; // 'ignore' or 'delete_post'

        const reportRepo = AppDataSource.getRepository(Report);
        const marketItemRepo = AppDataSource.getRepository(MarketItem);

        const report = await reportRepo.findOne({
            where: { id: parseInt(id) },
            relations: ['marketItem']
        });

        if (!report) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        if (action === 'delete_post') {
            if (report.marketItem) {
                await marketItemRepo.remove(report.marketItem);
            }
        }

        // We handle banning the user via auth.controller.js /api/auth/ban/:id
        // from the frontend, but we still mark the report as resolved here.
        
        report.status = 'resolved';
        await reportRepo.save(report);

        // Si eliminamos la publicación, eliminamos todos los reportes asociados a esa publicación
        if (action === 'delete_post' && report.marketItemId) {
            await reportRepo.delete({ marketItemId: report.marketItemId });
        }

        res.json({ success: true, message: 'Reporte resuelto correctamente' });
    } catch (error) {
        console.error('Error al resolver reporte:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    createReport,
    getPendingReports,
    resolveReport
};

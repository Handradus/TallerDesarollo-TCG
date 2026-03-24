const { AppDataSource } = require('../data-source');
const Report = require('../entities/Report');
const MarketItem = require('../entities/MarketItem');

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.id;
        const { marketItemId, reason } = req.body;

        if (!marketItemId || !reason) {
            return res.status(400).json({ error: 'El ID de la publicación y la razón son obligatorios' });
        }

        const reportRepo = AppDataSource.getRepository(Report);
        const marketItemRepo = AppDataSource.getRepository(MarketItem);

        // Verificar si la publicación existe y está activa
        const marketItem = await marketItemRepo.findOne({ where: { id: marketItemId, active: true } });
        if (!marketItem) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }

        // Verificar si el usuario ya reportó esta publicación
        const existingReport = await reportRepo.findOne({
            where: { reporterId, marketItemId }
        });

        if (existingReport) {
            return res.status(400).json({ error: 'Ya has reportado esta publicación anteriormente.' });
        }

        // Crear el nuevo reporte
        const report = reportRepo.create({
            reporterId,
            marketItemId,
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
            relations: ['reporter', 'marketItem', 'marketItem.user', 'marketItem.carta'],
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
                // Remove the market item entirely
                await marketItemRepo.remove(report.marketItem);
                
                // Note: The report itself might get deleted due to CASCADE,
                // but if not, we should mark it as resolved.
                // It will be deleted if ON DELETE CASCADE is working properly, 
                // but let's check if we still need to update status if it exists.
            }
        }

        if (action === 'ignore') {
            report.status = 'resolved';
            await reportRepo.save(report);
        }

        // Si eliminamos la publicación, eliminamos todos los reportes asociados a esa publicación
        // Esto está manejado automáticamente por ON DELETE CASCADE de TypeORM
        if (action === 'delete_post') {
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

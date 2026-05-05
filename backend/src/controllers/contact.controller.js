const { AppDataSource } = require('../data-source');
const Message = require('../entities/Message');
const User = require('../entities/User');

const submitContact = async (req, res) => {
    try {
        const { nombre, email, asunto, mensaje } = req.body;
        
        const userRepository = AppDataSource.getRepository(User);
        const messageRepository = AppDataSource.getRepository(Message);

        // Encontrar al primer admin para enviar el mensaje
        const admin = await userRepository.findOne({ where: { role: 'admin' } });
        if (!admin) {
            return res.status(500).json({ message: 'No admin user found to receive contact form.' });
        }

        const content = `🔔 Nuevo Formulario de Contacto 🔔\n\n**Nombre:** ${nombre}\n**Email:** ${email}\n**Asunto:** ${asunto}\n\n**Mensaje:**\n${mensaje}`;

        // Si el usuario está logueado, usar su id. Si no, usamos el del admin
        let senderId = admin.id;
        if (req.user && req.user.userId) {
            senderId = req.user.userId;
        }

        const msg = messageRepository.create({
            senderId: senderId,
            receiverId: admin.id,
            content: content,
            read: false
        });

        await messageRepository.save(msg);

        // Notificación en tiempo real al admin
        const io = req.app.get('socketio');
        if (io) {
            const unreadCount = await messageRepository.count({ where: { receiverId: admin.id, read: false } });
            io.to(`user_${admin.id}`).emit('notification', { type: 'message', unreadCount });
        }

        res.status(200).json({ message: 'Contacto enviado correctamente.' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = { submitContact };

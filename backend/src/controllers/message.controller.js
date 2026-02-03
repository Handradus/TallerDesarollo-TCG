const { AppDataSource } = require('../data-source');
const Message = require('../entities/Message');
const User = require('../entities/User');

const messageRepository = AppDataSource.getRepository(Message);
const userRepository = AppDataSource.getRepository(User);

const sendMessage = async (req, res) => {
    const { receiverId, content, marketItemId } = req.body;
    const senderId = req.user.userId;

    if (!receiverId || !content) {
        return res.status(400).json({ message: 'Receiver and content required' });
    }

    try {
        const msg = messageRepository.create({
            senderId,
            receiverId,
            content,
            marketItemId,
            read: false
        });
        await messageRepository.save(msg);

        // Socket.IO Notification
        const io = req.app.get('socketio');
        if (io) {
            // Send full message payload for chat real-time update
            // We need to fetch it with relations to be useful in frontend, or just send partial
            // Ideally fetch relations:
            const fullMsg = await messageRepository.findOne({
                where: { id: msg.id },
                relations: ['sender', 'receiver', 'marketItem', 'marketItem.carta']
            });

            // Map safe user info
            const safeMsg = {
                ...fullMsg,
                sender: { id: fullMsg.sender.id, name: fullMsg.sender.name, picture: fullMsg.sender.picture },
                receiver: { id: fullMsg.receiver.id, name: fullMsg.receiver.name, picture: fullMsg.receiver.picture }
            };

            io.to(`user_${receiverId}`).emit('receive_message', safeMsg);

            // Send unread count update for badge
            const unreadCount = await messageRepository.count({ where: { receiverId, read: false } });
            io.to(`user_${receiverId}`).emit('notification', { type: 'message', unreadCount });
        }

        res.json({ message: 'Message sent', msg });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getMyMessages = async (req, res) => {
    const userId = req.user.userId;
    try {
        // Fetch valid messages involving this user
        const messages = await messageRepository.find({
            where: [
                { senderId: userId },
                { receiverId: userId }
            ],
            relations: ['sender', 'receiver', 'marketItem', 'marketItem.carta'],
            order: { createdAt: 'DESC' }
        });

        // Map to safe user info
        const safeMessages = messages.map(msg => ({
            ...msg,
            sender: { id: msg.sender.id, name: msg.sender.name, picture: msg.sender.picture },
            receiver: { id: msg.receiver.id, name: msg.receiver.name, picture: msg.receiver.picture }
        }));

        res.json(safeMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const msg = await messageRepository.findOneBy({ id });
        if (!msg) return res.status(404).json({ message: 'Message not found' });

        if (msg.receiverId !== userId) return res.status(403).json({ message: 'Not your message' });

        msg.read = true;
        await messageRepository.save(msg);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
}

const getUnreadCount = async (req, res) => {
    const userId = req.user.userId;
    try {
        const count = await messageRepository.count({
            where: {
                receiverId: userId,
                read: false
            }
        });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Error' });
    }
}

module.exports = {
    sendMessage,
    getMyMessages,
    markAsRead,
    getUnreadCount
};

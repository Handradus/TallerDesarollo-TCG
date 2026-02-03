const { AppDataSource } = require('../data-source');
const UserCollection = require('../entities/UserCollection');
const Carta = require('../entities/Carta');

const collectionRepository = AppDataSource.getRepository(UserCollection);
const cartaRepository = AppDataSource.getRepository(Carta);

const { IsNull } = require('typeorm');

const addToCollection = async (req, res) => {
    const { cartaId, binderId } = req.body;
    const userId = req.user.userId;

    if (!cartaId) {
        return res.status(400).json({ message: 'Carta ID is required' });
    }

    try {
        const carta = await cartaRepository.findOneBy({ id: cartaId });
        if (!carta) return res.status(404).json({ message: 'Card not found' });

        // Search scope: if binderId is provided, look in that binder.
        // If no binderId, look for entries where customCollectionId is NULL (General collection)
        const whereClause = {
            userId,
            cartaId,
            customCollection: binderId ? { id: binderId } : IsNull()
        };

        let item = await collectionRepository.findOne({
            where: whereClause,
            relations: ['customCollection']
        });

        if (item) {
            item.quantity += 1;
        } else {
            item = collectionRepository.create({
                userId,
                cartaId,
                quantity: 1,
                customCollection: binderId ? { id: binderId } : null
            });
        }

        await collectionRepository.save(item);
        res.json({ message: 'Added to collection', item });
    } catch (error) {
        console.error('Error adding to collection:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const removeFromCollection = async (req, res) => {
    const { cartaId, binderId } = req.body;
    const userId = req.user.userId;

    try {
        const whereClause = {
            userId,
            cartaId,
            customCollection: binderId ? { id: binderId } : IsNull()
        };

        let item = await collectionRepository.findOne({
            where: whereClause
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found in collection' });
        }

        if (item.quantity > 1) {
            item.quantity -= 1;
            await collectionRepository.save(item);
        } else {
            await collectionRepository.remove(item);
        }

        res.json({ message: 'Removed from collection', item });
    } catch (error) {
        console.error('Error removing from collection:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCollection = async (req, res) => {
    const userId = req.user.userId;
    const { binderId } = req.query;

    try {
        const whereClause = { userId };
        if (binderId) {
            whereClause.customCollection = { id: binderId };
        }

        const collection = await collectionRepository.find({
            where: whereClause,
            relations: ['carta'],
            order: {
                carta: {
                    set: 'ASC',
                    numero: 'ASC'
                }
            }
        });

        // Group by Set manually if needed, or return flat list
        // Returning flat list with full card details
        const formatted = collection.map(item => ({
            ...item.carta,
            quantity: item.quantity,
            collectionId: item.id,
            addedAt: item.addedAt
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const CustomCollection = require('../entities/CustomCollection');
const binderRepository = AppDataSource.getRepository(CustomCollection);

const createBinder = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        const binder = binderRepository.create({
            name,
            userId
        });
        await binderRepository.save(binder);
        res.json(binder);
    } catch (error) {
        console.error('Error creating binder:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getBinders = async (req, res) => {
    const userId = req.user.userId;
    try {
        const binders = await binderRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
        res.json(binders);
    } catch (error) {
        console.error('Error fetching binders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    addToCollection,
    removeFromCollection,
    getCollection,
    createBinder,
    getBinders
};

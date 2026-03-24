const { AppDataSource } = require('../data-source');
const UserCollection = require('../entities/UserCollection');
const Carta = require('../entities/Carta');

const collectionRepository = AppDataSource.getRepository(UserCollection);
const cartaRepository = AppDataSource.getRepository(Carta);

const { IsNull } = require('typeorm');

const addToCollection = async (req, res) => {
    const { cartaId, binderId, isOwned = true, forceAdd = false, condition = 'NM', language = 'ES', foilType = 'Normal' } = req.body;
    const userId = req.user.userId;

    if (!cartaId) {
        return res.status(400).json({ message: 'Carta ID is required' });
    }

    try {
        const carta = await cartaRepository.findOneBy({ id: cartaId });
        if (!carta) return res.status(404).json({ message: 'Card not found' });

        // Check if ANY copy of this card exists in this binder (General duplicate check)
        if (isOwned && !forceAdd) {
            const duplicateCheck = await collectionRepository.findOne({
                where: {
                    userId,
                    cartaId,
                    customCollection: binderId ? { id: binderId } : IsNull()
                }
            });
            if (duplicateCheck) {
                return res.status(409).json({ error: 'Ya tienes esta carta en esta colección. ¿Deseas agregar otra copia?' });
            }
        }

        let item;
        // Search just to see if we are converting a "wanted" to "owned" 
        // We only care about finding a wanted version to convert if it exists.
        const wantedItem = await collectionRepository.findOne({
            where: {
                userId,
                cartaId,
                customCollection: binderId ? { id: binderId } : IsNull(),
                isOwned: false
            },
            relations: ['customCollection']
        });

        if (wantedItem && isOwned) {
            // Converting from wanted to owned
            wantedItem.isOwned = true;
            wantedItem.quantity = 1;
            wantedItem.condition = condition;
            wantedItem.language = language;
            wantedItem.foilType = foilType;
            item = wantedItem;
        } else {
            // Always create a new item stack for new owned cards
            item = collectionRepository.create({
                userId,
                cartaId,
                quantity: isOwned ? 1 : 0,
                isOwned: isOwned,
                customCollection: binderId ? { id: binderId } : null,
                condition,
                language,
                foilType
            });
        }

        await collectionRepository.save(item);
        res.json({ message: 'Collection updated', item });
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

        // Returning flat list with full card details
        const formatted = collection.map(item => ({
            ...item.carta,
            quantity: item.quantity,
            isOwned: item.isOwned,
            collectionId: item.id,
            addedAt: item.addedAt,
            condition: item.condition,
            language: item.language,
            foilType: item.foilType
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

const updateCollectionItem = async (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.id;
    const { condition, language, foilType } = req.body;

    try {
        const item = await collectionRepository.findOne({
            where: { id: itemId, userId },
            relations: ['customCollection']
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found in your collection' });
        }

        // Update current item in place WITHOUT merging
        if (condition) item.condition = condition;
        if (language) item.language = language;
        if (foilType) item.foilType = foilType;
        await collectionRepository.save(item);
        return res.json({ message: 'Item updated successfully', item });
    } catch (error) {
        console.error('Error updating collection item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    addToCollection,
    removeFromCollection,
    getCollection,
    createBinder,
    getBinders,
    updateCollectionItem
};

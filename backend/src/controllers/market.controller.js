const { AppDataSource } = require('../data-source');
const MarketItem = require('../entities/MarketItem');
const UserCollection = require('../entities/UserCollection');
const Carta = require('../entities/Carta');

const marketRepository = AppDataSource.getRepository(MarketItem);
const collectionRepository = AppDataSource.getRepository(UserCollection);

const fs = require('fs');
const path = require('path');

const listForSale = async (req, res) => {
    const { cartaId, price, description, quantity } = req.body;
    const userId = req.user.userId;
    const realImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!cartaId || !price) {
        return res.status(400).json({ message: 'Carta ID and Price are required' });
    }

    // Validar que el precio sea positivo
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ message: 'El precio debe ser un valor positivo' });
    }

    // Validar límite de palabras en la descripción (máximo 500 palabras)
    if (description) {
        const wordCount = description.trim().split(/\s+/).length;
        if (wordCount > 500) {
            return res.status(400).json({ 
                message: `La descripción excede el límite de 500 palabras (actual: ${wordCount} palabras)` 
            });
        }
    }

    try {
        // Check removed to allow selling without adding to collection first
        // const owned = await collectionRepository.findOne({ where: { userId, cartaId } });
        // if (!owned || owned.quantity < (quantity || 1)) {
        //     // Validation logic here
        // }

        const item = marketRepository.create({
            userId,
            cartaId,
            price: priceNum,
            description,
            quantity: quantity || 1,
            active: true,
            realImage: realImage, // Save path
            deliveryType: req.body.deliveryType || 'ambos',
            region: req.body.region || null
        });

        await marketRepository.save(item);
        res.json({ message: 'Listed for sale', item });
    } catch (error) {
        console.error('Error listing item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getMyListings = async (req, res) => {
    const userId = req.user.userId;
    try {
        const items = await marketRepository.find({
            where: { userId },
            relations: ['carta'],
            order: { createdAt: 'DESC' }
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching my listings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getListingsByCarta = async (req, res) => {
    try {
        const { cartaId } = req.params;

        if (!cartaId) {
            return res.status(400).json({ message: 'Carta ID is required' });
        }

        const items = await marketRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.carta', 'carta')
            .leftJoinAndSelect('item.user', 'user')
            .where('item.active = :active', { active: true })
            .andWhere('item.cartaId = :cartaId', { cartaId: Number(cartaId) })
            .orderBy('item.createdAt', 'DESC')
            .getMany();

        const safeItems = items.map(item => ({
            ...item,
            user: item.user ? {
                id: item.user.id,
                name: item.user.name,
                picture: item.user.picture
            } : null
        }));

        res.json(safeItems);
    } catch (error) {
        console.error('Error fetching market listings by carta:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const searchMarket = async (req, res) => {
    try {
        const { query } = req.query;
        let whereClause = { active: true };

        const builder = marketRepository.createQueryBuilder('item')
            .leftJoinAndSelect('item.carta', 'carta')
            .leftJoinAndSelect('item.user', 'user')
            .where('item.active = :active', { active: true });

        if (query) {
            builder.andWhere('carta.nombre ILIKE :query', { query: `%${query}%` });
        }

        const items = await builder.orderBy('item.createdAt', 'DESC').getMany();

        const safeItems = items.map(item => ({
            ...item,
            user: {
                id: item.user.id,
                name: item.user.name,
                picture: item.user.picture
            }
        }));

        res.json(safeItems);
    } catch (error) {
        console.error('Error searching market:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteResult = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const item = await marketRepository.findOneBy({ id });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (item.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Delete image if exists
        if (item.realImage) {
            const imagePath = path.join(__dirname, '../public', item.realImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await marketRepository.remove(item);
        res.json({ message: 'Item removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing item' });
    }
}

module.exports = {
    listForSale,
    getMyListings,
    getListingsByCarta,
    searchMarket,
    deleteResult // renamed from removeListing to avoid collision if needed
};

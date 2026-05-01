const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'DailyCardScraping',
  tableName: 'daily_card_scrapings',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    userId: {
      type: 'int',
    },
    cartaId: {
      type: 'int',
    },
    day: {
      type: 'varchar',
      length: 10,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'IDX_daily_card_scraping_user_card_day_unique',
      columns: ['userId', 'cartaId', 'day'],
      unique: true,
    },
  ],
});

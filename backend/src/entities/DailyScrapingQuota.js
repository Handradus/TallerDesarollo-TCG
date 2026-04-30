const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'DailyScrapingQuota',
  tableName: 'daily_scraping_quotas',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    userId: {
      type: 'int',
    },
    day: {
      type: 'varchar',
      length: 10,
    },
    scrapingCount: {
      type: 'int',
      default: 0,
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
      name: 'IDX_daily_scraping_quota_user_day_unique',
      columns: ['userId', 'day'],
      unique: true,
    },
  ],
});

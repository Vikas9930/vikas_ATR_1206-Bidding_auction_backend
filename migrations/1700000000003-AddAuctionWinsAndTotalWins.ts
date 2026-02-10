import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddAuctionWinsAndTotalWins1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if totalWins column exists, add only if it doesn't
    const columnExists = await queryRunner.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'totalWins'`
    );
    
    if (columnExists[0].count === 0) {
      // Add totalWins column using raw SQL to avoid TypeORM caching issues
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`totalWins\` int NOT NULL DEFAULT 0`
      );
    }

    // Check if auction_wins table exists before creating
    const auctionWinsTableExists = await queryRunner.hasTable('auction_wins');
    
    if (!auctionWinsTableExists) {
      // Create auction_wins table
      await queryRunner.createTable(
        new Table({
          name: 'auction_wins',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'auctionId',
            type: 'varchar',
            length: '36',
            isUnique: true,
          },
          {
            name: 'winnerId',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'finalPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'endedAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

      // Add foreign keys
      await queryRunner.createForeignKey(
      'auction_wins',
      new TableForeignKey({
        columnNames: ['auctionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'auction_items',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'auction_wins',
      new TableForeignKey({
        columnNames: ['winnerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'auction_wins',
      new TableIndex({
        name: 'IDX_auction_wins_winnerId_endedAt',
        columnNames: ['winnerId', 'endedAt'],
      }),
    );

      await queryRunner.createIndex(
        'auction_wins',
        new TableIndex({
          name: 'IDX_auction_wins_auctionId',
          columnNames: ['auctionId'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('auction_wins', 'IDX_auction_wins_auctionId');
    await queryRunner.dropIndex('auction_wins', 'IDX_auction_wins_winnerId_endedAt');

    // Drop foreign keys
    const table = await queryRunner.getTable('auction_wins');
    const foreignKeys = table?.foreignKeys || [];
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('auction_wins', fk);
    }

    // Drop table
    await queryRunner.dropTable('auction_wins');

    // Drop column
    await queryRunner.dropColumn('users', 'totalWins');
  }
}


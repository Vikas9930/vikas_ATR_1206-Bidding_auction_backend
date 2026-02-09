import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
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

    // Create auction_items table
    await queryRunner.createTable(
      new Table({
        name: 'auction_items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'startingPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currentPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'sold', 'expired'],
            default: "'draft'",
          },
          {
            name: 'creatorId',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'winnerId',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'endsAt',
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

    // Create bids table
    await queryRunner.createTable(
      new Table({
        name: 'bids',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'bidderId',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'auctionItemId',
            type: 'varchar',
            length: '36',
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

    // Create foreign keys
    await queryRunner.createForeignKey(
      'auction_items',
      new TableForeignKey({
        columnNames: ['creatorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'auction_items',
      new TableForeignKey({
        columnNames: ['winnerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'bids',
      new TableForeignKey({
        columnNames: ['bidderId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bids',
      new TableForeignKey({
        columnNames: ['auctionItemId'],
        referencedTableName: 'auction_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'auction_items',
      new TableIndex({
        name: 'IDX_auction_items_status_endsAt',
        columnNames: ['status', 'endsAt'],
      }),
    );

    await queryRunner.createIndex(
      'auction_items',
      new TableIndex({
        name: 'IDX_auction_items_endsAt',
        columnNames: ['endsAt'],
      }),
    );

    await queryRunner.createIndex(
      'bids',
      new TableIndex({
        name: 'IDX_bids_auctionItemId_createdAt',
        columnNames: ['auctionItemId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bids', true);
    await queryRunner.dropTable('auction_items', true);
    await queryRunner.dropTable('users', true);
  }
}


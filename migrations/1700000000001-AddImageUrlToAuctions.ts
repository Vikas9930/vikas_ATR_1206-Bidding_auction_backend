import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImageUrlToAuctions1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'auction_items',
      new TableColumn({
        name: 'imageUrl',
        type: 'varchar',
        length: '1000',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('auction_items', 'imageUrl');
  }
}

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateImageUrlLength1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'auction_items',
      'imageUrl',
      new TableColumn({
        name: 'imageUrl',
        type: 'varchar',
        length: '1000',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'auction_items',
      'imageUrl',
      new TableColumn({
        name: 'imageUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }
}

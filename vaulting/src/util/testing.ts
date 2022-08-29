import { getConnection } from 'typeorm';

export async function clearDB() {
  const entities = getConnection().entityMetadatas;
  for (const entity of entities) {
    const repository = await getConnection().getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}

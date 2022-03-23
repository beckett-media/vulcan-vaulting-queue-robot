import { Entity, Index, Column, PrimaryColumn } from 'typeorm';

@Entity()
@Index(['collection', 'token_id'], { unique: true })
export class Vaulting {
  @PrimaryColumn()
  beckett_id: string;

  @Column()
  collection: string;

  @Column()
  token_id: number;
}

@Entity()
export class Token {
  @PrimaryColumn()
  collection: string;

  @PrimaryColumn()
  id: number;

  @Index()
  @Column()
  status: number;
}

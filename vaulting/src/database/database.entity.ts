import { Entity, Index, Column, PrimaryColumn, BeforeInsert } from 'typeorm';

@Entity()
@Index(['collection', 'token_id'], { unique: true })
export class Vaulting {
  @PrimaryColumn()
  beckett_id: string;

  @Column()
  collection: string;

  @Column()
  token_id: number;

  @BeforeInsert()
  toLowerCaseCollection() {
    this.collection = this.collection.toLowerCase();
  }
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

  @BeforeInsert()
  toLowerCaseCollection() {
    this.collection = this.collection.toLowerCase();
  }
}

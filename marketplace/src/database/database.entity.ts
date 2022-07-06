import {
  Entity,
  Index,
  Column,
  PrimaryColumn,
  BeforeInsert,
  PrimaryGeneratedColumn,
} from 'typeorm';

/*
Category as Comic, Card enum
Grading Company enum
Serial Number
Description as Title
Genre as Football, Baseball, Pokemon, World Series optional
Manufacturer optional
Year optional
Overall grade optional
Sub-grades optional
Autograph optional
Subject optional
Image, need to define formats/file size
*/

@Entity()
@Index(['user', 'item_id'], { unique: true })
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user: number;

  @Column()
  item_id: number;

  @Column()
  status: number;

  @Column()
  created_at: number;

  @Column()
  received_at: number;

  @Column()
  rejected_at: number;

  @Column()
  approved_at: number;
}

@Entity()
@Index(['uuid'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  //TODO: hard code cognito first
  @Column()
  source: string;

  @Column()
  created_at: number;
}

@Entity()
@Index(['uuid'], { unique: true })
@Index(['user'])
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  @Column()
  user: number;

  @Column()
  grading_company: string;

  @Column()
  serial_number: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  genre: string;

  @Column()
  manufacturer: string;

  @Column()
  year: number;

  @Column()
  overall_grade: string;

  @Column()
  sub_grades: string;

  @Column()
  autograph: string;

  @Column()
  subject: string;

  @Column()
  submission_image: string;

  @Column()
  nft_image: string;
}

@Entity()
@Index(['user'])
@Index(['item_id'], { unique: true })
@Index(['collection', 'token_id'], { unique: true })
export class Vaulting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  item_id: number;

  @Column()
  user: number;

  @Column()
  mint_job_id: number;

  @Column()
  burn_job_id: number;

  @Column()
  collection: string;

  @Column()
  token_id: number;

  @Column()
  status: number;

  @Column()
  last_updated: number;

  @Column()
  minted_at: number;

  @Column()
  burned_at: number;

  @BeforeInsert()
  toLowerCaseCollection() {
    this.collection = this.collection.toLowerCase();
  }
}

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
@Index(['user_id', 'item_id'], { unique: true })
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  item_id: number;

  @Column()
  status: number;

  @Column()
  created_at: number;

  @Column()
  received_at: number;

  @Column()
  minted_at: number;
}

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

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
  token_image: string;
}

// TODO: determine indexing strategy
@Entity()
@Index(['user_id'])
@Index(['submission_id'], { unique: true })
@Index(['item_id'], { unique: true })
@Index(['collection', 'token_id'], { unique: true })
export class Vaulting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  item_id: number;

  @Column()
  user_id: number;

  @Column()
  submission_id: number;

  @Column()
  collection: string;

  @Column()
  token_id: number;

  @BeforeInsert()
  toLowerCaseCollection() {
    this.collection = this.collection.toLowerCase();
  }
}

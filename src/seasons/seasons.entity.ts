import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'SEASONS' })
export class SeasonsEntity {
  @PrimaryGeneratedColumn()
  SEASON_NO: number;

  @Column()
  SEASON_BGN_DT: Date;

  @Column()
  SEASON_END_DT: Date;
}
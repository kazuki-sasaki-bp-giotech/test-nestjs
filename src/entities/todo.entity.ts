import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('todos')
export class Todo {
  @ApiProperty({ description: 'TODO ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'タイトル', example: '買い物に行く' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: '説明',
    example: 'スーパーで野菜を買う',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '完了状態', example: false, default: false })
  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @ApiProperty({ description: '作成日時' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

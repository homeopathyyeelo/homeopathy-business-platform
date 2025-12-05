import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('gmb_posts')
export class GmbPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'gmb_account_id' })
    accountId: string;

    @Column()
    title: string;

    @Column('text')
    content: string;

    @Column({ default: 'DRAFT' })
    status: string; // DRAFT, PUBLISHING, PUBLISHED, FAILED

    @Column({ name: 'scheduled_for', nullable: true })
    scheduledFor: Date;

    @Column({ name: 'published_at', nullable: true })
    publishedAt: Date;

    @Column({ name: 'post_url', nullable: true })
    postUrl: string;

    @Column({ name: 'error_message', nullable: true, type: 'text' })
    errorMessage: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

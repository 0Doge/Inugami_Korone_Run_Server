import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    Name: string;

    @Column()
    Password: string;
    @Column()
    Salt: string;

    @Column({ type: 'json', nullable: true })
    tokens: any;


}

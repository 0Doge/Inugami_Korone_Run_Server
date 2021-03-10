import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class GameScore {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    Name: string;

    @Column()
    Score: number;



}

import "reflect-metadata";
import * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import * as jwt from 'jsonwebtoken';
import { createConnection } from "typeorm";
import { User } from "./entity/User";
import { GameScore } from "./entity/GameScore";
import { Request, Response } from 'express';

const app = express();

const port = 3000;

const SECRET = 'doogdoogwoofwoof';

let _conn;
async function getConnection() {
    if (!_conn) {
        _conn = await createConnection();
    }
    return _conn;
}



app.use(express.json());

app.post('/user/register', async (req: Request, res: Response) => {
    const body = req.body;
    const connection = await getConnection();
    let dbUser = await connection.manager.findOne(User, { Name: body.Name });

    //console.log(dbUser);

    if (!dbUser) {
        dbUser = new User();
       // console.log(body.name);

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(body.Password, salt);

        dbUser.Name = body.Name;
        dbUser.Password = hash;
        dbUser.Salt = salt;

        await connection.manager.save(dbUser);

        const token = jwt.sign({ id: dbUser.id.toString(),Name: dbUser.Name}, SECRET,{ expiresIn: '1 day' });
        if (!dbUser.tokens) {
            dbUser.tokens = []
        }
        dbUser.tokens.push(token);
        await connection.manager.save(dbUser);

        return res.status(201).send(token);
    }
    else {
        return res.status(409).end();
    }
});

app.post('/user/login', async (req, res) => {
    const body = req.body;
    const connection = await getConnection();
    const dbUser = await connection.manager.findOne(User, { Name: body.Name });

    //console.log(dbUser);

    const pwdhash = await bcrypt.hash(body.Password, dbUser.Salt);
    //console.log(pwdhash);
    if (!dbUser) {
        res.status(401);
    }
    else if (dbUser.Password === pwdhash) {
        const token = jwt.sign({ id: dbUser.id.toString(),Name: dbUser.Name}, SECRET,{ expiresIn: '1 day' });
        dbUser.tokens.push(token);
        await connection.manager.save(dbUser);

        res.status(200).send(token);
   
    }
    else {
        res.status(401);
    }
    res.end();
});


app.post('/user/pushscore', async (req, res) => {
    const token=req.header('Authorization').replace('Bearer ', '');
    const body = req.body;
    const connection = await getConnection();



    try{
        const decoded = jwt.verify(token, SECRET);
        if(moment().valueOf()<decoded.exp){
            throw new Error();
        }
        //console.log(decoded.exp,moment().valueOf());
        

        let Score=new GameScore();
        Score.Name=decoded.Name;
        Score.Score=body.Score;    
        await connection.manager.save(Score);
    
    
        const GS = await connection.getRepository(GameScore)
      .createQueryBuilder("GameScore")
      .orderBy("GameScore.Name", "DESC")
      .addOrderBy("GameScore.Score","ASC")
      .limit(10)
      .getMany();
    
    
      let GS2: any=[];
        GS.forEach( (GS)=> {
            GS2.push({ Name:GS.Name, Score: GS.Score});
        });
    
    
        res.status(200).send(GS2);
    }

    catch(err){
        res.status(401).send({ error: 'Please authenticate.' })
    }
  

    //console.log(user, decoded.id, token );




    res.end();
});





app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
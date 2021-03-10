import "reflect-metadata";
import * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createConnection } from "typeorm";
import { User } from "./entity/User";
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
    let dbUser = await connection.manager.findOne(User, { Name: body.name });

    //console.log(dbUser);

    if (!dbUser) {
        dbUser = new User();
       // console.log(body.name);

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(body.Password, salt);

        dbUser.Name = body.name;
        dbUser.Password = hash;
        dbUser.Salt = salt;

        await connection.manager.save(dbUser);

        const token = jwt.sign({ id: dbUser.id.toString() }, SECRET,{ expiresIn: '1 day' });
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

app.post('/user/loing', async (req, res) => {
    const body = req.body;
    const connection = await getConnection();
    const dbUser = await connection.manager.findOne(User, { Name: body.name });


    //console.log(dbUser);

    const pwdhash = await bcrypt.hash(body.Password, dbUser.Salt);
    //console.log(pwdhash);
    if (!dbUser) {
        res.status(401);
    }
    else if (dbUser.Password === pwdhash) {
        res.status(200).send(dbUser.tokens);
    }
    else {
        res.status(401);
    }
    res.end();
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
import { Client } from 'pg';

 const client = new Client({
 user: 'kirill',
 host: 'localhost',
 database: 'wetherdb',
 password: '77889912',
 port: 5432,
 });

 client.connect();
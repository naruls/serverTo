import express from 'express';
import pg from 'pg';
import fetch from 'node-fetch';
import cors from 'cors';
import _ from 'lodash'; /*необходимая для merge библиотека*/
import fs from 'fs';

var objDataTo = {};
var objEndOp = {};
var objEndData = {};

const app = express();

var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    methods: "GET",
}

const client = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'wether_test',
    password: '77889912',
    port: 5432,
});

client.connect();

app.use(cors(corsOptions));

const { PORT = 3000 } = process.env;

const osinovaiRosFirsPointTomorrow = "https://api.tomorrow.io/v4/timelines?location=60.108884,30.262840&fields=temperature,precipitationIntensity,precipitationType,windSpeed,windGust,windDirection,temperatureApparent&timesteps=1h&units=metric&timezone=Europe/Moscow&apikey=3JBsocTjXabI9MkbPByqznkWNRJ5iZ4D";
const osinovaiRosFirsPointOpenweter = "https://api.openweathermap.org/data/2.5/weather?lat=60.108884&lon=30.262840&lang=fr&appid=c48b10ff7d42501ae1d7246b3fbed3e1";


app.use(express.json());

function fetchDataOpenweathermap(link){
  fetch(link)
    .then(res => res.json())
    .then(json => {
      objEndOp = { temper: json.main.temp, wind: json.wind.speed };
        console.log(json);
        const query = `
          INSERT INTO openwether (temp, wind)
          VALUES ($1, $2) returning *
        `;
        client.query(query, [json.main.temp, json.wind.speed], (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log('Data insert successful');
          client.end();
        });
      })
      .catch(err =>{
        console.log(err);
      })

}

/*Функция, для tomorrow api*/
/*Функция, что объединяет tomorrow api и openwether, а также сохроняет в objEndData результаты таблицы итоговых значений*/


let timerId = setInterval(() => fetchDataOpenweathermap(osinovaiRosFirsPointOpenweter), 3000);



app.get('/objEndData', (request, response) => {
    response.send(objEndData);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

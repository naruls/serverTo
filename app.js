import express from 'express';
import pg from 'pg';
import fetch from 'node-fetch';
import cors from 'cors';
import _ from 'lodash'; /*необходимая для merge библиотека*/
import fs from 'fs';

const app = express();

const options = {
  origin: [
    'http://localhost:3000',
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'origin', 'Authorization', 'Accept'],
  credentials: true,
};

const client = new pg.Client({
    user: 'postgres',
    host: '172.16.117.193',
    database: 'Wether_test',
    password: '1234',
    port: 5432,
});

client.connect();

app.use(cors(options));

const { PORT = 3002 } = process.env;

const cordHibin = {
  lat: 67.670036,
  lon: 33.687525,
};

const osinovaiRosFirsPointTomorrow = "https://api.tomorrow.io/v4/timelines?location=67.670036,33.687525&fields=temperature,windSpeed,windGust,windDirection,pressureSeaLevel,humidity&timesteps=current&units=metric&timezone=Europe/Moscow&apikey=sCUblc1wePiFH49ZtaUla6zoB0N62pCv";


app.use(express.json());

function fetchDataTomorroyApi(link) {
  fetch(link)
    .then(res => res.json())
    .then(json => {
        console.log(json.data.timelines[0].intervals[0].values);
        const query = `
          INSERT INTO in_tomorrowapi (temperature, humidity, pressure, windSpeed, windDirection, windGust, time)
          VALUES ($1, $2, $3, $4, $5, $6, $7) returning *
        `;
        client.query(query, [json.data.timelines[0].intervals[0].values.temperature, json.data.timelines[0].intervals[0].values.humidity,
          json.data.timelines[0].intervals[0].values.pressureSeaLevel, json.data.timelines[0].intervals[0].values.windSpeed,
          json.data.timelines[0].intervals[0].values.windDirection, json.data.timelines[0].intervals[0].values.windGust,
          json.data.timelines[0].intervals[0].startTime], (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log('Data insert successful');
        });
      })
    .catch(err =>{
      console.log(err);
    })

}

function endFuction(linkTomorrow) {
  fetchDataTomorroyApi(linkTomorrow);
}


let timerId = setInterval(() => endFuction(osinovaiRosFirsPointTomorrow), 600000);


app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

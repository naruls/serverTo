import express from 'express';
import pg from 'pg';
import fetch from 'node-fetch';
import cors from 'cors';
import _ from 'lodash'; /*необходимая для merge библиотека*/
import fs from 'fs';
import moment from 'moment';

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

const { PORT = 3003 } = process.env;

const cordHibin = {
  lat: 67.670036,
  lon: 33.687525,
};

const getTimelineURL = "https://api.tomorrow.io/v4/timelines";

// get your key from app.tomorrow.io/development/keys
const apikey = "sCUblc1wePiFH49ZtaUla6zoB0N62pCv";

// pick the location, as a latlong pair
let location = [67.670036, 33.687525];

// list the fields
const fields = [
"temperature",
"windSpeed",
"windGust",
"windDirection",
"pressureSeaLevel",
"humidity",
"precipitationIntensity",
"precipitationProbability",
"precipitationType",
"rainAccumulation",
"snowAccumulation",
"iceAccumulation",
];

// choose the unit system, either metric or imperial
const units = "metric";

// set the timesteps, like "current", "1h" and "1d"
const timesteps = ["1h"];

// configure the time frame up to 6 hours back and 15 days out
const now = moment.utc();
const startTime = moment.utc(now).subtract(6, "hours").toISOString();
const endTime = moment.utc(now).add(6, "hours").toISOString();

// specify the timezone, using standard IANA timezone format
const timezone = "Europe/Moscow";

// request the timelines with all the query string parameters as options
const getTimelineParameters =  queryString.stringify({
    apikey,
    location,
    fields,
    units,
    timesteps,
    startTime,
    endTime,
    timezone,
}, {arrayFormat: "comma"});


app.use(express.json());

function fetchDataTomorroyApi() {
  fetch(getTimelineURL + "?" + getTimelineParameters)
    .then(res => res.json())
    .then(json => {
        console.log(json.data.timelines[0].intervals[0].values);
        const query = `
          INSERT INTO in_tomorrowapidata (temperature, humidity, pressure, windspeed, winddirection,
          windgust, precipitationintensity1h, precipitationintensity3h, precipitationintensity6h,
          precipitationprobability, precipitationtype, rainaccumulation1h, rainaccumulation3h, rainaccumulation6h,
          snowaccumulation1h, snowaccumulation3h, snowaccumulation6h, iceaccumulation1h, iceaccumulation3h, iceaccumulation6h, time)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) returning *
        `;
        client.query(query, [json.data.timelines[0].intervals[6].values.temperature,
       json.data.timelines[0].intervals[6].values.humidity,
        json.data.timelines[0].intervals[6].values.pressureSeaLevel,
         json.data.timelines[0].intervals[6].values.windSpeed,
          json.data.timelines[0].intervals[6].values.windDirection,
           json.data.timelines[0].intervals[6].values.windGust,
          json.data.timelines[0].intervals[6].values.precipitationIntensity,
          (json.data.timelines[0].intervals[5].values.precipitationIntensity+json.data.timelines[0].intervals[4].values.precipitationIntensity+json.data.timelines[0].intervals[3].values.precipitationIntensity),
          (json.data.timelines[0].intervals[5].values.precipitationIntensity+json.data.timelines[0].intervals[4].values.precipitationIntensity+json.data.timelines[0].intervals[3].values.precipitationIntensity+json.data.timelines[0].intervals[2].values.precipitationIntensity+json.data.timelines[0].intervals[1].values.precipitationIntensity+json.data.timelines[0].intervals[0].values.precipitationIntensity),
          json.data.timelines[0].intervals[6].values.precipitationProbability,
          json.data.timelines[0].intervals[6].values.precipitationType,
          json.data.timelines[0].intervals[6].values.rainAccumulation,
          (json.data.timelines[0].intervals[5].values.rainAccumulation+json.data.timelines[0].intervals[4].values.rainAccumulation+json.data.timelines[0].intervals[3].values.rainAccumulation),
          (json.data.timelines[0].intervals[5].values.rainAccumulation+json.data.timelines[0].intervals[4].values.rainAccumulation+json.data.timelines[0].intervals[3].values.rainAccumulation+json.data.timelines[0].intervals[2].values.rainAccumulation+json.data.timelines[0].intervals[1].values.rainAccumulation+json.data.timelines[0].intervals[0].values.rainAccumulation),
          json.data.timelines[0].intervals[6].values.snowAccumulation,
          (json.data.timelines[0].intervals[5].values.snowAccumulation+json.data.timelines[0].intervals[4].values.snowAccumulation+json.data.timelines[0].intervals[3].values.snowAccumulation),
          (json.data.timelines[0].intervals[5].values.snowAccumulation+json.data.timelines[0].intervals[4].values.snowAccumulation+json.data.timelines[0].intervals[3].values.snowAccumulation+json.data.timelines[0].intervals[2].values.snowAccumulation+json.data.timelines[0].intervals[1].values.snowAccumulation+json.data.timelines[0].intervals[0].values.snowAccumulation),
          json.data.timelines[0].intervals[6].values.iceAccumulation,
          (json.data.timelines[0].intervals[5].values.iceAccumulation+json.data.timelines[0].intervals[4].values.iceAccumulation+json.data.timelines[0].intervals[3].values.iceAccumulation),
          (json.data.timelines[0].intervals[5].values.iceAccumulation+json.data.timelines[0].intervals[4].values.iceAccumulation+json.data.timelines[0].intervals[3].values.iceAccumulation+json.data.timelines[0].intervals[2].values.iceAccumulation+json.data.timelines[0].intervals[1].values.iceAccumulation+json.data.timelines[0].intervals[0].values.iceAccumulation),
          now], (err, res) => {
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

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

const osinovaiRosFirsPointTomorrow = "https://api.tomorrow.io/v4/timelines?location=60.108884,30.262840&fields=temperature,precipitationIntensity,precipitationType,windSpeed,windGust,windDirection,temperatureApparent&timesteps=current&units=metric&timezone=Europe/Moscow&apikey=sCUblc1wePiFH49ZtaUla6zoB0N62pCv";
const osinovaiRosFirsPointOpenweter = "https://api.openweathermap.org/data/2.5/weather?lat=60.108884&lon=30.262840&lang=fr&appid=6264921aac158477ee4f86c2486e4f38";


app.use(express.json());

function fetchDataOpenweathermap(link){
  fetch(link)
    .then(res => res.json())
    .then(json => {
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
        });
      })
      .catch(err =>{
        console.log(err);
      })

}


function fetchDataTomorroyApi(link) {
  fetch(link)
    .then(res => res.json())
    .then(json => {
        console.log(json.data.timelines[0].intervals[0].values);
        const query = `
          INSERT INTO tomorrowapi (temp, wind)
          VALUES ($1, $2) returning *
        `;
        client.query(query, [json.data.timelines[0].intervals[0].values.temperature, json.data.timelines[0].intervals[0].values.windSpeed], (err, res) => {
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

function script(){
  const query = `
  SELECT temp,wind FROM openwether WHERE id=(select max(id) from openwether)
`;
  client.query(query, (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    objDataTo = { tempEnd: res.rows[0].temp};
    console.log(res.rows[0].temp);
    fs.writeFile('data.txt', JSON.stringify({tempEnd: res.rows[0].temp}), (err) => {
        if(err) throw err;
        console.log('Data has been replaced!');
    });
  });
  const query2 = `
  SELECT temp,wind FROM tomorrowapi WHERE id=(select max(id) from tomorrowapi)
`;
  client.query(query2, (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    objEndOp = { windEnd: res.rows[0].wind };
    console.log(res.rows[0].wind);
    fs.appendFile('data.txt', JSON.stringify({windEnd: res.rows[0].wind}), (err) => {
        if(err) throw err;
        console.log('Data has been replaced!');
    });
  });
  var objResult = _.merge(objEndOp, objDataTo);
  objEndData = objResult;
  console.log(objEndData);
}


function endFuction(linkOpen, linkTomorrow) {
  fetchDataOpenweathermap(linkOpen);
  fetchDataTomorroyApi(linkTomorrow);

  script();
  var textData = fs.readFileSync('data.txt','utf8');

  /*const query3 = `
    INSERT INTO endData (tempend, windend)
    VALUES ($1, $2) returning *
    `;
  client.query(query3, [kl.temp, op.wind], (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
      console.log('Data insert successful');
  });*/
}


let timerId = setInterval(() => endFuction(osinovaiRosFirsPointOpenweter, osinovaiRosFirsPointTomorrow), 10000);



app.get('/objEndData', (request, response) => {
    response.send(objEndData);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

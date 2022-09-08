import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { Counter } from 'k6/metrics';


export const options = {
  stages: [
  { duration: '5s', target: 5000 },
  ],

  gracefulStop: "5s",

};

export const requests = new Counter('http_reqs');

export default function () {
  //console.log('Random user: ', JSON.stringify(params));

  //const res = http.get(`http://192.168.20.150:8000/challenges?name=${encodeURIComponent(params.SummonerName)}&shard=${params.Region}`, params2);
  //const res = http.get(`http://192.168.110.33:31000/profile?name=${encodeURIComponent(params.SummonerName)}&shard=${params.Region}`, params2);
  //const res = http.get(`http://192.168.110.33:31000/profile?name=geozukunft&shard=euw1`, params2);
  //const res = http.post(`http://192.168.20.150:8002/update_profile`, JSON.stringify(params3), {headers: { 'Content-Type': 'application/json' },});
  //const res = http.get(`nload/602beaa33a5eef0921e1af12`, params2);
  const res = http.get('http://localhost:4000/cpuload')


  check(res, {
    'got 200': (r) => r.status === 200
  });

  check(res, {
    'got 404': (r) => r.status === 404
  });
  
  check(res, {
    'got 429': (r) => r.status === 429
  });

  check(res, {
    'got 504': (r) => r.status === 504
  });  
}
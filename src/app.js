const fs = require('fs');
const path = require('path');
const util = require('util')
const HyperExpress = require('hyper-express');
const app = new HyperExpress.Server();
const joi = require('joi');
const Unifi = require('node-unifi');
const RouterOSInterface = require('../lib/routerOS');
const PingInterface = require('../lib/ping');
const { log } = require('../lib/logger');

const ros = new RouterOSInterface(
  process.env.RouterOS_IP || '192.168.88.1',
  process.env.RouterOS_User || 'admin',
  process.env.RouterOS_Password || '',
);

const ping = new PingInterface();

const [Unifi_Url, Unifi_Port, Unifi_Email, Unifi_Password] = [process.env.Unifi_URL, process.env.Unifi_Port, process.env.Unifi_Email, process.env.Unifi_Password];

/* Input Schema */
const genCodeSchema = joi.object({
  duration: joi.number().min(1).max(7).required(),
  download: joi.number().min(1).max(50).required(),
  upload: joi.number().min(1).max(50).required(),
});

/* Server Static Files */
app.get('/', (req, res) => {
  res.header('Content-Type', 'text/html');
  res.send(fs.readFileSync(path.join(__dirname, '..', 'www-public', 'index.html')));
})

app.get('/js/*', (req, res) => {
  if (req.url.endsWith('.js')) { res.header('Content-Type', 'text/javascript'); } else { res.header('Content-Type', 'text/css'); }
  res.send(fs.readFileSync(path.join(__dirname, '..', 'www-public', req.url)));
})

app.get('/logo', (req, res) => {
  res.header('Content-Type', 'image/png');
  res.send(fs.readFileSync(path.join(__dirname, '..', 'www-public', 'logo.png')));
});

/* API */
app.get('/genCode', async (req, res) => {
  const value = await genCodeSchema.validateAsync(req.query);
  try {
    let unifi = new Unifi.Controller({ host: Unifi_Url, port: Unifi_Port, sslverify: false });
    const loginData = await unifi.login(Unifi_Email, Unifi_Password);
    log.info(`Logged into UNIFI Controller: ${loginData}`);
    const VoucherTime = await unifi.createVouchers(value.duration * (24 * 60), 1, 1, null, value.upload * 1000, value.download * 1000, null)
    const Voucher = await unifi.getVouchers(VoucherTime[0].create_time);
    await unifi.logout();
    unifi = null;
    res.header('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify(Voucher[0]));
  } catch (error) {
    throw new Error("UnifiError");
  }
});

app.get('/cpuload', (req, res) => {
  res.header('Content-Type', 'text/html');
  res.send("Hello");
});

app.ws('/realtime', {
  idle_timeout: 60
}, (ws) => {
  ws.on('message', (msg) => {
    //console.log(msg);
    const { com, payload } = JSON.parse(msg);
    // Subscribe to ROS Traffic
    /*
    {
      "com": "subscribe_rosTraffic",
      "payload": "Hello World"
    }
    */
    if (com === 'subscribe_rosTraffic') {
      ros.getInterfaceList().then((interfaces) => {
        const activeEthInterfaces = interfaces.filter((interface) => { return interface.running === 'true' && interface.type === 'ether' });
        for (let i = 0; i < activeEthInterfaces.length; i++) {
          ros.getInterfaceStats(activeEthInterfaces[i].name, ws).then((wasclosed) => {
            // true is returned once the connection was closed. If error occured, error is returned
            if (wasclosed === true) {
              log.info('rosTraffic: Connection closed');
            } else {
              log.error(wasclosed)
            }
          }).catch((error) => {
            log.error(error);
          });
        }
      }).catch((error) => {
        log.error(error);
      });
    }

    /*
    {
      "com": "subscribe_ping",
      "payload": "Hello World"
    }
    */
    if(com === 'subscribe_ping'){
      ping.ping(ws).then((wasclosed) => {
        // true is returned once the connection was closed. If error occured, error is returned
        if (wasclosed === true) {
          log.info('ping: Connection closed');
        } else {
          log.error(wasclosed)
        }
      }).catch((error) => {
        log.error(error);
      });
    }

    // Subscribe to Docker Stats
  });
  ws.on('open', () => log.info('WS: Connection opened'));
  ws.on('close', () => log.info('WS: Connection closed'));
});

/* Handlers */
app.set_error_handler((req, res, error) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  /* Returns 400 if the client didn´t provide all data/wrong data type*/
  if (error.name === "ValidationError") {
    statusCode = 400;
  }

  /* Returns 500 if there was a problem communicating to Unifi Controler*/
  if (error.name === "UnifiError") {
    statusCode = 500;
  }

  log.error(`[${statusCode}] ${req.method} "${req.url}" >> ${error.message}`);
  res.status(statusCode);
  res.json({
    message: error.message
  });
});

module.exports = app;
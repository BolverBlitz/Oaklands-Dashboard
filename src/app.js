const fs = require('fs');
const path = require('path');
const util = require('util')
const HyperExpress = require('hyper-express');
const app = new HyperExpress.Server();
const joi = require('joi');
const Unifi = require('node-unifi');
const { log } = require('../lib/logger');

const [Unifi_Url, Unifi_Port, Unifi_Email, Unifi_Password] = [process.env.Unifi_URL, process.env.Unifi_Port, process.env.Unifi_Email, process.env.Unifi_Password];

const unifi = new Unifi.Controller({ host: Unifi_Url, port: Unifi_Port, sslverify: false });

// Login into UNIFI Controller
(async () => {
  try {
    // LOGIN
    const loginData = await unifi.login(Unifi_Email, Unifi_Password);
    log.info(`Logged into UNIFI Controller: ${loginData}`);
  } catch (error) {
    console.log('ERROR: ' + error);
  }
})();

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

app.get('/logo', (req, res) => {
  res.header('Content-Type', 'image/png');
  res.send(fs.readFileSync(path.join(__dirname, '..', 'www-public', 'logo.png')));
});

/* API */
app.get('/genCode', async (req, res) => {
  const value = await genCodeSchema.validateAsync(req.query);
  try {
    const VoucherTime = await unifi.createVouchers(value.duration * (24 * 60), 1, 1, null, value.upload * 1000, value.download * 1000, null)
    const Voucher = await unifi.getVouchers(VoucherTime[0].create_time);
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

/* Handlers */
app.set_error_handler((req, res, error) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  /* Returns 400 if the client didn´t provide all data/wrong data type*/
  if (error.name === "ValidationError") {
    statusCode = 400;
  }

  /* Returns 500 if there was a problem communicating to Unifi Controler*/
  if(error.name === "UnifiError") {
    statusCode = 500;
  }

  log.error(`[${statusCode}] ${req.method} "${req.url}" >> ${error.message}`);
  res.status(statusCode);
  res.json({
    message: error.message
  });
});

module.exports = app;
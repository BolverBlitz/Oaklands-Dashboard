const fs = require('fs');
const path = require('path');
const HyperExpress = require('hyper-express');
const RouterOSInterface = require('@lib/routerOS');

const app = new HyperExpress.Server({
  fast_buffers: process.env.HE_FAST_BUFFERS == 'false' ? false : true || false,
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
const apiv1 = require('@api');
app.use('/api/v1', apiv1);

/* Handlers */
app.set_error_handler((req, res, error) => {
  let statusCode = error.status || 500;

  /* Returns 400 if the client didn´t provide all data/wrong data type*/
  if (error.name === "ValidationError") {
    statusCode = 400;
  }

  /* Returns 500 if there was a problem communicating to Unifi Controler*/
  if (error.name === "UnifiError") {
    statusCode = 500;
  }

  process.log.error(`[${statusCode}] ${req.method} "${req.url}" >> ${error.message}`);
  res.status(statusCode);
  res.json({
    message: error.message
  });
});

module.exports = app;
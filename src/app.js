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

const ros = new RouterOSInterface(
  process.env.RouterOS_IP || '192.168.88.1',
  process.env.RouterOS_User || 'admin',
  process.env.RouterOS_Password || '',
);

/* API */
const apiv1 = require('@api');
app.use('/api/v1', apiv1);
/*
{
  "com": "subscribe_rosTraffic",
  "payload": "Hello World"
}
*/
app.ws('/realtime', {
  idle_timeout: 60
}, (ws) => {
  ws.on('message', (msg) => {
    //console.process.log(msg);
    const { com, payload } = JSON.parse(msg);
    // Subscribe to ROS Traffic
    if (com === 'subscribe_rosTraffic') {
      ros.getInterfaceList().then((interfaces) => {
        const activeEthInterfaces = interfaces.filter((interface) => { return interface.running === 'true' && interface.type === 'ether' });
        for (let i = 0; i < activeEthInterfaces.length; i++) {
          ros.getInterfaceStats(activeEthInterfaces[i].name, ws).then((wasclosed) => {
            // true is returned once the connection was closed. If error occured, error is returned
            if (wasclosed === true) {
              process.log.info('rosTraffic: Connection closed');
            } else {
              process.log.error(wasclosed)
            }
          }).catch((error) => {
            process.log.error(error);
          });
        }
      }).catch((error) => {
        process.log.error(error);
      });
    }

    // Subscribe to Docker Stats
  });
  ws.on('open', () => process.log.info('WS: Connection opened'));
  ws.on('close', () => process.log.info('WS: Connection closed'));
});

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
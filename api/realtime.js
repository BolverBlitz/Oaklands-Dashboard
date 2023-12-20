const HyperExpress = require('hyper-express');
const { limiter } = require('@middleware/limiter');
const router = new HyperExpress.Router();
const RouterOSInterface = require('@lib/routerOS');

/* Plugin info*/
const PluginName = 'Realtime'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const ros = new RouterOSInterface(
    process.env.ROUTEROS_IP || '192.168.88.1',
    process.env.ROUTEROS_USER || 'admin',
    process.env.ROUTEROS_PASSWORD || '',
);
/*
{
  "com": "subscribe_rosTraffic",
  "payload": "Hello World"
}
*/
router.upgrade('/', async (req, res) => {
    res.upgrade(req)
});

router.ws('/', {
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

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};
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

const html = {
    imports: `./js/smoothie.js`,
    html: `<div class="flex-items"> <!-- Vertical Flex Item 1 - Logo --->
    <p style="color:rgb(255, 255, 255)">Network usage (in mbit/s):</p>
    <canvas id="chart" width="1200" height="400"></canvas>
  </div>`,
    js: `const ROS_global = {
        rosInterfaces: [], // Holds all interfaces brodcasted by ROS
        rosInterfacesData: {}, // Holds all interfaces data brodcasted by ROS
      }
    
      const rosChartColor = {
        "ether1_WAN - Upload": "rgba(255, 255, 255, 0.5)",
        "ether1_WAN - Download": "rgba(255, 255, 255, 1)",
        "ether10 - AP Annex - Upload": "rgba(255, 0, 0, 0.5)",
        "ether10 - AP Annex - Download": "rgba(255, 0, 0, 1)",
        "ether7 - Study - Upload": "rgba(255, 255, 0, 0.5)",
        "ether7 - Study - Download": "rgba(255, 255, 0, 1)",
        "ether8 - AP Sunroom - Upload": "rgba(249, 105, 14, 0.5)",
        "ether8 - AP Sunroom - Download": "rgba(249, 105, 14, 1)",
        "ether6 - RaspberyPI - Upload": "rgba(153, 50, 204, 0.5)",
        "ether6 - RaspberyPI - Download": "rgba(153, 50, 204, 1)",
        "ether9 - Upstairs - Upload": "rgba(0, 158, 255, 0.5)",
        "ether9 - Upstairs - Download": "rgba(0, 158, 255, 1)",
      }
    
      function replaceWAN(name) {
        if (name.toLowerCase().includes('wan')){
          return 'Internet';
        }
        return name;
      }
    
      // Find the canvas
      const canvas = document.getElementById('chart');
      // Create the chart
      const chart = new SmoothieChart({millisPerPixel:50, grid:{fillStyle:'transparent', strokeStyle:'rgba(119,119,119,0.20)'}, tooltip:true, tooltipLine:{strokeStyle:'#bbbbbb'}});
      chart.streamTo(canvas, 1100);
    
      let ws_protocol = "ws://";
      if (window.location.protocol === "https:") {
        ws_protocol = "wss://";
      }
      const ws = new WebSocket(\`\${ws_protocol}\${window.location.host}/api/v1/realtime\`);
    
      ws.onopen = function() {
        ws.send(JSON.stringify({"com": "subscribe_rosTraffic","payload": ""}));
      };
    
      ws.onmessage = function(event) {
        const { com, payload } = JSON.parse(event.data);
        switch (com) {
          case "traffic":
            if(!ROS_global.rosInterfaces.includes(payload.name)) {
              ROS_global.rosInterfaces.push(payload.name);
              const lineDOWN = new TimeSeries();
              const lineUP = new TimeSeries();
              ROS_global.rosInterfacesData[\`\${payload.name} - Download\`] = lineDOWN;
              ROS_global.rosInterfacesData[\`\${payload.name} - Upload\`] = lineUP;
              chart.addTimeSeries(ROS_global.rosInterfacesData[\`\${payload.name} - Download\`], { strokeStyle: rosChartColor[\`\${payload.name} - Download\`], tooltipLabel: \`D: \${replaceWAN(payload.name)}\` });
              chart.addTimeSeries(ROS_global.rosInterfacesData[\`\${payload.name} - Upload\`], { strokeStyle: rosChartColor[\`\${payload.name} - Upload\`], fillStyle:'rgba(0,0,0,0.10)', tooltipLabel: \`U: \${replaceWAN(payload.name)}\` });
    
              // Order the interfaces by alphabetical order but ignore first 3 chars in chart.seriesSet[0].options.tooltipLabe.
              // Put RaspberyPI and Ciaran at the end of the list
              // Put Internet at the top of the list
              chart.seriesSet.sort((a, b) => {
                if (a.options.tooltipLabel.substring(3) === 'Internet') {
                  return -1;
                }
                if (b.options.tooltipLabel.substring(3) === 'Internet') {
                  return 1;
                }
                if (a.options.tooltipLabel.substring(3) === 'RaspberyPI') {
                  return 1;
                }
                if (b.options.tooltipLabel.substring(3) === 'RaspberyPI') {
                  return -1;
                }
                if (a.options.tooltipLabel.substring(3) === 'Ciaran') {
                  return 1;
                }
                if (b.options.tooltipLabel.substring(3) === 'Ciaran') {
                  return -1;
                }
                return a.options.tooltipLabel.substring(3) > b.options.tooltipLabel.substring(3) ? 1 : -1;
              });
              
            }
            if(replaceWAN(payload.name) === 'Internet') {
              ROS_global.rosInterfacesData[\`\${payload.name} - Download\`].append(Date.now(), (Number(payload["rx-bits-per-second"]))/(1000*1000));
              ROS_global.rosInterfacesData[\`\${payload.name} - Upload\`].append(Date.now(), (Number(payload["tx-bits-per-second"]))/(1000*1000));
            } else {
              ROS_global.rosInterfacesData[\`\${payload.name} - Download\`].append(Date.now(), (Number(payload["tx-bits-per-second"]))/(1000*1000));
              ROS_global.rosInterfacesData[\`\${payload.name} - Upload\`].append(Date.now(), (Number(payload["rx-bits-per-second"]))/(1000*1000));
            }
    
            // Make sure the data array isn't getting to big
            if (ROS_global.rosInterfacesData[\`\${payload.name} - Download\`].data.length > 250) {
              ROS_global.rosInterfacesData[\`\${payload.name} - Download\`].data.shift();
              ROS_global.rosInterfacesData[\`\${payload.name} - Upload\`].data.shift();
            }
            
            break;
          default:
            console.log("Unknown message com: " + com);
            break;
        }
      };`
}

module.exports = {
    router: router,
    PluginHtml: html,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};
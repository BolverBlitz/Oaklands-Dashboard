const Joi = require('joi');
const HyperExpress = require('hyper-express');
const { InvalidRouteInput, UnifiError } = require('@lib/errors');
const Unifi = require('node-unifi');
const { limiter } = require('@middleware/limiter');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'Unifi'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

const [Unifi_Url, Unifi_Port, Unifi_Email, Unifi_Password] = [process.env.UNIFI_URL, process.env.UNIFI_PORT, process.env.UNIFI_EMAIL, process.env.UNIFI_PASSWORD];

/* Input Schema */
const genCodeSchema = Joi.object({
    duration: Joi.number().min(1).max(7).required(),
    download: Joi.number().min(1).max(50).required(),
    upload: Joi.number().min(1).max(50).required(),
});

router.get('/genCode', limiter(), async (req, res) => {
    const value = await genCodeSchema.validateAsync(req.query);
    if(!value) throw new InvalidRouteInput('Invalid Route Input');

    try {
        let unifi = new Unifi.Controller({ host: Unifi_Url, port: Unifi_Port, sslverify: false });
        process.log.info(`Connecting to UNIFI Controller: ${Unifi_Url}:${Unifi_Port}`);
        const loginData = await unifi.login(Unifi_Email, Unifi_Password);
        process.log.info(`Logged into UNIFI Controller: ${loginData}`);
        const VoucherTime = await unifi.createVouchers(value.duration * (24 * 60), 1, 1, null, value.upload * 1000, value.download * 1000, null)
        const Voucher = await unifi.getVouchers(VoucherTime[0].create_time);
        await unifi.logout();
        unifi = null;
        res.header('Content-Type', 'application/json');
        res.status(200);
        res.send(JSON.stringify(Voucher[0]));
    } catch (error) {
        console.log(error);
        throw new UnifiError(error);
    }
});

const html = {
    imports: ``,
    html: `<div class="flex-items"> <!-- Vertical Flex Item 3 - Unifi WiFi Code Form (Horizontal) --->
    <div class="flex-container2" style="margin-top: 20px;">
      <div class="flex-items"><button class="button" onclick="generateCode()" style="margin-right: 8px">Generate WiFi Code</button></div>
      <div class="flex-items">
        <select id="unifi_duration">
          <option disabled selected value style="display:none">Duration</option>
          <option value="1">1 Day</option>
          <option value="2">2 Days</option>
          <option value="3">3 Days</option>
          <option value="4">7 Days</option>
        </select>
      </div>
      <div class="flex-items">
        <select  id="unifi_download">
          <option disabled selected value style="display:none">Download Speed</option>
          <option value="8">8 Mbit/s</option>
          <option value="16">16 Mbit/s</option>
          <option value="50">50 Mbit/s</option>
        </select>
      </div>
      <div class="flex-items">
        <select id="unifi_upload">
          <option disabled selected value style="display:none">Upload Speed</option>
          <option value="2">2 Mbit/s</option>
          <option value="4">4 Mbit/s</option>
          <option value="10">10 Mbit/s</option>
          <option value="25">25 Mbit/s</option>
        </select>
      </div>
    </div>
  </div>
  <div style="margin-top: 8px; font-size: 32px; color: #04AA6D;" class="flex-items"> <!-- Vertical Flex Item 4 - Div where the WiFi Code will be displayed --->
    <a id="unifi_code_response"></a>
  </div>`,
    js: `// Generate the Unifi-Guest Code
    function generateCode() {
      const duration = document.getElementById("unifi_duration").value;
      const download = document.getElementById("unifi_download").value;
      const upload = document.getElementById("unifi_upload").value;
      const requestUrl = \`\${baseUrl}api/v1/unifi/genCode?duration=\${duration}&download=\${download}&upload=\${upload}\`;
  
      fetch(requestUrl)
          .then(response => {
            if (!response.ok) {
                // If the response is not ok, parse the JSON to get the error message
                return response.json().then(err => {
                  throw new Error(err.message || 'Unknown error');
                });
              }
          return response.json();
          })
          .then(data => {
          document.getElementById("unifi_code_response").innerHTML = data.code.substring(0, 5) + "-" + data.code.substring(5);
          })
          .catch(error => {
          if (error.message.includes('400')) {
              const element = error.message.split('"')[4].replace("\\\\",'')[0].toUpperCase() + error.message.split('"')[4].replace("\\\\",'').slice(1);
              document.getElementById("unifi_code_response").innerHTML = "Error: " + element + " " + error.message.split('"')[5];
          } else {
              document.getElementById("unifi_code_response").innerHTML = "Error: " + error.message;
          }
          });
      }`
}

module.exports = {
    router: router,
    PluginHtml: html,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};
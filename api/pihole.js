const HyperExpress = require('hyper-express');
const { limiter } = require('@middleware/limiter');
const router = new HyperExpress.Router();

const fs = require('fs');

/* Plugin info*/
const PluginName = 'PiHole'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

if (!fs.existsSync('./store/pihole.json')) {
    // Generate file and generate folder recursively
    fs.mkdirSync('./store', { recursive: true });
    fs.writeFileSync('./store/pihole.json', JSON.stringify({
        "disabled_until_timestamp": 0,
    }));
}

// API DOCS: https://discourse.pi-hole.net/t/pi-hole-api/1863

router.get('/', limiter(), async (req, res) => {
    res.status(200);
    res.json(JSON.parse(fs.readFileSync('./store/pihole.json', 'utf8')));
});

router.post('/disable', limiter(), async (req, res) => {
    res.header('Content-Type', 'application/json');

    const newTime = Date.now() + (process.env.PIHOLE_BLOCK_TIME * 60 * 1000)

    try {
        res.status(200);
        // Ifnore SSL errors
        await fetch(`${process.env.PIHOLE_URL}/admin/api.php?disable=${process.env.PIHOLE_BLOCK_TIME * 60 }&auth=${process.env.PIHOLE_API_TOKEN}`, {
            method: 'GET'
        });

        fs.writeFileSync('./store/pihole.json', JSON.stringify({
            "disabled_until_timestamp": newTime,
        }));

        res.json({
            "disabled_until_timestamp": newTime,
        });
    } catch (error) {
        process.log.error(error);
        res.status(500);
        res.json({
            "error": error,
        });
    }
});

const html = {
    imports: ``,
    html: `<div class="flex-items"> <!-- Vertical Flex Item 2 - Webpage List (Horizontal) --->
    <br>
    <div class="flex-container2">
    <div class="flex-items"><button class="blockButton" id="piholeblock" style="border:rgb(60, 59, 92); border-style: solid; border-width: thin;" onclick="requestPiHoleBlock()">PiHole</button></div>
  </div>
</div>`,
    js: `let countDownID = null;

    // Load current PiHole status when page is loaded
    window.onload = function() {
      fetch(baseUrl + "api/v1/pihole")
        .then(response => response.json())
        .then(data => {
          console.log(data);
          if (data.disabled_until_timestamp < Date.now()) {
            document.getElementById("piholeblock").innerHTML = "PiHole: Enabled";
          } else {
            // Make a countdown timer and make button light red
            document.getElementById("piholeblock").innerHTML = \`PiHole: Disabled for \$\{secondsToHms((data.disabled_until_timestamp - Date.now() )/1000)}\`;
            document.getElementById("piholeblock").style.backgroundColor = "#c43030";

            // Update timer every second
            countDownID = setInterval(() => {
              document.getElementById("piholeblock").innerHTML = \`PiHole: Disabled for \$\{secondsToHms((data.disabled_until_timestamp - Date.now() )/1000)}\`;
              if (data.disabled_until_timestamp < Date.now()) {
                clearInterval(countDownID);
                document.getElementById("piholeblock").innerHTML = "PiHole: Enabled";
                document.getElementById("piholeblock").style.backgroundColor = "#4CAF50";
              }
            }, 1000);
          }
        });
    }

    // Send POST request to PiHole API to block all ads
    const requestPiHoleBlock = () => {
      clearInterval(countDownID);
      fetch(baseUrl + "api/v1/pihole/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          if (data.disabled_until_timestamp < Date.now()) {
            document.getElementById("piholeblock").innerHTML = "PiHole: Enabled";
          } else {
            // Make a countdown timer and make button light red
            document.getElementById("piholeblock").innerHTML = \`PiHole: Disabled for \$\{secondsToHms((data.disabled_until_timestamp - Date.now() )/1000)}\`;
            document.getElementById("piholeblock").style.backgroundColor = "#c43030";

            // Update timer every second
            countDownID = setInterval(() => {
              document.getElementById("piholeblock").innerHTML = \`PiHole: Disabled for \$\{secondsToHms((data.disabled_until_timestamp - Date.now() )/1000)}\`;
              if (data.disabled_until_timestamp < Date.now()) {
                clearInterval(countDownID);
                document.getElementById("piholeblock").innerHTML = "PiHole: Enabled";
                document.getElementById("piholeblock").style.backgroundColor = "#4CAF50";
              }
            }, 1000);
          }
        });
    }

    // Function to convert seconds to human readable time
    const secondsToHms = (seconds) => {
      if (!seconds) return "0s";
    
      let duration = seconds;
      let hours = duration / 3600;
      duration = duration % (3600);
    
      let min = parseInt(duration / 60);
      duration = duration % (60);
    
      let sec = parseInt(duration);
    
      if (sec < 10) {
        sec = \`0\$\{sec}\`;
      }
      if (min < 10) {
        min = \`0\$\{min}\`;
      }
      if (parseInt(hours, 10) > 0) {
        return \`\$\{parseInt(hours, 10)}h \$\{min}m \$\{sec}s\`;
      } else if (min == 0) {
        return \`\$\{sec}s\`;
      } else {
        return \`\$\{min}m \$\{sec}s\`;
      }
    }`
}

module.exports = {
    router: router,
    PluginHtml: html,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};
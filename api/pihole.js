const HyperExpress = require('hyper-express');
const { limiter } = require('@middleware/limiter');
const router = new HyperExpress.Router();

/* Plugin info*/
const PluginName = 'PiHole'; //This plugins name
const PluginRequirements = []; //Put your Requirements and version here <Name, not file name>|Version
const PluginVersion = '0.0.1'; //This plugins version

// API DOCS: https://discourse.pi-hole.net/t/pi-hole-api/1863

router.get('/', limiter(), async (req, res) => {
    res.header('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify({}));
});

const html = {
    imports: ``,
    html: ``,
    js: ``
}

module.exports = {
    router: router,
    PluginHtml: html,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};
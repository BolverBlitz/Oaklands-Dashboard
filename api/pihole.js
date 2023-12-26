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
        console.log(`${process.env.PIHOLE_URL}/admin/api.php?disable=${process.env.PIHOLE_BLOCK_TIME * 60 }&auth=${process.env.PIHOLE_API_TOKEN}`)
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
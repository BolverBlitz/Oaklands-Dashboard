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

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
};
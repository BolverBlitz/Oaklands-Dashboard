require('dotenv').config();
require('module-alias/register')
const { log } = require('./lib/logger');

process.log = log;

const event = require('node:events');

process.eventbus = new event.EventEmitter();

const port = parseInt(process.env.PORT, 10) || 80

setTimeout(() => {
    const app = require('@src/app');

    setTimeout(() => {
        if (process.env.ExtraErrorWebDelay > 0) {
            process.log.system(`Webserver was delayed by ${process.env.ExtraErrorWebDelay || 500}ms beause of a error.`);
        }
        app.listen(port)
            .then((socket) => process.log.system(`Listening on port: ${port}`))
            .catch((error) => process.log.error(`Failed to start webserver on: ${port}\nError: ${error}`));
    }, process.env.ExtraErrorWebDelay || 500);
}, process.env.GlobalWaitTime || 100);
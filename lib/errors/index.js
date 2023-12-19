const ErrorStackParser = require('error-stack-parser');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');

class InvalidRouteInput extends Error {
    /**
     * Invalid Route Input Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Validation returned empty/invalid data'
        this.reason = 'Invalid Route Input';
        this.status = 400;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidRouteInput';
    }
}

class UnifiError extends Error {
    /**
     * Unifi Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Unifi Controller returned an error'
        this.reason = 'Unifi Error';
        this.status = 500;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'UnifiError';
    }
}

class TooManyRequests extends Error {
    /**
     * Too many requests error
     * @param {String} message 
     * @param {Number} retryIn 
     */
    constructor(message, retryIn) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Retry in header `Retry-At` (uses ms)'
        this.reason = 'Too Many Requests';
        this.headers = { name: 'Retry-At', value: retryIn };
        this.status = 429;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'TooManyRequests';
    }
}

module.exports = {
    InvalidRouteInput,
    UnifiError,
    TooManyRequests
}
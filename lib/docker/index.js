require('dotenv').config();
const DockerNode = require('dockerode');

class DockerInterface {
    /**
     * Initialize class
     */
    constructor() {
        this.sock = new DockerNode({socketPath: '/var/run/docker.sock'});
    };

    
}

module.exports = DockerInterface;
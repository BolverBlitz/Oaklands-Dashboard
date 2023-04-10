const path = require('path');

const spawn = require('child_process').spawn;

class PingInterface {
    /**
     * Initialize class
     */
    constructor() {

    };

    /**
     * Run a cli command within node as async function in a specific directory
     * @param {String} command | The command to execute
     * @param {String} cwd | Path to execute the command in
     * @param {WebSocket} ws | WS connection to send output to
     * @returns 
     */
    #executeCommand(command, cwd, ws) {
        return new Promise(function (resolve, reject) {
            const child = spawn(command, { cwd: cwd, shell: true });

            ws.on('close', () => {
                child.kill();
                resolve(true);
            });
            ws.on('message', (msg) => {
                const { com, payload } = JSON.parse(msg);
                if (com === 'unsubscribe_ping') {
                    child.kill();
                    resolve(true);
                }
            });

            child.on('close', (code) => {
                if(code == 0) {
                    resolve(true);
                }else {
                    reject(code);
                }
            });

            child.stdout.on('data', (data) => {
                console.log(data.toString().replace(/^\s+|\s+$/g, ''));
                if (ws) {
                    if(process.platform === 'linux'){
                        if(data.toString().replace(/^\s+|\s+$/g, '').includes('rtt')){
                            ws.send(JSON.stringify({ type: 'cli_ping', data: data.toString().replace(/^\s+|\s+$/g, '') }));
                        }
                    } else if(process.platform === 'win32'){
                        reject('Windows is not supported yet');
                        //ws.send(JSON.stringify({ type: 'cli_ping', data: data.toString().replace(/^\s+|\s+$/g, '') }));
                    }
                    
                }
            });
            child.stderr.on('data', (data) => {
                reject(data.toString());
            });
            child.on('close', (code) => {
                resolve(code);
            });
        });
    }

    ping(ws, host = '1.1.1.1') {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.#executeCommand(`ping ${host}`, path.join(__dirname, '..', '..'), ws);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


}

module.exports = PingInterface;
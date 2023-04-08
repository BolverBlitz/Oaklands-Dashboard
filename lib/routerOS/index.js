require('dotenv').config();
const RosApi = require('node-routeros').RouterOSAPI;

class ROSInterface {
    /**
     * Initialize class
     */
    constructor(host, user, password) {
        this.rosconn = new RosApi({
            host: host || '192.168.0.1',
            user: user || 'admin',
            password: password || 'admin',
            keepalive: true,
        });

        this.isConnected = false;
        this.isConnecting = false;

        this.#connect();

        this.rosconn.on('error', (error) => {
            console.log(error);
        });
    };

    // Coonect to ROS
    #connect = () => new Promise((resolve, reject) => {
        this.isConnecting = true;
        this.rosconn.connect().then(() => {
            this.isConnecting = false;
            this.isConnected = true;
            resolve(true);
        }).catch((error) => {
            this.isConnecting = false;
            this.isConnected = false;
            reject(error);
        });
    });

    getInterfaceList = () => new Promise(async (resolve, reject) => {
        try {
            if (!this.isConnected) {
                if (this.isConnecting) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } else {
                    await this.#connect();
                }
            }
            this.rosconn.write('/interface/print').then((data) => {
                resolve(data);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });

    getInterfaceStats = (interfaceName, ws) => new Promise(async (resolve, reject) => {
        try {
            if (!this.isConnected) {
                if (this.isConnecting) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } else {
                    await this.#connect();
                }
            }
            const monTrafficStream = this.rosconn.stream(['/interface/monitor-traffic', `=interface=${interfaceName}`]);

            ws.on('close', () => {
                monTrafficStream.stop();
                resolve(true);
            });
            ws.on('message', (msg) => {
                const { com, payload } = JSON.parse(msg);
                if (com === 'unsubscribe_rosTraffic') {
                    monTrafficStream.stop();
                    resolve(true);
                }
            });

            monTrafficStream.on('data', (data) => {
                ws.send(JSON.stringify({ com: 'traffic', payload: data }));
            });

            monTrafficStream.on('error', (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = ROSInterface;
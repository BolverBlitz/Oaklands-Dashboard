require('dotenv').config();
const RosApi = require('node-routeros').RouterOSAPI;

class ROSInterface {
    /**
     * Initialize class
     */
    constructor() {
        this.rosconn = new RosApi({
            host: process.env.RouterOS_IP || '192.168.88.1',
            user: process.env.RouterOS_User || 'admin',
            password: process.env.RouterOS_Password || '',
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

    getInterfaceStats = (interfaceName) => new Promise(async (resolve, reject) => {
        try {
            if (!this.isConnected) {
                if (this.isConnecting) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } else {
                    await this.#connect();
                }
            }
            const monTrafficStream = this.rosconn.stream(['/interface/monitor-traffic', `=interface=${interfaceName}`]);

            monTrafficStream.on('data', (data) => {
                console.log(data);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = ROSInterface;
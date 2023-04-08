const ROSInterface = require('./lib/routerOS');

const ros = new ROSInterface(
    process.env.RouterOS_IP || '192.168.88.1',
    process.env.RouterOS_User || 'admin',
    process.env.RouterOS_Password || '',
);

ros.getInterfaceList().then((interfaces) => {
    const activeEthInterfaces = interfaces.filter((interface) => { return interface.running === 'true' && interface.type === 'ether' });
    //console.log(activeEthInterfaces);
    ros.getInterfaceStats(activeEthInterfaces[0].name).then((data) => {
        console.log(data);
    }).catch((error) => {
        console.log(error);
    });
}).catch((error) => {
    console.log(error);
});
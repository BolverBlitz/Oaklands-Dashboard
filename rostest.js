const ROSInterface = require('./lib/routerOS');

const ros = new ROSInterface();

ros.getInterfaceList().then((data) => {
    console.log(data);
}).catch((error) => {
    console.log(error);
});
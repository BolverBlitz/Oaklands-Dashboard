const HyperExpress = require('hyper-express');
const router = new HyperExpress.Router();
const fs = require('fs');

const plugins = [];
const Preplugins = [];
var iimport;

Array.prototype.remove = function () {
  var what, a = arguments, L = a.length, ax;
  while (L && this.length) {
    what = a[--L];
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1);
    }
  }
  return this;
};

function sortFilenames(filenames, order) {
  // Helper function to remove file extension
  const removeExtension = filename => filename.split('.').slice(0, -1).join('.');

  // Create a map for ordered filenames with their respective order indices
  const orderMap = new Map(order.map((name, index) => [name, index]));

  // Separate and sort the filenames
  const orderedFiles = filenames.filter(filename => orderMap.has(removeExtension(filename)));
  const unorderedFiles = filenames.filter(filename => !orderMap.has(removeExtension(filename)));

  // Sort the orderedFiles based on the order in the 'order' array, ignoring extensions
  orderedFiles.sort((a, b) => {
    const indexA = orderMap.get(removeExtension(a));
    const indexB = orderMap.get(removeExtension(b));
    return indexA - indexB;
  });

  // Concatenate the ordered files with the unordered ones
  return orderedFiles.concat(unorderedFiles);
}

fs.readdir("./api", function (err, filenames) {
  filenames.remove('index.js');
  for (i = 0; i < filenames.length; i++) {
    if (filenames[i].startsWith("disabled.")) {

    } else if (filenames[i].endsWith(".js")) {
      let name = filenames[i].slice(0, filenames[i].length - 3)
      iimport = require(`./${name}`);
      Preplugins.push(`${iimport.PluginName}|${iimport.PluginVersion}`)
    } else {

    }
  }
});

/* Load in all the plugins */
fs.readdir("./api", function (err, filenames) {
  filenames.remove('index.js');
  console.log(filenames)
  filenames = sortFilenames(filenames, process.env.PLUGIN_ORDER.split(','));
  console.log(filenames)
  for (i = 0; i < filenames.length; i++) {
    if (filenames[i].startsWith("disabled.")) {
      process.log.warning(`Skipped API Plugin ${filenames[i].slice(9, filenames[i].length - 3)} because its disabled`);
    } else if (filenames[i].endsWith(".js")) {
      let PluginRequirementsFailed = false;
      const name = filenames[i].slice(0, filenames[i].length - 3)
      iimport = require(`./${name}`);
      if (typeof (iimport.PluginHtml) === "undefined" || typeof (iimport.PluginRequirements) === "undefined" || typeof (iimport.PluginName) === "undefined" || typeof (iimport.PluginVersion) === "undefined" || typeof (iimport.router) === "undefined") {
        process.log.error(`Skipped API Plugin ${name} because there are missing exports!`);
      } else {
        iimport.PluginRequirements.map(Req => {
          if (!Preplugins.includes(Req)) { PluginRequirementsFailed = true }
        });

        if (!PluginRequirementsFailed) {
          if (iimport.PluginHtml?.imports) process.eventbus.emit("addImports", iimport.PluginHtml.imports)
          if (iimport.PluginHtml?.html) process.eventbus.emit("addHtml", iimport.PluginHtml.html)
          if (iimport.PluginHtml?.js) process.eventbus.emit("addJs", iimport.PluginHtml.js)
          plugins.push({ route: `/${name}`, name: iimport.PluginName, version: iimport.PluginVersion, author: iimport.PluginAuthor || "", docs: iimport.PluginDocs || "" })
          router.use(`/${name}`, iimport.router);
          process.log.system(`Loaded API Plugin ${iimport.PluginName}@${iimport.PluginVersion}`);
        } else {
          process.log.error(`API Plugin ${filenames[i].slice(0, filenames[i].length - 3)}} requires following plugins [${iimport.PluginRequirements}] and at least one is missing!`);
        }
      }
    } else {
      process.log.error(`Unknown file was skipped ${filenames[i]}`);
    }
  }
})

router.get('/', (req, res) => {
  res.json({
    message: 'API - List of all loaded routs',
    plugins: plugins
  });
});

module.exports = router;
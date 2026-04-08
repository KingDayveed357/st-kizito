const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// if (config.watcher) {
// 	const { unstable_workerThreads, ...watcher } = config.watcher;
// 	config.watcher = watcher;
// }

module.exports = withNativeWind(config, { input: "./global.css" });
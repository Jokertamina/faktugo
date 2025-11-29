const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, "..");

const config = getDefaultConfig(projectRoot);

// Permitimos a Metro observar el directorio de la monorepo (packages, web, etc.)
config.watchFolders = [workspaceRoot];

// Aseguramos que Metro resuelva modulos tanto desde node_modules del proyecto
// como desde la raiz del workspace cuando exista.
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;

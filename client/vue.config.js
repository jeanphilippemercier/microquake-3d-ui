const path = require('path');

const vtkChainWebpack = require('vtk.js/Utilities/config/chainWebpack');

module.exports = {
  outputDir: path.resolve(__dirname, '../www'),
  chainWebpack: (config) => {
    // Add project name as alias
    config.resolve.alias.set('paraview-quake', __dirname);

    // Add vtk.js rules
    vtkChainWebpack(config);
  },
};

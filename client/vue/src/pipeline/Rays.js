import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';

// ----------------------------------------------------------------------------
// Helpers methods
// ----------------------------------------------------------------------------
function pointCount(a, b) {
  const aNumber = Number.isFinite(a) ? a : a.length;
  const bNumber = Number.isFinite(b) ? b : b.length;
  return aNumber + bNumber;
}

function updatePolyData(polydata, xyzCells) {
  const nbCells = xyzCells.length;
  const nbPoints = xyzCells.reduce(pointCount, 0) / 3;

  const xyz = new Float32Array(nbPoints * 3);
  const lines = new Uint16Array(nbPoints + nbCells);
  let pointOffset = 0;
  let cellOffset = 0;

  for (let cellIdx = 0; cellIdx < nbCells; cellIdx++) {
    const cellXYZ = xyzCells[cellIdx];
    lines[cellOffset++] = cellXYZ.length / 3;

    for (let i = 0; i < cellXYZ.length; i += 3) {
      lines[cellOffset++] = pointOffset / 3;
      xyz[pointOffset++] = cellXYZ[i];
      xyz[pointOffset++] = cellXYZ[i + 1];
      xyz[pointOffset++] = cellXYZ[i + 2];
    }
  }

  polydata.getPoints().setData(xyz, 3);
  polydata.getPoints().modified();
  polydata.getLines().setData(lines);
  polydata.getLines().modified();
  polydata.modified();
}

// ----------------------------------------------------------------------------
// vtkRays methods
// ----------------------------------------------------------------------------

function vtkRays(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRays');

  // --------------------------------------------------------------------------
  // Data structure
  // --------------------------------------------------------------------------
  model.actors = [];

  model.datasetsMap = {
    sAll: vtkPolyData.newInstance(),
    pAll: vtkPolyData.newInstance(),
    sOrigin: vtkPolyData.newInstance(),
    pOrigin: vtkPolyData.newInstance(),
    sOriginArrival: vtkPolyData.newInstance(),
    pOriginArrival: vtkPolyData.newInstance(),
  };
  model.mappersMap = {};
  model.actorsMap = {};

  Object.keys(model.datasetsMap).forEach((key) => {
    model.mappersMap[key] = vtkMapper.newInstance();
    model.actorsMap[key] = vtkActor.newInstance();

    model.mappersMap[key].setInputData(model.datasetsMap[key]);
    model.actorsMap[key].setMapper(model.mappersMap[key]);

    // register actor
    model.actors.push(model.actorsMap[key]);

    // Configure actors props
    model.actorsMap[key]
      .getProperty()
      .setColor(
        ...(key[0] === 's'
          ? [0.862745098, 0.2078431373, 0.2705882353]
          : [0, 0.4823529, 1])
      );

    model.actorsMap[key].getProperty().setInterpolationToFlat();
    model.actorsMap[key].getProperty().set({
      ambient: 1.0,
      diffuse: 0.0,
    });
  });

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  publicAPI.setInput = (id) => {
    const rays = model.raysDataMap[id] || [];
    model.numberOfRays = rays.length;
    publicAPI.modified();

    console.log('update rays', model.numberOfRays);

    if (!model.numberOfRays) {
      return;
    }

    const arrays = {
      S: {
        all: [],
        origin: [],
        originArrival: [],
      },
      P: {
        all: [],
        origin: [],
        originArrival: [],
      },
    };
    let activeArray = null;
    const prefOrigin = model.preferredOrigins[id];

    for (let i = 0; i < rays.length; i++) {
      const cell = [];
      const { phase, arrival, origin, nodes } = rays[i];
      if (prefOrigin === origin) {
        activeArray = arrival
          ? arrays[phase].originArrival
          : arrays[phase].origin;
      } else {
        activeArray = arrays[phase].all;
      }

      for (let j = 0; j < nodes.length; j++) {
        cell.push(nodes[j][0] + model.translate[0]);
        cell.push(nodes[j][1] + model.translate[1]);
        cell.push(nodes[j][2] + model.translate[2]);
      }
      activeArray.push(cell);
    }

    // ------------------------------------------------------------------------

    updatePolyData(model.datasetsMap.sAll, arrays.S.all);
    updatePolyData(model.datasetsMap.pAll, arrays.P.all);
    updatePolyData(model.datasetsMap.sOrigin, arrays.S.origin);
    updatePolyData(model.datasetsMap.pOrigin, arrays.P.origin);
    updatePolyData(model.datasetsMap.sOriginArrival, arrays.S.originArrival);
    updatePolyData(model.datasetsMap.pOriginArrival, arrays.P.originArrival);

    // ------------------------------------------------------------------------

    publicAPI.render();
  };

  publicAPI.getNestedProps = () => {
    if (model.numberOfRays) {
      return model.actors;
    }
    return [];
  };

  publicAPI.setVisibility = (v) => {
    model.visibility = v;
    model.actors.forEach((a) => a.setVisibility(false));
    if (v) {
      model.activePieces.forEach((k) => model.actorsMap[k].setVisibility(true));
    }
    publicAPI.render();
  };

  publicAPI.enablePieces = (names) => {
    model.activePieces = names;
    if (model.visibility) {
      publicAPI.setVisibility(true);
    }
  };

  publicAPI.render = () => {
    if (model.renderer) {
      model.renderer.getRenderWindow().render();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activePieces: [],
  raysDataMap: {},
  numberOfRays: 0,
  renderer: null,
  translate: [0, 0, 0],
  actors: [],
  visibility: true,
  preferredOrigins: {},
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'raysDataMap',
    'numberOfRays',
    'renderer',
    'preferredOrigins',
  ]);
  macro.setGetArray(publicAPI, model, ['translate'], 3);

  vtkRays(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRays');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

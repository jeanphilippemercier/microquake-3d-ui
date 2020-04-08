import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';

// ----------------------------------------------------------------------------
// vtkLocations methods
// ----------------------------------------------------------------------------

function vtkLocations(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLocations');

  // --------------------------------------------------------------------------
  // Data structure
  // --------------------------------------------------------------------------
  model.actors = [];
  model.lookupTable = vtkColorTransferFunction.newInstance();
  model.lookupTable.applyColorMap(vtkColorMaps.getPresetByName('coolwarm'));

  model.polydata = vtkPolyData.newInstance();
  model.polydata.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'id',
      empty: true,
    })
  );

  model.lineMapper = vtkMapper.newInstance({ scalarVisibility: false });
  model.lineActor = vtkActor.newInstance();
  model.lineMapper.setInputData(model.polydata);
  model.lineActor.setMapper(model.lineMapper);
  model.actors.push(model.lineActor);

  model.sphereMapper = vtkSphereMapper.newInstance({
    lookupTable: model.lookupTable,
    useLookupTableScalarRange: true,
  });
  model.sphereActor = vtkActor.newInstance();
  model.sphereMapper.setInputData(model.polydata);
  model.sphereActor.setMapper(model.sphereMapper);
  model.actors.push(model.sphereActor);

  model.lineActor.getProperty().set({
    ambient: 1.0,
    diffuse: 0.0,
  });

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  publicAPI.setInput = (xyz) => {
    const xyzFloat32 = new Float32Array(xyz.length);

    for (let i = 0; i < xyz.length; i += 3) {
      xyzFloat32[i] = xyz[i] + model.translate[0];
      xyzFloat32[i + 1] = xyz[i + 1] + model.translate[1];
      xyzFloat32[i + 2] = xyz[i + 2] + model.translate[2];
    }
    model.polydata.getPoints().setData(xyzFloat32, 3);

    const nbPoints = xyz.length / 3;
    const lines = new Uint16Array(1 + nbPoints);
    const ids = new Uint16Array(nbPoints);
    lines[0] = nbPoints;
    for (let i = 0; i < nbPoints; i++) {
      lines[i + 1] = i;
      ids[i] = i;
    }
    model.polydata.getLines().setData(lines);
    model.polydata.getPointData().getScalars().setData(ids);
    publicAPI.modified();

    model.lookupTable.setMappingRange(0, nbPoints - 1);
    model.lookupTable.updateRange();

    publicAPI.render();
  };

  publicAPI.getNestedProps = () => {
    return model.actors;
  };

  publicAPI.render = () => {
    if (model.renderer) {
      model.renderer.getRenderWindow().render();
    }
  };

  publicAPI.setRadius = model.sphereMapper.setRadius;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  renderer: null,
  translate: [0, 0, 0],
  actors: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['renderer']);
  macro.setGetArray(publicAPI, model, ['translate'], 3);

  vtkLocations(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLocations');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

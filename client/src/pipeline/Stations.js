import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';

import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

// ----------------------------------------------------------------------------
// vtkStations methods
// ----------------------------------------------------------------------------

function vtkStations(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkStations');

  // --------------------------------------------------------------------------
  // Data structure
  // --------------------------------------------------------------------------
  model.actors = [];

  model.lookupTable = vtkColorTransferFunction.newInstance();
  model.lookupTable.applyColorMap(vtkColorMaps.getPresetByName('Grayscale'));

  model.polydata = vtkPolyData.newInstance();
  model.polydata.getPointData().addArray(
    vtkDataArray.newInstance({
      name: 'status',
      empty: true,
    })
  );
  model.polydata.getPointData().addArray(
    vtkDataArray.newInstance({
      name: 'orientation',
      empty: true,
    })
  );

  if (!model.glyph) {
    const cone = vtkConeSource.newInstance({
      height: 40,
      radius: 10,
      resolution: 60,
    });
    model.glyph = cone.getOutputData();
  }

  model.actor = vtkActor.newInstance();
  model.mapper = vtkGlyph3DMapper.newInstance({
    colorByArrayName: 'status',
    colorMode: ColorMode.MAP_SCALARS,
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
    scalarVisibility: true,
    lookupTable: model.lookupTable,
    useLookupTableScalarRange: true,
    orient: true,
    orientationArray: 'orientation',
    scaling: false,
  });
  model.mapper.setInputData(model.glyph, 1);
  // model.mapper = vtkSphereMapper.newInstance({ radius: 100 });
  model.mapper.setInputData(model.polydata, 0);
  model.actor.setMapper(model.mapper);

  model.actors.push(model.actor);

  // --------------------------------------------------------------------------
  // Inner helpers
  // --------------------------------------------------------------------------

  /// pick station component suitable to define orientation
  function getOrientationRef(components) {
    // filter out component without code
    const fcs = (components || []).filter((comp) => Boolean(comp.code));

    // sort component by orientation_z in desc order
    fcs.sort((c0, c1) => c1.orientation_z - c0.orientation_z);

    return fcs[0] || { orientation_x: 0, orientation_y: 0, orientation_z: 1 };
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  publicAPI.setInput = (stations) => {
    const nbStations = stations.length;
    const xyz = new Float32Array(nbStations * 3);
    const orientation = new Float32Array(nbStations * 3);
    const status = new Float32Array(nbStations);

    model.tooltips = [];

    for (let i = 0; i < nbStations; i++) {
      const station = stations[i];
      xyz[i * 3] = station.location_x + model.translate[0];
      xyz[i * 3 + 1] = station.location_y + model.translate[1];
      xyz[i * 3 + 2] = station.location_z + model.translate[2];
      // Reset signal quality to in-between
      status[i] = 0.5; // 0:dead / 1:alive

      const { orientation_x, orientation_y, orientation_z } = getOrientationRef(
        station.components
      );
      orientation[i * 3] = -orientation_x;
      orientation[i * 3 + 1] = -orientation_y;
      orientation[i * 3 + 2] = -orientation_z;

      // ----------------------------------------------------------------------
      // Check station signal_quality
      // ----------------------------------------------------------------------
      // if (station.signal_quality) {
      //   status[i] = 2 * (station.signal_quality.integrity - 0.5);
      // }

      // Fill tooltip
      model.tooltips.push(station);
    }
    model.polydata.getPoints().setData(xyz, 3);
    model.polydata
      .getPointData()
      .getArray('status')
      .setData(status);
    model.polydata
      .getPointData()
      .getArray('orientation')
      .setData(orientation, 3);

    // Update cells
    const verts = new Uint16Array(nbStations + 1);
    verts[0] = nbStations;
    for (let i = 0; i < nbStations; i++) {
      verts[i + 1] = i;
    }
    model.polydata.getVerts().setData(verts);

    model.polydata.modified();
    publicAPI.modified();
    publicAPI.render();
  };

  publicAPI.updateSignalQuality = (allStatus) => {
    const statusArray = model.polydata
      .getPointData()
      .getArray('status')
      .getData();

    for (let i = 0; i < statusArray.length; i++) {
      const { code } = model.tooltips[i];
      if (code && allStatus[code] !== undefined) {
        const integrity = 2 * (allStatus[code].integrity - 0.5);
        statusArray[i] = integrity;
      }
    }

    model.polydata.modified();
    publicAPI.modified();
    publicAPI.render();
  };

  publicAPI.setVisibility = (v) => {
    model.actor.setVisibility(v);
    publicAPI.render();
  };

  publicAPI.getNestedProps = () => {
    if (model.polydata.getPoints().getData().length) {
      return model.actors;
    }
    return [];
  };

  publicAPI.render = () => {
    if (model.renderer) {
      model.renderer.getRenderWindow().render();
    }
  };

  publicAPI.getSelectionData = (selection) => {
    const { prop, compositeID } = selection;
    if (model.actor === prop) {
      const worldPosition = [
        model.polydata.getPoints().getData()[compositeID * 3 + 0],
        model.polydata.getPoints().getData()[compositeID * 3 + 1],
        model.polydata.getPoints().getData()[compositeID * 3 + 2],
      ];
      const station = model.tooltips[compositeID];
      return Object.assign(
        {
          worldPosition,
        },
        station
      );
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  renderer: null,
  translate: [0, 0, 0],
  tooltips: [],
  actors: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['renderer']);
  macro.setGetArray(publicAPI, model, ['translate'], 3);

  vtkStations(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkStations');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

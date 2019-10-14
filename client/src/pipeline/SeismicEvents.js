import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';

import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

const UNIT_CYLINDER_SOURCE = vtkCylinderSource.newInstance({
  height: 1.0,
  radius: 0.1,
  resolution: 60,
});

const ACTIVE_CELLS = new Uint8Array([2, 0, 1, 2, 2, 3, 2, 4, 5]);

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const UNCERTAINTY_CAP = 50.0;
const TIME_RATIO = 10000000000;

function filterEvents(mineBounds, eventsData, typeFilter = 'all') {
  if (!eventsData) {
    return [];
  }
  return eventsData.filter((event) => {
    if (event.x < mineBounds[0] || event.x > mineBounds[1]) {
      return false;
    }
    if (event.y < mineBounds[2] || event.y > mineBounds[3]) {
      return false;
    }
    if (event.z < mineBounds[4] || event.z > mineBounds[5]) {
      return false;
    }

    if (typeFilter !== 'all') {
      return typeFilter === event.event_type;
    }

    return true;
  });
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  filterEvents,
};

// ----------------------------------------------------------------------------
// vtkSeismicEvents methods
// ----------------------------------------------------------------------------

function vtkSeismicEvents(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSeismicEvents');

  // --------------------------------------------------------------------------
  // Data structure
  // --------------------------------------------------------------------------

  model.polydata = vtkPolyData.newInstance();

  model.magnitudeArray = vtkDataArray.newInstance({
    name: 'magnitude',
    numberOfComponents: 1,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.magnitudeArray);

  model.adjustedMagnitudeArray = vtkDataArray.newInstance({
    name: 'adjustedMagnitude',
    numberOfComponents: 1,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.adjustedMagnitudeArray);

  model.timeArray = vtkDataArray.newInstance({
    name: 'time',
    numberOfComponents: 1,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.timeArray);

  model.idArray = vtkDataArray.newInstance({
    name: 'id',
    numberOfComponents: 1,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.idArray);

  model.uncertaintyArray = vtkDataArray.newInstance({
    name: 'uncertainty',
    numberOfComponents: 1,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.uncertaintyArray);

  model.adjustedUncertaintyArray = vtkDataArray.newInstance({
    name: 'adjustedUncertainty',
    numberOfComponents: 1,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.adjustedUncertaintyArray);

  model.uncertaintyDirectionArray = vtkDataArray.newInstance({
    name: 'uncertainty_direction',
    numberOfComponents: 3,
    empty: true,
  });
  model.polydata.getPointData().addArray(model.uncertaintyDirectionArray);

  // --------------------------------------------------------------------------
  // pipeline
  // --------------------------------------------------------------------------

  model.actors = [];
  model.lookupTable = vtkColorTransferFunction.newInstance();

  // Regular rendering

  model.mapper = vtkMapper.newInstance();

  if (model.glyph) {
    model.mapper = vtkGlyph3DMapper.newInstance({
      colorByArrayName: 'time',
      colorMode: ColorMode.MAP_SCALARS,
      scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
      scalarVisibility: true,
      lookupTable: model.lookupTable,
      useLookupTableScalarRange: true,
      orient: false,
      scaling: true,
      scaleArray: 'adjustedMagnitude',
      scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE,
    });
    model.mapper.setInputData(model.glyph, 1);
  }

  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);
  model.mapper.setInputData(model.polydata);

  model.actors.push(model.actor);

  // Uncertainty

  if (model.glyph) {
    model.uncertaintyActor = vtkActor.newInstance({ visibility: false });
    model.uncertaintyMapper = vtkGlyph3DMapper.newInstance({
      orient: true,
      orientationArray: 'uncertainty_direction',
      scaling: true,
      scaleArray: 'adjustedUncertainty',
      scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE,
      colorByArrayName: 'time',
      colorMode: ColorMode.MAP_SCALARS,
      scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
      scalarVisibility: true,
      lookupTable: model.lookupTable,
      useLookupTableScalarRange: true,
    });
    model.uncertaintyMapper.setOrientationModeToDirection();
    model.uncertaintyMapper.setInputData(
      UNIT_CYLINDER_SOURCE.getOutputData(),
      1
    );

    model.uncertaintyActor.setMapper(model.uncertaintyMapper);
    model.uncertaintyMapper.setInputData(model.polydata);

    model.actors.push(model.uncertaintyActor);
  }

  // Active part
  model.activePolydata = vtkPolyData.newInstance();
  model.activePolydata.getPoints().setData(new Float32Array(6 * 3), 3);
  model.activePolydata.getLines().setData(ACTIVE_CELLS);

  model.activeMapper = vtkMapper.newInstance();
  model.activeActor = vtkActor.newInstance();
  model.activeActor.setMapper(model.activeMapper);
  model.activeMapper.setInputData(model.activePolydata);

  model.activeActor.setVisibility(false);
  model.activeActor.getProperty().set({
    ambient: 1.0,
    diffuse: 0.0,
  });
  model.actors.push(model.activeActor);

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  publicAPI.setInput = (eventsData, preferedOrigins = {}, idList = []) => {
    model.lastIdList = idList;
    const filteredEvents = filterEvents(
      model.mineBounds,
      eventsData,
      model.eventType
    );
    const size = filteredEvents.length;
    console.log(`update ${model.eventType} ${size}`);

    // ------------------------------------------------------------------------
    // Allocate + fill arrays
    // ------------------------------------------------------------------------
    // - magnitude                         Float32Array
    // - time                              BigUint64Array
    // - id                                Uint32Array
    // - uncertainty                       Float32Array
    // - direction (uncertainty_direction) Float32Array
    const coords = new Float32Array(size * 3);
    const idArray = new Uint32Array(size);
    const magnitudeArray = new Float32Array(size);
    const timeArray = new Float64Array(size);
    const uncertaintyArray = new Float32Array(size);
    const uncertaintyDirectionArray = new Float32Array(size * 3);
    // ------------------------------------------------------------------------
    for (let i = 0; i < size; ++i) {
      const event = filteredEvents[i];
      coords[3 * i] = event.x + model.translate[0];
      coords[3 * i + 1] = event.y + model.translate[1];
      coords[3 * i + 2] = event.z + model.translate[2];

      if (event.uncertainty) {
        const value = parseFloat(event.uncertainty);
        if (value > UNCERTAINTY_CAP) {
          uncertaintyArray[i] = UNCERTAINTY_CAP;
        } else {
          uncertaintyArray[i] = value;
        }
      } else {
        uncertaintyArray[i] = 0.0;
      }

      uncertaintyDirectionArray[3 * i] = event.uncertainty_vector_x || 0;
      uncertaintyDirectionArray[3 * i + 1] = event.uncertainty_vector_y || 0;
      uncertaintyDirectionArray[3 * i + 2] =
        event.uncertainty_vector_z === undefined
          ? 1
          : event.uncertainty_vector_z;

      magnitudeArray[i] = event.magnitude;
      timeArray[i] = event.time_epoch / TIME_RATIO;
      idArray[i] = idList.length;

      idList.push(event.event_resource_id);
      preferedOrigins[event.event_resource_id] = event.preferred_origin_id;
    }
    // ------------------------------------------------------------------------

    model.polydata.getPoints().setData(coords, 3);
    model.idArray.setData(idArray);
    model.magnitudeArray.setData(magnitudeArray);
    model.timeArray.setData(timeArray);
    model.uncertaintyArray.setData(uncertaintyArray);
    model.uncertaintyDirectionArray.setData(uncertaintyDirectionArray, 3);

    // Update cells
    const verts = new Uint32Array(size + 1);
    verts[0] = size;
    for (let i = 0; i < size; i++) {
      verts[i + 1] = i;
    }
    model.polydata.getVerts().setData(verts);
    publicAPI.updateScaling();
    publicAPI.updateUncertaintyScaling();

    // ------------------------------------------------------------------------

    publicAPI.render();
  };

  publicAPI.updateColorRange = (min, max) => {
    model.colorRange = [min, max];
    publicAPI.setColorPreset();
  };

  publicAPI.setColorPreset = (name) => {
    if (name) {
      const preset = vtkColorMaps.getPresetByName(name);
      model.lookupTable.applyColorMap(preset);
    }
    model.lookupTable.setMappingRange(model.colorRange[0], model.colorRange[1]);
    model.lookupTable.updateRange();
    publicAPI.render();
  };

  publicAPI.updateUncertaintyVisibility = (v) => {
    model.actor.setVisibility(model.visibility && !v);
    if (model.uncertaintyActor) {
      model.uncertaintyActor.setVisibility(model.visibility && v);
    }
    publicAPI.render();
  };

  publicAPI.updateUncertaintyScaling = () => {
    model.adjustedUncertaintyArray.setData(
      model.uncertaintyArray
        .getData()
        .map((v) => v * model.uncertaintyScalingFactor)
    );

    model.polydata.modified();
    publicAPI.modified();
  };

  publicAPI.updateScaling = () => {
    const [minMagnitude, maxMagnitude] = model.magnitudeRange;
    const deltaMagnitude = maxMagnitude - minMagnitude;
    const [minScale, maxScale] = model.scalingRange;
    const deltaScale = maxScale - minScale;

    function adjustMagnitude(v) {
      if (v < minMagnitude) {
        return minScale * model.scalingFactor;
      }
      if (v > maxMagnitude) {
        return maxScale * model.scalingFactor;
      }
      return (
        model.scalingFactor *
        ((deltaScale * (v - minMagnitude)) / deltaMagnitude + minScale)
      );
    }

    model.adjustedMagnitudeArray.setData(
      model.magnitudeArray.getData().map(adjustMagnitude)
    );

    model.polydata.modified();
    publicAPI.modified();
  };

  publicAPI.getNestedProps = () => {
    if (model.polydata.getPoints().getData().length) {
      return model.actors;
    }
    return [];
  };

  publicAPI.setVisibility = (v) => {
    model.visibility = v;
    model.actor.setVisibility(v);
    publicAPI.render();
  };

  publicAPI.render = () => {
    if (model.renderer) {
      model.renderer.getRenderWindow().render();
    }
  };

  publicAPI.getSelectionData = (selection) => {
    const { prop, compositeID } = selection;
    if (model.actor === prop || model.uncertaintyActor === prop) {
      const worldPosition = [
        model.polydata.getPoints().getData()[compositeID * 3 + 0],
        model.polydata.getPoints().getData()[compositeID * 3 + 1],
        model.polydata.getPoints().getData()[compositeID * 3 + 2],
      ];
      const id = model.idArray.getData()[compositeID];
      const magnitude = model.magnitudeArray.getData()[compositeID];
      const time = model.timeArray.getData()[compositeID];
      const uncertainty = model.uncertaintyArray.getData()[compositeID];
      return {
        id,
        magnitude,
        time: time * TIME_RATIO,
        uncertainty,
        event_resource_id: model.lastIdList[id],
        worldPosition,
      };
    }
    return null;
  };

  publicAPI.activate = (id) => {
    const ids = model.idArray.getData();
    const inRange = id >= ids[0] && id <= ids[ids.length - 1];
    if (inRange) {
      const idx = id - ids[0];
      const xyzs = model.polydata.getPoints().getData();
      const x = xyzs[idx * 3];
      const y = xyzs[idx * 3 + 1];
      const z = xyzs[idx * 3 + 2];
      const outPoints = model.activePolydata.getPoints();
      const outXYZs = outPoints.getData();

      outXYZs[0] = model.mineBounds[0] + model.translate[0];
      outXYZs[1] = y;
      outXYZs[2] = z;
      outXYZs[3] = model.mineBounds[1] + model.translate[0];
      outXYZs[4] = y;
      outXYZs[5] = z;

      outXYZs[6] = x;
      outXYZs[7] = model.mineBounds[2] + model.translate[1];
      outXYZs[8] = z;
      outXYZs[9] = x;
      outXYZs[10] = model.mineBounds[3] + model.translate[1];
      outXYZs[11] = z;

      outXYZs[12] = x;
      outXYZs[13] = y;
      outXYZs[14] = model.mineBounds[4] + model.translate[2];
      outXYZs[15] = x;
      outXYZs[16] = y;
      outXYZs[17] = model.mineBounds[5] + model.translate[2];

      outPoints.modified();
      model.activePolydata.modified();
    }
    model.activeActor.setVisibility(inRange);
    publicAPI.render();
  };

  publicAPI.updateGlyph = (g) => {
    if (model.glyph) {
      model.glyph = g;
      model.mapper.setInputData(model.glyph, 1);
    }
  };

  // forwarding API
  publicAPI.setPointSize = model.actor.getProperty().setPointSize;
  publicAPI.getPointSize = model.actor.getProperty().getPointSize;
  publicAPI.setOpacity = model.actor.getProperty().setOpacity;
  publicAPI.getOpacity = model.actor.getProperty().getOpacity;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  glyph: null,
  lastIdList: null,
  renderer: null,
  translate: [0, 0, 0],
  mineBounds: [-1, 1, -1, 1, -1, 1],
  actors: [],
  eventType: 'all', // earthquake, explosion, all
  ready: false,
  magnitudeRange: [-3, 5],
  scalingRange: [0.001, 1],
  scalingFactor: 50,
  uncertaintyScalingFactor: 50,
  visibility: true,
  colorRange: [0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'eventType',
    'glyph',
    'renderer',
    'scalingFactor',
    'uncertaintyScalingFactor',
    'lastIdList',
  ]);
  macro.setGetArray(publicAPI, model, ['translate'], 3);
  macro.setGetArray(publicAPI, model, ['mineBounds'], 6);
  macro.setGetArray(publicAPI, model, ['magnitudeRange', 'scalingRange'], 2);

  vtkSeismicEvents(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSeismicEvents');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);

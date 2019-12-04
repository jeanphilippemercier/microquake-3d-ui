import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function filterEvents(mineBounds, eventsData) {
  if (!eventsData) {
    return [];
  }
  return eventsData.filter((event) => {
    const x = event.x;
    const y = event.y;
    const z = event.z;
    // console.log(`scatter postion\nX: ${mineBounds[0]} < ${x} < ${mineBounds[1]}\nY: ${mineBounds[2]} < ${y} < ${mineBounds[3]}\nZ: ${mineBounds[4]} < ${z} < ${mineBounds[5]}`);
    if (x < mineBounds[0] || x > mineBounds[1]) {
      return false;
    }
    if (y < mineBounds[2] || y > mineBounds[3]) {
      return false;
    }
    if (z < mineBounds[4] || z > mineBounds[5]) {
      return false;
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
// vtkScatters methods
// ----------------------------------------------------------------------------

function vtkScatters(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkScatters');

  // --------------------------------------------------------------------------
  // Data structure
  // --------------------------------------------------------------------------

  model.polydata = vtkPolyData.newInstance();

  // --------------------------------------------------------------------------
  // pipeline
  // --------------------------------------------------------------------------

  model.actors = [];

  // Regular rendering

  model.mapper = vtkMapper.newInstance();
  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);
  model.mapper.setInputData(model.polydata);
  model.actors.push(model.actor);

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  publicAPI.setInput = (eventsData) => {
    model.originalList = eventsData;
    const filteredEvents = filterEvents(model.mineBounds, eventsData);
    const size = filteredEvents.length;
    console.log(
      `update scatters with ${size} points vs ${eventsData.length} given`
    );

    // ------------------------------------------------------------------------
    // Allocate + fill arrays
    // ------------------------------------------------------------------------
    const coords = new Float32Array(size * 3);
    // ------------------------------------------------------------------------
    for (let i = 0; i < size; ++i) {
      const event = filteredEvents[i];
      coords[3 * i] = event.x + model.translate[0];
      coords[3 * i + 1] = event.y + model.translate[1];
      coords[3 * i + 2] = event.z + model.translate[2];
    }
    // ------------------------------------------------------------------------

    model.polydata.getPoints().setData(coords, 3);

    // Update cells
    const verts = new Uint32Array(size + 1);
    verts[0] = size;
    for (let i = 0; i < size; i++) {
      verts[i + 1] = i;
    }
    model.polydata.getVerts().setData(verts);

    // ------------------------------------------------------------------------
    model.polydata.modified();
    publicAPI.modified();
    publicAPI.render();
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
  renderer: null,
  translate: [0, 0, 0],
  mineBounds: [-1, 1, -1, 1, -1, 1],
  actors: [],
  ready: false,
  visibility: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['renderer']);
  macro.setGetArray(publicAPI, model, ['translate'], 3);
  macro.setGetArray(publicAPI, model, ['mineBounds'], 6);

  vtkScatters(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkScatters');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);

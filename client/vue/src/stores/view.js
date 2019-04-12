/* eslint-disable no-unused-vars */
import { Actions, Mutations } from 'paraview-quake/src/stores/TYPES';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const ROTATION_STEP = 2;
const VIEW_UPS = [[0, 1, 0], [0, 0, 1], [0, 1, 0]];

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
const source = vtkPolyData.newInstance();

actor.setMapper(mapper);
mapper.setInputData(source);

function updateCamera(viewProxy, cameraInfo) {
  if (!viewProxy) {
    return;
  }
  const { position, focalPoint, viewUp, centerOfRotation } = cameraInfo;
  const camera = viewProxy.getCamera();
  if (position) {
    camera.setPosition(...position);
  }
  if (focalPoint) {
    camera.setFocalPoint(...focalPoint);
  }
  if (viewUp) {
    camera.setViewUp(...viewUp);
  }
  if (centerOfRotation) {
    viewProxy.getInteractorStyle3D().setCenterOfRotation(centerOfRotation);
  }

  // Update changes
  viewProxy
    .getOpenglRenderWindow()
    .getReferenceByName('viewStream')
    .pushCamera();
  viewProxy.renderLater();
}

export default {
  state: {
    view: '-1',
    stats: false,
    stillQuality: 100,
    interactiveQuality: 80,
    stillRatio: 1,
    interactiveRatio: 1,
    maxFPS: 30,
    mouseThrottle: 16.6,
    camera: null,
    viewProxy: null,
    widgetManager: null,
    advancedOrientation: true,
    inAnimation: false,
  },
  getters: {
    VIEW_STATS(state) {
      return state.stats;
    },
    VIEW_ID(state) {
      return state.view;
    },
    VIEW_PROXY(state) {
      return state.viewProxy;
    },
    VIEW_QUALITY_STILL(state) {
      return state.stillQuality;
    },
    VIEW_QUALITY_INTERACTIVE(state) {
      return state.interactiveQuality;
    },
    VIEW_RATIO_STILL(state) {
      return state.stillRatio;
    },
    VIEW_RATIO_INTERACTIVE(state) {
      return state.interactiveRatio;
    },
    VIEW_FPS_MAX(state) {
      return state.maxFPS;
    },
    VIEW_MOUSE_THROTTLE(state) {
      return state.mouseThrottle;
    },
    VIEW_ADVANCED_ORIENTATION_WIDGET(state) {
      return state.advancedOrientation;
    },
    VIEW_WIDGET_MANAGER(state) {
      return state.widgetManager;
    },
  },
  mutations: {
    VIEW_PROXY_SET(state, viewProxy) {
      if (state.viewProxy !== viewProxy) {
        state.viewProxy = viewProxy;
        state.viewProxy.getRenderer().addActor(actor);
      }
    },
    VIEW_ID_SET(state, id) {
      state.view = id;
    },
    VIEW_STATS_SET(state, enable) {
      state.stats = enable;
    },
    VIEW_QUALITY_STILL_SET(state, value) {
      state.stillQuality = value;
    },
    VIEW_QUALITY_INTERACTIVE_SET(state, value) {
      state.interactiveQuality = value;
    },
    VIEW_RATIO_STILL_SET(state, value) {
      state.stillRatio = value;
    },
    VIEW_RATIO_INTERACTIVE_SET(state, value) {
      state.interactiveRatio = value;
    },
    VIEW_FPS_MAX_SET(state, value) {
      state.maxFPS = value;
    },
    VIEW_MOUSE_THROTTLE_SET(state, value) {
      state.mouseThrottle = value;
    },
    VIEW_ADVANCED_ORIENTATION_WIDGET_SET(state, value) {
      state.advancedOrientation = value;
    },
    VIEW_WIDGET_MANAGER_SET(state, widgetManager) {
      state.widgetManager = widgetManager;
    },
  },
  actions: {
    VIEW_UPDATE_CAMERA({ dispatch, rootState, state }, camera) {
      console.log('camera', camera);
      const { focalPoint, viewUp, position, centerOfRotation, bounds } = camera;
      // Update bounds in local vtk.js renderer
      source
        .getPoints()
        .setData(
          Float64Array.from([
            bounds[0],
            bounds[2],
            bounds[4],
            bounds[1],
            bounds[3],
            bounds[5],
          ]),
          3
        );

      updateCamera(state.viewProxy, {
        centerOfRotation,
        focalPoint,
        position,
        viewUp,
      });
    },
    VIEW_RESET_CAMERA({ dispatch, rootState, state }, id) {
      const client = rootState.network.client;
      const viewId = id || state.view;
      if (client) {
        client.remote.Quake.resetCamera()
          .then((camera) => dispatch(Actions.VIEW_UPDATE_CAMERA, camera))
          .catch(console.error);
      } else {
        console.error('no client', rootState);
      }
    },
    VIEW_UPDATE_ORIENTATION(
      { state, commit, dispatch },
      { axis, orientation, viewUp }
    ) {
      if (state.viewProxy && !state.inAnimation) {
        state.inAnimation = true;
        state.viewProxy
          .updateOrientation(axis, orientation, viewUp || VIEW_UPS[axis], 100)
          .then(() => {
            state.inAnimation = false;
            dispatch(Actions.VIEW_RESET_CAMERA);
          });
      }
    },
    VIEW_RENDER({ rootState, state, dispatch }) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Quake.render()
          .then((camera) => dispatch(Actions.VIEW_UPDATE_CAMERA, camera))
          .catch(console.error);
      } else {
        console.error('no client', rootState);
      }
    },
    VIEW_UP({ rootState, state, dispatch }) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Quake.snapCamera()
          .then((camera) => dispatch(Actions.VIEW_UPDATE_CAMERA, camera))
          .catch(console.error);
      } else {
        console.error('no client', rootState);
      }
    },
    VIEW_TOGGLE_WIDGET_MANAGER({ rootState, state, dispatch }) {
      if (state.widgetManager) {
        if (rootState.view.advancedOrientation) {
          state.widgetManager.enablePicking();
        } else {
          state.widgetManager.disablePicking();
        }

        if (state.viewProxy) {
          state.viewProxy.renderLater();
        } else {
          console.error('no viewProxy', rootState);
        }
      } else {
        console.error('no widgetManager', rootState);
      }
    },
  },
};

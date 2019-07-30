import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';

import DateHelper from 'paraview-quake/src/util/DateHelper';
import handlePiece from 'paraview-quake/src/pipeline/MinePieceHandler';
import URLHelper from 'paraview-quake/src/util/URLHelper';

/* eslint-disable import/no-named-as-default-member */
import vtkSeismicEvents from 'paraview-quake/src/pipeline/SeismicEvents';
import vtkRays from 'paraview-quake/src/pipeline/Rays';
import vtkLocations from 'paraview-quake/src/pipeline/Locations';
import vtkStations from 'paraview-quake/src/pipeline/Stations';

const PIPELINE_ITEMS = {};
let LIVE_TIMEOUT = 0;

const vtpReader = vtkXMLPolyDataReader.newInstance();
const BLAST_GLYPH = vtpReader.setUrl('/blast.vtp').then(() => {
  return vtpReader.getOutputData();
});

export default {
  state: {
    mineCategories: [],
    mineBounds: null,
    mineTranslate: [0.0, 0.0, 0.0],
    minePlan: null,
    pipelineObjects: {},
  },
  getters: {
    LOCAL_MINE_PLAN(state) {
      return state.minePlan;
    },
    LOCAL_MINE_BOUNDS(state) {
      return state.mineBounds;
    },
    LOCAL_MINE_TRANSLATE(state) {
      return state.mineTranslate;
    },
    LOCAL_PIPELINE_OBJECTS() {
      return PIPELINE_ITEMS;
    },
  },
  mutations: {
    LOCAL_MINE_PLAN_SET(state, plan) {
      state.minePlan = plan;
    },
    LOCAL_MINE_BOUNDS_SET(state, bounds) {
      state.mineBounds = bounds;
    },
    LOCAL_MINE_TRANSLATE_SET(state, translate) {
      state.mineTranslate = translate;
    },
    LOCAL_PIPELINE_OBJECTS_SET(state, objects) {
      Object.assign(PIPELINE_ITEMS, objects);
    },
  },
  actions: {
    //-----------------------------------------------------------------------
    // Public (processing) API
    //-----------------------------------------------------------------------
    LOCAL_INITIALIZE({ getters, commit, dispatch }) {
      // Initialize ray handler
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      const raysDataMap = getters.QUAKE_RAY_DATA;
      const preferredOrigins = getters.QUAKE_PREFERRED_ORIGIN_MAP;
      pipeline.ray = vtkRays.newInstance({
        raysDataMap,
        preferredOrigins,
      });

      dispatch('API_FETCH_MINE').then(() => {
        // Events need to be translated by an amount which is unknown until
        // we have successfully processed the mine plan.
        const translate = getters.LOCAL_MINE_TRANSLATE;

        dispatch('API_UPDATE_EVENTS');
        dispatch('LOCAL_UPDATE_PRESET', 'coolwarm');

        dispatch('API_UPDATE_SCALING');
        dispatch('API_UPDATE_UNCERTAINTY_SCALING');

        // Link renderer to the rays and configure offset
        const renderer = getters.VIEW_LOCAL_RENDERER;
        pipeline.ray.setTranslate(translate);
        pipeline.ray.setRenderer(renderer);
        renderer.addViewProp(pipeline.ray);

        // // Dynamic monitoring of the mine
        // dispatch('API_ON_MINE_CHANGE', () => {
        //   dispatch('API_FETCH_MINE');
        // });

        // Handle locations in url
        const config = getters.REMOTE_CONFIG;
        if (config.locations) {
          commit('QUAKE_COMPONENTS_VISIBILITY_SET', {
            mine: true,
            seismicEvents: false,
            blast: false,
            historicEvents: false,
            ray: false,
            uncertainty: false,
          });
          dispatch('API_UPDATE_EVENTS_VISIBILITY');
          dispatch('API_SHOW_LOCATIONS', config.locations);
        }

        // Handle stations locations
        dispatch('HTTP_FETCH_STATIONS').then(({ data }) => {
          pipeline.stations = vtkStations.newInstance({ renderer, translate });
          pipeline.stations.setInput(data);
          renderer.addViewProp(pipeline.stations);
        });

        // Triger live update
        const timeout = getters.QUAKE_LIVE_REFRESH_RATE * 60 * 1000; // minutes => ms
        setTimeout(() => {
          dispatch('LOCAL_LIVE_UPDATE');
        }, timeout);
        dispatch('QUAKE_UPDATE_LIVE_MODE');
      });
    },
    LOCAL_UPDATE_UNCERTAINTY_SCALING({ getters }) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      const itemToUpdate = [pipeline.seismicEvents, pipeline.blast];

      while (itemToUpdate.length) {
        const item = itemToUpdate.pop();
        item.setUncertaintyScalingFactor(
          getters.QUAKE_UNCERTAINTY_SCALE_FACTOR
        );
        item.updateUncertaintyScaling();
      }
      renderer.getRenderWindow().render();
    },
    LOCAL_UPDATE_SCALING({ getters }) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      const itemToUpdate = [pipeline.seismicEvents, pipeline.blast];

      while (itemToUpdate.length) {
        const item = itemToUpdate.pop();
        item.setMagnitudeRange(getters.QUAKE_MAGNITUDE_RANGE);
        item.setScalingRange(getters.QUAKE_SCALING_RANGE);
        item.updateScaling();
      }
      renderer.getRenderWindow().render();
    },
    LOCAL_UPDATE_PRESET({ getters, commit }, preset) {
      commit('QUAKE_COLOR_PRESET_SET', preset);

      const renderer = getters.VIEW_LOCAL_RENDERER;
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      const itemToUpdate = [pipeline.seismicEvents, pipeline.blast];
      while (itemToUpdate.length) {
        itemToUpdate.pop().setColorPreset(preset);
      }
      renderer.getRenderWindow().render();
    },
    LOCAL_UPDATE_RAY_FILTER_MODE({ getters }) {
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;

      switch (getters.QUAKE_RAY_FILTER_MODE) {
        case 0:
          // Preferred origin + arrival
          pipeline.ray.enablePieces(['sOriginArrival', 'pOriginArrival']);
          break;
        case 1:
          // Preferred origin
          pipeline.ray.enablePieces([
            'sOriginArrival',
            'pOriginArrival',
            'sOrigin',
            'pOrigin',
          ]);
          break;
        default:
          // All rays, already set
          pipeline.ray.enablePieces([
            'sOriginArrival',
            'pOriginArrival',
            'sOrigin',
            'pOrigin',
            'sAll',
            'pAll',
          ]);
          break;
      }
    },
    LOCAL_UPDATE_EVENTS_VISIBILITY({ getters }) {
      const componentsVisibility = getters.QUAKE_COMPONENTS_VISIBILITY;
      const keys = [
        'seismicEvents',
        'blast',
        'historicEvents',
        'ray',
        'uncertainty',
      ];

      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;

      // Handle pipeline visibility (mine plan + sensor + ray)
      keys.forEach((key) => {
        const visibility = componentsVisibility[key];
        if (visibility !== undefined && key in pipeline) {
          pipeline[key].setVisibility(visibility);
        }
      });

      // Handle uncertainty visibility
      const itemToUpdate = [pipeline.seismicEvents, pipeline.blast];
      while (itemToUpdate.length) {
        itemToUpdate
          .pop()
          .updateUncertaintyVisibility(componentsVisibility['uncertainty']);
      }
    },
    LOCAL_UPDATE_EVENTS({ getters, commit, dispatch }) {
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const translate = getters.LOCAL_MINE_TRANSLATE;
      const mineBounds = getters.LOCAL_MINE_BOUNDS;
      const eventStatusFilter = getters.QUAKE_FOCUS_EVENT_STATUS;
      const prefOriginMap = getters.QUAKE_PREFERRED_ORIGIN_MAP;

      const idList = [];

      const focusPeriod = getters.QUAKE_FOCUS_PERIOD;
      const historicalTime = getters.QUAKE_HISTORICAL_TIME;
      const now = DateHelper.getDateFromNow(2190 - focusPeriod[1]);
      const fTime = DateHelper.getDateFromNow(2190 - focusPeriod[0]);
      const hTime = DateHelper.getDateFromNow(historicalTime);

      if (!mineBounds) {
        return Promise.reject('No mine bounds set yet, cannot update events');
      }

      if (!pipeline.seismicEvents) {
        const sphereSource = vtkSphereSource.newInstance({
          radius: 0.5,
          thetaResolution: 60,
          phiResolution: 60,
        });
        pipeline.seismicEvents = vtkSeismicEvents.newInstance({
          translate,
          renderer,
          eventType: 'earthquake',
          mineBounds,
          glyph: sphereSource.getOutputData(),
        });

        const cubeSource = vtkCubeSource.newInstance({
          xLength: 0.8,
          yLength: 0.8,
          zLength: 0.8,
        });
        pipeline.blast = vtkSeismicEvents.newInstance({
          translate,
          renderer,
          eventType: 'explosion',
          mineBounds,
          glyph: cubeSource.getOutputData(),
        });
        BLAST_GLYPH.then(pipeline.blast.updateGlyph);

        pipeline.historicEvents = vtkSeismicEvents.newInstance({
          translate,
          renderer,
          mineBounds,
        });
        pipeline.historicEvents.setOpacity(0.6);
        pipeline.historicEvents.setPointSize(3);

        renderer.addViewProp(pipeline.seismicEvents);
        renderer.addViewProp(pipeline.blast);
        renderer.addViewProp(pipeline.historicEvents);
      }

      // Get the events
      dispatch('HTTP_FETCH_EVENTS', [fTime, now, eventStatusFilter])
        .then((response) => {
          commit('QUAKE_REFRESH_COUNT_SET', getters.QUAKE_REFRESH_COUNT + 1);

          const focusTS = new Date(fTime) / 10000;
          const nowTS = new Date(now) / 10000;
          pipeline.seismicEvents.setInput(response.data, prefOriginMap, idList);
          pipeline.seismicEvents.updateColorRange(focusTS, nowTS);
          pipeline.blast.setInput(response.data, prefOriginMap, idList);
          pipeline.blast.updateColorRange(focusTS, nowTS);

          dispatch('QUAKE_UPDATE_CATALOGUE', response.data);

          if (getters.QUAKE_LIVE_MODE && focusPeriod[0] < 2100) {
            dispatch('LOCAL_UPDATE_EVENTS');
          }
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
        });

      dispatch('HTTP_FETCH_EVENTS', [hTime, fTime, eventStatusFilter])
        .then((response) => {
          pipeline.historicEvents.setInput(response.data, prefOriginMap);
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
        });
    },
    LOCAL_UPDATE_MINE_VISIBILITY({ getters }) {
      const mine = getters.QUAKE_MINE;
      const visibility = getters.QUAKE_MINE_VISIBILITY;
      const mineVisibility = getters.QUAKE_COMPONENTS_VISIBILITY.mine;

      function flattenMineKeys(nodeList, keysList) {
        if (!nodeList) {
          return;
        }

        for (let i = 0; i < nodeList.length; i += 1) {
          const node = nodeList[i];
          keysList.push(node.id);
          flattenMineKeys(node.children, keysList);
        }
      }

      const allMineKeys = [];
      flattenMineKeys(mine, allMineKeys);

      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;

      allMineKeys.forEach((mineKey) => {
        if (mineKey in pipeline) {
          if (mineVisibility && visibility.indexOf(mineKey) >= 0) {
            pipeline[mineKey].setVisibility(true);
          } else {
            pipeline[mineKey].setVisibility(false);
          }
        }
      });

      // fillVisibilityMap(getters.QUAKE_MINE, visibilityMap);
      // if (getters.QUAKE_COMPONENTS_VISIBILITY.mine) {
      //   getters.QUAKE_MINE_VISIBILITY.forEach((name) => {
      //     visibilityMap[name] = true;
      //   });
      // }
    },
    LOCAL_EVENT_PICKING({ commit }, [x, y]) {
      // Picking in local mode is handled in the view...
      commit('QUAKE_PICKING_POSITION_SET', [x, y]);
    },
    LOCAL_UPDATE_CENTER_OF_ROTATION({ getters, commit }, position) {
      commit('QUAKE_PICKING_CENTER_OF_ROTATION_SET', false);
      const interactor = getters.VIEW_LOCAL_INTERACTOR;
      interactor.getInteractorStyle().setCenterOfRotation(position);
    },
    LOCAL_SHOW_RAY({ getters, commit, dispatch }) {
      const raysDataMap = getters.QUAKE_RAY_DATA;
      if (getters.QUAKE_PICKED_DATA) {
        const id = getters.QUAKE_PICKED_DATA.event_resource_id;
        if (raysDataMap[id]) {
          const hasRays = raysDataMap[id].length > 0;
          commit('QUAKE_RAYS_IN_SCENE_SET', hasRays);
          getters.LOCAL_PIPELINE_OBJECTS.ray.setInput(id);
          // Auto show the rays
          if (hasRays && !getters.QUAKE_COMPONENTS_VISIBILITY.ray) {
            const newVizibility = Object.assign(
              {},
              getters.QUAKE_COMPONENTS_VISIBILITY,
              { ray: true }
            );
            commit('QUAKE_COMPONENTS_VISIBILITY_SET', newVizibility);
            dispatch('LOCAL_UPDATE_EVENTS_VISIBILITY');
          }
          dispatch('LOCAL_UPDATE_RAY_FILTER_MODE');
          return;
        }
        dispatch('HTTP_FETCH_RAYS', id).then(({ data }) => {
          const nbRays = data.length;
          commit(
            'QUAKE_RAY_MAPPING_SET',
            Object.assign({}, getters.QUAKE_RAY_MAPPING, {
              [id]: nbRays,
            })
          );
          const hasRays = nbRays > 0;
          commit('QUAKE_RAYS_IN_SCENE_SET', hasRays);
          commit('QUAKE_RAY_DATA_SET', { id, data });

          // Activate given ID
          getters.LOCAL_PIPELINE_OBJECTS.ray.setInput(id);

          // Auto show the rays
          if (hasRays && !getters.QUAKE_COMPONENTS_VISIBILITY.ray) {
            const newVizibility = Object.assign(
              {},
              getters.QUAKE_COMPONENTS_VISIBILITY,
              { ray: true }
            );
            commit('QUAKE_COMPONENTS_VISIBILITY_SET', newVizibility);
            dispatch('LOCAL_UPDATE_EVENTS_VISIBILITY');
          }
          dispatch('LOCAL_UPDATE_RAY_FILTER_MODE');
        });
      }
    },
    LOCAL_OPEN_EVENT({ getters }) {
      if (getters.QUAKE_PICKED_DATA) {
        const url = URLHelper.getWaveformURLForEvent(
          getters.QUAKE_PICKED_DATA.event_resource_id
        );
        const win = window.open(url, '_blank');
        win.focus();
      }
    },
    LOCAL_RESET_CAMERA({ getters }) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const interactor = getters.VIEW_LOCAL_INTERACTOR;
      renderer.resetCamera();
      const fp = renderer.getActiveCamera().getFocalPoint();
      interactor.getInteractorStyle().setCenterOfRotation(fp);

      renderer.getRenderWindow().render();
    },
    LOCAL_RESET_CAMERA_Z({ getters }) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const interactor = getters.VIEW_LOCAL_INTERACTOR;
      const camera = renderer.getActiveCamera();
      camera.set({
        focalPoint: [0, 0, 0],
        position: [0, 0, 1],
        viewUp: [0, 1, 0],
      });
      renderer.resetCamera();
      const fp = camera.getFocalPoint();
      interactor.getInteractorStyle().setCenterOfRotation(fp);

      renderer.getRenderWindow().render();
    },
    LOCAL_RENDER({ getters }) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      renderer.getRenderWindow().render();
    },
    LOCAL_VIEW_UP({ getters }) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const camera = renderer.getActiveCamera();
      const vUp = camera.getViewUp();
      let majorAxis = 0;
      let axisIdx = -1;
      for (let i = 0; i < 3; i++) {
        const currentAxis = Math.abs(vUp[i]);
        if (currentAxis > majorAxis) {
          majorAxis = currentAxis;
          axisIdx = i;
        }
      }

      const viewUp = [0, 0, 0];
      viewUp[axisIdx] = vUp[axisIdx] > 0 ? 1 : -1;
      camera.set({ viewUp });
      renderer.getRenderWindow().render();
    },
    LOCAL_ON_MINE_CHANGE({ state }, callback) {
      // FIXME xxxxxxxxxxxx
      console.log('LOCAL_ON_MINE_CHANGE', state, callback);
    },
    LOCAL_FETCH_MINE({ commit, getters, dispatch }) {
      // First, retrieve the mine plan itself
      return dispatch('HTTP_FETCH_MINES')
        .then((response) => {
          const minePlanJson = response.data[0];
          commit('LOCAL_MINE_PLAN_SET', minePlanJson);

          const bounds = minePlanJson.boundaries;
          commit('LOCAL_MINE_BOUNDS_SET', bounds);

          // Translate x, y to the center of the bounds, translate z so the ground
          // shows up as 0.
          const translate = [
            -0.5 * (bounds[0] + bounds[1]),
            -0.5 * (bounds[2] + bounds[3]),
            -bounds[5],
          ];
          commit('LOCAL_MINE_TRANSLATE_SET', translate);

          const visibilityList = ['stations'];
          const mineCategories = {};
          const minePiecesByCategory = {};
          const piecesToLoad = [];

          function pushVisibilities() {
            // const mine = Object.keys(minePiecesByCategory).map((key) => minePiecesByCategory[key]);
            commit('QUAKE_MINE_SET', Object.values(minePiecesByCategory));
            commit('QUAKE_MINE_VISIBILITY_SET', visibilityList);
          }

          function loadNextPiece() {
            if (piecesToLoad.length <= 0) {
              pushVisibilities();
              dispatch('LOCAL_RESET_CAMERA');
              return;
            }
            const nextPieceToLoad = piecesToLoad.pop();
            const url = nextPieceToLoad.file;
            const fileExtension = url.substr(url.lastIndexOf('.') + 1);

            const builder = handlePiece[fileExtension];
            const renderer = getters.VIEW_LOCAL_RENDERER;
            const context = {
              url,
              piece: nextPieceToLoad,
              translate,
              renderer,
              getters,
              commit,
            };

            if (!builder) {
              console.log(`No known reader for files of type ${fileExtension}`);
              return;
            }

            builder(context);

            // Schedule loading another piece
            setTimeout(loadNextPiece, 25);
          }

          minePlanJson.categories.forEach((cat) => {
            mineCategories[cat.name] = cat.label;
            minePiecesByCategory[cat.name] = {
              id: cat.label,
              name: cat.label,
              children: [],
            };
          });

          minePlanJson.pieces.forEach((piece) => {
            // Suddenly pieces with category 'tester' started showing up
            // without having previously been mentioned in json description
            // under "categories".
            if (piece.category in mineCategories) {
              minePiecesByCategory[piece.category].children.push({
                id: piece.label,
                name: piece.label,
              });

              if (piece.visibility === 1) {
                visibilityList.push(piece.label);
              }

              piecesToLoad.push(piece);
            }
          });

          loadNextPiece();

          return Promise.resolve();

          // const mineVisibility = [];
          // const mine = mineFromServer.map((item) =>
          //   convertMineItem(item, mineVisibility)
          // );
          // commit('QUAKE_MINE_SET', mine);
          // commit('QUAKE_MINE_VISIBILITY_SET', mineVisibility);
        })
        .catch((error) => {
          console.error('Encountered error retrieving mineplan');
          console.error(error);
          return Promise.reject('Encountered error retrieving mineplan');
        });
    },
    LOCAL_SHOW_LOCATIONS({ getters }, xyz) {
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const translate = getters.LOCAL_MINE_TRANSLATE;
      const locations = vtkLocations.newInstance({ renderer, translate });
      locations.setRadius(5);
      locations.setInput(xyz);
      renderer.addViewProp(locations);
    },
    LOCAL_UPDATE_SELECTION_DATA({ getters, commit }, selection) {
      if (!selection) {
        commit('QUAKE_PICKED_DATA_SET', null);
      } else {
        const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
        commit(
          'QUAKE_PICKED_DATA_SET',
          pipeline.seismicEvents.getSelectionData(selection) ||
            pipeline.blast.getSelectionData(selection) ||
            pipeline.historicEvents.getSelectionData(selection) ||
            pipeline.stations.getSelectionData(selection)
        );
      }
    },
    LOCAL_LIVE_UPDATE({ getters, commit, dispatch }) {
      if (LIVE_TIMEOUT) {
        clearTimeout(LIVE_TIMEOUT);
        LIVE_TIMEOUT = 0;
      }

      // Fetch events only when listening till "now"
      if (getters.QUAKE_FOCUS_PERIOD[1] > 2160) {
        dispatch('LOCAL_UPDATE_EVENTS');
      }

      // Fetch mine update
      dispatch('HTTP_FETCH_MINES').then((response) => {
        const minePlanJson = response.data[0];
        commit('LOCAL_MINE_PLAN_SET', minePlanJson);

        // fetch any missing piece
        // FIXME: @scott
      });

      // Fetch stations for status
      dispatch('HTTP_FETCH_STATIONS').then(({ data }) => {
        getters.LOCAL_PIPELINE_OBJECTS.stations.setInput(data);
      });

      // Reschedule ourself minutes => ms
      const timeout = getters.QUAKE_LIVE_MODE
        ? 30000 // 30s
        : getters.QUAKE_LIVE_REFRESH_RATE * 60 * 1000;
      LIVE_TIMEOUT = setTimeout(() => {
        dispatch('LOCAL_LIVE_UPDATE');
      }, timeout);
    },
    LOCAL_ACTIVATE_EVENT({ getters }, resourceId) {
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      if (pipeline.seismicEvents) {
        const id = pipeline.seismicEvents.getLastIdList().indexOf(resourceId);
        pipeline.seismicEvents.activate(id);
        pipeline.blast.activate(id);
      }
    },
  },
};

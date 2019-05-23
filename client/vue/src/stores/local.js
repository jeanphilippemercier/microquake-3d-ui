import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';

import DateHelper from 'paraview-quake/src/util/DateHelper';
import handlePiece from 'paraview-quake/src/pipeline/MinePieceHandler';
import URLHelper from 'paraview-quake/src/util/URLHelper';

/* eslint-disable import/no-named-as-default-member */
import vtkSeismicEvents from 'paraview-quake/src/pipeline/SeismicEvents';

const PIPELINE_ITEMS = {};

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
      console.log('PIPELINE_ITEMS', PIPELINE_ITEMS);
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
    LOCAL_INITIALIZE({ dispatch }) {
      dispatch('API_FETCH_MINE').then(() => {
        // Events need to be translated by an amount which is unknown until
        // we have successfully processed the mine plan.

        dispatch('API_UPDATE_EVENTS');
        dispatch('LOCAL_UPDATE_PRESET', 'coolwarm');

        dispatch('API_UPDATE_SCALING');
        dispatch('API_UPDATE_UNCERTAINTY_SCALING');

        // // Dynamic monitoring of the mine
        // dispatch('API_ON_MINE_CHANGE', () => {
        //   dispatch('API_FETCH_MINE');
        // });

        // const config = getters.REMOTE_CONFIG;
        // // Handle locations in url
        // if (config.locations) {
        //   commit('QUAKE_COMPONENTS_VISIBILITY_SET', {
        //     mine: true,
        //     seismicEvents: false,
        //     blast: false,
        //     historicEvents: false,
        //     ray: false,
        //     uncertainty: false,
        //   });
        //   dispatch('API_UPDATE_EVENTS_VISIBILITY');
        //   dispatch('API_SHOW_LOCATIONS', config.locations);
        // }
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
    LOCAL_UPDATE_RAY_FILTER_MODE({ state }) {
      console.log('LOCAL_UPDATE_RAY_FILTER_MODE', state);
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

      // console.log('LOCAL_UPDATE_EVENTS_VISIBILITY');
      keys.forEach((key) => {
        const visibility = componentsVisibility[key];
        // console.log(`stored visibility of ${key} is ${visibility}`);
        if (visibility !== undefined && key in pipeline) {
          console.log(`  Setting visibility of ${key} to ${visibility}`);
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
    LOCAL_UPDATE_EVENTS({ getters, dispatch }) {
      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;
      const renderer = getters.VIEW_LOCAL_RENDERER;
      const translate = getters.LOCAL_MINE_TRANSLATE;
      const mineBounds = getters.LOCAL_MINE_BOUNDS;

      const idList = [];

      const focusPeriod = getters.QUAKE_FOCUS_PERIOD;
      const historicalTime = getters.QUAKE_HISTORICAL_TIME;
      const now = DateHelper.getDateFromNow(2190 - focusPeriod[1]);
      const fTime = DateHelper.getDateFromNow(2190 - focusPeriod[0]);
      const hTime = DateHelper.getDateFromNow(historicalTime);

      if (!mineBounds) {
        // console.error('No mine bounds set yet, cannot update events');
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

        pipeline.historicEvents = vtkSeismicEvents.newInstance({
          translate,
          renderer,
          mineBounds,
        });

        renderer.addViewProp(pipeline.seismicEvents);
        renderer.addViewProp(pipeline.blast);
        renderer.addViewProp(pipeline.historicEvents);
      }

      // Get the events
      dispatch('HTTP_FETCH_EVENTS', [fTime, now])
        .then((response) => {
          const focusTS = new Date(fTime) / 10000;
          const nowTS = new Date(now) / 10000;
          pipeline.seismicEvents.setInput(response.data, idList);
          pipeline.seismicEvents.updateColorRange(focusTS, nowTS);
          pipeline.blast.setInput(response.data, idList);
          pipeline.blast.updateColorRange(focusTS, nowTS);
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
        });

      dispatch('HTTP_FETCH_EVENTS', [hTime, fTime])
        .then((response) => {
          pipeline.historicEvents.setInput(response.data);
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
        });
    },
    LOCAL_UPDATE_MINE_VISIBILITY({ getters }) {
      // console.log('LOCAL_UPDATE_MINE_VISIBILITY');
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
    LOCAL_SHOW_RAY({ state }) {
      // FIXME xxxxxxxxxxxx
      console.log('LOCAL_SHOW_RAY', state);
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
          console.log(`Just set mine bounds to ${bounds}`);

          // Translate x, y to the center of the bounds, translate z so the ground
          // shows up as 0.
          const translate = [
            -0.5 * (bounds[0] + bounds[1]),
            -0.5 * (bounds[2] + bounds[3]),
            -bounds[5],
          ];
          commit('LOCAL_MINE_TRANSLATE_SET', translate);

          const visibilityList = [];
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
              console.log('Finished loading pieces');
              pushVisibilities();
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
          // console.error('Encountered error retrieving mineplan');
          console.error(error);
          return Promise.reject('Encountered error retrieving mineplan');
        });
    },
    LOCAL_SHOW_LOCATIONS({ state }) {
      // FIXME xxxxxxxxxxxx
      console.log('LOCAL_SHOW_LOCATIONS', state);
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
            pipeline.historicEvents.getSelectionData(selection)
        );
      }
    },
  },
};

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';

import DateHelper from 'paraview-quake/src/util/DateHelper';

const UNCERTAINTY_CAP = 50.0;

const PIECE_HANDLERS = {
  vtp: (context) => {
    const { url, piece, translate, renderer, getters } = context;

    const reader = vtkXMLPolyDataReader.newInstance();
    reader.setUrl(url).then(() => {
      const polydata = reader.getOutputData(0);
      const points = polydata.getPoints().getData();

      // Apply tranformation to the points coordinates
      vtkMatrixBuilder
        .buildFromRadian()
        .translate(...translate)
        .apply(points);

      polydata.getPoints().setData(points, 3);

      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();

      actor.setMapper(mapper);
      mapper.setInputData(polydata);

      renderer.addActor(actor);

      renderer.resetCamera();
      renderer.getRenderWindow().render();

      const pipeline = getters.LOCAL_PIPELINE_OBJECTS;

      const pipelineObject = {
        getProp: () => actor,
        setVisibility: (visibility) => {
          actor.setVisibility(visibility);
          renderer.getRenderWindow().render();
        },
      };

      pipeline[piece.label] = pipelineObject;
    });
  },
  jpg: (context) => {
    const { url, piece, translate, renderer, getters } = context;

    const origin = piece.extra_json_attributes.origin || [0, 0, 0];
    const point1 = piece.extra_json_attributes.point1 || [0, 0, 0];
    const point2 = piece.extra_json_attributes.point2 || [0, 0, 0];

    const planeSource = vtkPlaneSource.newInstance({
      xResolution: 1,
      yResolution: 1,
      origin: [
        origin[0] + translate[0],
        origin[1] + translate[1],
        origin[2] + translate[2],
      ],
      point1: [
        point1[0] + translate[0],
        point1[1] + translate[1],
        point1[2] + translate[2],
      ],
      point2: [
        point2[0] + translate[0],
        point2[1] + translate[1],
        point2[2] + translate[2],
      ],
    });

    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();

    // actor.getProperty().setRepresentation(Representation.WIREFRAME);
    mapper.setInputConnection(planeSource.getOutputPort());
    actor.setMapper(mapper);

    renderer.addActor(actor);
    renderer.resetCamera();
    renderer.getRenderWindow().render();

    // Download and apply Texture
    const img = new Image();
    img.onload = function textureLoaded() {
      const texture = vtkTexture.newInstance();
      texture.setInterpolate(true);
      texture.setImage(img);
      actor.addTexture(texture);
      // renderWindow.render();
    };
    img.src = url;

    const pipeline = getters.LOCAL_PIPELINE_OBJECTS;

    const pipelineObject = {
      getProp: () => actor,
      setVisibility: (visibility) => {
        actor.setVisibility(visibility);
        renderer.getRenderWindow().render();
      },
    };

    pipeline[piece.label] = pipelineObject;
  },
};

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
    LOCAL_PIPELINE_OBJECTS(state) {
      return state.pipelineObjects;
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
      state.pipelineObjects = objects;
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

        // dispatch('API_UPDATE_SCALING');
        // dispatch('API_UPDATE_UNCERTAINTY_SCALING');

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
    LOCAL_UPDATE_UNCERTAINTY_SCALING({ state }) {
      console.log('LOCAL_UPDATE_UNCERTAINTY_SCALING', state);
    },
    LOCAL_UPDATE_SCALING({ state }) {
      console.log('LOCAL_UPDATE_SCALING', state);
    },
    LOCAL_UPDATE_PRESET({ state }, preset) {
      console.log('LOCAL_UPDATE_PRESET', state, preset);
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

      console.log('LOCAL_UPDATE_EVENTS_VISIBILITY');
      keys.forEach((key) => {
        const visibility = componentsVisibility[key];
        console.log(`stored visibility of ${key} is ${visibility}`);
        if (visibility !== undefined && key in pipeline) {
          console.log(`  Setting visibility of ${key} to ${visibility}`);
          pipeline[key].setVisibility(visibility);
        }
      });
    },
    LOCAL_UPDATE_EVENTS({ getters, dispatch }) {
      const focusPeriod = getters.QUAKE_FOCUS_PERIOD;
      const historicalTime = getters.QUAKE_HISTORICAL_TIME;
      const now = DateHelper.getDateFromNow(2190 - focusPeriod[1]);
      const fTime = DateHelper.getDateFromNow(2190 - focusPeriod[0]);
      const hTime = DateHelper.getDateFromNow(historicalTime);
      // const monitorEvents = focusPeriod[1] > 2160;

      const mineBounds = getters.LOCAL_MINE_BOUNDS;
      if (!mineBounds) {
        // console.error('No mine bounds set yet, cannot update events');
        return Promise.reject('No mine bounds set yet, cannot update events');
      }
      const idList = [];

      function filterEvents(eventData, typeFilter) {
        return eventData.filter((event) => {
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

      /*
        param: eventType: 'focus' or 'historical'
        param: eventData: array of event objects retrieved from seismic-api
        param: typeFilter: 'earthquake', 'explosion', or 'all'
      */
      function buildEventsPipeline(eventType, eventData, typeFilter = 'all') {
        const translate = getters.LOCAL_MINE_TRANSLATE;
        const filteredEvents = filterEvents(eventData, typeFilter);
        const numEvents = filteredEvents.length;

        // One of 'seismicEvents', 'blast', or 'historicEvents'
        let pipelineKey = 'historicEvents';
        if (eventType === 'focus') {
          pipelineKey = typeFilter === 'earthquake' ? 'seismicEvents' : 'blast';
        }

        console.log(
          `LOCAL_UPDATE_EVENTS found ${numEvents} ${eventType} (${typeFilter}) events, translating to ${translate}`
        );

        const polydata = vtkPolyData.newInstance();
        const points = vtkPoints.newInstance();
        const pointData = new Float32Array(3 * numEvents);
        points.setNumberOfPoints(numEvents);
        const verts = new Uint32Array(2 * numEvents);

        /*
        magnitude                            vtkFloatArray          Float32Array
        time                                 vtkUnsignedLongArray   BigUint64Array
        id                                   vtkUnsignedIntArray    Uint32Array
        uncertainty                          vtkFloatArray          Float32Array
        direction (uncertainty_direction)    vtkFloatArray          Float32Array
        */
        const magnitudeArray = vtkDataArray.newInstance({
          name: 'magnitude',
          numberOfComponents: 1,
          values: new Float32Array(numEvents),
        });

        const timeArray = vtkDataArray.newInstance({
          name: 'time',
          numberOfComponents: 1,
          // FIXME: Rather have long int here, if there is one
          values: new Uint32Array(numEvents),
        });

        const idArray = vtkDataArray.newInstance({
          name: 'id',
          numberOfComponents: 1,
          values: new Uint32Array(numEvents),
        });

        const uncertaintyArray = vtkDataArray.newInstance({
          name: 'uncertainty',
          numberOfComponents: 1,
          values: new Float32Array(numEvents),
        });

        const uncertaintyDirectionArray = vtkDataArray.newInstance({
          name: 'uncertainty_direction',
          numberOfComponents: 3,
          values: new Float32Array(numEvents * 3),
        });

        for (let i = 0; i < numEvents; ++i) {
          const event = filteredEvents[i];
          pointData[3 * i] = event.x + translate[0];
          pointData[3 * i + 1] = event.y + translate[1];
          pointData[3 * i + 2] = event.z + translate[2];

          verts[2 * i] = 1;
          verts[2 * i + 1] = i;

          if (event.hasOwnProperty('uncertainty')) {
            const value = parseFloat(event.uncertainty);
            if (value > UNCERTAINTY_CAP) {
              uncertaintyArray.getData()[i] = UNCERTAINTY_CAP;
            } else {
              uncertaintyArray.getData()[i] = value;
            }
          } else {
            uncertaintyArray.getData()[i] = 0.0;
          }

          if (
            event.hasOwnProperty('uncertainty_vector_x') &&
            event.hasOwnProperty('uncertainty_vector_y') &&
            event.hasOwnProperty('uncertainty_vector_z')
          ) {
            uncertaintyDirectionArray.getData()[3 * i] =
              event.uncertainty_vector_x;
            uncertaintyDirectionArray.getData()[3 * i + 1] =
              event.uncertainty_vector_y;
            uncertaintyDirectionArray.getData()[3 * i + 2] =
              event.uncertainty_vector_z;
          } else {
            uncertaintyDirectionArray.getData()[3 * i] = 0.0;
            uncertaintyDirectionArray.getData()[3 * i + 1] = 0.0;
            uncertaintyDirectionArray.getData()[3 * i + 2] = 1.0;
          }

          magnitudeArray.getData()[i] = event.magnitude;
          timeArray.getData()[i] = event.time_epoch;
          idArray.getData()[i] = idList.length;

          idList.push(event.event_resource_id);
        }

        points.setData(pointData);
        polydata.setPoints(points);
        polydata.getVerts().setData(verts);
        polydata.getPointData().addArray(magnitudeArray);
        polydata.getPointData().addArray(timeArray);
        polydata.getPointData().addArray(idArray);
        polydata.getPointData().addArray(uncertaintyArray);
        polydata.getPointData().addArray(uncertaintyDirectionArray);

        const renderer = getters.VIEW_LOCAL_RENDERER;
        const mapper = vtkSphereMapper.newInstance();
        const actor = vtkActor.newInstance();

        actor.setMapper(mapper);
        mapper.setRadius(20);
        mapper.setInputData(polydata);

        renderer.addActor(actor);

        renderer.resetCamera();
        renderer.getRenderWindow().render();

        const pipeline = getters.LOCAL_PIPELINE_OBJECTS;

        const pipelineObject = {
          getProp: () => actor,
          setVisibility: (visibility) => {
            actor.setVisibility(visibility);
            renderer.getRenderWindow().render();
          },
        };

        pipeline[pipelineKey] = pipelineObject;
      }

      // Get the events
      dispatch('HTTP_FETCH_EVENTS', [fTime, now])
        .then((response) => {
          buildEventsPipeline('focus', response.data, 'earthquake');
          buildEventsPipeline('focus', response.data, 'explosion');
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
        });

      dispatch('HTTP_FETCH_EVENTS', [hTime, fTime])
        .then((response) => {
          buildEventsPipeline('historical', response.data);
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
        });
    },
    LOCAL_UPDATE_MINE_VISIBILITY({ getters, commit }) {
      console.log('LOCAL_UPDATE_MINE_VISIBILITY');
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

      commit('LOCAL_PIPELINE_OBJECTS_SET', pipeline);

      // fillVisibilityMap(getters.QUAKE_MINE, visibilityMap);
      // if (getters.QUAKE_COMPONENTS_VISIBILITY.mine) {
      //   getters.QUAKE_MINE_VISIBILITY.forEach((name) => {
      //     visibilityMap[name] = true;
      //   });
      // }
    },
    LOCAL_EVENT_PICKING({ commit, dispatch }, [x, y]) {
      commit('QUAKE_PICKING_POSITION_SET', [x, y]);
      dispatch('REMOTE_UPDATE_PICKING');
    },
    LOCAL_UPDATE_CENTER_OF_ROTATION({ state }, position) {
      console.log('LOCAL_UPDATE_CENTER_OF_ROTATION', state, position);
    },
    LOCAL_SHOW_RAY({ state }) {
      console.log('LOCAL_SHOW_RAY', state);
    },
    LOCAL_OPEN_EVENT({ state }) {
      console.log('LOCAL_OPEN_EVENT', state);
    },
    LOCAL_RESET_CAMERA({ state }) {
      console.log('LOCAL_RESET_CAMERA', state);
    },
    LOCAL_RENDER({ state }) {
      console.log('LOCAL_RENDER', state);
    },
    LOCAL_VIEW_UP({ state }) {
      console.log('LOCAL_VIEW_UP', state);
    },
    LOCAL_ON_MINE_CHANGE({ state }, callback) {
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

            const builder = PIECE_HANDLERS[fileExtension];
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
      console.log('LOCAL_SHOW_LOCATIONS', state);
    },
  },
};

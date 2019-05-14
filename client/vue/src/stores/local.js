import axios from 'axios';

import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

const READER_MAPPING = {
  vtp: (responseData) => {
    const reader = vtkXMLPolyDataReader.newInstance();
    reader.parseAsArrayBuffer(responseData);
    return reader.getOutputData(0);
  },
};

export default {
  state: {
    mineBounds: [0.0, 1.0, 0.0, 1.0, 0.0, 1.0],
    mineTranslate: [0.0, 0.0, 0.0],
    minePlan: null,
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
  },
  actions: {
    //-----------------------------------------------------------------------
    // Public (processing) API
    //-----------------------------------------------------------------------
    LOCAL_INITIALIZE({ dispatch }) {
      dispatch('HTTP_FETCH_MINES');
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
    LOCAL_UPDATE_EVENTS_VISIBILITY({ state }) {
      console.log('LOCAL_UPDATE_EVENTS_VISIBILITY', state);
    },
    LOCAL_UPDATE_EVENTS({ state }) {
      console.log('LOCAL_UPDATE_EVENTS', state);
    },
    LOCAL_UPDATE_MINE_VISIBILITY({ state }) {
      console.log('LOCAL_UPDATE_MINE_VISIBILITY', state);
    },
    LOCAL_EVENT_PICKING({ state }, [x, y]) {
      console.log('LOCAL_EVENT_PICKING', state, x, y);
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
    LOCAL_FETCH_MINE({ state }) {
      console.log('LOCAL_FETCH_MINE', state);
    },
    LOCAL_SHOW_LOCATIONS({ state }) {
      console.log('LOCAL_SHOW_LOCATIONS', state);
    },
    //-----------------------------------------------------------------------
    // Implementation
    //-----------------------------------------------------------------------
    LOCAL_UPDATE_MINE_PLAN({ getters, commit }) {
      const minePlanJson = getters.LOCAL_MINE_PLAN[0];

      // The mineplan itself has:
      //   boundaries: [650200, 652700, 4766170, 4768695, -500, 1200]
      //   categories: [{label: l1, name: n1}, ...]
      //   description: "Mine plan for 3d-UI"
      //   network: 1
      //   pieces: []
      //   site: 1
      //   upload_time: "2019-04-01T23:00:59.170975Z"

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

      const piecesToLoad = [];

      function loadNextPiece() {
        if (piecesToLoad.length <= 0) {
          console.log('Finished loading pieces');
          return;
        }
        const nextPieceToLoad = piecesToLoad.pop();
        const url = nextPieceToLoad.file;
        const fileExtension = url.substr(url.lastIndexOf('.') + 1);

        const request = {
          url,
          method: 'get',
          responseType: 'arraybuffer',
        };

        axios(request)
          .then((result) => {
            const builder = READER_MAPPING[fileExtension];

            if (!builder) {
              console.log(`No known reader for files of type ${fileExtension}`);
              return;
            }

            const polydata = builder(result.data);

            console.log('Here is the polydata I got:');
            console.log(polydata);

            const renderer = getters.VIEW_LOCAL_RENDERER;
            const mapper = vtkMapper.newInstance();
            const actor = vtkActor.newInstance();

            actor.setMapper(mapper);
            mapper.setInputData(polydata);

            renderer.addActor(actor);

            renderer.resetCamera();
          })
          .catch((error) => {
            console.log(`Failed to load piece: ${url}`);
            console.log(error);
          });

        // Schedule loading another piece
        setTimeout(loadNextPiece, 25);
      }

      minePlanJson.pieces.forEach((piece) => {
        piecesToLoad.push(piece);
      });

      loadNextPiece();

      // Each piece has:
      //   category: "plan"
      //   extra_json_attributes
      //   file: "https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/mineplans/Mineplan_milestone3.vtp"
      //   id: 13
      //   label: "Milestone"
      //   mineplan: 1
      //   sha: "949c63542e48fbfc1f5eef0e159640f9a9ca2f1a1e2cce6e900a45d31f50611b"
      //   type: "lines"
      //   visibility: 1

      // Computing sha256 and hex digest in javascript:
      // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    },
  },
};

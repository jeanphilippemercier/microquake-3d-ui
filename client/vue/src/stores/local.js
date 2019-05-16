import axios from 'axios';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const PIECE_HANDLERS = {
  vtp: (context) => {
    const { url, piece, translate, renderer } = context;

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
    });
  },
  jpg: (context) => {
    const { url, piece, translate, renderer } = context;

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
    LOCAL_INITIALIZE({ getters, commit, dispatch }) {
      // Retrieve the mine files
      dispatch('HTTP_FETCH_MINES')
        .then((response) => {
          console.log('Got mine plan');
          console.log(response);
          commit('LOCAL_MINE_PLAN_SET', response);
          dispatch('LOCAL_UPDATE_MINE_PLAN');
        }).catch((error) => {
          console.error('Encountered error retrieving mineplan');
          console.error(error);
        });

      // Get the events
      dispatch('HTTP_FETCH_EVENTS')
        .then((response) => {
          const translate = getters.LOCAL_MINE_TRANSLATE;
          const numPoints = response.length;
          const polydata = vtkPolyData.newInstance();
          const points = vtkPoints.newInstance();
          const pointData = new Float32Array(3 * numPoints);
          points.setNumberOfPoints(numPoints);
          const verts = new Uint32Array(2 * numPoints);

          for (let i = 0; i < numPoints; ++i) {
            const event = response[i];
            pointData[3 * i] = event.x + translate[0];
            pointData[3 * i + 1] = event.y + translate[1];
            pointData[3 * i + 2] = event.z + translate[2];

            verts[2 * i] = 1;
            verts[2 * i + 1] = i;
          }

          points.setData(pointData);
          polydata.setPoints(points);
          polydata.getVerts().setData(verts);

          const renderer = getters.VIEW_LOCAL_RENDERER;
          const mapper = vtkSphereMapper.newInstance();
          const actor = vtkActor.newInstance();

          actor.setMapper(mapper);
          mapper.setRadius(20);
          mapper.setInputData(polydata);

          renderer.addActor(actor);

          renderer.resetCamera();
        })
        .catch((error) => {
          console.error('Encountered error retrieving events');
          console.error(error);
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
      // console.log('LOCAL_EVENT_PICKING', state, x, y);
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

        const builder = PIECE_HANDLERS[fileExtension];
        const renderer = getters.VIEW_LOCAL_RENDERER;
        const context = { url, piece: nextPieceToLoad, translate, renderer };

        if (!builder) {
          console.log(`No known reader for files of type ${fileExtension}`);
          return;
        }

        builder(context);

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

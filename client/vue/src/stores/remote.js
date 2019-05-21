import Client from 'paraview-quake/src/io/Client';
import DateHelper from 'paraview-quake/src/util/DateHelper';
import URLHelper from 'paraview-quake/src/util/URLHelper';

function fillVisibilityMap(nodes, visibilityMap) {
  if (!nodes) {
    return;
  }
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    visibilityMap[node.id] = false;
    fillVisibilityMap(node.children, visibilityMap);
  }
}

function convertMineItem(node, visibilityList) {
  const { name, checked, pieces } = node;
  const response = {
    id: name,
    name,
  };

  if (checked) {
    visibilityList.push(name);
  }

  if (pieces) {
    response.children = pieces
      ? node.pieces.map((n) => convertMineItem(n, visibilityList))
      : null;
  }

  return response;
}

const NoOp = () => {};

function networkDebounce(
  localAction,
  pvwAction,
  argExtract,
  respHandler = NoOp
) {
  let pendingRequest = 0;

  return (ctx) => {
    pendingRequest++;
    if (pendingRequest === 1) {
      return ctx
        .dispatch(pvwAction, argExtract(ctx))
        .then((response) => {
          respHandler(ctx, response);
          pendingRequest--;
          if (pendingRequest) {
            pendingRequest = 0;
            return ctx.dispatch(localAction);
          }
        })
        .catch((e) => {
          if (ctx.getters.REMOTE_CLIENT) {
            console.error(e);
          }
          pendingRequest = 0;
        });
    }
  };
}

const updatePickingDebouncedMethod = networkDebounce(
  'REMOTE_UPDATE_PICKING',
  'PVW_EVENT_PICKING',
  ({ getters }) => getters.QUAKE_PICKING_POSITION,
  ({ commit }, data) => {
    commit('QUAKE_PICKED_DATA_SET', data && data.magnitude ? data : null);
  }
);

const updateUncertaintyScalingDebouncer = networkDebounce(
  'REMOTE_UPDATE_UNCERTAINTY_SCALING',
  'PVW_UPDATE_UNCERTAINTY_SCALING',
  ({ getters }) => getters.QUAKE_UNCERTAINTY_SCALE_FACTOR
);

const updateScalingDebouncer = networkDebounce(
  'REMOTE_UPDATE_SCALING',
  'PVW_UPDATE_SCALING',
  ({ getters }) => [getters.QUAKE_MAGNITUDE_RANGE, getters.QUAKE_SCALING_RANGE]
);

const updateEventsDebouncer = networkDebounce(
  'REMOTE_UPDATE_EVENTS',
  'PVW_UPDATE_EVENTS',
  ({ getters }) => {
    const focusPeriod = getters.QUAKE_FOCUS_PERIOD;
    const historicalTime = getters.QUAKE_HISTORICAL_TIME;
    const now = DateHelper.getDateFromNow(2190 - focusPeriod[1]);
    const fTime = DateHelper.getDateFromNow(2190 - focusPeriod[0]);
    const hTime = DateHelper.getDateFromNow(historicalTime);
    const monitorEvents = focusPeriod[1] > 2160;
    return [now, fTime, hTime, monitorEvents];
  }
);

export default {
  state: {
    errorMessage: null,
    client: null,
    config: null,
  },
  getters: {
    REMOTE_CLIENT(state) {
      return state.client;
    },
    REMOTE_CONFIG(state) {
      return state.config;
    },
    REMOTE_ERROR(state) {
      return state.errorMessage;
    },
  },
  mutations: {
    REMOTE_CLIENT_SET(state, client) {
      state.client = client;
    },
    REMOTE_CONFIG_SET(state, config) {
      state.config = config;
    },
    REMOTE_ERROR_SET(state, value) {
      state.errorMessage = value;
    },
  },
  actions: {
    REMOTE_INITIALIZE({ state, commit, dispatch }) {
      const { config, client } = state;
      if (client && client.isConnected()) {
        client.disconnect();
      }
      const clientToConnect = client || new Client();

      clientToConnect.setBusyCallback((count) => {
        commit('BUSY_COUNT_SET', count);
      });

      clientToConnect.updateBusy(+1);

      clientToConnect.setConnectionErrorCallback((type, httpReq) => {
        const message =
          (httpReq && httpReq.response && httpReq.response.error) ||
          `Connection ${type}`;
        commit('REMOTE_ERROR_SET', message);
        console.error(message);
        console.log(httpReq);
      });

      return clientToConnect
        .connect(config)
        .then((validClient) => {
          commit('REMOTE_CLIENT_SET', validClient);
          dispatch('PVW_UPDATE_ACCESS_INFORMATION')
            .then(() => {
              dispatch('API_FETCH_MINE');
              dispatch('API_UPDATE_EVENTS');
              dispatch('API_UPDATE_SCALING');
              dispatch('API_UPDATE_UNCERTAINTY_SCALING');
              clientToConnect.updateBusy(-1);

              // Dynamic monitoring of the mine
              dispatch('API_ON_MINE_CHANGE', () => {
                dispatch('API_FETCH_MINE');
              });

              // Handle locations in url
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
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    },
    REMOTE_UPDATE_UNCERTAINTY_SCALING(ctx) {
      updateUncertaintyScalingDebouncer(ctx);
    },
    REMOTE_UPDATE_SCALING(ctx) {
      updateScalingDebouncer(ctx);
    },
    REMOTE_UPDATE_PRESET({ commit, dispatch }, preset) {
      commit('QUAKE_COLOR_PRESET_SET', preset);
      return dispatch('PVW_UPDATE_PRESET', preset);
    },
    REMOTE_UPDATE_RAY_FILTER_MODE({ getters, dispatch }) {
      const prefOrigRange = [0.0, 1.0];
      const arrivalRange = [0.0, 1.0];
      switch (getters.QUAKE_RAY_FILTER_MODE) {
        case 0:
          // Preferred origin + arrival
          prefOrigRange[0] = 1.0;
          arrivalRange[0] = 1.0;
          break;
        case 1:
          // Preferred origin
          prefOrigRange[0] = 1.0;
          break;
        default:
          // All rays, already set
          break;
      }
      return dispatch('PVW_UPDATE_RAY_FILTER_MODE', [
        prefOrigRange,
        arrivalRange,
      ]);
    },
    REMOTE_UPDATE_EVENTS_VISIBILITY({ getters, dispatch }) {
      const visibilityMap = {
        quake: getters.QUAKE_COMPONENTS_VISIBILITY.seismicEvents,
        blast: getters.QUAKE_COMPONENTS_VISIBILITY.blast,
        historical: getters.QUAKE_COMPONENTS_VISIBILITY.historicEvents,
        ray: getters.QUAKE_COMPONENTS_VISIBILITY.ray,
        uncertainty: getters.QUAKE_COMPONENTS_VISIBILITY.uncertainty,
      };
      return dispatch('PVW_UPDATE_EVENTS_VISIBILITY', visibilityMap);
    },
    REMOTE_UPDATE_EVENTS(ctx) {
      updateEventsDebouncer(ctx);
    },
    REMOTE_UPDATE_MINE_VISIBILITY({ getters, dispatch }) {
      const visibilityMap = {};
      fillVisibilityMap(getters.QUAKE_MINE, visibilityMap);
      if (getters.QUAKE_COMPONENTS_VISIBILITY.mine) {
        getters.QUAKE_MINE_VISIBILITY.forEach((name) => {
          visibilityMap[name] = true;
        });
      }
      return dispatch('PVW_UPDATE_MINE_VISIBILITY', visibilityMap);
    },
    REMOTE_UPDATE_PICKING(ctx) {
      updatePickingDebouncedMethod(ctx);
    },
    REMOTE_EVENT_PICKING({ dispatch, commit }, [x, y]) {
      commit('QUAKE_PICKING_POSITION_SET', [x, y]);
      dispatch('REMOTE_UPDATE_PICKING');
    },
    REMOTE_UPDATE_CENTER_OF_ROTATION({ commit, dispatch }, position) {
      commit('QUAKE_PICKING_CENTER_OF_ROTATION_SET', false);
      return dispatch('PVW_UPDATE_CENTER_OF_ROTATION', position)
        .then((camera) => {
          dispatch('VIEW_UPDATE_CAMERA', camera);
          return camera;
        })
        .catch(console.error);
    },
    REMOTE_SHOW_RAY({ getters, commit, dispatch }) {
      if (getters.QUAKE_PICKED_DATA) {
        return dispatch('PVW_SHOW_RAY', getters.QUAKE_PICKED_DATA.id).then(
          ([eventResourceId, nbRays]) => {
            commit(
              'QUAKE_RAY_MAPPING_SET',
              Object.assign({}, getters.QUAKE_RAY_MAPPING, {
                [eventResourceId]: nbRays,
              })
            );
            const hasRays = nbRays > 0;
            commit('QUAKE_RAYS_IN_SCENE_SET', hasRays);

            // Auto show the rays
            if (hasRays && !getters.QUAKE_COMPONENTS_VISIBILITY.ray) {
              const newVizibility = Object.assign(
                {},
                getters.QUAKE_COMPONENTS_VISIBILITY,
                { ray: true }
              );
              commit('QUAKE_COMPONENTS_VISIBILITY_SET', newVizibility);
              dispatch('REMOTE_UPDATE_EVENTS_VISIBILITY');
            }
          }
        );
      }
    },
    REMOTE_OPEN_EVENT({ getters, dispatch }) {
      if (getters.QUAKE_PICKED_DATA) {
        return dispatch('PVW_OPEN_EVENT', getters.QUAKE_PICKED_DATA.id).then(
          (id) => {
            const url = URLHelper.getWaveformURLForEvent(id);
            const win = window.open(url, '_blank');
            win.focus();
          }
        );
      }
    },
    REMOTE_RESET_CAMERA({ dispatch }) {
      return dispatch('PVW_RESET_CAMERA')
        .then((camera) => {
          dispatch('VIEW_UPDATE_CAMERA', camera);
          return camera;
        })
        .catch(console.error);
    },
    REMOTE_RENDER({ dispatch }) {
      return dispatch('PVW_RENDER')
        .then((camera) => {
          dispatch('VIEW_UPDATE_CAMERA', camera);
          return camera;
        })
        .catch(console.error);
    },
    REMOTE_VIEW_UP({ dispatch }) {
      return dispatch('PVW_VIEW_UP')
        .then((camera) => {
          dispatch('VIEW_UPDATE_CAMERA', camera);
          return camera;
        })
        .catch(console.error);
    },
    REMOTE_ON_MINE_CHANGE({ dispatch }, callback) {
      return dispatch('PVW_ON_MINE_CHANGE', callback);
    },
    REMOTE_FETCH_MINE({ commit, dispatch }) {
      return dispatch('PVW_FETCH_MINE').then((mineFromServer) => {
        const mineVisibility = [];
        const mine = mineFromServer.map((item) =>
          convertMineItem(item, mineVisibility)
        );
        commit('QUAKE_MINE_SET', mine);
        commit('QUAKE_MINE_VISIBILITY_SET', mineVisibility);
      });
    },
    REMOTE_SHOW_LOCATIONS({ dispatch }, locations) {
      return dispatch('PVW_SHOW_LOCATIONS', locations);
    },
  },
};

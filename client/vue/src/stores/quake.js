/* eslint-disable no-unused-vars */
import { Mutations } from 'paraview-quake/src/stores/TYPES';
import DateHelper from 'paraview-quake/src/util/DateHelper';
import PRESETS from 'paraview-quake/src/presets';

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

export default {
  state: {
    mine: [],
    mineVisibility: [],
    componentsVisibility: {
      mine: true,
      seismicEvents: true,
      blast: true,
      historicEvents: true,
    },
    scalingRange: [0.1, 1],
    magnitudeRange: [-2, 3],
    preset: 'coolwarm',
    presets: PRESETS,
    historicalTime: 0,
    focusPeriod: [0, 2190],
    busyUpdateEvents: 0,
    busyUpdateScaleFunction: 0,
  },
  getters: {
    QUAKE_MINE(state) {
      return state.mine;
    },
    QUAKE_MINE_VISIBILITY(state) {
      return state.mineVisibility;
    },
    QUAKE_COLOR_PRESET(state) {
      return state.preset;
    },
    QUAKE_COLOR_PRESETS(state) {
      return state.presets;
    },
    QUAKE_SCALING_RANGE(state) {
      return state.scalingRange;
    },
    QUAKE_MAGNITUDE_RANGE(state) {
      return state.magnitudeRange;
    },
    QUAKE_COMPONENTS_VISIBILITY(state) {
      return state.componentsVisibility;
    },
    QUAKE_HISTORICAL_TIME(state) {
      return state.historicalTime;
    },
    QUAKE_FOCUS_PERIOD(state) {
      return state.focusPeriod;
    },
  },
  mutations: {
    QUAKE_MINE_SET(state, value) {
      state.mine = value;
    },
    QUAKE_MINE_VISIBILITY_SET(state, value) {
      state.mineVisibility = value;
    },
    QUAKE_COLOR_PRESET_SET(state, value) {
      state.preset = value;
    },
    QUAKE_SCALING_RANGE_SET(state, value) {
      state.scalingRange = value;
    },
    QUAKE_MAGNITUDE_RANGE_SET(state, value) {
      state.magnitudeRange = value;
    },
    QUAKE_COMPONENTS_VISIBILITY_SET(state, value) {
      state.componentsVisibility = value;
    },
    QUAKE_HISTORICAL_TIME_SET(state, value) {
      state.historicalTime = value;
    },
    QUAKE_FOCUS_PERIOD_SET(state, value) {
      state.focusPeriod = value;
    },
  },
  actions: {
    QUAKE_FETCH_MINE({ rootState, commit }) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Quake.getMineDescription()
          .then((mineFromServer) => {
            const mineVisibility = [];
            const mine = mineFromServer.map((item) =>
              convertMineItem(item, mineVisibility)
            );
            commit(Mutations.QUAKE_MINE_SET, mine);
            commit(Mutations.QUAKE_MINE_VISIBILITY_SET, mineVisibility);
          })
          .catch(console.error);
      } else {
        console.error('no client', rootState);
      }
    },
    QUAKE_UPDATE_MINE_VISIBILITY({ rootState, state }) {
      const client = rootState.network.client;
      if (client) {
        if (state.componentsVisibility.mine) {
          const visibilityMap = {};
          state.mineVisibility.forEach((name) => {
            visibilityMap[name] = true;
          });
          client.remote.Quake.updateMineVisibility(visibilityMap);
        } else {
          client.remote.Quake.updateMineVisibility({});
        }
      }
    },
    QUAKE_UPDATE_EVENTS_VISIBILITY({ rootState, state }) {
      const client = rootState.network.client;
      if (client) {
        // quake, blast, historical
        const visibilityMap = {
          quake: state.componentsVisibility.seismicEvents,
          blast: state.componentsVisibility.blast,
          historical: state.componentsVisibility.historicEvents,
        };
        client.remote.Quake.updateVisibility(visibilityMap);
      }
    },
    QUAKE_UPDATE_PRESET({ rootState, state, commit }, preset) {
      commit(Mutations.QUAKE_COLOR_PRESET_SET, preset);
      const client = rootState.network.client;
      if (client) {
        client.remote.Quake.updatePreset(preset);
      }
    },
    QUAKE_UPDATE_EVENTS({ rootState, state, dispatch }) {
      const client = rootState.network.client;
      if (client) {
        state.busyUpdateEvents++;
        if (state.busyUpdateEvents === 1) {
          const now = DateHelper.getDateFromNow(2190 - state.focusPeriod[1]);
          const fTime = DateHelper.getDateFromNow(2190 - state.focusPeriod[0]);
          const hTime = DateHelper.getDateFromNow(state.historicalTime);
          client.remote.Quake.updateEvents(now, fTime, hTime).then(() => {
            state.busyUpdateEvents--;
            if (state.busyUpdateEvents) {
              state.busyUpdateEvents = 0;
              dispatch('QUAKE_UPDATE_EVENTS');
            }
          });
        }
      }
    },
    QUAKE_UPDATE_SCALING({ rootState, state, dispatch }) {
      const client = rootState.network.client;
      if (client) {
        state.busyUpdateScaleFunction++;
        if (state.busyUpdateScaleFunction === 1) {
          const dataRange = state.magnitudeRange;
          const sizeRange = state.scalingRange;
          client.remote.Quake.updateScaleFunction(dataRange, sizeRange).then(
            () => {
              state.busyUpdateScaleFunction--;
              if (state.busyUpdateScaleFunction) {
                state.busyUpdateScaleFunction = 0;
                dispatch('QUAKE_UPDATE_SCALING');
              }
            }
          );
        }
      }
    },
  },
};

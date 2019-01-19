/* eslint-disable no-unused-vars */
import { Mutations } from 'paraview-quake/src/stores/TYPES';
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
    scalingRange: [0.1, 1],
    magnitudeRange: [-2, 3],
    preset: 'cool2warm',
    presets: PRESETS,
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
    QUAKE_UPDATE_MINE_VISIBILITY({ rootState, commit }, visibleList) {
      const client = rootState.network.client;
      commit(Mutations.QUAKE_MINE_VISIBILITY_SET, visibleList);

      if (client) {
        const visibilityMap = {};
        visibleList.forEach((name) => {
          visibilityMap[name] = true;
        });
        client.remote.Quake.updateMineVisibility(visibilityMap);
      }
    },
  },
};

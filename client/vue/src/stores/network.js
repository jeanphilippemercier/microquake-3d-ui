import Client from 'paraview-quake/src/io/Client';
import { Actions, Mutations } from 'paraview-quake/src/stores/TYPES';

export default {
  state: {
    client: null,
    config: null,
  },
  getters: {
    NETWORK_CLIENT(state) {
      return state.client;
    },
    NETWORK_CONFIG(state) {
      return state.config;
    },
  },
  mutations: {
    NETWORK_CLIENT_SET(state, client) {
      state.client = client;
    },
    NETWORK_CONFIG_SET(state, config) {
      state.config = config;
    },
  },
  actions: {
    NETWORK_CONNECT({ commit, state, dispatch }) {
      const { config, client } = state;
      if (client && client.isConnected()) {
        client.disconnect();
      }
      const clientToConnect = client || new Client();

      clientToConnect.setBusyCallback((count) => {
        commit(Mutations.BUSY_COUNT_SET, count);
      });

      clientToConnect.updateBusy(+1);

      clientToConnect.setConnectionErrorCallback((type, httpReq) => {
        const message =
          (httpReq && httpReq.response && httpReq.response.error) ||
          `Connection ${type}`;
        console.error(message);
        console.log(httpReq);
      });

      clientToConnect
        .connect(config)
        .then((validClient) => {
          commit(Mutations.NETWORK_CLIENT_SET, validClient);
          dispatch(Actions.QUAKE_FETCH_MINE);
          dispatch(Actions.QUAKE_UPDATE_EVENTS);
          dispatch(Actions.QUAKE_UPDATE_SCALING);
          dispatch(Actions.QUAKE_UPDATE_UNCERTAINTY_SCALING);
          clientToConnect.updateBusy(-1);
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
};

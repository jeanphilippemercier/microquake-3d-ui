import Client from 'paraview-quake/src/io/Client';

export default {
  state: {
    errorMessage: null,
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
    NETWORK_ERROR(state) {
      return state.errorMessage;
    },
  },
  mutations: {
    NETWORK_CLIENT_SET(state, client) {
      state.client = client;
    },
    NETWORK_CONFIG_SET(state, config) {
      state.config = config;
    },
    NETWORK_ERROR_SET(state, value) {
      state.errorMessage = value;
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
        commit('BUSY_COUNT_SET', count);
      });

      clientToConnect.updateBusy(+1);

      clientToConnect.setConnectionErrorCallback((type, httpReq) => {
        const message =
          (httpReq && httpReq.response && httpReq.response.error) ||
          `Connection ${type}`;
        commit('NETWORK_ERROR_SET', message);
        console.error(message);
        console.log(httpReq);
      });

      clientToConnect
        .connect(config)
        .then((validClient) => {
          commit('NETWORK_CLIENT_SET', validClient);
          dispatch('QUAKE_FETCH_MINE');
          dispatch('QUAKE_UPDATE_EVENTS');
          dispatch('QUAKE_UPDATE_SCALING');
          dispatch('QUAKE_UPDATE_UNCERTAINTY_SCALING');
          clientToConnect.updateBusy(-1);

          // Dynamic monitoring of the mine
          validClient.remote.Quake.onMineChange(() => {
            dispatch('QUAKE_FETCH_MINE');
          });
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
};

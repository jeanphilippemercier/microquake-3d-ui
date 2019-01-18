import Vuex from 'vuex';

import busy from 'paraview-quake/src/stores/busy';
import network from 'paraview-quake/src/stores/network';
import quake from 'paraview-quake/src/stores/quake';
import view from 'paraview-quake/src/stores/view';

function createStore() {
  return new Vuex.Store({
    state: {
      darkMode: false,
    },
    modules: {
      busy,
      network,
      quake,
      view,
    },
    getters: {
      APP_DARK_THEME(state) {
        return state.darkMode;
      },
    },
    mutations: {
      APP_DARK_THEME_SET(state, value) {
        state.darkMode = value;
      },
    },
    actions: {},
  });
}

export default createStore;

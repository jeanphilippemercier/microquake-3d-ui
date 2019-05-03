import Vuex from 'vuex';

import busy from 'paraview-quake/src/stores/busy';
import local from 'paraview-quake/src/stores/local';
import processing from 'paraview-quake/src/stores/processing';
import pvw from 'paraview-quake/src/stores/pvw';
import quake from 'paraview-quake/src/stores/quake';
import remote from 'paraview-quake/src/stores/remote';
import view from 'paraview-quake/src/stores/view';

function createStore() {
  return new Vuex.Store({
    state: {
      darkMode: false,
      renderMode: 'remote',
    },
    modules: {
      busy,
      local,
      processing,
      pvw,
      quake,
      remote,
      view,
    },
    getters: {
      APP_DARK_THEME(state) {
        return state.darkMode;
      },
      APP_RENDER_MODE(state) {
        return state.renderMode;
      },
    },
    mutations: {
      APP_DARK_THEME_SET(state, value) {
        state.darkMode = value;
      },
      APP_RENDER_MODE_SET(state, value) {
        state.renderMode = value;
      },
    },
    actions: {},
  });
}

export default createStore;

import Vuex from 'vuex';

import busy from 'paraview-quake/src/stores/busy';
import http from 'paraview-quake/src/stores/http';
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
    },
    modules: {
      busy,
      http,
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

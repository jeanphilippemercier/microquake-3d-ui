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
      userName: '',
      userPassword: '',
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
      APP_AUTH_USER_NAME(state) {
        return state.userName;
      },
      APP_AUTH_USER_PASSWORD(state) {
        return state.userPassword;
      },
    },
    mutations: {
      APP_DARK_THEME_SET(state, value) {
        state.darkMode = value;
      },
      APP_AUTH_USER_NAME_SET(state, value) {
        state.userName = value;
      },
      APP_AUTH_USER_PASSWORD_SET(state, value) {
        state.userPassword = value;
      },
    },
    actions: {},
  });
}

export default createStore;

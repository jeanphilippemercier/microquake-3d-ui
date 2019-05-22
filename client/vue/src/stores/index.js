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
    actions: {
      APP_DEVELOPMENT_SETUP({ commit, dispatch }, token) {
        if (token) {
          commit('API_RENDER_MODE_SET', 'LOCAL');
          commit('HTTP_AUTH_TOKEN_SET', token);
          commit('QUAKE_SELECTED_SITE_SET', 'OT');
          commit('QUAKE_SELECTED_NETWORK_SET', 'HNUG');
          commit('QUAKE_USER_ACCEPTED_SITE_SET', true);
          dispatch('API_INITIALIZE');
        }
      },
      APP_LOGIN({ dispatch, commit }) {
        const log = console.log; // () => {}
        dispatch('HTTP_AUTHENTICATE')
          .then((result) => {
            log('Authenticated');
            log(result);
            commit('HTTP_AUTH_TOKEN_SET', result.data.access);
            console.log(`Stored auth token (${result.data.access})`);
            dispatch('HTTP_FETCH_SITES')
              .then((sitesResponse) => {
                log('Got sites json:');
                log(sitesResponse.data);
                dispatch('QUAKE_UPDATE_SITES', sitesResponse.data);
              })
              .catch((siteError) => {
                console.error('Error fetching sites:');
                console.error(siteError);
              });
          })
          .catch((error) => {
            console.error('Authentication failure');
            console.error(error);
          });
      },
    },
  });
}

export default createStore;

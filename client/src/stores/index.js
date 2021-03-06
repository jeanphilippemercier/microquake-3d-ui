import Vuex from 'vuex';

import busy from 'paraview-quake/src/stores/busy';
import date from 'paraview-quake/src/stores/date';
import http from 'paraview-quake/src/stores/http';
import local from 'paraview-quake/src/stores/local';
import processing from 'paraview-quake/src/stores/processing';
import quake from 'paraview-quake/src/stores/quake';
import view from 'paraview-quake/src/stores/view';

function createStore() {
  return new Vuex.Store({
    state: {
      errorMsg: null,
      darkMode: false,
      userName: '',
      userPassword: '',
      authError: {},
      config: {},
    },
    modules: {
      busy,
      date,
      http,
      local,
      processing,
      quake,
      view,
    },
    getters: {
      APP_CONFIG(state) {
        return state.config;
      },
      APP_ERROR_MSG(state) {
        return state.errorMsg;
      },
      APP_DARK_THEME(state) {
        return state.darkMode;
      },
      APP_AUTH_USER_NAME(state) {
        return state.userName;
      },
      APP_AUTH_USER_PASSWORD(state) {
        return state.userPassword;
      },
      APP_AUTH_ERROR(state) {
        return state.authError;
      },
    },
    mutations: {
      APP_CONFIG_SET(state, value) {
        state.config = value;
      },
      APP_DARK_THEME_SET(state, value) {
        state.darkMode = value;
      },
      APP_AUTH_USER_NAME_SET(state, value) {
        state.userName = value;
      },
      APP_AUTH_USER_PASSWORD_SET(state, value) {
        state.userPassword = value;
      },
      APP_AUTH_ERROR_SET(state, value) {
        state.authError = value;
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
        dispatch('HTTP_AUTHENTICATE')
          .then((result) => {
            if (!result.data) {
              throw result;
            }
            commit('APP_AUTH_ERROR_SET', {});
            commit('HTTP_AUTH_TOKEN_SET', result.data.access);
            console.log(`Stored auth token (${result.data.access})`);
            dispatch('HTTP_FETCH_SITES')
              .then((sitesResponse) => {
                dispatch('QUAKE_UPDATE_SITES', sitesResponse.data);
              })
              .catch((siteError) => {
                console.error('Error fetching sites:');
                console.error(siteError);
              });

            // Monitor heartbeat
            // dispatch('QUAKE_UPDATE_HEARTBEAT');
            // setInterval(() => {
            //   dispatch('QUAKE_UPDATE_HEARTBEAT');
            // }, 5 * 60 * 1000); // 5 minutes

            // Start listening on event stream
            dispatch('HTTP_WS_CONNECT');
          })
          .catch((error) => {
            console.error('Authentication failure', error.response.data);
            commit('APP_AUTH_ERROR_SET', error.response.data);
          });
      },
    },
  });
}

export default createStore;

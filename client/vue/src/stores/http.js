import axios from 'axios';
import mineplan from 'paraview-quake/src/stores/mock/mineplan.json';
import events from 'paraview-quake/src/stores/mock/events.json';

export default {
  state: {
    baseUrl: 'https://api.microquake.org/api',
    authToken: null,
    siteCode: 'OT',
    networkCode: 'HNUG',
  },
  getters: {
    HTTP_AUTH_TOKEN(state) {
      return state.authToken;
    },
    HTTP_BASE_URL(state) {
      return state.baseUrl;
    },
    HTTP_SITE_CODE(state) {
      return state.siteCode;
    },
    HTTP_NETWORK_CODE(state) {
      return state.networkCode;
    },
  },
  mutations: {
    HTTP_AUTH_TOKEN_SET(state, token) {
      state.authToken = token;
    },
    HTTP_BASE_URL_SET(state, url) {
      state.baseUrl = url;
    },
    HTTP_SITE_CODE_SET(state, code) {
      state.siteCode = code;
    },
    HTTP_NETWORK_CODE_SET(state, code) {
      state.networkCode = code;
    },
  },
  actions: {
    HTTP_AUTHENTICATE({ getters }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const username = getters.APP_AUTH_USER_NAME;
      const password = getters.APP_AUTH_USER_PASSWORD;

      const request = {
        method: 'post',
        url: `${baseUrl}/token-auth`,
        data: { username, password },
      };

      return axios(request);
    },
    HTTP_FETCH_MINES({ state, commit, dispatch }) {
      // const { authToken, baseUrl, siteCode, networkCode } = state;

      // const request = {
      //   method: 'get',
      //   headers: { Authorization: `Token ${authToken}` },
      //   url: `${baseUrl}/v2/mineplan`,
      //   headers: {
      //     Authentication: `Token ${state.authToken}`,
      //   },
      // };

      // // Make the request to retrieve the mineplan description
      // return axios(request);

      return Promise.resolve(mineplan);
    },
    HTTP_FETCH_EVENTS({ state, commit, dispatch }) {
      return Promise.resolve(events);
    },
  },
};

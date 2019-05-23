import axios from 'axios';

export default {
  state: {
    baseUrl: 'https://api.microquake.org/api',
    authToken: null,
  },
  getters: {
    HTTP_AUTH_TOKEN(state) {
      return state.authToken;
    },
    HTTP_BASE_URL(state) {
      return state.baseUrl;
    },
  },
  mutations: {
    HTTP_AUTH_TOKEN_SET(state, token) {
      state.authToken = token;
    },
    HTTP_BASE_URL_SET(state, url) {
      state.baseUrl = url;
    },
  },
  actions: {
    HTTP_AUTHENTICATE({ getters }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const username = getters.APP_AUTH_USER_NAME;
      const password = getters.APP_AUTH_USER_PASSWORD;

      const request = {
        method: 'post',
        url: `${baseUrl}/token/`,
        data: { username, password },
      };

      return axios(request);
    },
    HTTP_FETCH_MINES({ getters }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;
      const siteCode = getters.QUAKE_SELECTED_SITE;
      const networkCode = getters.QUAKE_SELECTED_NETWORK;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/mineplan`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
        params: {
          site_code: siteCode,
          network_code: networkCode,
        },
      };

      return axios(request);
    },
    HTTP_FETCH_EVENTS({ getters }, [startTime, endTime, status]) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/catalog`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
        params: {
          start_time: startTime,
          end_time: endTime,
          status,
        },
      };

      return axios(request);
    },
    HTTP_FETCH_SITES({ getters }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/sites`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return axios(request);
    },
  },
};

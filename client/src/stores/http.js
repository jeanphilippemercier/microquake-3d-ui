import axios from 'axios';

function busy(dispatch, promise) {
  dispatch('BUSY_START');
  return promise.then(
    (a) => {
      dispatch('BUSY_END');
      return a;
    },
    (a) => {
      dispatch('BUSY_END');
      return a;
    }
  );
}

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
    HTTP_AUTHENTICATE({ getters, dispatch }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const username = getters.APP_AUTH_USER_NAME;
      const password = getters.APP_AUTH_USER_PASSWORD;

      const request = {
        method: 'post',
        url: `${baseUrl}/token/`,
        data: { username, password },
      };

      return busy(dispatch, axios(request));
    },
    HTTP_FETCH_MINES({ getters, dispatch }) {
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

      return busy(dispatch, axios(request));
    },
    HTTP_FETCH_EVENTS({ getters, dispatch }, [startTime, endTime, status]) {
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

      return busy(dispatch, axios(request));
    },
    HTTP_FETCH_SITES({ getters, dispatch }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/sites`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    HTTP_FETCH_RAYS({ getters, dispatch }, event_id) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/rays`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
        params: { event_id },
      };

      return busy(dispatch, axios(request));
    },
    HTTP_FETCH_STATIONS({ getters, dispatch }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/inventory/stations`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
  },
};

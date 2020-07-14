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

let WS_MONITOR_TIMEOUT = 0;

export default {
  state: {
    baseUrl: 'https://api.microquake.org/api',
    wsUrl: 'wss://api.microquake.org/eventstream/',
    authToken: null,
    wsClient: null,
    lastWsMessage: Date.now(),
    checkWsStale: 0,
  },
  getters: {
    HTTP_AUTH_TOKEN(state) {
      return state.authToken;
    },
    HTTP_BASE_URL(state) {
      return state.baseUrl;
    },
    HTTP_WS_STALE(state) {
      // We need to depend on checkWsStale
      // eslint-disable-next-line no-unused-vars
      const { checkWsStale, lastWsMessage } = state;
      const now = Date.now();
      return now - lastWsMessage > 30000; // stale if nothing was seen in 30s
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
      console.log(`fetch ${status} events from ${startTime} to ${endTime}`);

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
    HTTP_FETCH_STATIONS_DEPRECATED({ getters, dispatch }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/inventory/sensors`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    async HTTP_FETCH_HEARTBEAT({ getters, dispatch }) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/inventory/heartbeat`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    async HTTP_FETCH_URL({ getters, dispatch }, url) {
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    async HTTP_FETCH_STATIONS({ getters, dispatch }) {
      const fullList = [];
      const baseUrl = getters.HTTP_BASE_URL;

      let nextURL = `${baseUrl}/v1/inventory/sensors`;
      /* eslint-disable no-await-in-loop */
      while (nextURL) {
        try {
          const { data } = await dispatch('HTTP_FETCH_URL', nextURL);
          if (!data) {
            nextURL = null;
          } else {
            nextURL = data.next;
            const list = data.results;
            for (let i = 0; i < list.length; i++) {
              fullList.push(list[i]);
            }
          }
        } catch (err) {
          console.error(err);
          nextURL = null;
        }
      }
      /* eslint-enable no-await-in-loop */
      return { data: fullList };
    },
    async HTTP_FETCH_SCATTERS({ getters, dispatch }, resourceId) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/scatters?event_id=${encodeURIComponent(
          resourceId
        )}`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    async HTTP_FETCH_EVENT_TYPES({ getters, dispatch }, siteCode) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}/v1/inventory/microquake_event_types?site__code=${siteCode}`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    async HTTP_FETCH({ getters, dispatch }, url) {
      const baseUrl = getters.HTTP_BASE_URL;
      const authToken = getters.HTTP_AUTH_TOKEN;

      const request = {
        method: 'get',
        url: `${baseUrl}${url}`,
        headers: {
          Authorization: `Bearer: ${authToken}`,
        },
      };

      return busy(dispatch, axios(request));
    },
    HTTP_WS_CONNECT({ state, commit, dispatch }) {
      if (state.wsClient) {
        dispatch('HTTP_WS_DISCONNECT');
      }
      state.lastWsMessage = Date.now();
      state.wsClient = new WebSocket(state.wsUrl);
      state.wsClient.onmessage = (msg) => {
        state.lastWsMessage = Date.now();
        const msgObj = JSON.parse(msg.data);
        dispatch('QUAKE_NOTIFICATIONS_ADD', msgObj);
        switch (msgObj.type) {
          case 'heartbeat':
            commit('QUAKE_HEARTBEAT_SET', [msgObj.heartbeat]);
            break;
          case 'signal_quality':
            dispatch('QUAKE_SENSOR_STATUS_UPDATE', msgObj.signal_quality);
            break;
          default:
            console.log('got notification', msgObj.type);
            break;
        }
      };
      state.wsClient.onerror = (e) => {
        console.error(e);
        setTimeout(() => {
          dispatch('HTTP_WS_CONNECT');
        }, 20000);
      };
      state.wsClient.onopen = () => {
        console.log('opening event stream');
      };
      state.wsClient.onclose = (e) => {
        console.log('closing event stream', e);
      };
      dispatch('HTTP_MONITOR_WS_STALE');
    },
    HTTP_WS_DISCONNECT({ state }) {
      if (state.wsClient) {
        state.wsClient.close();
        state.wsClient = null;
      }
    },
    HTTP_MONITOR_WS_STALE({ state, getters, dispatch }) {
      if (WS_MONITOR_TIMEOUT) {
        clearTimeout(WS_MONITOR_TIMEOUT);
        WS_MONITOR_TIMEOUT = 0;
      }
      state.checkWsStale += 1;
      WS_MONITOR_TIMEOUT = setTimeout(() => {
        dispatch('HTTP_MONITOR_WS_STALE');
      }, 5000); // 5s

      if (getters.HTTP_WS_STALE) {
        dispatch('HTTP_WS_CONNECT');
      }
    },
  },
};

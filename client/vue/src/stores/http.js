// import axios from 'axios';
import mineplan from 'paraview-quake/src/stores/mock/mineplan.json';

export default {
  state: {
    baseUrl: 'https://api.microquake.org/api/',
    authToken: 'be072024b881fd7735ad4865beb9f1e4ac075650',
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
    HTTP_FETCH_MINES({ state, commit, dispatch }) {
      // const { baseUrl, siteCode, networkCode } = state;

      // const request = {
      //   method: 'get',
      //   url: `${baseUrl}/v2/site/${siteCode}/network/${networkCode}/mineplan`,
      //   headers: {
      //     Authentication: `Token ${state.authToken}`,
      //   },
      // };

      // // Make the request to retrieve the mineplan description
      // axios(request).then((response) => {
      //   console.log('Got mine plan');
      //   console.log(response);
      //   commit('LOCAL_MINE_PLAN_SET', response);
      //   dispatch('LOCAL_UPDATE_MINE_PLAN');
      // }).catch((error) => {
      //   console.log('Encountered error retrieving mineplan');
      //   console.log(error);
      // });

      commit('LOCAL_MINE_PLAN_SET', mineplan);
      dispatch('LOCAL_UPDATE_MINE_PLAN');
    },
  },
};

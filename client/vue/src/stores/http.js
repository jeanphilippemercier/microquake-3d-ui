// import axios from 'axios';
import mineplan from 'paraview-quake/src/stores/mock/mineplan.json';

function processMinePlan(minePlanJson) {
  console.log(minePlanJson);

  // The mineplan itself has:
  //   boundaries: [650200, 652700, 4766170, 4768695, -500, 1200]
  //   categories: [{label: l1, name: n1}, ...]
  //   description: "Mine plan for 3d-UI"
  //   network: 1
  //   pieces: []
  //   site: 1
  //   upload_time: "2019-04-01T23:00:59.170975Z"

  // Each piece has:
  //   category: "plan"
  //   extra_json_attributes
  //   file: "https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/mineplans/Mineplan_milestone3.vtp"
  //   id: 13
  //   label: "Milestone"
  //   mineplan: 1
  //   sha: "949c63542e48fbfc1f5eef0e159640f9a9ca2f1a1e2cce6e900a45d31f50611b"
  //   type: "lines"
  //   visibility: 1

  // Computing sha256 and hex digest in javascript:
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

}

export default {
  state: {
    stuff: [],
    siteCode: 'OT',
    networkCode: 'HNUG',
    minePlan: null,
    baseUrl: 'https://api.microquake.org/api/',
    authToken: 'be072024b881fd7735ad4865beb9f1e4ac075650',
  },
  getters: {
    HTTP_AUTH_TOKEN(state) {
      return state.authToken;
    },
    HTTP_MINE_PLAN(state) {
      return state.minePlan;
    },
  },
  mutations: {
    HTTP_AUTH_TOKEN_SET(state, token) {
      state.authToken = token;
    },
    HTTP_MINE_PLAN_SET(state, plan) {
      state.minePlan = plan;
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
      // }).catch((error) => {
      //   console.log('Encountered error retrieving mineplan');
      //   console.log(error);
      // });

      commit('HTTP_MINE_PLAN_SET', mineplan);
      processMinePlan(mineplan[0]);
    },
  },
};

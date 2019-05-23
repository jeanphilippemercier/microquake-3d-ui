import PRESETS from 'paraview-quake/src/presets';

const RAY_DATA = {};
const PREFERRED_ORIGIN_MAP = {};

export default {
  state: {
    eventStatus: 'accepted',
    refreshRate: 10,
    pickingCenterOfRotation: false,
    rayMapping: {},
    raysInScene: false,
    mine: [],
    mineVisibility: [],
    componentsVisibility: {
      mine: true,
      seismicEvents: true,
      blast: true,
      historicEvents: true,
      ray: false,
      uncertainty: false,
    },
    doubleClickMode: 1,
    rayFilterMode: 0,
    scalingRange: [0.1, 1],
    magnitudeRange: [-2, 3],
    uncertaintyScaleFactor: 1,
    preset: 'coolwarm',
    presets: PRESETS,
    historicalTime: 0,
    focusPeriod: [0, 2190],
    focusOffset: 2190,
    // tooltip
    pickingPosition: [0, 0],
    pickedData: null,
    siteMap: null,
    selectedSite: null,
    selectedNetwork: null,
    userAcceptedSite: false,
  },
  getters: {
    QUAKE_FOCUS_EVENT_STATUS(state) {
      return state.eventStatus;
    },
    QUAKE_LIVE_REFRESH_RATE(state) {
      return state.refreshRate;
    },
    QUAKE_PICKING_CENTER_OF_ROTATION(state) {
      return state.pickingCenterOfRotation;
    },
    QUAKE_MINE(state) {
      return state.mine;
    },
    QUAKE_MINE_VISIBILITY(state) {
      return state.mineVisibility;
    },
    QUAKE_COLOR_PRESET(state) {
      return state.preset;
    },
    QUAKE_COLOR_PRESETS(state) {
      return state.presets;
    },
    QUAKE_SCALING_RANGE(state) {
      return state.scalingRange;
    },
    QUAKE_MAGNITUDE_RANGE(state) {
      return state.magnitudeRange;
    },
    QUAKE_COMPONENTS_VISIBILITY(state) {
      return state.componentsVisibility;
    },
    QUAKE_HISTORICAL_TIME(state) {
      return state.historicalTime;
    },
    QUAKE_FOCUS_PERIOD(state) {
      return state.focusPeriod;
    },
    QUAKE_PICKING_POSITION(state) {
      return state.pickingPosition;
    },
    QUAKE_PICKED_DATA(state) {
      return state.pickedData;
    },
    QUAKE_FOCUS_PERIOD_OFFSET(state) {
      return state.focusOffset;
    },
    QUAKE_UNCERTAINTY_SCALE_FACTOR(state) {
      return state.uncertaintyScaleFactor;
    },
    QUAKE_RAY_MAPPING(state) {
      return state.rayMapping;
    },
    QUAKE_DOUBLE_CLICK_MODE(state) {
      return state.doubleClickMode;
    },
    QUAKE_RAY_FILTER_MODE(state) {
      return state.rayFilterMode;
    },
    QUAKE_RAYS_IN_SCENE(state) {
      return state.raysInScene;
    },
    QUAKE_SITE_MAP(state) {
      return state.siteMap;
    },
    QUAKE_SELECTED_SITE(state) {
      return state.selectedSite;
    },
    QUAKE_SELECTED_NETWORK(state) {
      return state.selectedNetwork;
    },
    QUAKE_USER_ACCEPTED_SITE(state) {
      return state.userAcceptedSite;
    },
    QUAKE_RAY_DATA() {
      return RAY_DATA;
    },
    QUAKE_PREFERRED_ORIGIN_MAP() {
      return PREFERRED_ORIGIN_MAP;
    },
  },
  mutations: {
    QUAKE_FOCUS_EVENT_STATUS_SET(state, value) {
      state.eventStatus = value;
    },
    QUAKE_LIVE_REFRESH_RATE_SET(state, value) {
      state.refreshRate = value;
    },
    QUAKE_PICKING_CENTER_OF_ROTATION_SET(state, value) {
      state.pickingCenterOfRotation = value;
    },
    QUAKE_MINE_SET(state, value) {
      state.mine = value;
    },
    QUAKE_MINE_VISIBILITY_SET(state, value) {
      state.mineVisibility = value;
    },
    QUAKE_COLOR_PRESET_SET(state, value) {
      state.preset = value;
    },
    QUAKE_SCALING_RANGE_SET(state, value) {
      state.scalingRange = value;
    },
    QUAKE_MAGNITUDE_RANGE_SET(state, value) {
      state.magnitudeRange = value;
    },
    QUAKE_COMPONENTS_VISIBILITY_SET(state, value) {
      state.componentsVisibility = value;
    },
    QUAKE_HISTORICAL_TIME_SET(state, value) {
      state.historicalTime = value;
    },
    QUAKE_FOCUS_PERIOD_SET(state, value) {
      state.focusPeriod = value;
    },
    QUAKE_PICKING_POSITION_SET(state, value) {
      state.pickingPosition = value;
    },
    QUAKE_PICKED_DATA_SET(state, value) {
      state.pickedData = value;
    },
    QUAKE_FOCUS_PERIOD_OFFSET_SET(state, value) {
      state.focusOffset = value;
    },
    QUAKE_UNCERTAINTY_SCALE_FACTOR_SET(state, value) {
      state.uncertaintyScaleFactor = value;
    },
    QUAKE_RAY_MAPPING_SET(state, value) {
      state.rayMapping = value;
    },
    QUAKE_DOUBLE_CLICK_MODE_SET(state, value) {
      state.doubleClickMode = value;
    },
    QUAKE_RAY_FILTER_MODE_SET(state, value) {
      state.rayFilterMode = value;
    },
    QUAKE_RAYS_IN_SCENE_SET(state, value) {
      state.raysInScene = value;
    },
    QUAKE_SITE_MAP_SET(state, value) {
      console.log(`Setting QUAKE_SITE_MAP to ${value}`);
      state.siteMap = value;
    },
    QUAKE_SELECTED_SITE_SET(state, value) {
      state.selectedSite = value;
    },
    QUAKE_SELECTED_NETWORK_SET(state, value) {
      state.selectedNetwork = value;
    },
    QUAKE_USER_ACCEPTED_SITE_SET(state, value) {
      state.userAcceptedSite = value;
    },
    QUAKE_RAY_DATA_SET(state, { id, data }) {
      RAY_DATA[id] = data;
    },
  },
  actions: {
    QUAKE_UPDATE_SITES({ commit }, sitesJson) {
      console.log('Made it into QUAKE_UPDATE_SITES');
      const siteMapObj = {};
      sitesJson.forEach((siteJson) => {
        const { name, code, networks } = siteJson;
        const siteObj = { text: name, value: code, networks: [] };
        networks.forEach((network) => {
          siteObj.networks.push({ text: network.name, value: network.code });
        });
        siteMapObj[code] = siteObj;
      });
      commit('QUAKE_SITE_MAP_SET', siteMapObj);
    },
    QUAKE_TOGGLE_PICKING_CENTER_OF_ROTATION({ state, commit }) {
      commit(
        'QUAKE_PICKING_CENTER_OF_ROTATION_SET',
        !state.pickingCenterOfRotation
      );
    },
  },
};

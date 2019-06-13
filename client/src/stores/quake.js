import PRESETS from 'paraview-quake/src/presets';
import DateHelper from 'paraview-quake/src/util/DateHelper';

const RAY_DATA = {};
const PREFERRED_ORIGIN_MAP = {};
const TYPES = {
  earthquake: 'seismicEvents',
  explosion: 'blasts',
};

function byName(a, b) {
  return b.name.localeCompare(a.name);
}

export default {
  state: {
    liveMode: false,
    refreshCount: 0,
    typeMapping: {
      thunder: 'L',
      'controlled explosion': 'OB',
      'anthropogenic event': 'SE',
      'other event': 'N',
      'quarry blast': 'OP',
      explosion: 'B',
      earthquake: 'E',
    },
    catalogue: [],
    eventStatus: 'accepted',
    sensorChildren: [{ id: 'stations', name: 'Stations' }],
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
    QUAKE_REFRESH_COUNT(state) {
      return state.refreshCount;
    },
    QUAKE_LIVE_MODE(state) {
      return state.liveMode;
    },
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
      const sensors = state.mine.find((n) => n.id === 'Sensors');
      if (sensors) {
        sensors.children = state.sensorChildren;
      }
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
    QUAKE_CATALOGUE(state) {
      return state.catalogue;
    },
    QUAKE_TYPE_MAPPING(state) {
      return state.typeMapping;
    },
  },
  mutations: {
    QUAKE_REFRESH_COUNT_SET(state, value) {
      state.refreshCount = value;
    },
    QUAKE_LIVE_MODE_SET(state, value) {
      state.liveMode = value;
    },
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
      state.siteMap = value;
    },
    QUAKE_SELECTED_SITE_SET(state, value) {
      state.selectedSite = value;
      DateHelper.setTimeZone(
        (state.siteMap &&
          state.siteMap[value] &&
          state.siteMap[value].timezone) ||
          '+08:00'
      );
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
    QUAKE_CATALOGUE_SET(state, catalogue) {
      state.catalogue = catalogue;
    },
    QUAKE_TYPE_MAPPING_SET(state, value) {
      state.typeMapping = value;
    },
  },
  actions: {
    QUAKE_UPDATE_SITES({ commit }, sitesJson) {
      const siteMapObj = {};
      sitesJson.forEach((siteJson) => {
        const { name, code, networks, timezone } = siteJson;
        const siteObj = { text: name, value: code, networks: [], timezone };
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
    QUAKE_UPDATE_CATALOGUE({ getters, commit, dispatch }, events) {
      const catalogue = [];
      const nodeMap = {};

      for (let i = 0; i < events.length; i++) {
        const event = events[i];

        const hours = DateHelper.formatEpochTime(event.time_epoch);
        const [year, month, day] = DateHelper.formatEpochDate(
          event.time_epoch
        ).split('/');
        let currentKey = null;
        let parentNode = null;

        // Year
        currentKey = `${year}`;
        if (!nodeMap[currentKey]) {
          const node = { name: `${year}`, id: currentKey, children: [] };
          catalogue.push(node);
          catalogue.sort(byName);
          nodeMap[node.id] = node;
        }
        parentNode = nodeMap[currentKey];

        // Month
        currentKey = [year, month].join('/');
        if (!nodeMap[currentKey]) {
          const node = { name: `${month}`, id: currentKey, children: [] };
          parentNode.children.push(node);
          parentNode.children.sort(byName);
          nodeMap[node.id] = node;
        }
        parentNode = nodeMap[currentKey];

        // Day
        currentKey = [year, month, day].join('/');
        if (!nodeMap[currentKey]) {
          const node = { name: `${day}`, id: currentKey, children: [] };
          parentNode.children.push(node);
          parentNode.children.sort(byName);
          nodeMap[node.id] = node;
        }
        parentNode = nodeMap[currentKey];

        // child
        currentKey = event.event_resource_id;
        const node = {
          name: hours,
          id: currentKey,
          type: TYPES[event.event_type] || event.event_type,
          open: true,
        };
        if (event.magnitude > -999) {
          node.magnitude = event.magnitude;
        }
        parentNode.children.push(node);
        parentNode.children.sort(byName);
      }

      commit('QUAKE_CATALOGUE_SET', catalogue);

      if (getters.QUAKE_LIVE_MODE) {
        // Activate most recent event
        dispatch(
          'API_ACTIVATE_EVENT',
          catalogue[0].children[0].children[0].children[0].id
        );
      }
    },
    QUAKE_UPDATE_LIVE_MODE({ getters, commit, dispatch }) {
      if (getters.QUAKE_LIVE_MODE) {
        commit('QUAKE_FOCUS_PERIOD_SET', [2190 - 72, 2190]);
        dispatch('API_LIVE_UPDATE');
      }
    },
  },
};

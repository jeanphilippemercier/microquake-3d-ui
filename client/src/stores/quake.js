import Vue from 'vue';

import PRESETS from 'paraview-quake/src/presets';
import DateHelper from 'paraview-quake/src/util/DateHelper';

import * as moment from 'moment';

function encodeQueryData(data) {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
}

// function randomPick(list) {
//   const idx = Math.round(Math.random() * (list.length - 1));
//   return list[idx];
// }

const RAY_DATA = {};
const PREFERRED_ORIGIN_MAP = {};
const TYPES = {
  earthquake: 'seismicEvents',
  explosion: 'blasts',
};

function byName(a, b) {
  return b.name.localeCompare(a.name);
}

function extractMagnitudeMax(a, b) {
  const mA = a.magnitude || a;
  const mB = b.magnitude || b;
  return mA > mB ? mA : mB;
}

function storeItem(key, value) {
  console.log('store', key, value);
  window.localStorage.setItem(`paraview.quake.config.${key}`, value);
}

function retreiveItem(key, defaultValue) {
  const vStr = window.localStorage.getItem(`paraview.quake.config.${key}`);
  if (vStr === undefined || vStr === null) {
    return defaultValue;
  }
  return vStr;
}

let MOST_RECENT_EVENT = '';

export default {
  state: {
    liveMode: false,
    refreshCount: 0,
    quakeMagnitudeFilter: [-100, 0],
    quakeMagnitudeFiltering: false,
    typeMapping: {},
    catalogue: [],
    catalogueByDay: [],
    selectedEvent: null,
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
      otherEvents: true,
    },
    doubleClickMode: 1,
    rayFilterMode: 0,
    scalingRange: [0.1, 1],
    magnitudeRange: [-2, 3],
    uncertaintyScaleFactor: 1,
    preset: 'coolwarm',
    presets: PRESETS,
    // In days
    historicalTime: 0,
    // tooltip
    pickingPosition: [0, 0],
    pickedData: null,
    siteMap: null,
    selectedSite: null,
    selectedNetwork: null,
    userAcceptedSite: false,
    // notification
    notifications: [],
    // sensor live update
    sensorsStatus: {},
    // heartbeat status
    heartbeat: {},
  },
  getters: {
    QUAKE_MAGNITUDE_FILTERING(state) {
      return state.quakeMagnitudeFiltering;
    },
    QUAKE_MAGNITUDE_FILTER(state) {
      return state.quakeMagnitudeFilter;
    },
    QUAKE_MAGNITUDE_FILTER_LAMBDA(state, getters) {
      const doFilter = getters.QUAKE_MAGNITUDE_FILTERING;
      const [min, max] = getters.QUAKE_MAGNITUDE_FILTER;
      return ({ magnitude }) =>
        !doFilter || (magnitude >= min && magnitude <= max);
    },
    QUAKE_NOTIFICATIONS(state) {
      return state.notifications;
    },
    QUAKE_SENSOR_STATUS(state) {
      return state.sensorsStatus;
    },
    QUAKE_SELECTED_EVENT(state) {
      return state.selectedEvent;
    },
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
    QUAKE_PICKING_POSITION(state) {
      return state.pickingPosition;
    },
    QUAKE_PICKED_DATA(state) {
      return state.pickedData;
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
      return retreiveItem('selectedSite', state.selectedSite);
    },
    QUAKE_SELECTED_NETWORK(state) {
      return retreiveItem('selectedNetwork', state.selectedNetwork);
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
    QUAKE_CATALOGUE_BY_DAY(state) {
      return state.catalogueByDay;
    },
    QUAKE_TYPE_MAPPING(state) {
      return state.typeMapping;
    },
    QUAKE_HEARTBEAT(state) {
      return state.heartbeat;
    },
  },
  mutations: {
    QUAKE_MAGNITUDE_FILTERING_SET(state, value) {
      state.quakeMagnitudeFiltering = value;
    },
    QUAKE_MAGNITUDE_FILTER_SET(state, value) {
      state.quakeMagnitudeFilter = value;
    },
    QUAKE_SENSOR_STATUS_SET(state, value) {
      Vue.set(state.sensorsStatus, value.sensor_code, value);
    },
    QUAKE_SELECTED_EVENT_SET(state, value) {
      state.selectedEvent = { ...value };
    },
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
    QUAKE_PICKING_POSITION_SET(state, value) {
      state.pickingPosition = value;
    },
    QUAKE_PICKED_DATA_SET(state, value) {
      state.pickedData = value;
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
    QUAKE_SELECTED_NETWORK_SET(state, value) {
      state.selectedNetwork = value;
      storeItem('selectedNetwork', value);
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
    QUAKE_CATALOGUE_BY_DAY_SET(state, value) {
      state.catalogueByDay = value;
    },
    QUAKE_TYPE_MAPPING_SET(state, value) {
      state.typeMapping = value;
    },
    QUAKE_HEARTBEAT_SET(state, value) {
      const newHeartBeat = {};
      for (let i = 0; i < value.length; i++) {
        const { source, last_heard } = value[i];
        newHeartBeat[source] = last_heard;
      }
      state.heartbeat = newHeartBeat;
    },
  },
  actions: {
    QUAKE_NOTIFICATIONS_ADD({ state, dispatch }, notification) {
      const ts = Date.now();
      const { type, operation } = notification;

      if (type === 'event' && operation === 'created') {
        state.notifications.unshift({
          type: 'success',
          ts,
          autoclean: true,
          notification,
        });
      }

      dispatch('QUAKE_NOTIFICATIONS_GC');
    },
    QUAKE_NOTIFICATIONS_GC({ state }) {
      const timecut = Date.now() - 5000; // 5s
      state.notifications = state.notifications.filter(
        ({ ts, autoclean }) => !autoclean || ts > timecut
      );
    },
    QUAKE_SENSOR_STATUS_UPDATE({ commit, dispatch }, value) {
      commit('QUAKE_SENSOR_STATUS_SET', value);
      dispatch('API_UPDATE_SENSOR_INTEGRITY');
    },
    async QUAKE_SELECTED_SITE_SET({ state, commit, dispatch }, value) {
      state.selectedSite = value;
      storeItem('selectedSite', value);
      const offset =
        (state.siteMap &&
          state.siteMap[value] &&
          state.siteMap[value].timezone) ||
        '+08:00';
      DateHelper.setTimeZone(offset);
      commit('MINE_OFFSET_SET', offset);
      const { data } = await dispatch('HTTP_FETCH_EVENT_TYPES', value);
      const eventTypes = {};
      data.forEach(({ identifier, microquake_type, quakeml_type }) => {
        eventTypes[quakeml_type] = { text: microquake_type, value: identifier };
      });
      commit('QUAKE_TYPE_MAPPING_SET', eventTypes);
    },
    async QUAKE_UPDATE_HEARTBEAT({ commit, dispatch }) {
      const { data } = await dispatch('HTTP_FETCH_HEARTBEAT');
      commit('QUAKE_HEARTBEAT_SET', data);
    },
    QUAKE_UPDATE_SITES({ commit }, sitesJson) {
      const siteMapObj = {};
      sitesJson.forEach((siteJson) => {
        const { id, name, code, networks, timezone } = siteJson;
        const siteObj = { id, text: name, value: code, networks: [], timezone };
        networks.forEach((network) => {
          siteObj.networks.push({
            id: network.id,
            text: network.name,
            value: network.code,
          });
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
      const dateKeys = {};
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
          //
          dateKeys[currentKey] = node.children;
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

      // Generate catalogueByDay list
      const catalogueByDay = Object.entries(dateKeys).map(
        ([name, children]) => ({
          name,
          label: moment(name, 'YYYY/MM/DD').format('MMM DD'),
          year: name.split('/').shift(),
          max: children.reduce(extractMagnitudeMax, -1000),
          children,
        })
      );
      catalogueByDay.sort(byName);

      commit('QUAKE_CATALOGUE_SET', catalogue);
      commit('QUAKE_CATALOGUE_BY_DAY_SET', catalogueByDay);

      if (getters.QUAKE_LIVE_MODE) {
        const mostRecentEvent =
          catalogue[0].children[0].children[0].children[0].id;
        if (mostRecentEvent !== MOST_RECENT_EVENT) {
          // Activate most recent event
          dispatch('API_ACTIVATE_EVENT', mostRecentEvent);
        }
        MOST_RECENT_EVENT = mostRecentEvent;
      }
    },
    QUAKE_UPDATE_LIVE_MODE({ getters, commit, dispatch }) {
      if (getters.QUAKE_LIVE_MODE) {
        commit('DATE_FOCUS_END_DAY_SET', -1);
        dispatch('DATE_FOCUS_LIVE_START_DATE');
        dispatch('API_LIVE_UPDATE');

        // Force the catalogue to be visible
        commit('QUAKE_COMPONENTS_VISIBILITY_SET', {
          ...getters.QUAKE_COMPONENTS_VISIBILITY,
          catalogue: true,
        });
      }
    },
    QUAKE_DOWNLOAD_CSV({ getters, dispatch }) {
      const now = getters.DATE_FOCUS_END_TIME.toISOString();
      const fTime = getters.DATE_FOCUS_START_TIME.toISOString();

      const siteMap = getters.QUAKE_SITE_MAP;
      const selectedSite = getters.QUAKE_SELECTED_SITE;
      const selectedNetwork = getters.QUAKE_SELECTED_NETWORK;
      const site = siteMap[selectedSite];
      const network = site.networks.find(
        ({ value }) => value === selectedNetwork
      );

      const url = '/v1/events';
      const params = {
        format: 'csv',
        site: site.id,
        network: network.id,
        status: 'accepted',
        time_utc_after: fTime,
        time_utc_before: now,
        page_size: 1000000,
      };

      if (getters.QUAKE_MAGNITUDE_FILTERING) {
        [
          params.magnitude_min,
          params.magnitude_max,
        ] = getters.QUAKE_MAGNITUDE_FILTER;
      }

      dispatch('HTTP_FETCH', `${url}?${encodeQueryData(params)}`).then(
        ({ data }) => {
          // Create an invisible A element
          const a = document.createElement('a');
          a.style.display = 'none';
          document.body.appendChild(a);

          // Set the HREF to a Blob representation of the data to be downloaded
          a.href = window.URL.createObjectURL(
            new Blob([data], { type: 'text/plain' })
          );

          // Use download attribute to set set desired file name
          a.setAttribute('download', 'quake-events.csv');

          // Trigger the download by simulating click
          a.click();

          // Cleanup
          window.URL.revokeObjectURL(a.href);
          document.body.removeChild(a);
        }
      );
    },
  },
};

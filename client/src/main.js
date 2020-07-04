// Import polyfills
// import 'core-js/modules/es7.promise.finally';
// import 'core-js/modules/web.immediate';

/* eslint-disable import/prefer-default-export */
import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';

import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';

/* eslint-disable-next-line import/extensions */
import 'typeface-roboto';

import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';

import App from 'paraview-quake/src/components/core/App';
import createStore from 'paraview-quake/src/stores';

// ----------------------------------------------------------------------------

const vuetifyOptions = {
  theme: {
    themes: {
      light: {
        primary: '#1976D2',
        accent: '#1976D2',
      },
      dark: {
        primary: '#1976D2',
        accent: '#1976D2',
      },
    },
  },
  icons: {
    iconfont: 'mdi',
    values: {
      // login
      username: 'mdi-account',
      password: 'mdi-lock',
      // toolbar
      connectionError: 'mdi-access-point-network-off',
      settings: 'mdi-cog',
      mines: 'mdi-pickaxe',
      seismicEvents: 'mdi-chart-bubble',
      otherEvents: 'mdi-help-circle',
      quakeTrace: 'mdi-pulse',
      rays: 'mdi-wan',
      historicalEvents: 'mdi-history',
      uncertainty: 'mdi-vector-curve',
      blasts: 'mdi-bomb',
      accepted: 'mdi-check-circle',
      rejected: 'mdi-close-circle',
      catalogue: 'mdi-file-tree',

      // global settings
      undo: 'mdi-undo',

      // view
      resetCamera: 'mdi-image-filter-center-focus',
      resetCameraZ: 'mdi-map-search-outline',
      snapViewUp: 'mdi-compass',
      pickCenter: 'mdi-axis-x-rotate-clockwise',

      // expansion sections treeview
      defaultExpansionIcon: 'mdi-city',
      expandGroup: 'mdi-menu-down',
      layerOn: 'mdi-checkbox-blank',
      layerOff: 'mdi-checkbox-blank-outline',
      layerIndeterminate: 'mdi-checkbox-multiple-blank-outline',

      // picking tooltip
      pickedDate: 'mdi-calendar',
      pickedTime: 'mdi-clock-outline',
      pickedPosition: 'mdi-crosshairs-gps',
      eventType: 'mdi-format-list-bulleted-type',

      // catalogue
      waveform: 'mdi-open-in-new',
      scatterOn: 'mdi-scatter-plot',
      scatterOff: 'mdi-scatter-plot-outline',
      exportCSV: 'mdi-table',
    },
  },
};
// ----------------------------------------------------------------------------

Vue.use(Vuex);
Vue.use(Vuetify);

// ----------------------------------------------------------------------------

const config = {
  ...vtkURLExtract.extractURLParameters(),
  application: 'quake',
};
const store = createStore();
store.commit('APP_CONFIG_SET', config);

// Clear old toast events
setInterval(() => {
  store.dispatch('QUAKE_NOTIFICATIONS_GC');
}, 1000);

// ----------------------------------------------------------------------
// !!! To speed up development !!!
// Provide a token to skip: auth + site-selection
// ----------------------------------------------------------------------
// const token = null; // paste token from browser console after authenticating
// store.dispatch('APP_DEVELOPMENT_SETUP', token);
// ----------------------------------------------------------------------

/* eslint-disable no-new */
new Vue({
  vuetify: new Vuetify(vuetifyOptions),
  store,
  render: (h) => h(App),
}).$mount('#app');

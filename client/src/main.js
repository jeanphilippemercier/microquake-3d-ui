// Import polyfills
import 'core-js/modules/es7.promise.finally';
import 'core-js/modules/web.immediate';

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

Vue.use(Vuex);
Vue.use(Vuetify, {
  iconfont: 'mdi',
  icons: {
    // login
    username: 'mdi-account',
    password: 'mdi-lock',
    // toolbar
    connectionError: 'mdi-access-point-network-off',
    settings: 'mdi-settings',
    mines: 'mdi-pickaxe',
    seismicEvents: 'mdi-chart-bubble',
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

    // catalogue
    waveform: 'mdi-open-in-new',
  },
});

// ----------------------------------------------------------------------------

const config = Object.assign({}, vtkURLExtract.extractURLParameters(), {
  application: 'quake',
});
const store = createStore();
store.commit('REMOTE_CONFIG_SET', config);

// ----------------------------------------------------------------------
// !!! To speed up development !!!
// Provide a token to skip: auth + site-selection
// ----------------------------------------------------------------------
// const token = null; // paste token from browser console after authenticating
// store.dispatch('APP_DEVELOPMENT_SETUP', token);
// ----------------------------------------------------------------------

/* eslint-disable no-new */
new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
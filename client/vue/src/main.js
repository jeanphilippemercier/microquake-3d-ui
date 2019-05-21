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
    uncertainty: 'mdi-help-network-outline',
    blasts: 'mdi-bomb',

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
  },
});

// ----------------------------------------------------------------------------

const config = Object.assign({}, vtkURLExtract.extractURLParameters(), {
  application: 'quake',
});
const store = createStore();
store.commit('REMOTE_CONFIG_SET', config);

// #################################################
//        Comment/Uncomment for demo/development
// #################################################
// store.commit('API_RENDER_MODE_SET', 'LOCAL');
// store.commit('HTTP_AUTH_TOKEN_SET', 'be072024b881fd7735ad4865beb9f1e4ac075650');
// store.commit('QUAKE_SELECTED_SITE_SET', 'OT');
// store.commit('QUAKE_SELECTED_NETWORK_SET', 'HNUG');
// store.commit('QUAKE_USER_ACCEPTED_SITE_SET', true);
// store.dispatch('API_INITIALIZE');
// #################################################

/* eslint-disable no-new */
new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');

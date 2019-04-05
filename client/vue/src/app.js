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
import { Mutations, Actions } from 'paraview-quake/src/stores/TYPES';

// ----------------------------------------------------------------------------

Vue.use(Vuex);
Vue.use(Vuetify, {
  iconfont: 'mdi',
  icons: {
    settings: 'mdi-settings',
    defaultExpansionIcon: 'mdi-city',
    mines: 'mdi-pickaxe',
    seismicEvents: 'mdi-chart-bubble',
    quakeTrace: 'mdi-pulse',
    rays: 'mdi-wan',
    historicalEvents: 'mdi-history',
    uncertainty: 'mdi-help-network-outline',
    blasts: 'mdi-bomb',
    undo: 'mdi-undo',
    resetCamera: 'mdi-image-filter-center-focus',
    snapViewUp: 'mdi-compass',
    expandGroup: 'mdi-menu-down',
    layerOn: 'mdi-checkbox-blank',
    layerOff: 'mdi-checkbox-blank-outline',
    layerIndeterminate: 'mdi-checkbox-multiple-blank-outline',
    pickedDate: 'mdi-calendar',
    pickedTime: 'mdi-clock-outline',
    pickedPosition: 'mdi-crosshairs-gps',
  },
});

// ----------------------------------------------------------------------------

export function createConfigurationFromURLArgs(
  addOn = { application: 'quake' }
) {
  return Object.assign({}, vtkURLExtract.extractURLParameters(), addOn);
}

// ----------------------------------------------------------------------------

export function createViewer(
  container,
  config = createConfigurationFromURLArgs()
) {
  const store = createStore();
  store.commit(Mutations.NETWORK_CONFIG_SET, config);
  setInterval(() => store.dispatch(Actions.BUSY_UPDATE_PROGRESS, 1), 50);

  /* eslint-disable no-new */
  new Vue({
    el: container || '#root-container',
    components: { App },
    store,
    template: '<App />',
  });

  return {
    container,
    store,
  };
}

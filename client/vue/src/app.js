/* eslint-disable import/prefer-default-export */
import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';

import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';

/* eslint-disable-next-line import/extensions */
import 'typeface-roboto';

import 'vuetify/dist/vuetify.min.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

import App from 'paraview-quake/src/components/core/App';
import createStore from 'paraview-quake/src/stores';
import { Mutations, Actions } from 'paraview-quake/src/stores/TYPES';

// ----------------------------------------------------------------------------

Vue.use(Vuex);
Vue.use(Vuetify);

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

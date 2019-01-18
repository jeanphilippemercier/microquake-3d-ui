import Mousetrap from 'mousetrap';

import ControlsDrawer from 'paraview-quake/src/components/core/ControlsDrawer';
import GlobalSettings from 'paraview-quake/src/components/core/GlobalSettings';
import VtkView from 'paraview-quake/src/components/core/View';

import shortcuts from 'paraview-quake/src/shortcuts';
import { Actions } from 'paraview-quake/src/stores/TYPES';

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

export default {
  name: 'App',
  components: {
    ControlsDrawer,
    GlobalSettings,
    VtkView,
  },
  data() {
    return {
      menuVisible: true,
      advanceMenuVisible: false,
      componentsVisibility: [0, 1, 2, 3],
    };
  },
  computed: {
    client() {
      return this.$store.getters.NETWORK_CLIENT;
    },
    darkMode() {
      return this.$store.getters.APP_DARK_THEME;
    },
  },
  mounted() {
    // attach keyboard shortcuts
    shortcuts.forEach(({ key, action }) => {
      if (Actions[action]) {
        Mousetrap.bind(key, (e) => {
          e.preventDefault();
          this.$store.dispatch(Actions[action]);
        });
      }
    });

    // Establish websocket connection
    this.$store.dispatch(Actions.NETWORK_CONNECT);
  },
  beforeDestroy() {
    shortcuts.forEach(({ key, action }) => {
      if (Actions[action]) {
        Mousetrap.unbind(key);
      }
    });
  },
};

import Mousetrap from 'mousetrap';

import ControlsDrawer from 'paraview-quake/src/components/core/ControlsDrawer';
import GlobalSettings from 'paraview-quake/src/components/core/GlobalSettings';
import VtkView from 'paraview-quake/src/components/core/View';

import ProgressBar from 'paraview-quake/src/components/widgets/ProgressBar';

import shortcuts from 'paraview-quake/src/shortcuts';
import { Mutations, Actions } from 'paraview-quake/src/stores/TYPES';

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

const VISIBILITY_ICON_INDEX_MAPPING = [
  'mine',
  'seismicEvents',
  'blast',
  'historicEvents',
];

export default {
  name: 'App',
  components: {
    ControlsDrawer,
    GlobalSettings,
    VtkView,
    ProgressBar,
  },
  data() {
    return {
      menuVisible: true,
      advanceMenuVisible: false,
    };
  },
  computed: {
    client() {
      return this.$store.getters.NETWORK_CLIENT;
    },
    darkMode() {
      return this.$store.getters.APP_DARK_THEME;
    },
    busyProgress() {
      return this.$store.getters.BUSY_PROGRESS;
    },
    componentsVisibility: {
      get() {
        const visibilityMap = this.$store.getters.QUAKE_COMPONENTS_VISIBILITY;
        return VISIBILITY_ICON_INDEX_MAPPING.map(
          (v, i) => (visibilityMap[v] ? i : -1)
        );
      },
      set(value) {
        const visibilityMap = {};
        for (let i = 0; i < value.length; i++) {
          const key = VISIBILITY_ICON_INDEX_MAPPING[value[i]];
          if (key) {
            visibilityMap[key] = true;
          }
        }
        this.$store.commit(
          Mutations.QUAKE_COMPONENTS_VISIBILITY_SET,
          visibilityMap
        );
        this.$store.dispatch(Actions.QUAKE_UPDATE_MINE_VISIBILITY);
        this.$store.dispatch(Actions.QUAKE_UPDATE_EVENTS_VISIBILITY);
      },
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

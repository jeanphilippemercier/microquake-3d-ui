import Mousetrap from 'mousetrap';

import ControlsDrawer from 'paraview-quake/src/components/core/ControlsDrawer';
import GlobalSettings from 'paraview-quake/src/components/core/GlobalSettings';
import VtkView from 'paraview-quake/src/components/core/View';

// import ProgressBar from 'paraview-quake/src/components/widgets/ProgressBar';
import PickingTooltip from 'paraview-quake/src/components/widgets/PickingTooltip';
import ToolbarTimeRange from 'paraview-quake/src/components/widgets/ToolbarTimeRange';

import shortcuts from 'paraview-quake/src/shortcuts';

// ----------------------------------------------------------------------------
// Helper methods
// ----------------------------------------------------------------------------

function pushVisibilityChanges(store, visibilityMap) {
  store.commit('QUAKE_COMPONENTS_VISIBILITY_SET', visibilityMap);
  store.dispatch('API_UPDATE_MINE_VISIBILITY');
  store.dispatch('API_UPDATE_EVENTS_VISIBILITY');
}

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

const VISIBILITY_ICON_INDEX_MAPPING = [
  'mine',
  'seismicEvents',
  'blast',
  'historicEvents',
  'uncertainty',
];

export default {
  name: 'App',
  components: {
    ControlsDrawer,
    GlobalSettings,
    VtkView,
    // ProgressBar,
    PickingTooltip,
    ToolbarTimeRange,
  },
  data() {
    return {
      menuVisible: true,
      advanceMenuVisible: false,
      rayFilterModes: [
        { label: 'Preferred Origin + Arrival', value: 0 },
        { label: 'Preferred Origin', value: 1 },
        { label: 'All Rays', value: 2 },
      ],
    };
  },
  computed: {
    client() {
      return this.$store.getters.REMOTE_CLIENT;
    },
    darkMode() {
      return this.$store.getters.APP_DARK_THEME;
    },
    busyCount() {
      return this.$store.getters.BUSY_COUNT;
    },
    errorMessage() {
      return this.$store.getters.REMOTE_ERROR;
    },
    componentsVisibility: {
      get() {
        const visibilityMap = this.$store.getters.QUAKE_COMPONENTS_VISIBILITY;
        return VISIBILITY_ICON_INDEX_MAPPING.map((v, i) =>
          visibilityMap[v] ? i : -1
        );
      },
      set(value) {
        const visibilityMap = Object.assign(
          {},
          this.$store.getters.QUAKE_COMPONENTS_VISIBILITY
        );

        VISIBILITY_ICON_INDEX_MAPPING.forEach((key) => {
          visibilityMap[key] = false;
        });

        for (let i = 0; i < value.length; i++) {
          const key = VISIBILITY_ICON_INDEX_MAPPING[value[i]];
          if (key) {
            visibilityMap[key] = true;
          }
        }
        pushVisibilityChanges(this.$store, visibilityMap);
      },
    },
    raysInScene() {
      return this.$store.getters.QUAKE_RAYS_IN_SCENE;
    },
    raysVisible: {
      get() {
        const curVal = this.$store.getters.QUAKE_COMPONENTS_VISIBILITY.ray;
        return curVal ? 0 : null;
      },
      set() {
        const visibilityMap = this.$store.getters.QUAKE_COMPONENTS_VISIBILITY;
        visibilityMap.ray = !visibilityMap.ray;
        pushVisibilityChanges(this.$store, visibilityMap);
      },
    },
    doubleClickMode: {
      get() {
        return this.$store.getters.QUAKE_DOUBLE_CLICK_MODE;
      },
      set(value) {
        this.$store.commit('QUAKE_DOUBLE_CLICK_MODE_SET', value);
      },
    },
    rayFilterMode: {
      get() {
        return this.$store.getters.QUAKE_RAY_FILTER_MODE;
      },
      set(value) {
        this.$store.commit('QUAKE_RAY_FILTER_MODE_SET', value.value);
        this.$store.dispatch('API_UPDATE_RAY_FILTER_MODE');
      },
    },
  },
  mounted() {
    // attach keyboard shortcuts
    shortcuts.forEach(({ key, action }) => {
      Mousetrap.bind(key, (e) => {
        e.preventDefault();
        this.$store.dispatch(action);
      });
    });

    // Establish websocket connection
    this.$store.dispatch('API_INITIALIZE');
  },
  beforeDestroy() {
    shortcuts.forEach(({ key }) => {
      Mousetrap.unbind(key);
    });
  },
};

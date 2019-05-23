import Mousetrap from 'mousetrap';
import { mapGetters, mapMutations, mapActions } from 'vuex';

import ControlsDrawer from 'paraview-quake/src/components/core/ControlsDrawer';
import GlobalSettings from 'paraview-quake/src/components/core/GlobalSettings';
import LocalView from 'paraview-quake/src/components/core/LocalView';
import PickingTooltip from 'paraview-quake/src/components/widgets/PickingTooltip';
import ToolbarTimeRange from 'paraview-quake/src/components/widgets/ToolbarTimeRange';
import VtkView from 'paraview-quake/src/components/core/View';

import shortcuts from 'paraview-quake/src/shortcuts';

// ----------------------------------------------------------------------------
// Helper methods
// ----------------------------------------------------------------------------

function pushVisibilityChanges(store, visibilityMap) {
  store.commit('QUAKE_COMPONENTS_VISIBILITY_SET', visibilityMap);
  store.dispatch('API_UPDATE_MINE_VISIBILITY');
  store.dispatch('API_UPDATE_EVENTS_VISIBILITY');
}

const EMPTY_NETWORK = { networks: [] };

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
    LocalView,
    PickingTooltip,
    ToolbarTimeRange,
    VtkView,
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
    ...mapGetters({
      userName: 'APP_AUTH_USER_NAME',
      userPassword: 'APP_AUTH_USER_PASSWORD',
      selectedSite: 'QUAKE_SELECTED_SITE',
      selectedNetwork: 'QUAKE_SELECTED_NETWORK',
      localRendering: 'API_LOCAL_RENDERING',
      doubleClickMode: 'QUAKE_DOUBLE_CLICK_MODE',
      loginError: 'APP_AUTH_ERROR',

      siteMap: 'QUAKE_SITE_MAP',
      authToken: 'HTTP_AUTH_TOKEN',
      siteSelected: 'QUAKE_USER_ACCEPTED_SITE',
      client: 'REMOTE_CLIENT',
      darkMode: 'APP_DARK_THEME',
      busyCount: 'BUSY_COUNT',
      errorMessage: 'REMOTE_ERROR',
      raysInScene: 'QUAKE_RAYS_IN_SCENE',
    }),
    siteItems() {
      return Object.values(this.siteMap || []);
    },
    networkItems() {
      return (
        (this.siteMap &&
          this.selectedSite &&
          this.siteMap[this.selectedSite]) ||
        EMPTY_NETWORK
      ).networks;
    },
    remoteReady() {
      return !this.localRendering && this.client;
    },
    localReady() {
      return this.localRendering;
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
    rayFilterMode: {
      get() {
        return this.$store.getters.QUAKE_RAY_FILTER_MODE;
      },
      set(value) {
        this.$store.commit('QUAKE_RAY_FILTER_MODE_SET', value.value);
        this.$store.dispatch('API_UPDATE_RAY_FILTER_MODE');
      },
    },

    eventStatusFilter: {
      get() {
        return this.$store.getters.QUAKE_FOCUS_EVENT_STATUS;
      },
      set(value) {
        console.log(value);
        this.$store.commit('QUAKE_FOCUS_EVENT_STATUS_SET', value);
        this.$store.dispatch('API_UPDATE_EVENTS');
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
  },
  beforeDestroy() {
    shortcuts.forEach(({ key }) => {
      Mousetrap.unbind(key);
    });
  },
  methods: {
    ...mapMutations({
      updateUserName: 'APP_AUTH_USER_NAME_SET',
      updateUserPassword: 'APP_AUTH_USER_PASSWORD_SET',
      updateSelectedSite: 'QUAKE_SELECTED_SITE_SET',
      updateSelectedNetwork: 'QUAKE_SELECTED_NETWORK_SET',
      updateLocalRendering: 'API_LOCAL_RENDERING_SET',
      updateDoubleClickMode: 'QUAKE_DOUBLE_CLICK_MODE_SET',
    }),
    ...mapActions({
      login: 'APP_LOGIN',
    }),
    selectSite() {
      console.log('In selectSite() method');
      if (this.selectSite && this.selectedNetwork) {
        this.$store.commit('QUAKE_USER_ACCEPTED_SITE_SET', true);
        this.$store.dispatch('API_INITIALIZE');
      }
    },
  },
};

import Mousetrap from 'mousetrap';
import { mapGetters, mapMutations, mapActions } from 'vuex';

import ControlsDrawer from 'paraview-quake/src/components/core/ControlsDrawer';
import DateHelper from 'paraview-quake/src/util/DateHelper';
import GlobalSettings from 'paraview-quake/src/components/core/GlobalSettings';
import LocalView from 'paraview-quake/src/components/core/LocalView';
import NotificationToast from 'paraview-quake/src/components/core/NotificationToast';
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

const EMPTY_NETWORK = { networks: [] };

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

const VISIBILITY_ICON_INDEX_MAPPING = [
  'catalogue',
  'mine',
  'seismicEvents',
  'blast',
  'historicEvents',
  'otherEvents',
  'uncertainty',
];

export default {
  name: 'App',
  components: {
    ControlsDrawer,
    GlobalSettings,
    LocalView,
    NotificationToast,
    PickingTooltip,
    ToolbarTimeRange,
  },
  data() {
    return {
      refreshCount: 0,
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
      darkMode: 'APP_DARK_THEME',
      busyCount: 'BUSY_COUNT',
      errorMessage: 'APP_ERROR_MSG',
      raysInScene: 'QUAKE_RAYS_IN_SCENE',

      heartbeat: 'QUAKE_HEARTBEAT',

      appURL: 'QUAKE_URL',
    }),
    connectorColor() {
      // eslint-disable-next-line
      this.refreshCount; // create dependency
      const connectorTime = DateHelper.toHoursFromNow(
        this.heartbeat.event_connector
      );
      // 5/60 => 0.0833 => 5 minutes
      if (connectorTime < 0.083) {
        return 'green';
      }
      // 15/60 => 0.25 => 15 minutes
      if (connectorTime < 0.25) {
        return 'yellow';
      }
      return 'red';
    },
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
    localReady() {
      return this.localRendering;
    },
    componentsVisibility: {
      get() {
        const visibilityMap = this.$store.getters.QUAKE_COMPONENTS_VISIBILITY;
        return Object.keys(visibilityMap).filter((k) => visibilityMap[k]);
      },
      set(value) {
        const visibilityMap = {
          ...this.$store.getters.QUAKE_COMPONENTS_VISIBILITY,
        };

        VISIBILITY_ICON_INDEX_MAPPING.forEach((key) => {
          visibilityMap[key] = false;
        });

        for (let i = 0; i < value.length; i++) {
          visibilityMap[value[i]] = true;
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
        const status = this.$store.getters.QUAKE_FOCUS_EVENT_STATUS;
        if (status === 'all') {
          return ['accepted', 'rejected'];
        }
        return [status];
      },
      set(value) {
        if (value.length === 1) {
          this.$store.commit('QUAKE_FOCUS_EVENT_STATUS_SET', value[0]);
        } else {
          this.$store.commit('QUAKE_FOCUS_EVENT_STATUS_SET', 'all');
        }
        this.$store.dispatch('API_UPDATE_EVENTS');
      },
    },
    htmlError() {
      if (!this.loginError || typeof this.loginError !== 'string') {
        return null;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.loginError, 'text/html');
      const elem = doc.querySelector('head > title');
      return (elem && elem.textContent) || this.loginError;
    },
  },
  mounted() {
    this.refreshInterval = setInterval(() => {
      this.refreshCount = this.refreshCount + 1;
    }, 1000);

    // attach keyboard shortcuts
    shortcuts.forEach(({ key, action }) => {
      Mousetrap.bind(key, (e) => {
        e.preventDefault();
        this.$store.dispatch(action);
      });
    });

    if (this.selectedSite) {
      this.updateSelectedSite(this.selectedSite);
    }
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
    shortcuts.forEach(({ key }) => {
      Mousetrap.unbind(key);
    });
  },
  methods: {
    ...mapMutations({
      updateUserName: 'APP_AUTH_USER_NAME_SET',
      updateUserPassword: 'APP_AUTH_USER_PASSWORD_SET',
      updateSelectedNetwork: 'QUAKE_SELECTED_NETWORK_SET',
      updateDoubleClickMode: 'QUAKE_DOUBLE_CLICK_MODE_SET',
    }),
    ...mapActions({
      login: 'APP_LOGIN',
      updateSelectedSite: 'QUAKE_SELECTED_SITE_SET',
    }),
    selectSite() {
      console.log('In selectSite() method');
      if (this.selectSite && this.selectedNetwork) {
        this.$store.commit('QUAKE_USER_ACCEPTED_SITE_SET', true);
        this.$store.dispatch('API_INITIALIZE');
      }
    },
    loginOnEnter({ code }) {
      if (code === 'Enter') {
        this.login();
      }
    },
  },
  filters: {
    toHoursFromNow: DateHelper.toHoursFromNow,
    hoursFromNowToLabel: DateHelper.hoursFromNowToLabel,
  },
};

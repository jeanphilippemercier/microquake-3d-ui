import Mousetrap from 'mousetrap';

import ControlsDrawer from 'paraview-quake/src/components/core/ControlsDrawer';
import GlobalSettings from 'paraview-quake/src/components/core/GlobalSettings';
import VtkView from 'paraview-quake/src/components/core/View';
import LocalView from 'paraview-quake/src/components/core/LocalView';

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
    LocalView,
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
    userName: {
      get() {
        return this.$store.getters.APP_AUTH_USER_NAME;
      },
      set(value) {
        this.$store.commit('APP_AUTH_USER_NAME_SET', value);
      },
    },
    userPassword: {
      get() {
        return this.$store.getters.APP_AUTH_USER_PASSWORD;
      },
      set(value) {
        this.$store.commit('APP_AUTH_USER_PASSWORD_SET', value);
      },
    },
    sitesAvailable() {
      const siteMap = this.$store.getters.QUAKE_SITE_MAP;
      if (siteMap) {
        return Object.keys(siteMap).map((key) => siteMap[key]);
      }
      return [];
    },
    site: {
      get() {
        return this.$store.getters.QUAKE_SELECTED_SITE;
      },
      set(value) {
        console.log(`Going to commit ${value} to QUAKE_SELECTED_SITE_SET`);
        this.$store.commit('QUAKE_SELECTED_SITE_SET', value);
      },
    },
    networksAvailable() {
      const siteMap = this.$store.getters.QUAKE_SITE_MAP;
      const selectedSite = this.$store.getters.QUAKE_SELECTED_SITE;
      if (siteMap && selectedSite) {
        const { networks } = siteMap[selectedSite];
        return networks ? networks : [];
      }
      return [];
    },
    network: {
      get() {
        return this.$store.getters.QUAKE_SELECTED_NETWORK;
      },
      set(value) {
        console.log(`Going to commit ${value} to QUAKE_SELECTED_NETWORK_SET`);
        this.$store.commit('QUAKE_SELECTED_NETWORK_SET', value);
      },
    },
    renderMode: {
      get() {
        return this.$store.getters.API_RENDER_MODE === 'LOCAL';
      },
      set(value) {
        const mode = value ? 'LOCAL' : 'REMOTE';
        console.log(`storing render mode: ${mode}`);
        this.$store.commit('API_RENDER_MODE_SET', mode);
      },
    },
    authToken() {
      return this.$store.getters.HTTP_AUTH_TOKEN;
    },
    siteSelected() {
      return this.$store.getters.QUAKE_USER_ACCEPTED_SITE;
    },
    remoteReady() {
      return (
        this.$store.getters.API_RENDER_MODE === 'REMOTE' &&
        this.$store.getters.REMOTE_CLIENT
      );
    },
    localReady() {
      return this.$store.getters.API_RENDER_MODE === 'LOCAL';
    },
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

    // // Establish websocket connection
    // this.$store.dispatch('API_AUTHENTICATE').then(() => {
    //   this.$store.dispatch('API_INITIALIZE');
    // });
  },
  beforeDestroy() {
    shortcuts.forEach(({ key }) => {
      Mousetrap.unbind(key);
    });
  },
  methods: {
    performLogin() {
      // const username = this.$store.getters.APP_AUTH_USER_NAME;
      // const password = this.$store.getters.APP_AUTH_USER_PASSWORD;
      // console.log(`Authenticate: username = ${username}, password = ${password}`);

      this.$store
        .dispatch('HTTP_AUTHENTICATE')
        .then((result) => {
          console.log('Authenticated');
          console.log(result);
          this.$store.commit('HTTP_AUTH_TOKEN_SET', result.data.token);
          console.log('Stored auth token, about to dispatch HTTP_FETCH_SITES');
          this.$store
            .dispatch('HTTP_FETCH_SITES')
            .then((sitesResponse) => {
              console.log('Got sites json:');
              console.log(sitesResponse.data);
              this.$store.dispatch('QUAKE_UPDATE_SITES', sitesResponse.data);
            })
            .catch((siteError) => {
              console.error('Error fetching sites:');
              console.error(siteError);
            });
        })
        .catch((error) => {
          console.error('Authentication failure');
          console.error(error);
        });
    },
    selectSite() {
      console.log('In selectSite() method');
      if (
        this.$store.getters.QUAKE_SELECTED_SITE &&
        this.$store.getters.QUAKE_SELECTED_NETWORK
      ) {
        this.$store.commit('QUAKE_USER_ACCEPTED_SITE_SET', true);
        this.$store.dispatch('API_INITIALIZE');
      }
    },
  },
};

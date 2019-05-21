export default {
  name: 'SiteSelectModal',
  computed: {
    sitesAvailable() {
      const siteMap = this.$store.getters.QUAKE_SITE_MAP;
      if (siteMap) {
        return Object.keys(siteMap).map((key) => siteMap[key] );
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
  },
  methods: {
    selectSite() {
      console.log('In selectSite() method');
      if (this.$store.getters.QUAKE_SELECTED_SITE &&
        this.$store.getters.QUAKE_SELECTED_NETWORK) {
        this.$store.commit('QUAKE_USER_ACCEPTED_SITE_SET', true);
        this.$store.dispatch('API_INITIALIZE');
      }
    },
  },
};

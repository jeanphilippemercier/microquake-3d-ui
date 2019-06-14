import { mapGetters, mapActions } from 'vuex';
import URLHelper from 'paraview-quake/src/util/URLHelper';

export default {
  name: 'Catalogue',
  computed: {
    ...mapGetters({
      darkMode: 'APP_DARK_THEME',
      catalogue: 'QUAKE_CATALOGUE',
      labelTypeMapping: 'QUAKE_TYPE_MAPPING',
      activeEvent: 'API_ACTIVE_EVENT',
    }),
    active: {
      get() {
        return [this.activeEvent];
      },
      set(v) {
        this.updateActiveEvent(v[0]);
      },
    },
  },
  methods: {
    ...mapActions({
      updateActiveEvent: 'API_ACTIVATE_EVENT',
      open: '',
    }),
    open(id) {
      const url = URLHelper.getWaveformURLForEvent(id);
      const win = window.open(url, '_blank');
      win.focus();
    },
    showRays(event_resource_id) {
      this.$store.commit('QUAKE_PICKED_DATA_SET', { event_resource_id });
      this.$store.dispatch('API_SHOW_RAY');
    },
  },
};

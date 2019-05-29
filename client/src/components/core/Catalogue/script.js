import { mapGetters, mapActions } from 'vuex';
import URLHelper from 'paraview-quake/src/util/URLHelper';

export default {
  name: 'Catalogue',
  data() {
    return {
      active: [],
    };
  },
  computed: {
    ...mapGetters({
      darkMode: 'APP_DARK_THEME',
      catalogue: 'QUAKE_CATALOGUE',
      labelTypeMapping: 'QUAKE_TYPE_MAPPING',
    }),
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
  },
  watch: {
    active(v) {
      this.updateActiveEvent(v[0]);
    },
  },
};

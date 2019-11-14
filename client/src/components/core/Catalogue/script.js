import { mapGetters, mapActions } from 'vuex';
import URLHelper from 'paraview-quake/src/util/URLHelper';
import EventDetail from 'paraview-quake/src/components/widgets/EventDetail';

export default {
  name: 'Catalogue',
  components: {
    EventDetail,
  },
  computed: {
    ...mapGetters({
      darkMode: 'APP_DARK_THEME',
      catalogue: 'QUAKE_CATALOGUE',
      labelTypeMapping: 'QUAKE_TYPE_MAPPING',
      activeEvent: 'API_ACTIVE_EVENT',
      selectedEvent: 'QUAKE_SELECTED_EVENT',
    }),
    active: {
      get() {
        return [this.activeEvent];
      },
      set(v) {
        this.updateActiveEvent(v[0]);
      },
    },
    treeStyle() {
      let baseHeight = 110;
      if (this.selectedEvent && this.selectedEvent.time_utc) {
        baseHeight += 392;
      }
      const height = `calc(100vh - ${baseHeight}px)`;
      return {
        minHeight: height,
        maxHeight: height,
        overflow: 'auto',
      };
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
    unselectEvent() {
      this.updateActiveEvent('');
    },
  },
  filters: {
    significant(number) {
      let fixedDecimal = 0;
      let absNum = Math.abs(number);
      while (absNum < 10) {
        fixedDecimal++;
        absNum *= 10;
      }
      return number.toFixed(fixedDecimal);
    },
    sign(str) {
      if (str[0] === '-') {
        return str;
      }
      return `+${str}`;
    },
  },
};

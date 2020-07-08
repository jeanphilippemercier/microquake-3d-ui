import DateHelper from 'paraview-quake/src/util/DateHelper';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'ToolbarTimeRange',
  data() {
    return {
      dateHelper: DateHelper,
      minDateMenu: false,
      maxDateMenu: false,
    };
  },
  computed: {
    ...mapGetters({
      leftDateLabel: 'DATE_FOCUS_MIN_LABEL',
      rightDateLabel: 'DATE_FOCUS_MAX_LABEL',
    }),
    activePreset() {
      return this.$store.getters.QUAKE_COLOR_PRESET;
    },
    presets() {
      return this.$store.getters.QUAKE_COLOR_PRESETS;
    },
    focusDateLabels() {
      return this.focusPeriod.map((v) =>
        DateHelper.getDateFromNow(this.sliderMax - v)
      );
    },
    minDate: {
      get() {
        return this.leftDateLabel;
      },
      set(v) {
        this.setDateLeft(v);
        this.updateFocusPeriod();
      },
    },
    maxDate: {
      get() {
        return this.rightDateLabel;
      },
      set(v) {
        this.setDateRight(v);
        this.updateFocusPeriod();
      },
    },
  },
  filters: {
    toMineTime: DateHelper.toMineTime,
    toDay: (s) => s.substr(0, 10),
  },
  methods: {
    ...mapActions({
      setDateLeft: 'DATE_FOCUS_UPDATE_START_DATE',
      setDateRight: 'DATE_FOCUS_UPDATE_END_DATE',
      updateFocusPeriod: 'API_UPDATE_EVENTS',
    }),
  },
};

import DateHelper from 'paraview-quake/src/util/DateHelper';

const DEFAULT_MAX_RANGE = 2190;

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
    sliderMax: {
      get() {
        return this.$store.getters.QUAKE_FOCUS_PERIOD_OFFSET;
      },
      set(value) {
        this.$store.commit('QUAKE_FOCUS_PERIOD_OFFSET_SET', value);
      },
    },
    focusPeriod: {
      get() {
        return this.$store.getters.QUAKE_FOCUS_PERIOD;
      },
      set(value) {
        this.$store.commit('QUAKE_FOCUS_PERIOD_SET', value.slice());
      },
    },
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
        return this.focusDateLabels[0].substr(0, 10);
      },
      set(v) {
        const deltaH = DateHelper.getHoursFromNow(v);
        const newPeriod = this.focusPeriod.map((t) => this.sliderMax - t);
        this.sliderMax =
          deltaH > DEFAULT_MAX_RANGE ? deltaH : DEFAULT_MAX_RANGE;
        newPeriod[0] = deltaH;
        if (newPeriod[0] < newPeriod[1]) {
          newPeriod[1] = newPeriod[0] - 24;
          if (newPeriod[1] < 0) {
            newPeriod[1] = 0;
          }
        }
        this.focusPeriod = newPeriod.map((t) => this.sliderMax - t);
        this.updateFocusPeriod();
      },
    },
    maxDate: {
      get() {
        return this.focusDateLabels[1].substr(0, 10);
      },
      set(v) {
        const deltaH = DateHelper.getHoursFromNow(v);
        const newPeriod = this.focusPeriod.map((t) => this.sliderMax - t);
        newPeriod[1] = deltaH;
        if (deltaH > newPeriod[0]) {
          newPeriod[0] = deltaH + 24;
        }
        if (deltaH + 24 > this.sliderMax) {
          this.sliderMax = deltaH + 24;
        }
        this.focusPeriod = newPeriod.map((t) => this.sliderMax - t);
        this.updateFocusPeriod();
      },
    },
  },
  filters: {
    toMineTime: DateHelper.toMineTime,
    toDay: (s) => s.substr(0, 10),
  },
  methods: {
    updateFocusPeriod() {
      this.$store.dispatch('API_UPDATE_EVENTS');
    },
  },
};

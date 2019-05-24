import DateHelper from 'paraview-quake/src/util/DateHelper';

export default {
  name: 'ToolbarTimeRange',
  data() {
    return {
      dateHelper: DateHelper,
    };
  },
  computed: {
    sliderMax() {
      return this.$store.getters.QUAKE_FOCUS_PERIOD_OFFSET;
    },
    focusPeriod() {
      return this.$store.getters.QUAKE_FOCUS_PERIOD;
    },
    activePreset() {
      return this.$store.getters.QUAKE_COLOR_PRESET;
    },
    presets() {
      return this.$store.getters.QUAKE_COLOR_PRESETS;
    },
    focusDateLabels() {
      return this.focusPeriod.map(
        (v) => DateHelper.getDateFromNow(this.sliderMax - v).split('T')[0]
      );
    },
  },
};

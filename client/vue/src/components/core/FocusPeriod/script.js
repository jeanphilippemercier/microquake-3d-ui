import { Actions, Mutations } from 'paraview-quake/src/stores/TYPES';
import DateHelper from 'paraview-quake/src/util/DateHelper';
import ColorPresets from 'paraview-quake/src/components/widgets/ColorPresets';

export default {
  name: 'FocusPeriod',
  components: {
    ColorPresets,
  },
  computed: {
    darkMode() {
      return this.$store.getters.APP_DARK_THEME;
    },
    activePreset() {
      return this.$store.getters.QUAKE_COLOR_PRESET;
    },
    presets() {
      return this.$store.getters.QUAKE_COLOR_PRESETS;
    },
    focusPeriod: {
      get() {
        return this.$store.getters.QUAKE_FOCUS_PERIOD;
      },
      set(value) {
        this.$store.commit(Mutations.QUAKE_FOCUS_PERIOD_SET, value.slice());
      },
    },
    focusPeriodLabels() {
      return this.focusPeriod.map((v) =>
        DateHelper.getShortTimeLabel(2190 - v)
      );
    },
    focusDateLabels() {
      return this.focusPeriod.map((v) => DateHelper.getDateFromNow(2190 - v));
    },
  },
  methods: {
    updateActivePreset(value) {
      this.$store.dispatch(Actions.QUAKE_UPDATE_PRESET, `${value}`);
    },
    updateFocusPeriod() {
      this.$store.dispatch(Actions.QUAKE_UPDATE_EVENTS);
    },
  },
};

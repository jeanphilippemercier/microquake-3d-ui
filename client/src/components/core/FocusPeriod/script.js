import DateHelper from 'paraview-quake/src/util/DateHelper';
import ColorPresets from 'paraview-quake/src/components/widgets/ColorPresets';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'FocusPeriod',
  components: {
    ColorPresets,
  },
  data() {
    return {
      hideSlider: false,
      minDateMenu: false,
      maxDateMenu: false,
    };
  },
  computed: {
    ...mapGetters({
      sliderMax: 'DATE_FOCUS_PERIOD_MAX',
      sliderLeft: 'DATE_FOCUS_START_DAY',
      sliderRight: 'DATE_FOCUS_END_DAY',
      leftDateLabel: 'DATE_FOCUS_MIN_LABEL',
      rightDateLabel: 'DATE_FOCUS_MAX_LABEL',
      leftDurationLabel: 'DATE_FOCUS_MIN_DURATION_LABEL',
      rightDurationLabel: 'DATE_FOCUS_MAX_DURATION_LABEL',
    }),
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
        return [this.sliderLeft, this.sliderRight];
      },
      set(value) {
        this.setSliderRight(value[1]);
        this.setSliderLeft(value[0]);
      },
    },
    focusPeriodLabels() {
      return this.focusPeriod.map((v) =>
        DateHelper.getShortTimeLabel(this.sliderMax - v)
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
  methods: {
    ...mapActions({
      setSliderLeft: 'DATE_FOCUS_UPDATE_START_DAY',
      setSliderRight: 'DATE_FOCUS_UPDATE_END_DAY',
      setDateLeft: 'DATE_FOCUS_UPDATE_START_DATE',
      setDateRight: 'DATE_FOCUS_UPDATE_END_DATE',
      updateFocusPeriod: 'API_UPDATE_EVENTS',
    }),
    updateActivePreset(value) {
      this.$store.dispatch('API_UPDATE_PRESET', `${value}`);
    },
  },
};

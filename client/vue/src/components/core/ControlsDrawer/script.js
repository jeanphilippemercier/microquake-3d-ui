export default {
  name: 'ControlsDrawer',
  data() {
    return {
      focusPeriod: [0, 2000],
      historicalPeriod: 0,
      mineVisibility: [],
    };
  },
  computed: {
    darkMode() {
      return this.$store.getters.APP_DARK_THEME;
    },
    mine() {
      return this.$store.getters.QUAKE_MINE;
    },
  },
};

import { Actions } from 'paraview-quake/src/stores/TYPES';

export default {
  name: 'ControlsDrawer',
  data() {
    return {
      focusPeriod: [0, 2000],
      historicalPeriod: 0,
    };
  },
  computed: {
    darkMode() {
      return this.$store.getters.APP_DARK_THEME;
    },
    mine() {
      return this.$store.getters.QUAKE_MINE;
    },
    mineVisibility: {
      get() {
        return this.$store.getters.QUAKE_MINE_VISIBILITY;
      },
      set(value) {
        this.$store.dispatch(Actions.QUAKE_UPDATE_MINE_VISIBILITY, value);
      },
    },
  },
};

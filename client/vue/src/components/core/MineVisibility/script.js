import { Actions, Mutations } from 'paraview-quake/src/stores/TYPES';

export default {
  name: 'MineVisibility',
  data() {
    return {};
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
        this.$store.commit(Mutations.QUAKE_MINE_VISIBILITY_SET, value);
        this.$store.dispatch(Actions.QUAKE_UPDATE_MINE_VISIBILITY);
      },
    },
    allIds() {
      return this.mine.map((v) => v.id);
    },
  },
};

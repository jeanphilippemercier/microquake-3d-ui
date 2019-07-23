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
        this.$store.commit('QUAKE_MINE_VISIBILITY_SET', value);
        this.$store.dispatch('API_UPDATE_MINE_VISIBILITY');
      },
    },
    allIds() {
      return this.mine.map((v) => v.id);
    },
  },
};

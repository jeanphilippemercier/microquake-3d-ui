import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Catalogue',
  data() {
    return {
      active: [],
    };
  },
  computed: {
    ...mapGetters({
      darkMode: 'APP_DARK_THEME',
      catalogue: 'QUAKE_CATALOGUE',
    }),
  },
  methods: {
    ...mapActions({
      updateActiveEvent: 'API_ACTIVATE_EVENT',
    }),
  },
  watch: {
    active(v) {
      this.updateActiveEvent(v[0]);
    },
  },
};

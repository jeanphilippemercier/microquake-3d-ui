export default {
  name: 'ExpensionSection',
  props: {
    id: {
      type: String,
      default: 'mine',
    },
    title: {
      type: String,
      default: 'Mine',
    },
    icon: {
      type: String,
      default: 'location_city',
    },
  },
  computed: {
    style() {
      let visible = false;
      this.id.split(',').forEach((v) => {
        visible = visible || this.$store.getters.QUAKE_COMPONENTS_VISIBILITY[v];
      });
      return {
        opacity: visible ? 1 : 0.4,
      };
    },
  },
};

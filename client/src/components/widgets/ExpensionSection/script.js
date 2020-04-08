export default {
  name: 'ExpensionSection',
  props: {
    id: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: 'Mine',
    },
    icon: {
      type: String,
      default() {
        return this.$vuetify.icons.values.defaultExpansionIcon;
      },
    },
    contentClass: {
      type: String,
      default: 'px-2',
    },
  },
  computed: {
    style() {
      if (!this.id) {
        return { opacity: 1 };
      }
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

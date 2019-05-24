import PRESETS from 'paraview-quake/src/presets';

export default {
  name: 'ColorPresets',
  props: {
    presets: {
      type: Object,
      default: () => PRESETS,
    },
    active: {
      type: String,
      default: 'cool2warm',
    },
    onChange: {
      type: Function,
      default: Function.prototype,
    },
  },
  data() {
    return {
      showAll: false,
    };
  },
  computed: {
    inactiveImage() {
      return this.showAll ? this.$style.image : this.$style.hidden;
    },
  },
  methods: {
    activatePreset(e) {
      const newActiveName = e.target.dataset.name;
      if (newActiveName === this.active) {
        this.showAll = !this.showAll;
      } else {
        this.onChange(newActiveName);
      }
    },
  },
};

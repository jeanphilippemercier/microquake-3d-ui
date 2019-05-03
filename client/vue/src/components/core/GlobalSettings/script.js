function storeItem(key, value) {
  window.localStorage.setItem(
    `paraview.quake.config.${key.name}`,
    key.set(value)
  );
}

function retreiveItem(key, defaultValue) {
  const vStr = window.localStorage.getItem(`paraview.quake.config.${key.name}`);
  if (vStr === undefined || vStr === null) {
    return defaultValue || key.defaultValue;
  }
  return key.get(vStr);
}

function booleanSet(v) {
  return v ? '1' : '0';
}

function booleanGet(v) {
  return !!Number(v);
}

function numberSet(v) {
  return `${v}`;
}

function numberGet(v) {
  return Number(v);
}

function rangeSet(v) {
  return JSON.stringify(v.map(Number));
}

function rangeGet(v) {
  return JSON.parse(v);
}

const KEYS = {
  DARK_MODE: {
    name: 'darkmode',
    set: booleanSet,
    get: booleanGet,
    defaultValue: false,
    variable: 'darkMode',
  },
  ADVANCED_ORIENTATION: {
    name: 'advancedorientation',
    set: booleanSet,
    get: booleanGet,
    defaultValue: true,
    variable: 'advancedOrienation',
  },
  QUAKE_SCALING_RANGE: {
    name: 'scaling',
    set: rangeSet,
    get: rangeGet,
    defaultValue: [0.1, 1],
    variable: 'scalingRange',
  },
  QUAKE_MAGNITUDE_RANGE: {
    name: 'magnitude',
    set: rangeSet,
    get: rangeGet,
    defaultValue: [-2, 3],
    variable: 'magnitudeRange',
  },
  MAX_FPS: {
    name: 'fps',
    set: numberSet,
    get: numberGet,
    defaultValue: 30,
    variable: 'maxFPS',
  },
  QUAKE_UNCERTAINTY_SCALE_FACTOR: {
    name: 'uncertaintyScaleFactor',
    set: numberSet,
    get: numberGet,
    defaultValue: 1,
    variable: 'uncertaintyScaleFactor',
  },
  MOUSE_THROTTLE: {
    name: 'throttle',
    set: numberSet,
    get: numberGet,
    defaultValue: 16.6,
    variable: 'mouseThottle',
  },
  RATIO: {
    name: 'ratio',
    set: numberSet,
    get: numberGet,
    defaultValue: 1,
    variable: 'interactiveRatio',
  },
  QUALITY: {
    name: 'quality',
    set: numberSet,
    get: numberGet,
    defaultValue: 80,
    variable: 'interactiveQuality',
  },
};

// function purgeLocalStorage() {
//   Object.values(KEYS).forEach(({ name }) => {
//     localStorage.removeItem(`paraview.quake.config.${name}`);
//   });
// }
// purgeLocalStorage();

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

export default {
  name: 'GlobalSettings',
  methods: {
    wrapGet(storeGetKey, storeSetKey, storageKey) {
      const originalValue = this.$store.getters[storeGetKey];
      const value = retreiveItem(KEYS[storageKey], originalValue);
      if (value !== originalValue) {
        this.$store.commit(storeSetKey, value);
      }
      return value;
    },
    wrapSet(storeSetKey, storageKey, value) {
      storeItem(KEYS[storageKey], value);
      this.$store.commit(storeSetKey, value);
    },
    resetSettings() {
      Object.values(KEYS).forEach(({ variable, defaultValue }) => {
        this[variable] = defaultValue;
      });
    },
  },
  watch: {
    scalingRange() {
      this.$store.dispatch('API_UPDATE_SCALING');
    },
    magnitudeRange() {
      this.$store.dispatch('API_UPDATE_SCALING');
    },
    uncertaintyScaleFactor() {
      this.$store.dispatch('API_UPDATE_UNCERTAINTY_SCALING');
    },
    advancedOrientation() {
      this.$store.dispatch('VIEW_TOGGLE_WIDGET_MANAGER');
    },
  },
  computed: {
    hasChanges() {
      let changeDetected = false;
      Object.values(KEYS).forEach(({ variable, defaultValue }) => {
        if (this[variable] !== defaultValue) {
          changeDetected = true;
        }
      });
      return changeDetected;
    },
    darkMode: {
      get() {
        return this.wrapGet(
          'APP_DARK_THEME',
          'APP_DARK_THEME_SET',
          'DARK_MODE'
        );
      },
      set(value) {
        return this.wrapSet('APP_DARK_THEME_SET', 'DARK_MODE', value);
      },
    },
    advancedOrientation: {
      get() {
        return this.wrapGet(
          'VIEW_ADVANCED_ORIENTATION_WIDGET',
          'VIEW_ADVANCED_ORIENTATION_WIDGET_SET',
          'ADVANCED_ORIENTATION'
        );
      },
      set(value) {
        return this.wrapSet(
          'VIEW_ADVANCED_ORIENTATION_WIDGET_SET',
          'ADVANCED_ORIENTATION',
          value
        );
      },
    },
    scalingRange: {
      get() {
        return this.wrapGet(
          'QUAKE_SCALING_RANGE',
          'QUAKE_SCALING_RANGE_SET',
          'QUAKE_SCALING_RANGE'
        );
      },
      set(value) {
        return this.wrapSet(
          'QUAKE_SCALING_RANGE_SET',
          'QUAKE_SCALING_RANGE',
          value
        );
      },
    },
    magnitudeRange: {
      get() {
        return this.wrapGet(
          'QUAKE_MAGNITUDE_RANGE',
          'QUAKE_MAGNITUDE_RANGE_SET',
          'QUAKE_MAGNITUDE_RANGE'
        );
      },
      set(value) {
        return this.wrapSet(
          'QUAKE_MAGNITUDE_RANGE_SET',
          'QUAKE_MAGNITUDE_RANGE',
          value
        );
      },
    },
    uncertaintyScaleFactor: {
      get() {
        return this.wrapGet(
          'QUAKE_UNCERTAINTY_SCALE_FACTOR',
          'QUAKE_UNCERTAINTY_SCALE_FACTOR_SET',
          'QUAKE_UNCERTAINTY_SCALE_FACTOR'
        );
      },
      set(value) {
        return this.wrapSet(
          'QUAKE_UNCERTAINTY_SCALE_FACTOR_SET',
          'QUAKE_UNCERTAINTY_SCALE_FACTOR',
          value
        );
      },
    },
    interactiveQuality: {
      get() {
        return this.wrapGet(
          'VIEW_QUALITY_INTERACTIVE',
          'VIEW_QUALITY_INTERACTIVE_SET',
          'QUALITY'
        );
      },
      set(value) {
        this.wrapSet('VIEW_QUALITY_INTERACTIVE_SET', 'QUALITY', value);
      },
    },
    interactiveRatio: {
      get() {
        return this.wrapGet(
          'VIEW_RATIO_INTERACTIVE',
          'VIEW_RATIO_INTERACTIVE_SET',
          'RATIO'
        );
      },
      set(value) {
        this.wrapSet('VIEW_RATIO_INTERACTIVE_SET', 'RATIO', value);
      },
    },
    maxFPS: {
      get() {
        return this.wrapGet('VIEW_FPS_MAX', 'VIEW_FPS_MAX_SET', 'MAX_FPS');
      },
      set(value) {
        this.wrapSet('VIEW_FPS_MAX_SET', 'MAX_FPS', value);
        this.mouseThottle = 1000 / (2 * value);
      },
    },
    mouseThottle: {
      get() {
        return this.wrapGet(
          'VIEW_MOUSE_THROTTLE',
          'VIEW_MOUSE_THROTTLE_SET',
          'MOUSE_THROTTLE'
        );
      },
      set(value) {
        this.wrapSet('VIEW_MOUSE_THROTTLE_SET', 'MOUSE_THROTTLE', value);
      },
    },
    showRenderingStats: {
      get() {
        return this.$store.getters.VIEW_STATS;
      },
      set(value) {
        this.$store.commit('VIEW_STATS_SET', value);
        this.$store.dispatch('API_RENDER');
      },
    },
  },
};

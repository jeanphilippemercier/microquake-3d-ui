import DateHelper from 'paraview-quake/src/util/DateHelper';

const SPEED_UNIT = [
  {
    label: 'm/s',
    ratio: 1,
  },
  {
    label: 'mm/s',
    ratio: 1000,
  },
  {
    label: '&micro;m/s',
    ratio: 1000000,
  },
  {
    label: 'nm/s',
    ratio: 1000000000,
  },
  {
    label: 'pm/s',
    ratio: 1000000000000,
  },
];

const ENERGY_UNIT = [
  {
    label: 'J',
    ratio: 1,
  },
  {
    label: 'mJ',
    ratio: 1000,
  },
  {
    label: '&micro;J',
    ratio: 1000000,
  },
  {
    label: 'nJ',
    ratio: 1000000000,
  },
  {
    label: 'pJ',
    ratio: 1000000000000,
  },
];

function toUnit(value, UNITS) {
  for (let i = 0; i < UNITS.length; i++) {
    const unit = UNITS[i];
    if (value * unit.ratio > 1) {
      return `${Number(value * unit.ratio).toFixed(2)} ${unit.label}`;
    }
  }
  return '-';
}

function speedUnit(value) {
  return toUnit(value, SPEED_UNIT);
}

function energyUnit(value) {
  return toUnit(value, ENERGY_UNIT);
}

export default {
  name: 'PickingTooltip',
  props: {
    xOffset: {
      type: Number,
      default: 25,
    },
    yOffset: {
      type: Number,
      default: -20,
    },
  },
  data() {
    return {
      dateHelper: DateHelper,
      disablePicking: false,
      viewBounds: { x: 0, y: 0, height: 400, width: 400 },
      stylePosition: { top: 0, left: 0 },
    };
  },
  computed: {
    labelTypeMapping() {
      return this.$store.getters.QUAKE_TYPE_MAPPING;
    },
    tooltipClass() {
      return this.pickedData && !this.disablePicking
        ? this.$style.visible
        : this.$style.hidden;
    },
    pickedData() {
      return this.$store.getters.QUAKE_PICKED_DATA;
    },
    sensorStatus() {
      const code = this.pickedData && this.pickedData.code;
      const sensors = this.$store.getters.QUAKE_SENSOR_STATUS;
      return code && sensors && sensors[code];
    },
    rayCount() {
      return this.$store.getters.QUAKE_RAY_MAPPING[
        this.pickedData.event_resource_id
      ];
    },
    eventType() {
      const type = this.pickedData.event_type;
      const goodName = this.labelTypeMapping[type];
      return goodName ? `${goodName.value} - ${goodName.text}` : type;
    },
  },
  filters: {
    speedUnit,
    energyUnit,
    toMineTime: DateHelper.toMineTime,
  },
  methods: {
    speedUnit,
    energyUnit,
  },
  mounted() {
    // Create methods as closures
    this.onMouseEnter = () => {
      this.viewBounds = this.$el.getBoundingClientRect();
    };

    this.onDoubleClick = () => {
      if (this.$store.getters.QUAKE_DOUBLE_CLICK_MODE === 0) {
        this.$store.dispatch('API_OPEN_EVENT');
      } else {
        this.$store.dispatch('API_SHOW_RAY');
      }
    };

    this.onClick = () => {
      if (this.$store.getters.QUAKE_PICKING_CENTER_OF_ROTATION) {
        if (this.$store.getters.QUAKE_PICKED_DATA) {
          const { worldPosition } = this.$store.getters.QUAKE_PICKED_DATA;
          this.$store.dispatch('API_UPDATE_CENTER_OF_ROTATION', worldPosition);
        }
      }
    };

    this.onMousePress = () => {
      this.disablePicking = true;
    };

    this.onMouseRelease = () => {
      this.disablePicking = false;
    };

    this.onMouseMove = (e) => {
      if (this.disablePicking) {
        return;
      }
      const { x, y } = e;
      this.stylePosition = {
        top: `${y - this.viewBounds.y + this.yOffset}px`,
        left: `${x - this.viewBounds.x + this.xOffset}px`,
      };
      const devicePixelRatio = window.devicePixelRatio || 1;
      const vtkCoord = [
        devicePixelRatio * (x - this.viewBounds.x),
        devicePixelRatio * (this.viewBounds.height - (y - this.viewBounds.y)),
      ];
      this.$store.dispatch('API_EVENT_PICKING', vtkCoord);
    };

    // Attach listeners to the DOM
    this.$el.addEventListener('mouseenter', this.onMouseEnter);
    this.$el.addEventListener('mousemove', this.onMouseMove);
    this.$el.addEventListener('mousedown', this.onMousePress, true);
    this.$el.addEventListener('mouseup', this.onMouseRelease);
    this.$el.addEventListener('dblclick', this.onDoubleClick);
    this.$el.addEventListener('click', this.onClick);
  },
  beforeDestroy() {
    // Remove listeners to the DOM
    this.$el.removeEventListener('mouseenter', this.onMouseEnter);
    this.$el.removeEventListener('mousemove', this.onMouseMove);
    this.$el.removeEventListener('mousedown', this.onMousePress);
    this.$el.removeEventListener('mouseup', this.onMouseRelease);
    this.$el.removeEventListener('dblclick', this.onDoubleClick);
    this.$el.removeEventListener('click', this.onClick);
  },
};

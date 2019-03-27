import { Actions } from 'paraview-quake/src/stores/TYPES';
import DateHelper from 'paraview-quake/src/util/DateHelper';

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
    tooltipClass() {
      return this.pickedData && !this.disablePicking
        ? this.$style.visible
        : this.$style.hidden;
    },
    pickedData() {
      return this.$store.getters.QUAKE_PICKED_DATA;
    },
    rayCount() {
      return this.$store.getters.QUAKE_RAY_MAPPING[this.pickedData.event_resource_id];
    },
  },
  mounted() {
    // Create methods as closures
    this.onMouseEnter = () => {
      this.viewBounds = this.$el.getBoundingClientRect();
    };

    this.onDoubleClick = () => {
      if (this.$store.getters.QUAKE_COMPONENTS_VISIBILITY.ray) {
        this.$store.dispatch(Actions.QUAKE_SHOW_RAY);
      } else {
        this.$store.dispatch(Actions.QUAKE_OPEN_EVENT);
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
      this.$store.dispatch(Actions.QUAKE_EVENT_PICKING, vtkCoord);
    };

    // Attach listeners to the DOM
    this.$el.addEventListener('mouseenter', this.onMouseEnter);
    this.$el.addEventListener('mousemove', this.onMouseMove);
    this.$el.addEventListener('mousedown', this.onMousePress, true);
    this.$el.addEventListener('mouseup', this.onMouseRelease);
    this.$el.addEventListener('dblclick', this.onDoubleClick);
  },
  beforeDestroy() {
    // Remove listeners to the DOM
    this.$el.removeEventListener('mouseenter', this.onMouseEnter);
    this.$el.removeEventListener('mousemove', this.onMouseMove);
    this.$el.removeEventListener('mousedown', this.onMousePress);
    this.$el.removeEventListener('mouseup', this.onMouseRelease);
    this.$el.removeEventListener('dblclick', this.onDoubleClick);
  },
};

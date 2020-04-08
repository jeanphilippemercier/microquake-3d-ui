import * as moment from 'moment';
import DateHelper from 'paraview-quake/src/util/DateHelper';

export default {
  name: 'EventDetail',
  props: {
    event: {
      type: Object,
      default: () => null,
    },
    dark: {
      type: Boolean,
      default: false,
    },
    typeMapping: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    activeResourceId() {
      return this.event && this.event.event_resource_id;
    },
    isScatterOn() {
      return this.$store.getters.API_SCATTER_EVENT === this.activeResourceId;
    },
    scatterIcon() {
      return this.isScatterOn
        ? this.$vuetify.icons.values.scatterOn
        : this.$vuetify.icons.values.scatterOff;
    },
    headerClass() {
      return this.dark ? 'darken-2' : 'lighten-1';
    },
    toHour() {
      return moment(this.event.time_utc)
        .add(DateHelper.getOffsetTime())
        .utc()
        .format('HH:mm:ss');
    },
    toMs() {
      return moment(this.event.time_utc)
        .add(DateHelper.getOffsetTime())
        .utc()
        .format('.SSS');
    },
    toDate() {
      return moment(this.event.time_utc)
        .add(DateHelper.getOffsetTime())
        .utc()
        .format('MMM Do YYYY');
    },
    eventType() {
      if (this.event.event_type && this.typeMapping[this.event.event_type]) {
        return this.typeMapping[this.event.event_type].text;
      }
      return this.event.event_type;
    },
    eventTypeShort() {
      if (this.event.event_type && this.typeMapping[this.event.event_type]) {
        return this.typeMapping[this.event.event_type].value;
      }
      return null;
    },
    currentScattersCount() {
      const list = this.$store.getters.LOCAL_UNCERTAINTY_SCATTER[
        this.activeResourceId
      ];
      return list ? list.length : '-';
    },
    currentScattersColor() {
      const list = this.$store.getters.LOCAL_UNCERTAINTY_SCATTER[
        this.activeResourceId
      ];
      if (list) {
        return list.length ? 'green' : 'red';
      }
      return 'gray';
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    scatter() {
      const id = this.isScatterOn ? '-' : this.activeResourceId;
      this.$emit('scatter', id);
    },
  },
  filters: {
    eventMagnitude(v) {
      if (!v) {
        return null;
      }
      return Number(v).toFixed(1);
    },
    decentNumber(v) {
      if (!v) {
        return '-';
      }
      return Math.round(Number(v));
    },
  },
};

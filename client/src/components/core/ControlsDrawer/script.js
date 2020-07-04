import { mapGetters, mapActions } from 'vuex';

import Catalogue from 'paraview-quake/src/components/core/Catalogue';
import MineVisibility from 'paraview-quake/src/components/core/MineVisibility';
import FocusPeriod from 'paraview-quake/src/components/core/FocusPeriod';
import HistoricalPeriod from 'paraview-quake/src/components/core/HistoricalPeriod';

import ExpensionSection from 'paraview-quake/src/components/widgets/ExpensionSection';

export default {
  name: 'ControlsDrawer',
  data() {
    return {};
  },
  components: {
    Catalogue,
    ExpensionSection,
    MineVisibility,
    FocusPeriod,
    HistoricalPeriod,
  },
  computed: {
    ...mapGetters({
      componentsVisibility: 'QUAKE_COMPONENTS_VISIBILITY',
    }),
    showCatalogue() {
      return this.componentsVisibility.catalogue;
    },
  },
  methods: {
    ...mapActions({
      downloadCSV: 'QUAKE_DOWNLOAD_CSV',
    }),
  }
};

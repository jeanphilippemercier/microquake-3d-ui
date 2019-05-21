import { mapGetters } from 'vuex';

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
    ExpensionSection,
    MineVisibility,
    FocusPeriod,
    HistoricalPeriod,
  },
  computed: {
    ...mapGetters({
      componentsVisibility: 'QUAKE_COMPONENTS_VISIBILITY',
    }),
  },
};

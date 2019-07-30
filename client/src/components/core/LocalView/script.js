import { mapGetters, mapActions } from 'vuex';

import InteractionPresets from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator/Presets';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

// ----------------------------------------------------------------------------

export default {
  name: 'LocalView3D',
  mounted() {
    const container = this.$el.querySelector('.js-renderer');

    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance({
      background: [0.4470588235294118, 0.4470588235294118, 0.4470588235294118],
    });
    this.renderWindow.addRenderer(this.renderer);

    this.openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.renderWindow.addView(this.openglRenderWindow);

    this.openglRenderWindow.setContainer(container);

    // ----------------------------------------------------------------------------
    // Capture size of the container and set it to the renderWindow
    // ----------------------------------------------------------------------------

    const { width, height } = container.getBoundingClientRect();
    this.openglRenderWindow.setSize(width, height);

    // ----------------------------------------------------------------------------
    // Setup an interactor to handle mouse events
    // ----------------------------------------------------------------------------

    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.interactor.setView(this.openglRenderWindow);
    this.interactor.initialize();
    this.interactor.bindEvents(container);

    // ----------------------------------------------------------------------------
    // Setup interactor style to use
    // ----------------------------------------------------------------------------

    this.interactorStyle3D = vtkInteractorStyleManipulator.newInstance();
    InteractionPresets.applyPreset('3D', this.interactorStyle3D);
    this.interactor.setInteractorStyle(this.interactorStyle3D);

    // ----------------------------------------------------------------------------
    // Setup Picking
    // ----------------------------------------------------------------------------

    this.subscriptions = [];
    this.pickingAvailable = null;
    this.selector = vtkOpenGLHardwareSelector.newInstance();
    this.selector.setFieldAssociation(
      FieldAssociations.FIELD_ASSOCIATION_POINTS
    );
    this.selector.attach(this.openglRenderWindow, this.renderer);

    this.subscriptions.push(
      this.interactor.onStartAnimation(() => {
        this.pickingAvailable = false;
      })
    );
    this.subscriptions.push(
      this.interactor.onEndAnimation(() => {
        this.captureBuffer();
      })
    );

    this.subscriptions.push(
      this.interactor.onMouseMove(({ position }) => {
        if (!this.pickingAvailable) {
          return;
        }
        this.updateSelectionFromXY(
          Math.round(position.x),
          Math.round(position.y)
        );

        this.updateSelectionData(this.getSelectedData());
      })
    );

    // ----------------------------------------------------------------------------

    this.$store.commit('VIEW_LOCAL_RENDERER_SET', this.renderer);
    this.$store.commit('VIEW_LOCAL_INTERACTOR_SET', this.interactor);
  },
  computed: {
    ...mapGetters({
      pickingCenter: 'QUAKE_PICKING_CENTER_OF_ROTATION',
    }),
  },
  data() {
    return {
      orientationTooltip: '',
      tooltipStyle: { top: 0, left: 0 },
    };
  },
  methods: {
    ...mapActions({
      resetCameraZ: 'API_RESET_CAMERA_Z',
      resetCamera: 'API_RESET_CAMERA',
      render: 'API_RENDER',
      snapViewUp: 'API_VIEW_UP',
      updateOrientation: 'VIEW_UPDATE_ORIENTATION',
      togglePickCenter: 'QUAKE_TOGGLE_PICKING_CENTER_OF_ROTATION',
      updateSelectionData: 'LOCAL_UPDATE_SELECTION_DATA',
    }),

    onResize() {
      if (this.openglRenderWindow) {
        const { width, height } = this.$el
          .querySelector('.js-renderer')
          .getBoundingClientRect();
        this.openglRenderWindow.setSize(width, height);
      }
    },
    captureBuffer() {
      const [w, h] = this.openglRenderWindow.getSize();
      this.selector.setArea(0, 0, w, h);
      this.selector.releasePixBuffers();
      this.pickingAvailable = this.selector.captureBuffers();
    },
    updateSelectionFromXY(x, y) {
      if (this.pickingAvailable) {
        this.selections = this.selector.generateSelection(x, y, x, y);
      }
    },
    updateSelectionFromMouseEvent(event) {
      const { pageX, pageY } = event;
      const {
        top,
        left,
        height,
      } = this.openGLRenderWindow.getCanvas().getBoundingClientRect();
      const x = pageX - left;
      const y = height - (pageY - top);
      this.updateSelectionFromXY(x, y);
    },
    getSelectedData() {
      if (!this.selections || !this.selections.length) {
        this.previousSelectedData = null;
        return null;
      }
      return this.selections[0].getProperties();
    },
  },
  beforeDestroy() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }
    if (this.renderWindow) {
      this.renderWindow.delete();
    }
    if (this.renderer) {
      this.renderer.delete();
    }
    if (this.openglRenderWindow) {
      this.openglRenderWindow.delete();
    }
    if (this.interactor) {
      this.interactor.delete();
    }
    if (this.widget) {
      this.widget.delete();
    }
    if (this.mousePositionCache) {
      this.mousePositionCache.delete();
    }
  },
};

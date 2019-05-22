import macro from 'vtk.js/Sources/macro';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

import { mapGetters, mapActions } from 'vuex';

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

// function majorAxis(vec3, idxA, idxB) {
//   const axis = [0, 0, 0];
//   const idx = Math.abs(vec3[idxA]) > Math.abs(vec3[idxB]) ? idxA : idxB;
//   const value = vec3[idx] > 0 ? 1 : -1;
//   axis[idx] = value;
//   return axis;
// }

// ----------------------------------------------------------------------------

// function vectorToLabel(vec3) {
//   if (vec3[0]) {
//     return vec3[0] > 0 ? '+X' : '-X';
//   }
//   if (vec3[1]) {
//     return vec3[1] > 0 ? '+Y' : '-Y';
//   }
//   if (vec3[2]) {
//     return vec3[2] > 0 ? '+Z' : '-Z';
//   }
//   return '';
// }

// ----------------------------------------------------------------------------

// function toStyle({ x, y }, height) {
//   return { top: `${height - y - 15}px`, left: `${x - 15}px` };
// }

// ----------------------------------------------------------------------------

// function computeOrientation(direction, originalViewUp) {
//   let viewUp = [0, 0, 1];
//   let axis = 0;
//   let orientation = 1;

//   if (direction[0]) {
//     axis = 0;
//     orientation = direction[0] > 0 ? 1 : -1;
//     viewUp = majorAxis(originalViewUp, 1, 2);
//   }
//   if (direction[1]) {
//     axis = 1;
//     orientation = direction[1] > 0 ? 1 : -1;
//     viewUp = majorAxis(originalViewUp, 0, 2);
//   }
//   if (direction[2]) {
//     axis = 2;
//     orientation = direction[2] > 0 ? 1 : -1;
//     viewUp = majorAxis(originalViewUp, 0, 1);
//   }
//   return { axis, orientation, viewUp };
// }

// ----------------------------------------------------------------------------

function vtkCacheMousePosition(publicAPI, model, initialValues) {
  Object.assign(model, { position: { x: 0, y: 0 } }, initialValues);
  vtkInteractorObserver.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['position']);

  publicAPI.handleMouseMove = (e) => {
    model.position = e.position;
  };
}

vtkCacheMousePosition.newInstance = macro.newInstance(
  vtkCacheMousePosition,
  'vtkCacheMousePosition'
);

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

    // const coneSource = vtkConeSource.newInstance({ height: 1.0 });

    // const mapper = vtkMapper.newInstance();
    // mapper.setInputConnection(coneSource.getOutputPort());

    // const actor = vtkActor.newInstance();
    // actor.setMapper(mapper);

    // // ----------------------------------------------------------------------------
    // // Add the actor to the renderer and set the camera based on it
    // // ----------------------------------------------------------------------------

    // this.renderer.addActor(actor);
    // this.renderer.resetCamera();

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

    this.interactor.setInteractorStyle(
      vtkInteractorStyleTrackballCamera.newInstance()
    );

    this.$store.commit('VIEW_LOCAL_RENDERER_SET', this.renderer);

    // this.camera = this.renderer.getCamera();

    // // Bind user input
    // this.mousePositionCache = vtkCacheMousePosition.newInstance();
    // this.mousePositionCache.setInteractor(this.interactor);

    // // Add orientation widget
    // const orientationWidget = this.view.getReferenceByName('orientationWidget');
    // this.widgetManager = vtkWidgetManager.newInstance({
    //   pickingEnabled: false,
    // });
    // this.widgetManager.setRenderer(orientationWidget.getRenderer());
    // if (this.$store.getters.VIEW_ADVANCED_ORIENTATION_WIDGET) {
    //   this.widgetManager.enablePicking();
    // } else {
    //   this.widgetManager.disablePicking();
    // }
    // orientationWidget.setViewportCorner(
    //   vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
    // );

    // const bounds = [-0.51, 0.51, -0.51, 0.51, -0.51, 0.51];
    // this.widget = vtkInteractiveOrientationWidget.newInstance();
    // this.widget.placeWidget(bounds);
    // this.widget.setBounds(bounds);
    // this.widget.setPlaceFactor(1);
    // this.widget.getWidgetState().onModified(() => {
    //   const state = this.widget.getWidgetState();
    //   if (!state.getActive()) {
    //     this.orientationTooltip = '';
    //     return;
    //   }
    //   const direction = state.getDirection();
    //   const { axis, orientation, viewUp } = computeOrientation(
    //     direction,
    //     this.camera.getViewUp()
    //   );
    //   this.orientationTooltip = `Reset camera ${orientation > 0 ? '+' : '-'}${
    //     'XYZ'[axis]
    //   }/${vectorToLabel(viewUp)}`;
    //   this.tooltipStyle = toStyle(
    //     this.mousePositionCache.getPosition(),
    //     this.openglRenderWindow.getSize()[1]
    //   );
    // });

    // // Manage user interaction
    // this.viewWidget = this.widgetManager.addWidget(this.widget);
    // this.viewWidget.onOrientationChange(({ direction }) => {
    //   this.updateOrientation(
    //     computeOrientation(direction, this.camera.getViewUp())
    //   );
    // });

    // // Initial config
    // this.updateQuality();
    // this.updateRatio();
    // this.client.imageStream.setServerAnimationFPS(this.maxFPS);

    // // Expose viewProxy to store (for camera update...)
    // this.$store.commit('VIEW_PROXY_SET', this.view);

    // // Expose widgetManager to store (for enable/disable picking)
    // this.$store.commit('VIEW_WIDGET_MANAGER_SET', this.widgetManager);

    // // Link server side camera to local
    // this.$store.dispatch('API_RESET_CAMERA').then((cameraInfo) => {
    //   this.updateCamera(cameraInfo);
    //   this.viewStream.pushCamera();
    // });
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
      resetCamera: 'API_RESET_CAMERA',
      render: 'API_RENDER',
      snapViewUp: 'API_VIEW_UP',
      updateOrientation: 'VIEW_UPDATE_ORIENTATION',
      togglePickCenter: 'QUAKE_TOGGLE_PICKING_CENTER_OF_ROTATION',
    }),

    onResize() {
      if (this.openglRenderWindow) {
        const { width, height } = this.$el
          .querySelector('.js-renderer')
          .getBoundingClientRect();
        this.openglRenderWindow.setSize(width, height);
      }
    },
    updateCamera({ position, focalPoint, viewUp, centerOfRotation }) {
      console.log('Need to update camera in local viewer');
      console.log(position);
      console.log(focalPoint);
      console.log(viewUp);
      console.log(centerOfRotation);
    },
  },
  beforeDestroy() {
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

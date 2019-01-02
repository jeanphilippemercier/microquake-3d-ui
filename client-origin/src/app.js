import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageStream from 'vtk.js/Sources/IO/Core/ImageStream';
import Client from 'paraview-quake/src/io/Client';

export function createViewer(config = {}) {
  const client = new Client();
  let renderer = null;
  let camera = null;
  let renderWindow = null;
  let imageStream = null;
  return client.connect(config).then(() => {
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    renderer = fullScreenRenderer.getRenderer();
    renderWindow = fullScreenRenderer.getRenderWindow();
    camera = renderer.getActiveCamera();

    imageStream = vtkImageStream.newInstance();
    imageStream.connect(client.connection.getSession());
    const viewStream = imageStream.createViewStream('-1');
    fullScreenRenderer.getOpenGLRenderWindow().setViewStream(viewStream);
    viewStream.setCamera(camera);

    renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
    renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);

    // Remote API ----------

    function resetCamera() {
      client.remote.Quake.resetCamera().then((args) => {
        console.log(args.focalPoint);
        camera.set(args);
      });
    }

    function updateEvents(start, stop) {
      client.remote.Quake.getEvents(start, stop).then((events) => {
        console.log('events', events);
        resetCamera();
      });
    }

    return {
      resetCamera,
      updateEvents,
    };
  });
}

export default {
  createViewer,
};

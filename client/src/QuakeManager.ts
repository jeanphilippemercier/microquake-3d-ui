import vtkImageStream from "vtk.js/Sources/IO/Core/ImageStream";
import Client from "./io/Client";

let connected = false;
let client = null;
let camera = null;
let imageStream = null;
let renderer = null;
let renderWindow = null;
let glRenderWindow = null;

export function bindRendering(r = null, rw = null, glRW = null) {
  renderer = r || renderer;
  renderWindow = rw || renderWindow;
  glRenderWindow = glRW || glRenderWindow;
  camera = camera || renderer ? renderer.getActiveCamera() : null;

  if (connected && !imageStream && camera) {
    imageStream = vtkImageStream.newInstance();
    imageStream.connect(client.connection.getSession());
    const viewStream = imageStream.createViewStream("-1");

    glRenderWindow.setViewStream(viewStream);
    viewStream.setCamera(camera);

    renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
    renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);

    viewStream.render();
    return true;
  }
  return false;
}

export function connect(config = {}) {
  client = new Client();
  return client.connect(config).then(() => {
    connected = true;

    // Bind rendering if it was called before connected
    if (bindRendering()) {
      resetCamera();
    }
  });
}

export function isConnected() {
  return connected;
}

export function resetCamera() {
  return client.remote.Quake.resetCamera().then(args => {
    camera.set(args);
    return args;
  });
}

export function snapCamera() {
  return client.remote.Quake.snapCamera().then(args => {
    camera.set(args);
    return args;
  });
}

export function render() {
  return client.remote.Quake.render().then(args => {
    camera.set(args);
    return args;
  });
}

export function updateEvents(now, focusTime, historicalTime) {
  return client.remote.Quake.updateEvents(now, focusTime, historicalTime).then(
    events => {
      return render();
    }
  );
}

export function updateVisibility(visibilityMap) {
  return client.remote.Quake.updateVisibility(visibilityMap);
}

export function updateMineVisibility(visibilityMap) {
  return client.remote.Quake.updateMineVisibility(visibilityMap);
}

export function getMineDescription() {
  return client.remote.Quake.getMineDescription();
}

export function updateScaleFunction(dataRange, scaleRange) {
  return client.remote.Quake.updateScaleFunction(dataRange, scaleRange);
}

// export function setSelectionMode(selection = true) {
//   return client.remote.Quake.setSelectionMode(selection);
// }

export function pickPoint(x, y) {
  if (client && client.remote && client.remote.Quake) {
    return client.remote.Quake.pickPoint(x, y);
  }
  return Promise.resolve(null);
}

export function getEventId(idx) {
  return client.remote.Quake.getEventId(idx);
}

export function openWaveform(id) {
  const win = window.open(`https://FIXME/?event=${encodeURI(id)}`,'_blank');
  win.focus();
}

export function updatePreset(name) {
  return client.remote.Quake.updatePreset(name);
}

export default {
  // setSelectionMode,
  bindRendering,
  connect,
  getEventId,
  getMineDescription,
  isConnected,
  openWaveform,
  pickPoint,
  render,
  resetCamera,
  snapCamera,
  updateEvents,
  updateMineVisibility,
  updatePreset,
  updateScaleFunction,
  updateVisibility,
};

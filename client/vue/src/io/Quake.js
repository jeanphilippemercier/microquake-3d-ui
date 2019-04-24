/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    // 3D View ----------------------------------------------------------------
    resetCamera: () => session.call('paraview.quake.camera.reset', []),
    snapCamera: () => session.call('paraview.quake.camera.snap', []),
    getCamera: () => session.call('paraview.quake.camera.get', []),
    render: () => session.call('paraview.quake.render', []),
    // Quake events -----------------------------------------------------------
    updateEvents: (now, focusTime, historicalTime, monitorLiveEvents = false) =>
      session.call('paraview.quake.data.update', [
        now,
        focusTime,
        historicalTime,
        monitorLiveEvents,
      ]),
    updateVisibility: (visibilityMap) =>
      session.call('paraview.quake.visibility.update', [visibilityMap]),
    updateScaleFunction: (dataRange, sizeRange) =>
      session.call('paraview.quake.scale.range', [dataRange, sizeRange]),
    updateUncertaintyScaling: (scaleFactor) =>
      session.call('paraview.quake.scale.uncertainty', [scaleFactor]),
    updatePreset: (presetName) =>
      session.call('paraview.quake.color.preset', [presetName]),
    // Mine -------------------------------------------------------------------
    getMineDescription: () => session.call('paraview.quake.mine.get', []),
    updateMineVisibility: (visibilityMap) =>
      session.call('paraview.quake.mine.visibility.update', [visibilityMap]),
    // Selection --------------------------------------------------------------
    pickPoint: (x, y) => session.call('paraview.quake.view.pick.point', [x, y]),
    getEventId: (idx) => session.call('paraview.quake.event.id', [idx]),
    showRay: (idx) => session.call('paraview.quake.show.ray', [idx]),
    updateRayThresholds: (prefOrigRange, arrivalRange) =>
      session.call('paraview.quake.ray.filter.update', [
        prefOrigRange,
        arrivalRange,
      ]),
    onMineChange: (callback) =>
      session.subscribe('microquake.mine.dirty', callback),
    updateCenterOfRotation: (xyz) =>
      session.call('paraview.quake.center.rotation', [xyz]),
  };
}

/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    // 3D View ----------------------------------------------------------------
    resetCamera: () => session.call("paraview.quake.camera.reset", []),
    snapCamera: () => session.call("paraview.quake.camera.snap", []),
    render: () => session.call("paraview.quake.render", []),
    // Quake events -----------------------------------------------------------
    updateEvents: (now, focusTime, historicalTime) =>
      session.call("paraview.quake.data.update", [
        now,
        focusTime,
        historicalTime
      ]),
    updateVisibility: visibilityMap =>
      session.call("paraview.quake.visibility.update", [visibilityMap]),
    // deprecated -------------------------------------------------------------
    getEvents: (
      startTime = "2018-11-08T10:21:00.0",
      endTime = "2018-11-09T10:21:00.0"
    ) => session.call("paraview.quake.events.get", [startTime, endTime])
  };
}

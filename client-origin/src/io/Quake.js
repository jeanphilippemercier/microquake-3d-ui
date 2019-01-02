/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    // 3D View ----------------------------------------------------------------
    resetCamera: () => session.call('paraview.quake.camera.reset', []),
    // Quake events -----------------------------------------------------------
    getEvents: (
      startTime = '2018-11-08T10:21:00.0',
      endTime = '2018-11-09T10:21:00.0'
    ) => session.call('paraview.quake.events.get', [startTime, endTime]),
  };
}

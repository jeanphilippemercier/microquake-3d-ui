# Main python libs
import os, time

# ParaViewWeb
from wslink import register as exportRpc
from paraview import simple, servermanager
from paraview.web import protocols as pv_protocols

from vtkmodules.vtkCommonDataModel import vtkPolyData, vtkCellArray
from vtkmodules.vtkCommonCore import vtkPoints, vtkFloatArray

# Quake stuff
from spp.utils import seismic_client

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

API_URL = 'http://api.microquake.org/api/v1/'

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def extractCamera(view):
  if view:
    return {
      'centerOfRotation': tuple(view.CameraFocalPoint),
      'focalPoint': tuple(view.CameraFocalPoint),
      'position': tuple(view.CameraPosition),
      'viewUp': tuple(view.CameraViewUp),
    }
  return {
    'centerOfRotation': (0, 0, 0),
    'focalPoint': (0, 0, 0),
    'position': (0, 0, 1),
    'viewUp': (0, 1, 0),
  }

def createTrivialProducer():
    polyData = vtkPolyData()
    polyData.SetPoints(vtkPoints())
    polyData.SetVerts(vtkCellArray())

    trivialProducer = simple.TrivialProducer()
    trivialProducer.GetClientSideObject().SetOutput(polyData)

    return trivialProducer

# -----------------------------------------------------------------------------

class ParaViewQuake(pv_protocols.ParaViewWebProtocol):
    def __init__(self, **kwargs):
        super(pv_protocols.ParaViewWebProtocol, self).__init__()
        self.focusQuakeProxy = createTrivialProducer()
        self.focusBlastProxy = createTrivialProducer()
        self.historicalProxy = createTrivialProducer()

        self.focusQuakeRepresentation = simple.Show(self.focusQuakeProxy)
        self.focusBlastRepresentation = simple.Show(self.focusBlastProxy)
        self.historicalRepresentation = simple.Show(self.historicalProxy)
        self.view = simple.Render()

        # Add cone in view
        simple.Cone()
        simple.Show()

        # Load some initial data
        # self.getEvents()

        # simple.ColorBy(self.eventsRepresentation, ('POINTS', 'magnitude'))
        # self.eventsRepresentation.SetRepresentationType('Point Gaussian')
        # self.eventsRepresentation.GaussianRadius = 10
        # self.eventsRepresentation.ScaleByArray = 1


    def updateEventsPolyData(self, event_list, proxy, filterType = 0):
        polydata = proxy.GetClientSideObject().GetOutput()
        size = len(event_list) # FIXME based on filtering
        mag = polydata.GetPointData().GetArray('magnitude')
        if not mag:
            mag = vtkFloatArray()
            mag.SetName('magnitude')
            polydata.GetPointData().AddArray(mag)

        points = polydata.GetPoints()
        points.SetNumberOfPoints(size)

        verts = polydata.GetVerts().GetData()
        verts.SetNumberOfTuples(size + 1)
        verts.SetValue(0, size)

        mag.SetNumberOfTuples(size)

        for i in range(size):
            event = event_list[i]
            points.SetPoint(i, event.x, event.y, event.z)
            verts.SetValue(i + 1, i)
            mag.SetValue(i, abs(event.magnitude))

        polydata.Modified()
        proxy.MarkModified(proxy)

    def getEventsForClient(self, event_list):
        return {
            'count': len(event_list),
        }


    # @exportRpc("paraview.quake.events.get")
    # def getEvents(self, start_time='2018-11-08T10:21:00.0', end_time='2018-11-09T10:21:00.0'):
    #     '''
    #     Update event sets to visualize on the server side and send the part the client can use
    #     '''
    #     event_list = seismic_client.get_events_catalog(API_URL, start_time, end_time)
    #     self.updateEventsPolyData(event_list, self.eventsProxy)
    #     return self.getEventsForClient(event_list)

    @exportRpc("paraview.quake.data.update")
    def updateData(self, now, focusTime, historicalTime):
        events_in_focus = seismic_client.get_events_catalog(API_URL, focusTime, now)
        historic_events = seismic_client.get_events_catalog(API_URL, historicalTime, focusTime)

        self.updateEventsPolyData(events_in_focus, self.focusQuakeProxy, 1)
        self.updateEventsPolyData(events_in_focus, self.focusBlastProxy, 2)
        self.updateEventsPolyData(historic_events, self.historicalProxy)

        return self.getEventsForClient(events_in_focus)


    @exportRpc("paraview.quake.visibility.update")
    def updateVisibility(self, visibilityMap):
        self.focusQuakeRepresentation.Visibility = 1 if 'quake' in visibilityMap and visibilityMap['quake'] else 0
        self.focusBlastRepresentation.Visibility = 1 if 'blast' in visibilityMap and visibilityMap['blast'] else 0
        self.historicalRepresentation.Visibility = 1 if 'historical' in visibilityMap and visibilityMap['historical'] else 0

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.camera.reset")
    def resetCamera(self):
        simple.ResetCamera(self.view)
        try:
            self.view.CenterOfRotation = self.view.CameraFocalPoint
        except:
            pass

        self.getApplication().InvalidateCache(self.view.SMProxy)
        self.getApplication().InvokeEvent('UpdateEvent')

        return extractCamera(self.view)


    @exportRpc("paraview.quake.camera.snap")
    def snapCamera(self):
        vUp = tuple(self.view.CameraViewUp)
        majorAxis = 0
        axisIdx = -1
        for i in range(3):
            currentAxis = abs(vUp[i])
            if currentAxis > majorAxis:
                majorAxis = currentAxis
                axisIdx = i

        newViewUp = [0, 0, 0]
        newViewUp[axisIdx] = 1 if vUp[axisIdx] > 0 else -1

        self.view.CameraViewUp = newViewUp

        self.getApplication().InvalidateCache(self.view.SMProxy)
        self.getApplication().InvokeEvent('UpdateEvent')

        return extractCamera(self.view)


    @exportRpc("paraview.quake.render")
    def render(self):
        simple.Render(self.view)

        self.getApplication().InvalidateCache(self.view.SMProxy)
        self.getApplication().InvokeEvent('UpdateEvent')

        return extractCamera(self.view)

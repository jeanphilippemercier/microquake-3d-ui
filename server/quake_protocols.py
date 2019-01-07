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

BLAST_SHADER = """
// This custom shader code define a gaussian blur
// Please take a look into vtkSMPointGaussianRepresentation.cxx
// for other custom shader examples

//VTK::Color::Impl

float distSq = dot(offsetVCVSOutput.xy, offsetVCVSOutput.xy);
float angle = atan(offsetVCVSOutput.y, offsetVCVSOutput.x);

float starFn = 1.0f - abs(sin(4 * angle));

float scaledMask = mix(0.0, 0.05, starFn);
if (distSq > starFn) {
    discard;
}
"""

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

        # Green for earthquake and red for blast
        self.focusQuakeRepresentation.DiffuseColor = [0.0, 1.0, 0.0]
        self.focusBlastRepresentation.DiffuseColor = [1.0, 0.0, 0.0]

        # Earthquake representation
        self.focusQuakeRepresentation.SetRepresentationType('Point Gaussian')
        simple.ColorBy(self.focusQuakeRepresentation, ('POINTS', 'magnitude'))
        self.focusQuakeRepresentation.SetScalarBarVisibility(self.view , True)
        self.focusQuakeRepresentation.ScaleByArray = 1

        # Explosion representation
        self.focusBlastRepresentation.SetRepresentationType('Point Gaussian')
        simple.ColorBy(self.focusBlastRepresentation, ('POINTS', 'magnitude'))
        self.focusBlastRepresentation.SetScalarBarVisibility(self.view , True)
        self.focusBlastRepresentation.ScaleByArray = 1
        # self.focusBlastRepresentation.GaussianRadius = 0.05
        self.focusBlastRepresentation.ShaderPreset = 'Custom'
        self.focusBlastRepresentation.CustomShader = BLAST_SHADER

        # Hide scalar bar
        self.focusQuakeRepresentation.SetScalarBarVisibility(self.view, False)
        self.focusBlastRepresentation.SetScalarBarVisibility(self.view, False)

        # Add cone in view
        # simple.Cone()
        # simple.Show()

        # Load some initial data
        # self.getEvents()

        # simple.ColorBy(self.eventsRepresentation, ('POINTS', 'magnitude'))
        # self.eventsRepresentation.SetRepresentationType('Point Gaussian')
        # self.eventsRepresentation.GaussianRadius = 10
        # self.eventsRepresentation.ScaleByArray = 1


    def updateEventsPolyData(self, event_list, proxy, filterType = 0):
        polydata = proxy.GetClientSideObject().GetOutputDataObject(0)
        filteredList = event_list if filterType == 0 else []
        size = len(filteredList)

        if len(filteredList) == 0:
            targetType = 'earthquake' if filterType == 1 else 'explosion'
            for event in event_list:
                if event.event_type == targetType:
                    filteredList.append(event)
            size = len(filteredList)

        # Debug output
        print('updateEventsPolyData', filterType, len(filteredList), len(event_list))

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
            event = filteredList[i]
            points.SetPoint(i, event.x, event.y, event.z)
            verts.SetValue(i + 1, i)
            mag.SetValue(i, 3 + event.magnitude) # Shift scale

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
        print('focus', focusTime, now)
        print('historical', historicalTime, focusTime)

        self.updateEventsPolyData(events_in_focus, self.focusQuakeProxy, 1)
        self.updateEventsPolyData(events_in_focus, self.focusBlastProxy, 2)
        self.updateEventsPolyData(historic_events, self.historicalProxy)

        maxMagnitude = 3
        self.focusQuakeRepresentation.ScaleTransferFunction.RescaleTransferFunction(-maxMagnitude, maxMagnitude)
        self.focusBlastRepresentation.ScaleTransferFunction.RescaleTransferFunction(-maxMagnitude, maxMagnitude)
        self.focusQuakeRepresentation.GaussianRadius = 20
        self.focusBlastRepresentation.GaussianRadius = 25
        lut = simple.GetColorTransferFunction('magnitude')
        lut.RescaleTransferFunction(0.0, maxMagnitude)

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

# Main python libs
import os, time

# ParaViewWeb
from wslink import register as exportRpc
from paraview import simple, servermanager
from paraview.web import protocols as pv_protocols

from vtkmodules.vtkCommonDataModel import vtkPolyData, vtkCellArray
from vtkmodules.vtkCommonCore import vtkPoints

# Quake stuff
from spp.utils import seismic_client

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

API_URL = 'http://api.microquake.org/api/v1/'

# -----------------------------------------------------------------------------

class ParaViewQuake(pv_protocols.ParaViewWebProtocol):
    def __init__(self, **kwargs):
      super(pv_protocols.ParaViewWebProtocol, self).__init__()
      self.eventsPolyData = vtkPolyData()
      self.eventsPolyData.SetPoints(vtkPoints())
      self.eventsPolyData.SetVerts(vtkCellArray())
      self.eventsProxy = simple.TrivialProducer()
      self.eventsProxy.GetClientSideObject().SetOutput(self.eventsPolyData)
      self.eventsRepresentation = simple.Show(self.eventsProxy)

      # Load some initial data
      self.getEvents()


    def updateEventsPolyData(self, event_list):
        size = len(event_list)
        points = self.eventsPolyData.GetPoints()
        points.SetNumberOfPoints(size)
        verts = self.eventsPolyData.GetVerts().GetData()
        verts.SetNumberOfTuples(size + 1)
        verts.SetValue(0, size)
        for i in range(size):
            event = event_list[i]
            points.SetPoint(i, event.x, event.y, event.z)
            verts.SetValue(i + 1, i)


    def getEventsForClient(self, event_list):
        return {
            'count': len(event_list),
        }


    @exportRpc("paraview.quake.events.get")
    def getEvents(self, start_time='2018-11-08T10:21:00.0', end_time='2018-11-09T10:21:00.0'):
        '''
        Update event sets to visualize on the server side and send the part the client can use
        '''
        event_list = seismic_client.get_events_catalog(API_URL, start_time, end_time)
        self.updateEventsPolyData(event_list)
        return self.getEventsForClient(event_list)

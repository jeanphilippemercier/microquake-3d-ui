# Main python libs
import os, time, json, math, calendar, time, random

# ParaViewWeb
from wslink import register as exportRpc
from paraview import simple, servermanager
from paraview.web import protocols as pv_protocols

from vtkmodules.vtkCommonDataModel import vtkPolyData, vtkCellArray
from vtkmodules.vtkCommonCore import (vtkPoints, vtkFloatArray,
    vtkUnsignedCharArray, vtkUnsignedIntArray, vtkUnsignedLongArray)

# Picking
from vtkmodules.vtkCommonCore import vtkCollection
from vtkmodules.vtkPVClientServerCoreRendering import vtkPVRenderView

# Debug stuff
from vtkmodules.vtkIOXML import vtkXMLPolyDataWriter

# Quake stuff
from event_access import get_events_catalog, get_rays_for_event

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

PRINT_EVENT_STRUCTURE = False

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


BLAST_SHADER_BG = """
// This custom shader code define a gaussian blur
// Please take a look into vtkSMPointGaussianRepresentation.cxx
// for other custom shader examples

//VTK::Color::Impl

float distSq = dot(offsetVCVSOutput.xy, offsetVCVSOutput.xy);
float angle = atan(offsetVCVSOutput.y, offsetVCVSOutput.x);

float starFn = 1.0f - abs(sin(4 * angle));

if (distSq > 1.0f) {
    discard;
} else if (distSq > starFn) {
    ambientColor = vec3(0.0, 0.0, 0.0);
    diffuseColor = vec3(0.0, 0.0, 0.0);
}
"""

SHIFT = 2
MAX_MAGNITUDE = 2
GAUSSIAN_RADIUS = 10

UNCERTAINTY_CAP = 50.0
PHASE_NUMBER_MAPPING = {
    'P': 0,
    'S': 1,
}

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def debugWritePolyData(pd, name):
    writer = vtkXMLPolyDataWriter()
    writer.SetFileName(os.path.join('/external', name + '.vtp'))
    writer.SetInputData(pd)
    writer.Write()

def printEventFields(event):
    print('-' * 80)
    for arg in dir(event):
        if arg[0] != '_':
            print('%s: %s' % (arg, getattr(event, arg)))
    print('-' * 80)

def extractCamera(view):
  bounds = [-1, 1, -1, 1, -1, 1]
  if view:
    if view.GetClientSideView().GetClassName() == 'vtkPVRenderView':
      rr = view.GetClientSideView().GetRenderer()
      bounds = rr.ComputeVisiblePropBounds()
    return {
      'centerOfRotation': tuple(view.CameraFocalPoint),
      'focalPoint': tuple(view.CameraFocalPoint),
      'position': tuple(view.CameraPosition),
      'viewUp': tuple(view.CameraViewUp),
      'bounds': bounds,
    }
  return {
    'centerOfRotation': (0, 0, 0),
    'focalPoint': (0, 0, 0),
    'position': (0, 0, 1),
    'viewUp': (0, 1, 0),
    'bounds': bounds,
  }

def createTrivialProducer(cellTypes = []):
    polyData = vtkPolyData()
    polyData.SetPoints(vtkPoints())
    for cellType in cellTypes:
        fnSet = getattr(polyData, 'Set%s' % cellType)
        fnSet(vtkCellArray())
        # fnGet = getattr(polyData, 'Get%s' % cellType)
        # fnGet().SetNumberOfCells(0)

    trivialProducer = simple.TrivialProducer()
    trivialProducer.GetClientSideObject().SetOutput(polyData)

    return trivialProducer

# -----------------------------------------------------------------------------

def addPiecewisePoint(fn, scalar, size):
    fn.append(scalar)
    fn.append(size)
    fn.append(0.5)
    fn.append(0.0)

# -----------------------------------------------------------------------------

def createPicturePipeline(basePath, config, translate):
    source = simple.Plane()
    source.Origin = [config['origin'][0] + translate[0], config['origin'][1] + translate[1], config['origin'][2] + translate[2]]
    source.Point1 = [config['point1'][0] + translate[0], config['point1'][1] + translate[1], config['point1'][2] + translate[2]]
    source.Point2 = [config['point2'][0] + translate[0], config['point2'][1] + translate[1], config['point2'][2] + translate[2]]

    texture = servermanager._getPyProxy(servermanager.CreateProxy('textures', 'ImageTexture'))
    texture.FileName = os.path.join(basePath, config['file'])
    servermanager.Register(texture)

    representation = simple.GetRepresentation(source)
    representation.Texture = texture
    representation.Visibility = config['visibility']

    return {
        'label': config['label'],
        'source': source,
        'representation': representation,
        'texture': texture,
    }


# -----------------------------------------------------------------------------

def createLinePipeline(basePath, config, translate):
    reader = simple.OpenDataFile(os.path.join(basePath, config['file']))
    source = simple.Transform(Input=reader)
    source.Transform = 'Transform'
    source.Transform.Translate = translate

    representation = simple.GetRepresentation(source)
    representation.Visibility = config['visibility']

    # No color, wider width and looks like tubes
    # simple.ColorBy(representation, None)
    representation.LineWidth = 2.0
    representation.RenderLinesAsTubes = 1

    return {
        'label': config['label'],
        'source': source,
        'representation': representation
    }

# -----------------------------------------------------------------------------

def createSensorPipeline(basePath, config, translate):
    reader = simple.OpenDataFile(os.path.join(basePath, config['file']))
    source = simple.Transform(Input=reader)
    source.Transform = 'Transform'
    source.Transform.Translate = translate

    representation = simple.GetRepresentation(source)
    representation.Visibility = config['visibility']

    # No color, wider width and looks like tubes
    representation.LineWidth = 2.0
    representation.RenderLinesAsTubes = 1
    representation.DiffuseColor = config['color']

    return {
        'label': config['label'],
        'source': source,
        'representation': representation
    }

# -----------------------------------------------------------------------------

def createSensorCSVPipeline(basePath, config, translate):
    source = createTrivialProducer(['Verts'])
    polyData = source.GetClientSideObject().GetOutputDataObject(0)
    points = polyData.GetPoints()
    points.SetNumberOfPoints(0)
    cellArray = polyData.GetVerts().GetData()
    cellArray.SetNumberOfTuples(0)
    cellArray.InsertNextValue(0)
    direction = polyData.GetPointData().GetArray('direction')
    if not direction:
        direction = vtkFloatArray()
        direction.SetName('direction')
        direction.SetNumberOfComponents(3)
        polyData.GetPointData().SetVectors(direction)
    direction.SetNumberOfTuples(0)

    with open(os.path.join(basePath, config['file']), 'r') as csv:
        header = None
        for line in csv:
            if header:
                # process station
                tokens = line[:-1].split(',')
                # Try to use x3 first and fallback to x1 if not available
                if len(tokens[header['dx']]):
                    x = float(tokens[header['x']]) + translate[0]
                    y = float(tokens[header['y']]) + translate[1]
                    z = float(tokens[header['z']]) + translate[2]
                    dx = -float(tokens[header['dx']])
                    dy = -float(tokens[header['dy']])
                    dz = -float(tokens[header['dz']])
                    cellArray.InsertNextValue(points.GetNumberOfPoints())
                    points.InsertNextPoint(x, y, z)
                    direction.InsertNextTuple3(dx, dy, dz)
                elif len(tokens[header['dx_']]):
                    x = float(tokens[header['x']]) + translate[0]
                    y = float(tokens[header['y']]) + translate[1]
                    z = float(tokens[header['z']]) + translate[2]
                    dx = -float(tokens[header['dx_']])
                    dy = -float(tokens[header['dy_']])
                    dz = -float(tokens[header['dz_']])
                    cellArray.InsertNextValue(points.GetNumberOfPoints())
                    points.InsertNextPoint(x, y, z)
                    direction.InsertNextTuple3(dx, dy, dz)
            else:
                # process header
                header = {}
                tokens = line[:-1].split(',')
                header['x'] = tokens.index('Easting')
                header['y'] = tokens.index('Northing')
                header['z'] = tokens.index('Elev')

                header['dx'] = tokens.index('x3')
                header['dy'] = tokens.index('y3')
                header['dz'] = tokens.index('z3')

                header['dx_'] = tokens.index('x1')
                header['dy_'] = tokens.index('y1')
                header['dz_'] = tokens.index('z1')

    size = points.GetNumberOfPoints()
    cellArray.SetValue(0, size)
    polyData.GetVerts().SetNumberOfCells(1)

    representation = simple.GetRepresentation(source)
    representation.SetRepresentationType('3D Glyphs')

    representation.Orient = 1
    representation.GlyphType = 'Cone'
    representation.GlyphType.Resolution = 12
    representation.GlyphType.Height = 20
    representation.GlyphType.Radius = 10
    representation.GlyphType.Capping = 1

    representation.Visibility = config['visibility']

    # No color, wider width and looks like tubes
    # representation.DiffuseColor = config['color']

    polyData.Modified()
    source.MarkModified(source)

    return {
        'label': config['label'],
        'source': source,
        'representation': representation
    }

# -----------------------------------------------------------------------------

MINE_PIECES = {
    'picture': createPicturePipeline,
    'lines': createLinePipeline,
    'sensors': createSensorCSVPipeline,
}

# -----------------------------------------------------------------------------

class ParaViewQuake(pv_protocols.ParaViewWebProtocol):
    def __init__(self, mineBasePath = None, **kwargs):
        super(pv_protocols.ParaViewWebProtocol, self).__init__()

        self.showRay = False
        self.uncertaintyScaling = 1.0

        self.focusQuakeProxy = createTrivialProducer(['Verts'])
        self.focusBlastProxy = createTrivialProducer(['Verts'])
        self.historicalProxy = createTrivialProducer(['Verts'])
        self.rayProxy = createTrivialProducer(['Lines']) # , 'Lines'

        self.prefOrigThreshold = simple.Threshold(Input=self.rayProxy)
        self.prefOrigThreshold.Scalars = ['CELLS', 'preferred_origin']
        self.prefOrigThreshold.ThresholdRange = [1.0, 1.0]

        self.arrivalThreshold = simple.Threshold(Input=self.prefOrigThreshold)
        self.arrivalThreshold.Scalars = ['CELLS', 'arrival']
        self.arrivalThreshold.ThresholdRange = [1.0, 1.0]

        # get color transfer function/color map for 'phase'
        self.phaseLUT = simple.GetColorTransferFunction('phase')
        self.phaseLUT.InterpretValuesAsCategories = 1
        self.phaseLUT.AnnotationsInitialized = 1
        self.phaseLUT.ScalarRangeInitialized = 1.0
        self.phaseLUT.Annotations = ['0', 'P Waves', '1', 'S Waves']
        self.phaseLUT.ActiveAnnotatedValues = ['0', '1']
        # Blue = [93, 173, 226] = [0.36470588235294116, 0.6784313725490196, 0.8862745098039215]
        # Purple = [96, 40, 180] = [0.3764705882352941, 0.1568627450980392, 0.7058823529411765]
        self.phaseLUT.IndexedColors = [0.36470588235294116, 0.6784313725490196, 0.8862745098039215, 0.3764705882352941, 0.1568627450980392, 0.7058823529411765]
        self.phaseLUT.IndexedOpacities = [1.0, 1.0]

        # get opacity transfer function/opacity map for 'phase'
        self.phasePWF = simple.GetOpacityTransferFunction('phase')
        self.phasePWF.ScalarRangeInitialized = 1

        self.focusQuakeRepresentation = simple.Show(self.focusQuakeProxy)
        self.focusBlastRepresentation = simple.Show(self.focusBlastProxy)
        self.historicalRepresentation = simple.Show(self.historicalProxy)
        self.rayRepresentation = simple.Show(self.arrivalThreshold)

        # custom ray rendering
        self.rayRepresentation.Visibility = 0
        self.rayRepresentation.LineWidth = 2.0
        self.rayRepresentation.RenderLinesAsTubes = 1
        self.rayRepresentation.ColorArrayName = ['CELLS', 'phase']
        self.rayRepresentation.LookupTable = self.phaseLUT
        self.rayRepresentation.ScalarOpacityFunction = self.phasePWF
        self.rayRepresentation.ScalarOpacityUnitDistance = 373.2584881144596

        self.view = simple.Render()

        # self.phaseLUTColorBar = simple.GetScalarBar(self.phaseLUT, self.view)
        # self.phaseLUTColorBar.Title = 'Ray Phase'
        # self.phaseLUTColorBar.ComponentTitle = ''
        # self.phaseLUTColorBar.TitleFontFile = ''
        # self.phaseLUTColorBar.LabelFontFile = ''

        # # set color bar visibility
        # self.phaseLUTColorBar.Visibility = 1

        # # show color legend
        # self.rayRepresentation.SetScalarBarVisibility(self.view, True)

        # Green for earthquake and red for blast
        self.focusQuakeRepresentation.DiffuseColor = [0.0, 1.0, 0.0]
        self.focusBlastRepresentation.DiffuseColor = [1.0, 0.0, 0.0]
        self.historicalRepresentation.PointSize = 3

        # Earthquake representation
        self.focusQuakeRepresentation.SetRepresentationType('Point Gaussian')
        # simple.ColorBy(self.focusQuakeRepresentation, None)
        simple.ColorBy(self.focusQuakeRepresentation, ('POINTS', 'time'))
        self.focusQuakeRepresentation.SetScaleArray = ['POINTS', 'magnitude']
        self.focusQuakeRepresentation.ScaleByArray = 1
        self.focusQuakeRepresentation.GaussianRadius = 1
        self.focusQuakeRepresentation.UseScaleFunction = 0
        self.focusQuakeRepresentation.ScaleTransferFunction.Points = [
            -3, 0.1, 0.5, 0,
            4, 1, 0.5, 0
        ]
        self.focusQuakeRepresentation.UseScaleFunction = 1

        # Explosion representation
        self.focusBlastRepresentation.SetRepresentationType('Point Gaussian')
        simple.ColorBy(self.focusBlastRepresentation, ('POINTS', 'time'))
        # simple.ColorBy(self.focusBlastRepresentation, None)
        self.focusBlastRepresentation.SetScaleArray = ['POINTS', 'magnitude']
        self.focusBlastRepresentation.ScaleByArray = 1
        self.focusBlastRepresentation.GaussianRadius = 1
        self.focusBlastRepresentation.ShaderPreset = 'Custom'
        self.focusBlastRepresentation.CustomShader = BLAST_SHADER_BG
        self.focusBlastRepresentation.UseScaleFunction = 0
        self.focusBlastRepresentation.ScaleTransferFunction.Points = [
            -3, 0.1, 0.5, 0,
            4, 1, 0.5, 0
        ]
        self.focusBlastRepresentation.UseScaleFunction = 1

        # Hide scalar bar
        # self.focusQuakeRepresentation.SetScalarBarVisibility(self.view, False)
        # self.focusBlastRepresentation.SetScalarBarVisibility(self.view, False)

        # Load mine definition
        self.mineBounds = [-1, 1, -1, 1, -1, 1]
        self.translate = [0, 0, 0]
        self.mineCategories = []
        self.minePieces = []
        self.minePiecesByCategory = {}
        if mineBasePath:
            filepath = os.path.join(mineBasePath, 'index.json')
            with open(filepath, 'r') as mineFileMeta:
                mine = json.load(mineFileMeta)
                self.mineBounds = mine['boundaries']
                self.translate[0] = -0.5 * (self.mineBounds[0] + self.mineBounds[1])
                self.translate[1] = -0.5 * (self.mineBounds[2] + self.mineBounds[3])
                # Do not affect Z as it is small and we want to keep it untouch for picking info (depth)
                # Actually translating so the ground show up as 0
                # self.translate[2] = -0.5 * (self.mineBounds[4] + self.mineBounds[5])
                self.translate[2] = -self.mineBounds[5]
                self.mineCategories = mine['categories']
                for piece in mine['pieces']:
                    category = piece['category']
                    if category not in self.minePiecesByCategory:
                        self.minePiecesByCategory[category] = []
                    pipelineItem = MINE_PIECES[piece['type']](mineBasePath, piece, self.translate)

                    self.minePiecesByCategory[category].append(pipelineItem)
                    self.minePieces.append(pipelineItem)

        # Selection part
        self.selection = simple.ExtractSelection()
        self.extractSelection = simple.MergeBlocks(Input=self.selection)

    def keepEvent(self, event, filterType = 0):
        if event.x < self.mineBounds[0] or event.x > self.mineBounds[1]:
            return False
        if event.y < self.mineBounds[2] or event.y > self.mineBounds[3]:
            return False
        if event.z < self.mineBounds[4] or event.z > self.mineBounds[5]:
            return False

        if filterType == 1:
            return event.event_type == 'earthquake'

        if filterType == 2:
            return event.event_type == 'explosion'

        return True

    def updateEventsPolyData(self, event_list, proxy, filterType = 0):
        polydata = proxy.GetClientSideObject().GetOutputDataObject(0)
        filteredList = []
        for event in event_list:
            if self.keepEvent(event, filterType):
                filteredList.append(event)
        size = len(filteredList)

        # Debug output
        print('updateEventsPolyData', filterType, len(filteredList), len(event_list))

        # ---------------------------------------------------------------------
        # Fields available on polydata / picking
        # ---------------------------------------------------------------------

        mag = polydata.GetPointData().GetArray('magnitude')
        if not mag:
            mag = vtkFloatArray()
            mag.SetName('magnitude')
            polydata.GetPointData().AddArray(mag)
        mag.SetNumberOfTuples(size)

        timeArray = polydata.GetPointData().GetArray('time')
        if not timeArray:
            timeArray = vtkUnsignedLongArray()
            timeArray.SetName('time')
            polydata.GetPointData().AddArray(timeArray)
        timeArray.SetNumberOfTuples(size)

        idArray = polydata.GetPointData().GetArray('id')
        if not idArray:
            idArray = vtkUnsignedIntArray()
            idArray.SetName('id')
            polydata.GetPointData().AddArray(idArray)
        idArray.SetNumberOfTuples(size)

        uncertaintyArray = polydata.GetPointData().GetArray('uncertainty')
        if not uncertaintyArray:
            uncertaintyArray = vtkFloatArray()
            uncertaintyArray.SetName('uncertainty')
            polydata.GetPointData().AddArray(uncertaintyArray)
        uncertaintyArray.SetNumberOfTuples(size)

        uncertaintyDirectionArray = polydata.GetPointData().GetArray('direction')
        if not uncertaintyDirectionArray:
            uncertaintyDirectionArray = vtkFloatArray()
            uncertaintyDirectionArray.SetName('uncertainty_direction')
            uncertaintyDirectionArray.SetNumberOfComponents(3)
            polydata.GetPointData().AddArray(uncertaintyDirectionArray)
        uncertaintyDirectionArray.SetNumberOfTuples(size)

        # ---------------------------------------------------------------------

        points = polydata.GetPoints()
        points.SetNumberOfPoints(size)

        verts = polydata.GetVerts().GetData()
        verts.SetNumberOfTuples(size + 1)
        verts.SetValue(0, size)
        polydata.GetVerts().SetNumberOfCells(1 if size else 0);

        # DEBUG show event fields + values
        if PRINT_EVENT_STRUCTURE and len(filteredList):
            printEventFields(filteredList[0])

        for i in range(size):
            event = filteredList[i]
            points.SetPoint(i, event.x + self.translate[0], event.y + self.translate[1], event.z + self.translate[2])
            verts.SetValue(i + 1, i)
            mag.SetValue(i, event.magnitude)
            timeArray.SetValue(i, event.time_epoch)
            idArray.SetValue(i, len(self.idList))

            # Not all events have the uncertainty

            if 'uncertainty' in dir(event) and event.uncertainty:
                value = float(event.uncertainty)
                if value > UNCERTAINTY_CAP:
                  uncertaintyArray.SetValue(i, UNCERTAINTY_CAP)
                else:
                  uncertaintyArray.SetValue(i, value)
                # FIXME the data should have such info
                print('uncertainty_vector(%s, %s, %s) - mag(%s)' % (event.uncertainty_vector_x, event.uncertainty_vector_y, event.uncertainty_vector_z, value))
                uncertaintyDirectionArray.SetTuple3(i, random.random(), random.random(), random.random())
            else:
                uncertaintyArray.SetValue(i, 0.0)
                uncertaintyDirectionArray.SetTuple3(i, 0, 0, 1)


            self.idList.append(event.event_resource_id)
            self.preferredOrigins[event.event_resource_id] = event.preferred_origin_id

        polydata.Modified()
        proxy.MarkModified(proxy)

        # print('Time range:', timeArray.GetRange())

        # if filterType == 1:
        #     writer = vtkXMLPolyDataWriter()
        #     writer.SetDataModeToAppended()
        #     writer.SetCompressorTypeToZLib()
        #     writer.SetInputData(polydata)
        #     writer.SetFileName('/Users/seb/Desktop/events.vtp')
        #     writer.Update()

    def getEventsForClient(self, event_list):
        return {
            'count': len(event_list),
        }


    def showEventsUncertainty(self, showUncertainty):
        if showUncertainty:
            # Use glyph mapper
            for representation in [self.focusQuakeRepresentation, self.focusBlastRepresentation]:
                representation.SetRepresentationType('3D Glyphs')

                representation.Orient = 1
                representation.SelectOrientationVectors = 'uncertainty_direction'

                representation.Scaling = 1
                representation.ScaleMode = 'Magnitude'
                representation.SelectScaleArray = 'uncertainty'
                representation.ScaleFactor = self.uncertaintyScaling

                representation.GlyphType = 'Arrow'
                representation.GlyphType.TipResolution = 12
                representation.GlyphType.TipRadius = 0.1
                representation.GlyphType.ShaftResolution = 12
                representation.GlyphType.ShaftRadius = 0.03
        else:
            # Use point gaussian
            self.focusQuakeRepresentation.SetRepresentationType('Point Gaussian')
            self.focusBlastRepresentation.SetRepresentationType('Point Gaussian')


    def updateRay(self, event_resource_id):
        rayFound = 0
        if event_resource_id:
            rays = get_rays_for_event(API_URL, event_resource_id)
            numRayCells = len(rays)
            rayFound = numRayCells

            if numRayCells > 0:
                # print('got {0} rays for event {1}'.format(len(rays), event_resource_id))

                # Count number of nodes/points in all the rays
                numRayPoints = 0
                for ray in rays:
                    numRayPoints += ray.num_nodes

                # print('  polydata should have {0} points and {1} cells'.format(numRayPoints, numRayCells))

                polydata = self.rayProxy.GetClientSideObject().GetOutputDataObject(0)

                prefOriginArray = polydata.GetCellData().GetArray('preferred_origin')
                if not prefOriginArray:
                    prefOriginArray = vtkUnsignedCharArray()
                    prefOriginArray.SetName('preferred_origin')
                    polydata.GetCellData().AddArray(prefOriginArray)
                prefOriginArray.SetNumberOfTuples(numRayCells)

                arrivalArray = polydata.GetCellData().GetArray('arrival')
                if not arrivalArray:
                    arrivalArray = vtkUnsignedCharArray()
                    arrivalArray.SetName('arrival')
                    polydata.GetCellData().AddArray(arrivalArray)
                arrivalArray.SetNumberOfTuples(numRayCells)

                phaseArray = polydata.GetCellData().GetArray('phase')
                if not phaseArray:
                    phaseArray = vtkUnsignedCharArray()
                    phaseArray.SetName('phase')
                    polydata.GetCellData().AddArray(phaseArray)
                phaseArray.SetNumberOfTuples(numRayCells)

                points = polydata.GetPoints()
                points.SetNumberOfPoints(numRayPoints)

                lines = polydata.GetLines()
                lines.SetNumberOfCells(0)

                ptIdx = 0
                cellIdx = 0

                for ray in rays:
                    # Build geometry and topology of the ray
                    lines.InsertNextCell(ray.num_nodes)
                    for pt in ray.nodes:
                        points.SetPoint(ptIdx, pt[0] + self.translate[0], pt[1] + self.translate[1], pt[2] + self.translate[2])
                        lines.InsertCellPoint(ptIdx)
                        ptIdx += 1

                    # Mark this ray as either belonging to the preferred origin of the event or not
                    preferred = 0
                    if self.preferredOrigins[event_resource_id] == ray.origin_resource_id:
                        preferred = 1
                    prefOriginArray.SetValue(cellIdx, preferred)

                    # Mark this ray has being associated with an arrival or not
                    arrival = 0
                    if ray.arrival_resource_id:
                        arrival = 1
                    arrivalArray.SetValue(cellIdx, arrival)

                    # Assign the phase for this ray
                    phaseArray.SetValue(cellIdx, PHASE_NUMBER_MAPPING[ray.phase])

                    cellIdx += 1

                # print('  polydata actually has {0} points and {1} cells'.format(polydata.GetNumberOfPoints(), polydata.GetNumberOfCells()))

                polydata.Modified()
                self.rayProxy.MarkModified(self.rayProxy)

                fname = event_resource_id.replace('/', '-')
                fname = fname.replace(':', '-')
                debugWritePolyData(polydata, fname)

                self.rayRepresentation.Visibility = 1 if self.showRay else 0
            else:
                # print('Clearing ray {0} (no rays)'.format(event_resource_id))
                self.rayRepresentation.Visibility = 0
        else:
            # print('Clearing ray (no id)')
            self.rayRepresentation.Visibility = 0

        self.getApplication().InvokeEvent('UpdateEvent')
        return rayFound


    # @exportRpc("paraview.quake.events.get")
    # def getEvents(self, start_time='2018-11-08T10:21:00.0', end_time='2018-11-09T10:21:00.0'):
    #     '''
    #     Update event sets to visualize on the server side and send the part the client can use
    #     '''
    #     event_list = seismic_client.get_events_catalog(API_URL, start_time, end_time)
    #     self.updateEventsPolyData(event_list, self.eventsProxy)
    #     return self.getEventsForClient(event_list)

    @exportRpc("paraview.quake.scale.range")
    def updateScaleFunction(self, linearRange, sizeRange):
        # Create new function
        fnPoints = []
        addPiecewisePoint(fnPoints, -100, sizeRange[0])
        addPiecewisePoint(fnPoints, linearRange[0], sizeRange[0])
        addPiecewisePoint(fnPoints, linearRange[1], sizeRange[1])
        addPiecewisePoint(fnPoints, 100, sizeRange[1])

        self.focusQuakeRepresentation.UseScaleFunction = 0
        self.focusBlastRepresentation.UseScaleFunction = 0
        self.focusQuakeRepresentation.ScaleTransferFunction.Points = fnPoints
        self.focusBlastRepresentation.ScaleTransferFunction.Points = fnPoints
        self.focusQuakeRepresentation.UseScaleFunction = 1
        self.focusBlastRepresentation.UseScaleFunction = 1

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.scale.uncertainty")
    def updateUncertaintyScaling(self, scaling):
        self.uncertaintyScaling = scaling

        self.focusQuakeRepresentation.ScaleFactor = self.uncertaintyScaling
        self.focusBlastRepresentation.ScaleFactor = self.uncertaintyScaling

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.data.update")
    def updateData(self, now, focusTime, historicalTime):
        events_in_focus = get_events_catalog(API_URL, focusTime, now)
        historic_events = get_events_catalog(API_URL, historicalTime, focusTime)

        print('focus', focusTime, now)
        print('historical', historicalTime, focusTime)

        # epoch range 2018-12-01T00:00:00.0
        realNowEpoch = calendar.timegm(time.gmtime())
        nowEpoch = calendar.timegm(time.strptime(now, '%Y-%m-%dT%H:%M:%S.0'))
        startEpoch = calendar.timegm(time.strptime(focusTime, '%Y-%m-%dT%H:%M:%S.0'))

        self.idList = []
        self.preferredOrigins = {}
        self.updateEventsPolyData(events_in_focus, self.focusQuakeProxy, 1)
        self.updateEventsPolyData(events_in_focus, self.focusBlastProxy, 2)
        self.updateEventsPolyData(historic_events, self.historicalProxy)

        self.focusQuakeRepresentation.GaussianRadius = GAUSSIAN_RADIUS
        self.focusBlastRepresentation.GaussianRadius = GAUSSIAN_RADIUS
        lut = simple.GetColorTransferFunction('time')
        lut.RescaleTransferFunction(startEpoch * 1000000000, nowEpoch * 1000000000)

        self.getApplication().InvokeEvent('UpdateEvent')

        return self.getEventsForClient(events_in_focus)


    @exportRpc("paraview.quake.visibility.update")
    def updateVisibility(self, visibilityMap):
        self.focusQuakeRepresentation.Visibility = 1 if 'quake' in visibilityMap and visibilityMap['quake'] else 0
        self.focusBlastRepresentation.Visibility = 1 if 'blast' in visibilityMap and visibilityMap['blast'] else 0
        self.historicalRepresentation.Visibility = 1 if 'historical' in visibilityMap and visibilityMap['historical'] else 0

        # Show ray of the picked data
        self.showRay = 'ray' in visibilityMap and visibilityMap['ray']
        self.rayRepresentation.Visibility = 1 if self.showRay else 0

        # Show event 'uncertainty' or magnitude+time
        self.showEventsUncertainty('uncertainty' in visibilityMap and visibilityMap['uncertainty'])

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.mine.visibility.update")
    def updateMineVisibility(self, visibilityMap):
        for piece in self.minePieces:
            piece['representation'].Visibility = 1 if piece['label'] in visibilityMap and visibilityMap[piece['label']] else 0

        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.mine.get")
    def getMineDescription(self):
        response = []
        for category in self.mineCategories:
            pieces = []
            entry = { 'name': category['label'], 'pieces': pieces }
            response.append(entry)
            for piece in self.minePiecesByCategory[category['name']]:
                name = piece['label']
                checked = True if piece['representation'].Visibility == 1 else False
                pieces.append({ 'name': name, 'checked': checked })

        return response


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


    @exportRpc("paraview.quake.camera.get")
    def getCamera(self):
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


    @exportRpc("paraview.quake.view.interaction.mode")
    def updateInteraction(self, mode):
      # INTERACTION_MODE_UNINTIALIZED = -1,
      # INTERACTION_MODE_3D = 0,
      # INTERACTION_MODE_2D, // not implemented yet.
      # INTERACTION_MODE_SELECTION,
      # INTERACTION_MODE_ZOOM,
      # INTERACTION_MODE_POLYGON
      self.view.InteractionMode = vtkPVRenderView.INTERACTION_MODE_SELECTION if mode == 'Selection' else vtkPVRenderView.INTERACTION_MODE_3D


    @exportRpc("paraview.quake.view.pick.point")
    def pickPoint(self, x, y):
      output = {}
      selectedRepresentations = vtkCollection()
      selectionSources = vtkCollection()
      found = self.view.SelectSurfacePoints([int(x), int(y), int(x), int(y)], selectedRepresentations, selectionSources)
      if selectedRepresentations.GetNumberOfItems() == selectionSources.GetNumberOfItems() and selectionSources.GetNumberOfItems() == 1:
        # We are good for selection
        representation = servermanager._getPyProxy(selectedRepresentations.GetItemAsObject(0))
        selection = servermanager._getPyProxy(selectionSources.GetItemAsObject(0))
        self.selection.Input = representation.Input
        self.selection.Selection = selection
        self.extractSelection.UpdatePipeline()
        selectedDataSet = self.extractSelection.GetClientSideObject().GetOutput()
        selectedData = selectedDataSet.GetPointData()
        nbArrays = selectedData.GetNumberOfArrays()
        for i in range(nbArrays):
          array = selectedData.GetAbstractArray(i)
          output[array.GetName()] = array.GetValue(0)
          if array.GetName() == 'id':
            output['event_resource_id'] = self.idList[array.GetValue(0)]

        # Add picked point world coordinates
        output['worldPosition'] = selectedDataSet.GetPoints().GetPoint(0)


        return output

      return None


    @exportRpc("paraview.quake.event.id")
    def getEventId(self, idx):
        return self.idList[idx]


    @exportRpc("paraview.quake.show.ray")
    def showRay(self, idx):
        return [self.idList[idx], self.updateRay(self.idList[idx])]


    @exportRpc("paraview.quake.ray.filter.update")
    def updateRayThresholdFilters(self, prefOrigRange, arrivalRange):
        self.prefOrigThreshold.ThresholdRange = prefOrigRange
        self.arrivalThreshold.ThresholdRange = arrivalRange
        self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.quake.color.preset")
    def updatePreset(self, presetName):
        lutProxy = simple.GetColorTransferFunction('time')
        lutProxy.ApplyPreset(presetName, True)
        self.getApplication().InvokeEvent('UpdateEvent')

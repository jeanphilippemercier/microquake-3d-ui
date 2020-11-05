import os, sys

# Try to handle virtual env if provided
if '--virtual-env' in sys.argv:
    virtualEnvPath = sys.argv[sys.argv.index('--virtual-env') + 1]
    virtualEnv = virtualEnvPath + '/bin/activate_this.py'
    execfile(virtualEnv, dict(__file__=virtualEnv))

from paraview.util.vtkAlgorithm import *
from vtkmodules.vtkCommonDataModel import vtkPolyData, vtkCellArray, vtkMultiBlockDataSet
from vtkmodules.vtkCommonCore import vtkPoints, vtkShortArray
from vtkmodules.vtkFiltersCore import vtkAppendPolyData
from vtkmodules.vtkFiltersGeneral import vtkTransformPolyDataFilter
from vtkmodules.vtkRenderingFreeType import vtkVectorText
from vtkmodules.vtkCommonTransforms import vtkTransform
from vtkmodules.vtkIOXML import vtkXMLPolyDataWriter


# Set to True to print warnings about issues encountered
PRINT_WARNING_MESSAGES = False


def warning_message(msg):
    if PRINT_WARNING_MESSAGES:
        print(msg)


#------------------------------------------------------------------------------
# Handler infrastructure for different types of DXF entities.  So far, we have
# examples of the following types of entities:
#
#    POLYLINE, LWPOLYLINE, POINT, TEXT, INSERT, SEQEND, LINE, MTEXT
#
#------------------------------------------------------------------------------
entityHandlers = {}


def registerHandler(entityType, handler):
    entityHandlers[entityType] = handler


def handleEntity(entity, polydata=None):
    entityType = entity.dxftype
    # warning_message('{0} -> {1}'.format(entity.color, entity.dxftype))

    if entityType in entityHandlers and entityHandlers[entityType]:
        handler = entityHandlers[entityType]
        return handler(entity, polydata)
    else:
        warning_message('No handler for entity type {0}'.format(entityType))


def handlePolyLine(entity, polydata=None):
    """
        dxfgrabber.dxfentities.Polyline

        The attributes 'bulge', 'points', 'tangents', 'vertices', and 'width'
        seem to be parallel arrays.

        entity.append_data              <bound method ... >
        entity.bulge                    [0.0, ..., 0.0]
        entity.cast                     <bound method ... >
        entity.color                    30
        entity.control_points           []
        entity.default_end_width        0.0
        entity.default_start_width      0.0
        entity.dxftype                  u'POLYLINE'
        entity.elevation                (0.0, 0.0, 0.0)
        entity.extrusion                (0.0, 0.0, 1.0)
        entity.flags                    8
        entity.handle                   u'363'
        entity.invisible                0
        entity.is_closed                False
        entity.is_mclosed               False
        entity.is_nclosed               False
        entity.layer                    u'PLOTS_APEX LEVEL_01 DESIGN_00 PLOT WALLS'
        entity.layout_tab_name
        entity.line_weight              0
        entity.linetype
        entity.ltscale                  1.0
        entity.m_smooth_density         0.0
        entity.mcount                   0
        entity.mode                     u'polyline3d'
        entity.n_smooth_density         0.0
        entity.ncount                   0
        entity.owner                    u'347'
        entity.paperspace
        entity.points                   [(651435.2482160575, 4767534.152790012, -73.31750819381297), ..., (651409.9219160576, 4767556.141590012, -72.52254283757036)]
        entity.set_default_extrusion    <bound method ... >
        entity.setup_attributes         <bound method ... >
        entity.shadow_mode
        entity.smooth_type              0
        entity.spline_type
        entity.tangents                 [None, ..., None]
        entity.thickness                0.0
        entity.transparency
        entity.true_color
        entity.vertices                 [<dxfgrabber.dxfentities.Vertex object at 0x7fb37f903610>, ..., <dxfgrabber.dxfentities.Vertex object at 0x7fb37f8fc810>]
        entity.width                    [(0.0, 0.0), ..., (0.0, 0.0)]
        entity.vertices[0]

            <dxfgrabber.dxfentities.Vertex object at 0x7fb37f903610>

            entity.vertices[0].bulge              0.0
            entity.vertices[0].color              30
            entity.vertices[0].dxftype            u'VERTEX'
            entity.vertices[0].end_width          0.0
            entity.vertices[0].extrusion
            entity.vertices[0].flags              32
            entity.vertices[0].handle             u'364'
            entity.vertices[0].invisible          0
            entity.vertices[0].layer              u'PLOTS_APEX LEVEL_01 DESIGN_00 PLOT WALLS'
            entity.vertices[0].layout_tab_name
            entity.vertices[0].line_weight        0
            entity.vertices[0].linetype           u'BYLAYER'
            entity.vertices[0].location           (651435.2482160575, 4767534.152790012, -73.31750819381297)
            entity.vertices[0].ltscale            1.0
            entity.vertices[0].owner              u''
            entity.vertices[0].paperspace
            entity.set_default_extrusion          <bound method ... >
            entity.setup_attributes               <bound method ... >
            entity.vertices[0].shadow_mode
            entity.vertices[0].start_width        0.0
            entity.vertices[0].tangent
            entity.vertices[0].thickness          0.0
            entity.vertices[0].transparency
            entity.vertices[0].true_color
            entity.vertices[0].vtx
    """
    points = polydata.GetPoints()
    lines = polydata.GetLines()

    line = []
    for pt in entity.points:
        pid = points.InsertNextPoint(pt)
        # if pid % 100 == 0:
        #     warning_message('handlePolyLine() inserted {0}'.format(pt))
        line.append(pid)

    cellId = lines.InsertNextCell(len(line))
    for l in line:
        lines.InsertCellPoint(l)

    # warning_message('Added a POLYLINE, cell id = {0}, tuple id = {1}'.format(cellId, tupleId))


def handleLWPolyLine(entity, polydata=None):
    """
        dxfgrabber.dxfentities.LWPolyline

        The attributes 'bulge', 'points', and 'width' seem to be parallel arrays

        entity.bulge                    [0.0, 0.0, ..., 0.0]
        entity.color                    18
        entity.const_width              0.0
        entity.dxftype                  u'LWPOLYLINE'
        entity.elevation                -71.0
        entity.extrusion                (0.0, 0.0, 1.0)
        entity.flags                    0
        entity.handle                   u'725'
        entity.invisible                0
        entity.is_closed                False
        entity.layer                    u'PLOTS_APEX LEVEL_04 GEOLOGY_FAULTS'
        entity.layout_tab_name
        entity.line_weight              0
        entity.linetype                 u'DASHED2'
        entity.ltscale                  50.0
        entity.owner                    u'347'
        entity.paperspace
        entity.points                   [(652316.1982694921, 4768796.039987729), (652310.2965201059, 4768791.062912218), ..., (650144.0, 4767428.757242111)]
        entity.set_default_extrusion    <bound method ... >
        entity.setup_attributes         <bound method ... >
        entity.shadow_mode
        entity.thickness                0.0
        entity.transparency
        entity.true_color
        entity.width                    [(0.0, 0.0), (0.0, 0.0), ..., (0.0, 0.0)]
    """
    points = polydata.GetPoints()
    lines = polydata.GetLines()

    elevation = entity.elevation

    line = []
    for pt in entity.points:
        pid = points.InsertNextPoint([pt[0], pt[1], elevation])
        # if pid % 100 == 0:
        #     warning_message('handleLWPolyLine() inserted [{0}, {1}]'.format(pt, elevation))
        line.append(pid)

    numCellPoints = len(line)
    if entity.is_closed:
        numCellPoints += 1

    cellId = lines.InsertNextCell(numCellPoints)
    for l in line:
        lines.InsertCellPoint(l)

    if entity.is_closed:
        lines.InsertCellPoint(line[0])

    # warning_message('Added an LWPOLYLINE, cell id ={0}, tuple id = {1}'.format(cellId, tupleId))


def _createVectorText(text, position):
    source = vtkVectorText()
    source.SetText(text)

    transform = vtkTransform()
    transform.Translate(position)

    transformPD = vtkTransformPolyDataFilter()
    transformPD.SetOutputPointsPrecision(1)
    transformPD.SetTransform(transform)
    transformPD.SetInputConnection(source.GetOutputPort())

    transformPD.Update()
    return transformPD.GetOutput()


def handleMText(entity, polydata=None):
    """
        dxfgrabber.dxfentities.MText

        entity.attachment_point                   1
        entity.big_font                 u'Arial'
        entity.color                    256
        entity.dxftype                  u'MTEXT'
        entity.extrusion                (0.0, 0.0, 1.0)
        entity.font                     u'Arial'
        entity.handle                   u'B9'
        entity.height                   5.0
        entity.horizontal_width         36.97228539775091
        entity.insert                   (651331.9766731897, 4767529.584343491, -91.44930179)
        entity.invisible                0
        entity.layer                    u'PLOTS_APEX LEVEL_02 GENERAL ANNOTATIONS'
        entity.layout_tab_name
        entity.line_spacing             1.0
        entity.line_weight              0
        entity.lines                    <bound method ... >
        entity.lines()                  [u'From UCL']
        entity.linetype
        entity.ltscale                  1.0
        entity.owner                    u'347'
        entity.paperspace
        entity.plain_text               <bound method ... >
        entity.plain_text()             u'From UCL'
        entity.raw_text                 u'From UCL'
        entity.rect_width               36.97228539775091
        entity.resolve_text_style       <bound method ... >
        entity.resolve_text_style()     *** TypeError: resolve_text_style() takes exactly 2 arguments (1 given)
        entity.set_default_extrusion    <bound method ... >
        entity.setup_attributes         <bound method ... >
        entity.shadow_mode
        entity.style                    u'STANDARD'
        entity.thickness                0.0
        entity.transparency
        entity.true_color
        entity.vertical_height
        entity.xdirection               (0.9959898178265837, -0.08946665739686809, 0.0)
    """
    if entity.raw_text and entity.insert:
        return _createVectorText(entity.raw_text, entity.insert)
    else:
        msg = ''.join([
            'MTEXT entity missing information, needs both ',
            '"raw_text" (got {0}) and "insert" (got {1})',
        ]).format(entity.raw_text, entity.insert)
        warning_message(msg)
        return None


def handleText(entity, polydata=None):
    """
        dxfgrabber.dxfentities.Text

        entity.align_point              (651542.2137707327, 4767701.815610482, -69.86459901)
        entity.big_font                 u''
        entity.color                    7
        entity.dxftype                  u'TEXT'
        entity.extrusion                (0.0, 0.0, 1.0)
        entity.font                     u'Arial'
        entity.halign                   4
        entity.handle                   u'E0'
        entity.height                   1.5
        entity.insert                   (5.7591235000872985, -1.4695264222100377, 2.397784886529493)
        entity.invisible                0
        entity.is_backwards             False
        entity.is_upside_down           False
        entity.layer                    u'PLOTS_APEX LEVEL_08 DRAINAGE_ANNOTATIONS'
        entity.layout_tab_name
        entity.line_weight              0
        entity.linetype
        entity.ltscale                  1.0
        entity.oblique                  0.0
        entity.owner                    u'347'
        entity.paperspace
        entity.plain_text               <bound method ... >
        entity.plain_text()             u'-2.0'
        entity.resolve_text_style       <bound method ... >
        entity.resolve_text_style()     *** TypeError: resolve_text_style() takes exactly 2 arguments (1 given)
        entity.rotation                 -15.00734424682809
        entity.set_default_extrusion    <bound method ... >
        entity.setup_attributes         <bound method ... >
        entity.shadow_mode
        entity.style                    u'STANDARD'
        entity.text                     u'-2.0'
        entity.thickness                0.0
        entity.transparency
        entity.true_color
        entity.valign                   2
        entity.width                    1.0
    """
    if entity.text and (entity.align_point or entity.insert):
        position = entity.align_point or entity.insert
        return _createVectorText(entity.text, position)
    else:
        msg = ''.join([
            'TEXT entity missing information, needs both ',
            '"text" (got {0}) and one of "align_point" (got {1}) or ',
            '"insert" (got {2}).',
        ]).format(entity.text, entity.align_point, entity.insert)
        warning_message(msg)
        return None


def handleLine(entity, polydata=None):
    """
        dxfgrabber.dxfentities.Line

        entity.extrusion
        entity.handle                   u'5DD'
        entity.invisible                0
        entity.layer                    u'PLOTS_APEX LEVEL_08 DRAINAGE_ANNOTATIONS'
        entity.layout_tab_name
        entity.line_weight              0
        entity.linetype
        entity.ltscale                  1.0
        entity.owner                    u'347'
        entity.paperspace
        entity.set_default_extrusion    <bound method ... >
        entity.setup_attributes         <bound method ... >
        entity.shadow_mode
        entity.start                    (651673.5777664077, 4767630.029236615, -67.38643794130182)
        entity.thickness                0.0
        entity.transparency
        entity.true_color
        entity.color                    7
        entity.dxftype                  u'LINE'
        entity.end                      (651685.8624363637, 4767647.573426308, -67.81708068316786)
    """
    points = polydata.GetPoints()
    lines = polydata.GetLines()

    startIdx = points.InsertNextPoint(entity.start)
    endIdx = points.InsertNextPoint(entity.end)

    cellId = lines.InsertNextCell(2)
    lines.InsertCellPoint(startIdx)
    lines.InsertCellPoint(endIdx)

    # warning_message('Added a LINE, cell id = {0}, tuple id = {1}'.format(cellId, tupleId))


def handlePoint(entity, polydata=None):
    """
        dxfgrabber.dxfentities.Point

        entity.color                    9
        entity.dxftype                  u'POINT'
        entity.extrusion                (0.0, 0.0, 1.0)
        entity.handle
        entity.invisible                0
        entity.layer                    u'59'
        entity.layout_tab_name
        entity.line_weight              0
        entity.linetype
        entity.ltscale                  1.0
        entity.owner
        entity.paperspace
        entity.point                    (650363.328, 4766466.109, 55.534)
        entity.set_default_extrusion    <bound method ... >
        entity.setup_attributes         <bound method ... >
        entity.shadow_mode
        entity.thickness                0.0
        entity.transparency
        entity.true_color
    """
    points = polydata.GetPoints()
    verts = polydata.GetVerts()

    idx = points.InsertNextPoint(entity.point)

    cellId = verts.InsertNextCell(1)
    verts.InsertCellPoint(idx)

    # warning_message('Added a POINT, cell id = {0}, tuple id = {1}'.format(cellId, tupleId))


def handleSeqend(entity, polydata=None):
    """
        dxfgrabber.dxfentities.DXFEntity

        -2 APP: name of entity that began the sequence. This entity marks the
        end of vertex (vertex type name) for a polyline, or the end of
        attribute entities (attrib type name) for an insert entity that has
        attributes (indicated by 66 group present and nonzero in insert
        entity).This code is not saved in a DXF file

        entity.color              256
        entity.dxftype            u'SEQEND'
        entity.extrusion
        entity.handle             u'5CE'
        entity.invisible          0
        entity.layer              u'PLOTS_APEX LEVEL_02 GENERAL ANNOTATIONS'
        entity.layout_tab_name
        entity.line_weight        0
        entity.linetype
        entity.ltscale            1.0
        entity.owner              u'C6'
        entity.paperspace
        entity.shadow_mode
        entity.thickness          0.0
        entity.transparency
        entity.true_color
    """
    pass


def handleInsert(entity, polydata=None):
    """
        dxfgrabber.dxfentities.Insert

        entity.attribs            []
        entity.attribsfollow      False
        entity.col_count          1
        entity.col_spacing        0.0
        entity.color              7
        entity.dxftype            u'INSERT'
        entity.extrusion          (0.0, 0.0, 1.0)
        entity.find_attrib        <bound method ... >
        entity.handle             u'C6'
        entity.insert             (651402.9634957444, 4767534.874156112, -91.44930179)
        entity.invisible          0
        entity.layer              u'PLOTS_APEX LEVEL_02 GENERAL ANNOTATIONS'
        entity.layout_tab_name
        entity.line_weight        0
        entity.linetype
        entity.ltscale            1.0
        entity.name               u'OT_TLZ'
        entity.owner              u'347'
        entity.paperspace
        entity.rotation           -4.9999999999999885
        entity.row_count          1
        entity.row_spacing        0.0
        entity.scale              (1.0, 1.0, 1.0)
        entity.shadow_mode
        entity.thickness          0.0
        entity.transparency
        entity.true_color
    """
    pass


# register some default handlers
registerHandler('POLYLINE', handlePolyLine)
registerHandler('LWPOLYLINE', handleLWPolyLine)
registerHandler('LINE', handleLine)
# registerHandler('POINT', handlePoint)

registerHandler('MTEXT', handleMText)
registerHandler('TEXT', handleText)
registerHandler('SEQEND', handleSeqend)
registerHandler('INSERT', handleInsert)


#------------------------------------------------------------------------------
# Some helper methods
#------------------------------------------------------------------------------
def createPolyData(entityColor):
    polyData = vtkPolyData()
    polyData.SetPoints(vtkPoints())
    polyData.SetVerts(vtkCellArray())
    polyData.SetLines(vtkCellArray())
    polyData.SetPolys(vtkCellArray())
    polyData.SetStrips(vtkCellArray())

    shortValue = vtkShortArray()
    shortValue.SetNumberOfComponents(1)
    shortValue.SetName("EntityColor")
    shortValue.InsertNextValue(entityColor)
    polyData.GetFieldData().AddArray(shortValue)

    return polyData


def getText(entity):
    if hasattr(entity, 'text'):
        return entity.text
    elif hasattr(entity, 'raw_text'):
        return entity.raw_text
    return None


#------------------------------------------------------------------------------
# A basic DXF reader
#------------------------------------------------------------------------------
@smproxy.reader(name="PythonDXFReader", label="Python-based DXF Reader",
                extensions="dxf", file_description="DXF files")
class PythonDXFReader(VTKPythonAlgorithmBase):
    """A reader that reads a dxf file"""
    def __init__(self):
        VTKPythonAlgorithmBase.__init__(self, nInputPorts=0, nOutputPorts=1, outputType='vtkMultiBlockDataSet')
        self._filename = None
        self._dxf = None

    def _read_data_file(self):
        from dxfgrabber import readfile
        if not self._dxf:
            self._dxf = readfile(self._filename)

    @smproperty.stringvector(name="FileName")
    @smdomain.filelist()
    @smhint.filechooser(extensions="dxf", file_description="AutoCAD/AutoDesk dxf files")
    def SetFileName(self, name):
        """Specify filename for the file to read."""
        if self._filename != name:
            self._filename = name
            self._dxf = None
            self.Modified()

    def RequestData(self, request, inInfoVec, outInfoVec):
        output = vtkMultiBlockDataSet.GetData(outInfoVec, 0)

        self._read_data_file()

        entityColorsToPolyData = {}

        for entity in self._dxf.entities:
            if entity.color not in entityColorsToPolyData:
                entityColorsToPolyData[entity.color] = createPolyData(entity.color)
            polyData = entityColorsToPolyData[entity.color]

            vectorText = handleEntity(entity, polyData)
            hasGeom = polyData.GetNumberOfPoints() > 0 and polyData.GetNumberOfCells() > 0

            if vectorText:
                if hasGeom:
                    # warning_message('vector text append')
                    appender = vtkAppendPolyData()
                    appender.SetOutputPointsPrecision(1)
                    appender.AddInputData(polyData)
                    appender.AddInputData(vectorText)
                    appender.Update()
                    entityColorsToPolyData[entity.color] = appender.GetOutputDataObject(0)
                else:
                    # entityColorsToPolyData[entity.color] = vectorText
                    msg = """Entity has text ({0}), but previous polydata had
no geometry.  Skipping vector text append.""".format(getText(entity))
                    warning_message(msg)

        numberOfBlocks = len(entityColorsToPolyData)
        output.SetNumberOfBlocks(numberOfBlocks)

        blockIdx = 0
        for color, polyData in entityColorsToPolyData.items():
            output.SetBlock(blockIdx, polyData)
            blockIdx += 1

        return 1


def dxf_to_vtp(input_file, output_path):
    from paraview import simple

    module_path = os.path.abspath(__file__)

    warning_message('Loading plugin from file: {0}'.format(module_path))
    simple.LoadPlugin(module_path, ns=globals())

    source = simple.OpenDataFile(input_file)

    if output_path[-4:] != '.vtp':
        output_path = '{0}.vtp'.format(output_path)

    output_dir = os.path.dirname(output_path)
    if not os.path.isdir(output_dir):
        os.makedirs(output_dir)

    # Use client-side functionality here because the use of the
    # merge blocks filter followed by the extract surface filter
    # results in a loss of precision from double to float, which
    # causes the texts to be unreadable
    reader = source.SMProxy.GetClientSideObject()
    reader.Update()
    vtkMBDataset = reader.GetOutputDataObject(0)
    numBlocks = vtkMBDataset.GetNumberOfBlocks()

    appender = vtkAppendPolyData()
    appender.SetOutputPointsPrecision(1)

    for i in range(numBlocks):
        nextBlock = vtkMBDataset.GetBlock(i)
        appender.AddInputData(nextBlock)

    appender.Update()
    outputPolyData = appender.GetOutput()

    writer = vtkXMLPolyDataWriter()
    writer.SetFileName(output_path)
    writer.SetCompressorTypeToZLib()
    writer.SetInputData(outputPolyData)
    writer.Write()


#------------------------------------------------------------------------------
# Command-line runnable dxf to vtp converter
#------------------------------------------------------------------------------
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="DXF to VTP converter")
    parser.add_argument('--virtual-env', default=None, help="Path to virtual environment root (for dxfgrabber module)")
    parser.add_argument('--input-file', default=None, help="Path to DXF file to convert")
    parser.add_argument('--output-file', default=None, help="Path to VTP file to create")
    args = parser.parse_args()

    dxf_to_vtp(args.input_file, args.output_file)

import { Component, OnInit, ElementRef } from '@angular/core';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import QuakeManager from '../../QuakeManager';

@Component({
  selector: 'app-vtk-view',
  templateUrl: './vtk-view.component.html',
  styleUrls: ['./vtk-view.component.css']
})

export class VtkViewComponent implements OnInit {
  vtkContainer = null;
  fullscreenWindow = null;
  pipeline = null;
  waitNextPicking = false;
  viewBounds = null;
  pickedData = null;

  constructor(
    private el: ElementRef
  ) { }

  formatTime(epoch) {
    const isoStr = new Date(epoch / 1000000).toISOString().split('T');
    return `${isoStr[0].replace(/-/g, '/')} - ${isoStr[1].split('.')[0]}`;
  }

  formatMagnitude(mag) {
    return mag.toFixed(2);
  }

  ngOnInit() {
    this.vtkContainer = this.el.nativeElement.querySelector('.vtk-view-container');
    this.fullscreenWindow = vtkFullScreenRenderWindow.newInstance({
      rootContainer: this.el.nativeElement,
      container: this.vtkContainer,
      containerStyle: {},
      background: [0, 0, 0, 0],
    });

    const renderer = this.fullscreenWindow.getRenderer();
    const renWindow = this.fullscreenWindow.getRenderWindow();
    const glRenderWindow = this.fullscreenWindow.getOpenGLRenderWindow();

    this.el.nativeElement.addEventListener('mouseenter', (e) => {
      this.viewBounds = this.el.nativeElement.getBoundingClientRect();
    });

    this.el.nativeElement.addEventListener('dblclick', (e) => {
      if (this.pickedData) {
        QuakeManager.getEventId(this.pickedData.data.id).then((id) => {
          QuakeManager.openWaveform(id);
        });
      }
    });

    this.el.nativeElement.addEventListener('mousemove', (e) => {
      const inAnim = renWindow.getInteractor().isAnimating();
      if (!inAnim && !this.waitNextPicking && QuakeManager) {
        const { x, y } = e;
        this.waitNextPicking = !!QuakeManager.pickPoint;
        const devicePixelRatio = window.devicePixelRatio || 1;
        const vtkCoord = [
          devicePixelRatio * (x - this.viewBounds.x),
          devicePixelRatio * (this.viewBounds.height - (y - this.viewBounds.y)),
        ];
        if (QuakeManager.pickPoint) {
          QuakeManager.pickPoint(Math.round(vtkCoord[0]), Math.round(vtkCoord[1])).then((data) => {
            if (data && data.magnitude) {
              this.pickedData = { x, y, data };
            } else {
              this.pickedData = null;
            }

            this.waitNextPicking = false;
          })
          .catch(console.error);
        }
      }
    });

    QuakeManager.bindRendering(renderer, renWindow, glRenderWindow);
  }

}

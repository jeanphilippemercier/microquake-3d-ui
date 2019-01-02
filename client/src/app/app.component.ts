import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  expanded = true;
  picking = false;
  historicalPeriod = 12; // in months
  focusPeriod = '3mon';
  pieces = [
    { name: 'Piece 1', checked: false },
    { name: 'Piece 2', checked: false },
    { name: 'Piece 3', checked: false },
    { name: 'Piece 4', checked: false },
    { name: 'Piece 5', checked: false },
    { name: 'Piece 6', checked: false },
  ];
  events = [
    { name: 'Earthquake', checked: false },
    { name: 'Blastquake', checked: false },
  ]

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  togglePicking() {
    this.picking = !this.picking;
  }

  orientCamera() {
    console.log('orientCamera');
  }

  resetCamera() {
    console.log('resetCamera');
  }
}

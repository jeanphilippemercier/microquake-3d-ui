import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MatCardModule,
  MatRadioModule,
  MatDividerModule,
  MatButtonModule,
  MatIconModule,
  MatCheckboxModule,
} from '@angular/material';

import { AppComponent } from './app.component';
import { VtkViewComponent } from './vtk-view/vtk-view.component';
import { CollapsibleListComponent } from './collapsible-list/collapsible-list.component';

@NgModule({
  declarations: [
    AppComponent,
    VtkViewComponent,
    CollapsibleListComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatRadioModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

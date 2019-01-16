import { Component, OnInit } from "@angular/core";
import QuakeManager from "../QuakeManager";
import PRESETS from "./presets";

const TIME_UNITS = [
  { label: 'month', labelPlurial: 'months', base: 730 },
  { label: 'week', labelPlurial: 'weeks', base: 168 },
  { label: 'day', labelPlurial: 'days', base: 24 },
];

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

function getDateFromNow(nbHours = 0) {
  const timeStamp = new Date(Date.now() - nbHours * 3600000);
  const year = timeStamp.getFullYear();
  const month = pad(timeStamp.getMonth() + 1);
  const day = pad(timeStamp.getDate());
  const hours = pad(timeStamp.getHours());
  const minutes = pad(timeStamp.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}:00.0`;
}

const NAME_MAPPING = {
  Earthquake: "quake",
  Blastquake: "blast",
  Historical: "historical"
};

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  advanceMode = false;
  expanded = true;
  // picking = false;
  historicalPeriod = 0; // in hours (3 months)
  focusPeriod = 2190; // in hours (3 months)
  minMagnitude = -3;
  maxMagnitude = 3;
  minSize = 0.1;
  maxSize = 1;
  nowTimeString = '';
  focusTimeString = '';
  shortFocus = '';
  mineCategories = [];
  presets = PRESETS;
  presetNames = Object.keys(PRESETS);
  activePreset = 'coolwarm';
  scalarBar = `data:image/png;base64,${PRESETS.coolwarm}`;
  events = Object.keys(NAME_MAPPING).map(name => ({ name, checked: true }));

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  // togglePicking() {
  //   this.picking = !this.picking;
  //   // QuakeManager.setSelectionMode(this.picking);
  // }

  orientCamera() {
    QuakeManager.snapCamera();
  }

  resetCamera() {
    QuakeManager.resetCamera();
  }

  periodChange() {
    this.nowTimeString = getDateFromNow();
    const historicalTime = getDateFromNow(Math.max(this.focusPeriod, this.historicalPeriod));
    this.focusTimeString = getDateFromNow(this.focusPeriod);
    QuakeManager.updateEvents(this.nowTimeString, this.focusTimeString, historicalTime);
  }

  updateScalarBar(name) {
    this.activePreset = name;
    this.scalarBar = `data:image/png;base64,${PRESETS[name]}`;
    QuakeManager.updatePreset(name);
  }

  getShortTimeLabel(value) {
    let remain = value || this.focusPeriod;
    const strBuffer = [];
    for (let i = 0; i < TIME_UNITS.length; i++) {
      const { label, labelPlurial, base } = TIME_UNITS[i];
      if (remain >= base) {
        strBuffer.push(Math.floor(remain / base));
        strBuffer.push(remain / base >= 2 ? labelPlurial : label);
        remain %= base;
      }
    }
    return strBuffer.join(' ');
  }

  updateShortFocus(event) {
    this.shortFocus = this.getShortTimeLabel(event && event.value);
    this.focusTimeString = getDateFromNow(event && event.value);
  }

  visibilityChange() {
    const visibilityMap = {};
    this.events.forEach(e => {
      visibilityMap[NAME_MAPPING[e.name]] = e.checked;
    });
    QuakeManager.updateVisibility(visibilityMap);
  }

  mineVisibilityChange() {
    const visibilityMap = {};
    for (let i = 0; i < this.mineCategories.length; i++) {
      for (let j = 0; j < this.mineCategories[i].pieces.length; j++) {
        const piece = this.mineCategories[i].pieces[j];
        visibilityMap[piece.name] = piece.checked;
      }
    }
    QuakeManager.updateMineVisibility(visibilityMap);
  }

  scalingChange() {
    QuakeManager.updateScaleFunction(
      [Number(this.minMagnitude), Number(this.maxMagnitude)],
      [Number(this.minSize), Number(this.maxSize)]
    );
  }

  toggleAdvanceMode() {
    this.advanceMode = !this.advanceMode;
  }

  ngOnInit() {
    const config =
      window.location.hostname === "localhost" &&
      window.location.port === "4200"
        ? { sessionURL: "ws://localhost:1234/ws" }
        : { application: "quake" };
    QuakeManager.connect(config).then(() => {
      // Update mine info
      QuakeManager.getMineDescription().then(mine => {
        this.mineCategories = mine;

        // Put mine in center
        QuakeManager.resetCamera();

        // Trigger event fetching
        this.periodChange();
        this.scalingChange();
      });
    });
  }
}

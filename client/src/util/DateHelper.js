const TIME_UNITS = [
  { label: 'month', labelPlurial: 'months', base: 730 },
  { label: 'week', labelPlurial: 'weeks', base: 168 },
  { label: 'day', labelPlurial: 'days', base: 24 },
];

let OFFSET_IN_MS = 0;

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

function getDateFromNow(nbHours = 0) {
  const ts =
    nbHours < 24 ? new Date() : new Date(Date.now() - nbHours * 3600000);
  return ts.toISOString();
}

function dateToString(date) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}:00.0`;
}

function toMineTime(str) {
  const mineDate = new Date(OFFSET_IN_MS + new Date(str).getTime());
  return dateToString(mineDate);
}

function getShortTimeLabel(value) {
  if (value < 24) {
    return 'now';
  }
  let remain = value;
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

function getHoursFromNowInMineTime(strDate) {
  const deltaHours = Math.round(
    (Date.now() -
      new Date(new Date(`${strDate}T00:00:00.0`).getTime() - OFFSET_IN_MS)) /
      3600000
  );
  return deltaHours;
}

function getHoursFromNow(strDate) {
  const deltaHours = Math.round(
    (Date.now() - new Date(`${strDate}T00:00:00.0`)) / 3600000
  );
  return deltaHours;
}

function toHoursFromNow(str) {
  const deltaHours = (Date.now() - new Date(str)) / 3600000;
  return deltaHours;
}

function hoursFromNowToLabel(nbHoursAgo) {
  if (nbHoursAgo > 0.9) {
    return `${Math.round(nbHoursAgo)} hours ago`;
  }
  const minutes = nbHoursAgo * 60;

  if (minutes < 1) {
    return 'now';
  }

  return `${Math.round(minutes)} minutes ago`;
}

function formatEpochTime(epoch) {
  if (Number.isNaN(epoch)) {
    return 'N/A';
  }
  const isoStr = new Date(OFFSET_IN_MS + epoch / 1000000)
    .toISOString()
    .split('T');
  return `${isoStr[1].split('.')[0]}`;
}

function formatEpochDate(epoch) {
  if (Number.isNaN(epoch)) {
    return 'N/A';
  }
  const isoStr = new Date(OFFSET_IN_MS + epoch / 1000000)
    .toISOString()
    .split('T');
  return `${isoStr[0].replace(/-/g, '/')}`;
}

function setTimeZone(strOffset) {
  console.log('setTimeZone', strOffset);
  const [hours, min] = strOffset.split(':').map(Number);
  const sign = hours < 0 ? -1 : +1;
  OFFSET_IN_MS = 0;
  OFFSET_IN_MS += min * 60000;
  OFFSET_IN_MS += Math.abs(hours) * 60 * 60000;
  OFFSET_IN_MS *= sign;
}

function getOffsetTime() {
  return { ms: OFFSET_IN_MS };
}

export default {
  formatEpochDate,
  formatEpochTime,
  getDateFromNow,
  getHoursFromNow,
  getHoursFromNowInMineTime,
  getShortTimeLabel,
  setTimeZone,
  toMineTime,
  toHoursFromNow,
  hoursFromNowToLabel,
  getOffsetTime,
};

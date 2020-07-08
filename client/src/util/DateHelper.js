const TIME_UNITS = [
  { label: 'month', labelPlurial: 'months', base: 30 },
  { label: 'week', labelPlurial: 'weeks', base: 7 },
  { label: 'day', labelPlurial: 'days', base: 1 },
];

let OFFSET_IN_MS = 0;
let STR_OFFSET = '';

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

function getDateFromNow(nbDays = 0) {
  const now = new Date();
  if (nbDays <= 0) {
    // Now time
    return now.toISOString();
  }

  // we need to take midnight of the mine time
  const mineTime = new Date(Date.now() + OFFSET_IN_MS);
  const deltaDays = now.getUTCDate() - mineTime.getUTCDate();
  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate() - deltaDays);

  const strTS = `${year}-${month}-${day}T00:00:00.0${STR_OFFSET}`;
  const date = new Date(strTS);

  if (nbDays > 1) {
    date.setDate(date.getDate() + 1 - nbDays);
  }
  return date.toISOString();
}

function getDaysFromNowInMineTime(dateStrYYYYMMDD) {
  const newDate = new Date(`${dateStrYYYYMMDD}T00:00:00.0${STR_OFFSET}`);
  const nowDate = new Date(getDateFromNow(1));
  return (nowDate - newDate) / 86400000; // 24hours in ms
}

function getDateFromNowInMineTime(nbDays = 0) {
  const ts = new Date(new Date(getDateFromNow(nbDays)) - OFFSET_IN_MS);
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

function toMineTime(str, ensureMidNight = false) {
  if (ensureMidNight) console.log('toMineTime', str);
  const mineDate = new Date(OFFSET_IN_MS + new Date(str).getTime());
  if (ensureMidNight) console.log('mineDate', mineDate.toISOString());
  if (ensureMidNight && mineDate.getUTCHours() !== 0) {
    const deltaHours = mineDate.getUTCHours();
    if (deltaHours > 12) {
      mineDate.setDate(mineDate.getDate() + 1);
      mineDate.setHours(mineDate.getHours() - mineDate.getUTCHours());
    } else {
      mineDate.setDate(mineDate.getDate() - 1);
      mineDate.setHours(mineDate.getHours() - mineDate.getUTCHours());
    }
    if (ensureMidNight) console.log('utcHours', deltaHours);
    if (ensureMidNight) console.log('snappedDate', mineDate.toISOString());
  }
  return dateToString(mineDate);
}

function getShortTimeLabel(value) {
  if (value < 1) {
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
  STR_OFFSET = strOffset;
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
  getDateFromNowInMineTime,
  getHoursFromNow,
  getHoursFromNowInMineTime,
  getDaysFromNowInMineTime,
  getShortTimeLabel,
  setTimeZone,
  toMineTime,
  toHoursFromNow,
  hoursFromNowToLabel,
  getOffsetTime,
};

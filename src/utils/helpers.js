import BigNumber from "bignumber.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const RONE = new BigNumber(2).pow(40);

export function pow10(n) {
  return new BigNumber(10).pow(n);
}

export function toUTC(timestamp) {
  return dayjs(timestamp).unix();
}

function seriesToMap(series) {
  return series.reduce((a, b) => {
    if (!a[b.time]) {
      a[b.time] = b.value;
    }
    return a;
  }, {});
}

function mapToSeries(map, timeFrame) {
  const _format = timeFrame === "hourly" ? "YYYY-MM-DD-HH" : "YYYY-MM-DD";

  return Object.keys(map)
    .map((key) => ({
      time: dayjs(key, _format).unix(),
      value: map[key],
    }))
    .sort((a, b) => a.time - b.time);
}

export function getDataset(series, timeFrame) {
  const _format = timeFrame === "hourly" ? "YYYY-MM-DD-HH" : "YYYY-MM-DD";
  const _unit = timeFrame === "hourly" ? "hour" : "day";

  const startTime = dayjs(series[0].time, _format);
  // const endTime = dayjs(series[series.length - 1].time, _format);
  const endTime = dayjs(new Date());

  const _map = seriesToMap(series);

  let time = dayjs(startTime);

  while (!time.isAfter(endTime)) {
    let key = dayjs(time).format(_format);
    if (!_map[key]) {
      _map[key] = 0;
    }
    time = time.add(1, _unit);
  }

  const _series = mapToSeries(_map, timeFrame);

  return _series;
}

export function getDatasetWithNet(series, timeFrame) {
  const _format = timeFrame === "hourly" ? "YYYY-MM-DD-HH" : "YYYY-MM-DD";
  const _unit = timeFrame === "hourly" ? "hour" : "day";

  const startTime = dayjs(series[0].time, _format);
  // const endTime = dayjs(series[series.length - 1].time, _format);
  const endTime = dayjs(new Date());

  const _map = {};

  series.forEach((item) => {
    const key = item.time;
    const _in = item?.in ?? 0;
    const _out = item?.out ?? 0;

    if (!_map[key]) {
      _map[key] = { time: key, in: _in, out: _out };
    } else {
      _map[key].in += _in;
      _map[key].out += _out;
    }
  });

  let time = dayjs(startTime);
  let net = 0;

  while (!time.isAfter(endTime)) {
    const key = time.format(_format);
    if (!_map[key]) {
      _map[key] = { time: key, in: 0, out: 0, net };
    } else {
      net += _map[key].in - _map[key].out;
      _map[key].net = net;
    }
    time = time.add(1, _unit);
  }

  const _series = Object.keys(_map)
    .map((key) => ({
      ..._map[key],
      time: dayjs(key, _format).unix(),
    }))
    .sort((a, b) => a.time - b.time);

  return _series;
}

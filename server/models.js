export class Station {
  constructor(id, name, x, y, interchange = false) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.interchange = interchange;
  }
}

export class Line {
  constructor(id, name, color, stops = []) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.stops = stops;
  }
}

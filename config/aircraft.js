export const AircraftConfig = {

  mass: 180000,

  maxThrust: 640000,

  wingArea: 377,

  gearHeight: 2.75,

  takeoffSpeed: 130,

 drag: {
  base: 0.08,
  ground: 0.03,
  gear: 0.08
  },

  lift: {
    base: 0.8,
    aoaMultiplier: 6.5
  },

controls: {
  response: 2.5,
  pitchAuthority: 0.7,
  rollAuthority: 2.0,
  yawAuthority: 0.6
},

  engine: {
    spoolRate: 0.15
  }

};
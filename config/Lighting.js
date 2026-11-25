export const LightingConfig = {
    color: 0xffffff,
  sun: {
    intensity: 2.2,
    elevation: 45,
    azimuth: 180
  },

  ambient: {
    intensity: 0.8
  },

  hemisphere: {
    skyColor: 0xffffff,
    groundColor: 0x444444,
    intensity: 0.4
  },

  exposure: 0.6,

  atmosphere: {
    turbidity: 2,
    rayleigh: 0.8,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8
  }

};

export const SkyParameters = {
    turbidity: 2,
    rayleigh: 0.8,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    elevation: 45,
    azimuth: 180,
    exp: 1.0
  };
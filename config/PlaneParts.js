export const planeParts = {};

export function registerPlaneParts(plane) {

  plane.traverse((obj) => {

    if (
      obj.name &&
      obj.name.trim()
    ) {

      planeParts[obj.name] = obj;

    }

  });

}
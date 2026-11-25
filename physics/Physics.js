import * as THREE from "three";
import { AircraftConfig } from "../config/aircraft.js";

export class UniversalFlightEngine {

  constructor() {

    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();

    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();

    this.throttle = 0;
    this.actualEnginePower = 0;

    this.targetPitch = 0;
    this.targetRoll = 0;
    this.targetYaw = 0;

    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;

    this.isGrounded = true;
    this.noseGrounded = false;
  this.mainsGrounded = false;
  this.fullGrounded = false;

    this.speedKnots = 0;
    this.altitudeFeet = 0;

    this.brakes = 0;

    this.groundElevation = 0;

    this.mass = AircraftConfig.mass;

    this.gearHeight = AircraftConfig.gearHeight;
    this.gearExtension = 1.0;
    this.gearTarget = 1.0;

  }

  step(dt) {

    if (dt <= 0) return;

    //
    // Control Smoothing
    //
    const controlResponseRate = Math.min(
      1,
      dt * AircraftConfig.controls.response
    );

    this.pitch +=
      (this.targetPitch - this.pitch) *
      controlResponseRate;

    this.roll +=
      (this.targetRoll - this.roll) *
      controlResponseRate;

    this.yaw +=
      (this.targetYaw - this.yaw) *
      controlResponseRate;

    //
    // Engine Spool
    //
    const engineSpoolRate =
      dt * AircraftConfig.engine.spoolRate;

    this.actualEnginePower +=
      (this.throttle - this.actualEnginePower) *
      engineSpoolRate;

    //
    // Aircraft Axes
    //
    const fwd =
      new THREE.Vector3(0, 0, -1)
        .applyQuaternion(this.quaternion);

    const up =
      new THREE.Vector3(0, 1, 0)
        .applyQuaternion(this.quaternion);

    const right =
      new THREE.Vector3(1, 0, 0)
        .applyQuaternion(this.quaternion);

    //
    // Airspeed
    //
    const currentSpeed =
      this.velocity.length();

    this.speedKnots =
      currentSpeed * 1.94384;

    //
    // Altitude
    //
    const currentGroundY =
      this.groundElevation +
      (this.gearExtension * this.gearHeight);

    this.altitudeFeet =
      Math.max(
        0,
        (this.position.y - currentGroundY) * 3.28084
      );

    //
    // Thrust
    //
    const thrust =
      this.actualEnginePower *
      AircraftConfig.maxThrust;

    const accelThrust =
      thrust / this.mass;




    //
    // Aerodynamics
    //
    const currentFwdSpeed =
      Math.max(
        0,
        this.velocity.dot(fwd)
      );
    const aircraftPitch = new THREE.Euler().setFromQuaternion(this.quaternion, "YXZ").x;

  const flightPathAngle = Math.atan2(
    this.velocity.y,
    Math.max(0.01, currentFwdSpeed)
  );

  const aoa = aircraftPitch - flightPathAngle;
  let cl = AircraftConfig.lift.base + aoa * AircraftConfig.lift.aoaMultiplier;
 const stallAoA = 0.18;
const maxAoA = 0.35;

let stallDrag = 0;

if (aoa > stallAoA) {
  const stallAmount = THREE.MathUtils.clamp(
    (aoa - stallAoA) / (maxAoA - stallAoA),
    0,
    1
  );

  stallDrag = THREE.MathUtils.lerp(0, 0.5, stallAmount);
  cl *= THREE.MathUtils.lerp(1, 0.4, stallAmount);
}
  cl = Math.max(0, cl);
    const airDensity =
      1.225 *
      Math.exp(
        -this.position.y / 9000
      );

    const dynamicPressure =
      0.5 *
      airDensity *
      currentFwdSpeed *
      currentFwdSpeed;

    const gearDrag =
      this.gearExtension *
      AircraftConfig.drag.gear;

    const dragCoff =
      AircraftConfig.drag.base + stallDrag +
      (this.isGrounded ? AircraftConfig.drag.ground : 0) +
      gearDrag;

    const dragForce =
      dragCoff *
      dynamicPressure *
      AircraftConfig.wingArea;

    const dragAccel =
      dragForce / this.mass;

    //
    // Forward Acceleration
    //
    let netAccel =
      accelThrust - dragAccel;

    if (this.isGrounded) {
      const rollingResistance = 0.02 * 9.81;
      netAccel -= rollingResistance;
    }

if (this.throttle > 0 || currentFwdSpeed > 0.1) {
  this.velocity.addScaledVector(
    fwd,
    netAccel * dt
  );
}


    const liftForce =
      cl *
      dynamicPressure *
      AircraftConfig.wingArea;

    const liftAcc =
      liftForce / this.mass;

    //
    // Gear
    //
    this.gearExtension +=
      (this.gearTarget -
        this.gearExtension) *
      Math.min(1, dt * 0.3);

    //
    // Ground Logic
    //

    if (this.isGrounded) {

      if (!this.mainsGrounded && this.speedKnots > AircraftConfig.takeoffSpeed) {
        this.isGrounded = false;
      } else {

        this.position.y =
          currentGroundY;

        this.velocity.y = 0;

        const turnRate =
          -this.yaw *
          Math.min(
            0.6,
            currentFwdSpeed / 30
          );

        this.angularVelocity.set(
          0,
          turnRate,
          0
        );

        const euler =
          new THREE.Euler()
            .setFromQuaternion(
              this.quaternion,
              "YXZ"
            );
          let targetGroundPitch = this.pitch * 0.02;
        euler.x =
          THREE.MathUtils.lerp(
            euler.x,
            targetGroundPitch,
            dt * 2
          );

        euler.z =
          THREE.MathUtils.lerp(
            euler.z,
            0,
            dt * 5
          );

        this.quaternion.setFromEuler(
          euler
        );

      }

    } else {
if (this.mainsGrounded) {
  console.log("MAIN GEAR TOUCHDOWN");
  this.position.y = currentGroundY;
  if (this.velocity.y < -3) {
    this.velocity.y =
      -this.velocity.y * 0.15;

  } else {
    this.velocity.y = 0;
  }
  this.isGrounded = true;
}
      //
      // Airborne
      //
      this.velocity.addScaledVector(
        up,
        liftAcc * dt
      );
      this.position.y = Math.max(
    this.position.y,
    currentGroundY
);
      this.velocity.y += -9.81 * dt;

      const dynamicControlFactor =
        Math.min(
          1,
          Math.max(
            0.2,
            dynamicPressure / 2000
          )
        );

      const targetPitchRate =
        this.pitch *
        AircraftConfig.controls.pitchAuthority *
        dynamicControlFactor;

      const targetRollRate =
        -this.roll *
        AircraftConfig.controls.rollAuthority *
        dynamicControlFactor;

      const targetYawRate =
        -this.yaw *
        AircraftConfig.controls.yawAuthority *
        dynamicControlFactor;

      this.angularVelocity.x +=
        (targetPitchRate -
          this.angularVelocity.x) *
        dt *
        2;

      this.angularVelocity.z +=
        (targetRollRate -
          this.angularVelocity.z) *
        dt *
        2;

      this.angularVelocity.y +=
        (targetYawRate -
          this.angularVelocity.y) *
        dt *
        2;

      if (
        Math.abs(this.roll) < 0.05
      ) {

        const rollAngle =
          Math.atan2(
            right.y,
            up.y
          );

        this.angularVelocity.z -=
          rollAngle *
          0.4 *
          dt;

      }

    }

    //
    // Rotation
    //
    if (
      this.angularVelocity.lengthSq() >
      0.000001
    ) {

      const deltaEuler =
        new THREE.Euler(
          this.angularVelocity.x * dt,
          this.angularVelocity.y * dt,
          this.angularVelocity.z * dt,
          "YXZ"
        );

      const deltaQuaternion =
        new THREE.Quaternion()
          .setFromEuler(
            deltaEuler
          );

      this.quaternion.multiply(
        deltaQuaternion
      ).normalize();

    }

    //
    // Position
    //
    this.position.addScaledVector(
      this.velocity,
      dt
    );

    //
    // Landing
    //

    if (
      this.position.y <=
      currentGroundY
    ) {

    
        if (Math.random() < 0.01)
  console.log(
    this.noseGrounded,
    this.mainsGrounded,
    this.fullGrounded
  );

      if (this.velocity.y < -3){
        this.velocity.y =
          -this.velocity.y * 0.15;
      } 
      else 
      {
        this.velocity.y = 0;
      }
 /*     console.log(
  "Grounded:",
  this.isGrounded,
  "Mains:",
  this.mainsGrounded,
  "Y:",
  this.position.y.toFixed(2)
);*/
    }
  }
  
}

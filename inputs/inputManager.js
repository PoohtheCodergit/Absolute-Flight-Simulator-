import { codeList } from "../keybinders";

export const Input = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  brake: false,
  throttle: 0,
};

export function registerInput(world, flightData) {

  window.addEventListener("keydown", e => {

    if (
      e.code === codeList.KeyS ||
      e.code === codeList.ArrowDown
    ) {
      Input.pitch = 1;
    }

    if (
      e.code === codeList.KeyW ||
      e.code === codeList.ArrowUp
    ) {
      Input.pitch = -1;
    }

    if (
      e.code === codeList.KeyD ||
      e.code === codeList.ArrowLeft
    ) {
      Input.roll = 1;
    }

    if (
      e.code === codeList.KeyA ||
      e.code === codeList.ArrowRight
    ) {
      Input.roll = -1;
    }

    if (e.code === codeList.KeyV) {
      Input.yaw = -1;
    }

    if (e.code === codeList.KeyN) {
      Input.yaw = 1;
    }

    if (e.code === codeList.Space) {
      Input.brake = true;
    }

    if (e.code === codeList.KeyQ) {
      Input.throttle = 1;
    }
    if (e.code === codeList.KeyE) {
      Input.throttle = -1;
    }
  });

  window.addEventListener("keyup", e => {

    if (
      e.code === codeList.KeyW ||
      e.code === codeList.KeyS ||
      e.code === codeList.ArrowUp ||
      e.code === codeList.ArrowDown
    ) {
      Input.pitch = 0;
    }

    if (
      e.code === codeList.KeyA ||
      e.code === codeList.KeyD ||
      e.code === codeList.ArrowLeft ||
      e.code === codeList.ArrowRight
    ) {
      Input.roll = 0;
    }

    if (
      e.code === codeList.KeyV ||
      e.code === codeList.KeyN
    ) {
      Input.yaw = 0;
    }

    if (e.code === codeList.Space) {
      Input.brake = false;
    }

  });

}
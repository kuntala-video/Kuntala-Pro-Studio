'use server';

/**
 * @fileOverview A library for capturing from multiple camera sources.
 * 
 * This file will contain functions to manage and switch between multiple camera inputs.
 */

interface CameraSource {
  id: string;
  name: string;
  isActive: boolean;
}

const cameraSources: CameraSource[] = [];

/**
 * Adds a new camera source to the capture system.
 * @param deviceId The device ID of the camera.
 * @param name A friendly name for the camera.
 * @returns The newly created camera source object.
 */
export function addCameraSource(deviceId: string, name: string): CameraSource {
  const newSource = {
    id: deviceId,
    name,
    isActive: false
  };
  cameraSources.push(newSource);
  console.log(`Added camera source: ${name}`);
  return newSource;
}

/**
 * Switches the active camera source.
 * @param deviceId The ID of the camera source to make active.
 * @returns True if the switch was successful, false otherwise.
 */
export function switchActiveCamera(deviceId: string): boolean {
  let found = false;
  cameraSources.forEach(source => {
    if (source.id === deviceId) {
      source.isActive = true;
      found = true;
      console.log(`Switched active camera to: ${source.name}`);
    } else {
      source.isActive = false;
    }
  });
  return found;
}

/**
 * Gets the list of available camera sources.
 * @returns An array of camera source objects.
 */
export function getCameraSources(): CameraSource[] {
  return cameraSources;
}

export function multiCamCapture(){

return {
inputs:5,
deviceCamera:true,
usbCamera:true,
mixing:"live",
encoder:"webrtc",
output:"youtube live"
}

}

/**
 * @fileOverview A library for generating video scenes.
 * 
 * - generateScene: A function to generate a scene for a location.
 */


/**
 * Generates a scene object from a given location.
 * @param location The location for the scene.
 * @returns A scene object.
 */
export function generateScene(location:string){

return{

scene:location,

background:`/scenes/${location}.png`,

resolution:"1920x1080",

status:"scene generated"

}

}

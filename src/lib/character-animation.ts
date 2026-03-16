
export function animateCharacter(character:string, action:string){

const animation = {

character: character,

action: action,

motion: {

type: "3D Motion",

skeleton: "humanoid-rig",

frames: 240,

fps: 30

},

camera: {

angle: "cinematic",

movement: "dynamic pan"

},

status: "animation generated"

}

return animation

}

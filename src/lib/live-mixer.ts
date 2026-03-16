
export function liveMixer(){

return {

inputs:5,

sources:[

"device-camera",

"usb-camera-1",

"usb-camera-2",

"usb-camera-3",

"usb-camera-4"

],

layout:"live-mix",

output:"youtube-live",

quality:"1080p",

fx:true,

status:"live ready"

}

}

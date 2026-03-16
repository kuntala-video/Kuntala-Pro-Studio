'use server';

export function characterMemory(name:string){

return {

name,

faceLocked:true,

voiceLocked:true,

dressEditable:true,

colorEditable:true,

episodeConsistency:true,

status:"memory locked"

}

}

'use server';

/**
 * @fileOverview A library for managing episodic content.
 * 
 * This file will contain functions to create, manage, and assemble episodes.
 */

export function generateEpisodes(title:string,total:number){

const episodes=[]

for(let i=1;i<=total;i++){

episodes.push({

episode:i,

title:`${title} Episode ${i}`

})

}

return episodes

}

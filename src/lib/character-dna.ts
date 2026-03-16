'use server';

/**
 * @fileOverview A library for managing character DNA.
 * 
 * This file will contain functions to create and manage unique character DNA for consistent character generation.
 */

// Add your character DNA functions here.
export function characterDNA(name:string){

return {
name,
faceLocked:true,
voiceLocked:true,
dressEditable:true,
colorEditable:true,
episodeSafe:true
}

}

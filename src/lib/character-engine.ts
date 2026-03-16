'use server';

function _createCharacter(name:string){
    return {
        name,
        state:"idle",
        position:{x:0,y:0},
        actions:["walk","run","jump","talk"]
    }
}

function _animate(character:any,action:string){
    character.state = action
    return {
        status:"animation running",
        character
    }
}

export function handleCharacterRequest(name: string, action?: string) {
    const character = _createCharacter(name);

    if (action) {
        return _animate(character, action);
    }

    return {
        status: "character created",
        character
    };
}

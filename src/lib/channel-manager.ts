
export function manageChannels(topics:string[]){

const channels = topics.map((topic,i)=>{

return {

channel:"AI Channel "+(i+1),

topic,

status:"active"

}

})

return channels

}


export function generateChannels(){

const channels = []

for(let i=1;i<=100;i++){

channels.push({

channelName:`AI Movie Channel ${i}`,

category:"Entertainment",

automation:true,

uploadPerDay:5,

monetization:"enabled"

})

}

return {

totalChannels: channels.length,

channels,

status:"factory created"

}

}

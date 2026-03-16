
import NodeMediaServer from "node-media-server"

export function startStream(){

const config = {

rtmp:{
port:1935,
chunk_size:60000,
gop_cache:true,
ping:30,
ping_timeout:60
},

http:{
port:8000,
mediaroot:"./media",
allow_origin:"*"
}

}

const nms = new NodeMediaServer(config)

nms.run()

return {

status:"live streaming server started"

}

}

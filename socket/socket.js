const socketIO = require('socket.io');

let io;
const initSocket = (server)=>{
    io=socketIO(server,{
        cors:{
            origin:process.env.CLIENT_URL,
            methods:["GET","POST","PATCH","DELETE"]
        }
    })
    io.on("connection",(socket)=>{
        console.log("user connected",socket.id);
        socket.on("joinRoom", (roomId)=>{
            socket.join(roomId);
            console.log(`socket ${socket.id} joined room ${roomId}`)
        })
        socket.on("disconnect", ()=>{
            console.log("user disconnected", socket.id);
        })
    })
    return io;
}

const getIO=()=>{
    if(!io){
        throw new Error('Socket.io is not initialized')
    }
    return io;
}

module.exports={initSocket,getIO}
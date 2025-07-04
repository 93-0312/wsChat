// pages/api/socket.js
import { Server } from 'socket.io'

const users = new Map()

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Socket.IO 서버 시작...')
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('사용자 연결됨:', socket.id)

      // 사용자 입장
      socket.on('join', (data) => {
        const { username } = data
        users.set(socket.id, { username, socket })
        
        // 입장 메시지를 모든 사용자에게 전송
        io.emit('message', {
          type: 'system',
          text: `${username}님이 입장했습니다.`,
          timestamp: new Date().toISOString()
        })

        console.log(`${username} 입장`)
      })

      // 메시지 수신 및 브로드캐스트
      socket.on('message', (data) => {
        const user = users.get(socket.id)
        if (user) {
          // 메시지를 보낸 사용자를 제외한 모든 사용자에게 전송
          socket.broadcast.emit('message', {
            type: 'message',
            text: data.text,
            username: user.username,
            timestamp: data.timestamp
          })
          
          console.log(`${user.username}: ${data.text}`)
        }
      })

      // 사용자 연결 해제
      socket.on('disconnect', () => {
        const user = users.get(socket.id)
        if (user) {
          // 퇴장 메시지를 모든 사용자에게 전송
          io.emit('message', {
            type: 'system',
            text: `${user.username}님이 퇴장했습니다.`,
            timestamp: new Date().toISOString()
          })
          
          users.delete(socket.id)
          console.log(`${user.username} 퇴장`)
        }
      })
    })

    res.socket.server.io = io
  }
  
  res.end()
}
// server/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import session from 'express-session';


// ---  AdminJS Imports ---
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/mongoose';

// --- DATABASE & MODELS ---
import { dbConnect } from './src/config/database.js'; 
import Message from './src/models/Message.js';
import Conversation from './src/models/Conversation.js';
import { sendEmail } from './src/services/emailService.js';
import User from './src/models/UserModel.js';
import SkillSwap from './src/models/SkillSwapModel.js';
import Session from './src/models/Session.js';

// --- ROUTERS ---
import AuthRoutes from './src/routes/authRoutes.js';
import UserRoutes from './src/routes/userRoutes.js';
import SkillSwapRoutes from './src/routes/skillSwapRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import conversationRoutes from './src/routes/conversationRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import chatbotRoutes from './src/routes/chatbotRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';



// --- INITIAL SETUP ---
const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

dbConnect();

// --- MIDDLEWARE SETUP ---
app.use(cors({ origin: 'http://localhost:5173', 
credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: 'a_very_secret_key_for_sessions_replace_this', // Replace with a long random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

const userSocketMap = {};
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// --- ADMINJS SETUP ---
AdminJS.registerAdapter({ Database, Resource });

const adminOptions = {
  resources: [
    { resource: User, options: { navigation: { name: 'Management', icon: 'User' } } },
    { resource: SkillSwap, options: { navigation: { name: 'Activity', icon: 'Repeat' } } },
    { resource: Session, options: { navigation: { name: 'Activity', icon: 'Calendar' } } },
    { resource: Conversation, options: { navigation: { name: 'Communication', icon: 'MessageSquare' } } },
    { resource: Message, options: { navigation: { name: 'Communication', icon: 'Mail' } } },
  ],
  rootPath: '/admin', 
};

const admin = new AdminJS(adminOptions);

//-------------------------------Admine route-------------------------------
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      const user = await User.findOne({ email });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch && user.role === 'admin') {
          return user;
        }
      }
      return false;
    },
    cookiePassword: 'a-super-secret-cookie-password-change-this', // Change this to a random string
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
  }
);

app.use(admin.options.rootPath, adminRouter);



// -------------------------------- API ROUTES ------
app.get('/', (req, res) => res.send('Welcome to SkillSwap API'));
app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/swaps', SkillSwapRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);



// --- SOCKET.IO REAL-TIME LOGIC ---
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId && userId !== 'undefined') {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is online.`);
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  }

   io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on("sendMessage", async ({ conversationId, senderId, receiverId, content }) => {
    try {
      const newMessage = new Message({ conversationId, senderId, content });
      await newMessage.save();

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = content;
        conversation.lastMessageAt = Date.now();
        const currentCount = conversation.unreadCounts.get(receiverId) || 0;
        conversation.unreadCounts.set(receiverId, currentCount + 1);
        await conversation.save();
      }

      const receiver = await User.findById(receiverId);
      const sender = await User.findById(senderId);

      if (receiver && receiver.email) {
          if (!userSocketMap[receiverId]) {
              await sendEmail({
                  to: receiver.email,
                  subject: `New message from ${sender.name}`,
                  text: `You have a new message from ${sender.name} on SkillSwap. Message: "${content}"`,
                  html: `<p>You have a new message from <strong>${sender.name}</strong>:</p><p><em>"${content}"</em></p><p>Log in to SkillSwap to reply.</p>`
              });
          }
      }

      const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'name profilePicture');

      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", populatedMessage);
        io.to(receiverSocketId).emit("notification", { conversationId });
      }
    } catch (error) {
        console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    for (const id in userSocketMap) {
      if (userSocketMap[id] === socket.id) {
        delete userSocketMap[id];
        break;
      }
    }
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

// --- SERVER INITIALIZATION ---
httpServer.listen(PORT, () => {
  console.log(`Server & Socket.IO Started Successfully At Port No: ${PORT}`);
  console.log(`AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`);

});
import CodeSnippet from "../models/code.model.js";
import Session from "../models/session.model.js";
import {v4 as uuidv4} from 'uuid';
import mongoose, { get } from 'mongoose';
import { getSocketInstance } from "../socket/socket.js";


export const createSession = async(req , res) => {
    try {
        const hostId = req.user.id
        console.log(" hostId is " , hostId);
        const currSessionCode = uuidv4();
        const newInterview = new Session({
            sessionCode : currSessionCode , 
            host : hostId,
            participants : [hostId,] ,
        });

        if(newInterview)  {
            await newInterview.save();
            
            const newCodeSnippet = new CodeSnippet({
                sessionId: newInterview._id,
                code : {default : "start writing" , },
                language: "javascript",
              });
            
             if(newCodeSnippet) {
                await newCodeSnippet.save();
                
            } 
           
        res.status(201).json({
            success: true,
            code : currSessionCode,
            message: 'Interview session created successfully!',
          });

        }else {
            console.log("error saving session");
            res.status(400).json({ message: "Invalid session data" });
        }


    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server error', error });
    }
}

export const joinSession = async(req , res) => {
  
    const { sessionCode } = req.body;
    try {
        // Check if the session exists
        const session = await Session.findOne({ sessionCode });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        const io = getSocketInstance();

        const socketsInRoom = await io.in(sessionCode).fetchSockets();

         if(socketsInRoom.length === 2) {
            return res.status(400).json({ error: 'Session is already full' });
        }
        
        // Add user to the session (if not already in)
        if (!session.participants.includes(req.user.id)) {
            session.participants.push(req.user.id);
            await session.save();
        }

        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }

}

export const endInterview = async(req , res) => {
    const { sessionCode } = req.body;
    
    

}



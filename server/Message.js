import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema(
{
room: { type: String, index: true, required: true },
username: { type: String, required: true },
text: { type: String, required: true },
},
{ timestamps: { createdAt: true, updatedAt: false } }
);


messageSchema.index({ room: 1, createdAt: -1 });


export const Message = mongoose.model('Message', messageSchema);
import mongoose from 'mongoose';

const emailNotificationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    percentage: { 
        type: Number, 
        required: true 
    },
    sentAt: { 
        type: Date, 
        default: Date.now 
    },
    type: { 
        type: String, 
        enum: ['warning', 'critical'], 
        required: true 
    }
}, { timestamps: true });

// Compound index to prevent duplicate notifications for same user, category, and type within 24 hours
emailNotificationSchema.index(
    { 
        userId: 1, 
        category: 1, 
        type: 1, 
        sentAt: 1 
    }, 
    { 
        expireAfterSeconds: 24 * 60 * 60 // Expire after 24 hours
    }
);

// Method to check if notification was recently sent
emailNotificationSchema.statics.wasRecentlySent = async function(userId, category, type, hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    
    const recentNotification = await this.findOne({
        userId,
        category,
        type,
        sentAt: { $gte: cutoffTime }
    });
    
    return !!recentNotification;
};

// Method to record notification sent
emailNotificationSchema.statics.recordNotification = async function(userId, category, percentage, type) {
    return await this.create({
        userId,
        category,
        percentage,
        type
    });
};

const EmailNotification = mongoose.model('EmailNotification', emailNotificationSchema);
export default EmailNotification;

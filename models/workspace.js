const mongoose = require('mongoose');


const workspaceSchema = new mongoose.Schema({
    title: String,
    providerName: String,
    providerImage: String,
    file: String,
    thumbnail: {
        type: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    category: String,
    privacy: String,
    about: String,
    providerId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
      },
    persons: Number,
    duration: Number,
    startDate: String,
    endDate: String,
    startTime: String,
    endTime: String,
    workDuration: String,
    fee: Number,
    strikedFee: Number,
    assignedSpaceProvider: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    registeredClients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    enrollments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        enrolledOn: {
            type: String
        },
        status: {
            type: String
        },
        updatedAt: {
            type: String
        }
    }],
    address: {type: String, required: true },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location', 
        required: false,
    },
    room: String,
    approved: {
        type: Boolean,
        default: false,
    },
    teamMembers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['Admin', 'Editor', 'Viewer'],
            default: 'Viewer'
        },
        privileges: {
            canCreate: { type: Boolean, default: false },
            canEdit: { type: Boolean, default: false },
            canDelete: { type: Boolean, default: false }
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
});


// Populate registered clients
workspaceSchema.methods.populateRegisteredClients = async function () {
    try {
        await this.populate('registeredClients').execPopulate();
    } catch (error) {
        console.error('Error populating registered clients:', error);
        throw error; // Rethrow the error for upstream handling
    }
};



const Workspace = new mongoose.model("Workspace", workspaceSchema);



module.exports = Workspace;